import { describe, it, expect, beforeEach } from "@jest/globals";
import { Certificate } from "../../src/domain/entities/Certificate.js";
import { CourseTerm } from "../../src/domain/entities/CourseTerm.js";
import { TeachingDay } from "../../src/domain/entities/TeachingDay.js";
import { TermService } from "../../src/application/services/TermService.js";
import { CertificateService } from "../../src/application/services/CertificateService.js";
import { AttendanceService } from "../../src/application/services/AttendanceService.js";
import { PostgresTermRepository } from "../../src/infrastructure/database/PostgresTermRepository.js";
import { PostgresCertificateRepository } from "../../src/infrastructure/database/PostgresCertificateRepository.js";
import { PostgresAttendanceRepository } from "../../src/infrastructure/database/PostgresAttendanceRepository.js";
import {
  CertificateResponseDto,
  IssueCertificateDto,
} from "../../src/application/dto/CertificateDto.js";
import {
  CreateTeachingDayDto,
  MarkAttendanceDto,
  AttendanceSummaryDto,
} from "../../src/application/dto/AttendanceDto.js";
import { CreateEnrollmentDto } from "../../src/application/dto/EnrollmentDto.js";

/**
 * Shared in-memory database context mimicking PostgreSQL tables
 */
class SharedDatabaseContext {
  public terms: any[] = [];
  public students: any[] = [];
  public enrollments: any[] = [];
  public teachingDays: any[] = [];
  public attendanceRecords: any[] = [];
  public certificates: CertificateResponseDto[] = [];
  public certCounter: number = 0;
}

class InMemoryTermRepository {
  constructor(private ctx: SharedDatabaseContext) {}

  async findAll(): Promise<any[]> {
    return this.ctx.terms.map((t) => {
      const termEnrollments = this.ctx.enrollments.filter((e) => e.termId === t.id);
      const confirmed = termEnrollments.filter((e) => e.status === "CONFIRMED").length;
      const waitlist = termEnrollments.filter((e) => e.status === "WAITLIST").length;
      return {
        ...t,
        confirmedCount: confirmed,
        waitlistCount: waitlist,
        availableSpots: Math.max(0, t.capacity - confirmed),
        isFull: confirmed >= t.capacity,
      };
    });
  }

  async findById(id: string): Promise<any | null> {
    const list = await this.findAll();
    return list.find((t) => t.id === id) || null;
  }

  async createTerm(data: any): Promise<string> {
    const id = `term-${this.ctx.terms.length + 1}`;
    this.ctx.terms.push({
      id,
      courseId: data.courseId,
      classroomId: data.classroomId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      capacity: data.capacity,
      status: "PLANNED",
    });
    return id;
  }

  async getEnrollmentsForTerm(termId: string): Promise<any[]> {
    return this.ctx.enrollments.filter((e) => e.termId === termId);
  }

  async createEnrollment(termId: string, studentData: CreateEnrollmentDto): Promise<any> {
    const term = this.ctx.terms.find((t) => t.id === termId);
    if (!term) throw new Error("Course term was not found.");

    const normalizedEmail = studentData.email.trim().toLowerCase();
    let student = this.ctx.students.find((s) => s.email.toLowerCase() === normalizedEmail);
    if (!student) {
      student = {
        id: `stu-${this.ctx.students.length + 1}`,
        firstName: studentData.firstName.trim(),
        lastName: studentData.lastName.trim(),
        email: normalizedEmail,
      };
      this.ctx.students.push(student);
    }

    // Duplicate in this term check (must be CONFIRMED or WAITLIST)
    const duplicate = this.ctx.enrollments.some(
      (e) =>
        e.termId === termId &&
        e.studentId === student.id &&
        (e.status === "CONFIRMED" || e.status === "WAITLIST")
    );
    if (duplicate) {
      throw new Error("Student is already enrolled or on the waitlist for this term.");
    }

    // ADR-03: No duplicate active confirmed registrations for same course in different terms
    const activeSameCourse = this.ctx.enrollments.some((e) => {
      if (e.studentId !== student.id || e.status !== "CONFIRMED" || e.termId === termId)
        return false;
      const otherTerm = this.ctx.terms.find((t) => t.id === e.termId);
      return otherTerm && otherTerm.courseId === term.courseId;
    });
    if (activeSameCourse) {
      throw new Error(
        "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule)."
      );
    }

    const confirmedCount = this.ctx.enrollments.filter(
      (e) => e.termId === termId && e.status === "CONFIRMED"
    ).length;

    let status: "CONFIRMED" | "WAITLIST";
    let waitlistPosition: number | null = null;

    if (confirmedCount < term.capacity) {
      status = "CONFIRMED";
    } else {
      status = "WAITLIST";
      const waitlist = this.ctx.enrollments.filter(
        (e) => e.termId === termId && e.status === "WAITLIST"
      );
      const maxPos = waitlist.reduce((max, e) => Math.max(max, e.waitlistPosition || 0), 0);
      waitlistPosition = maxPos + 1;
    }

    const enrollment = {
      id: `enr-${this.ctx.enrollments.length + 1}`,
      termId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      status,
      waitlistPosition,
      submittedAt: new Date().toISOString(),
    };
    this.ctx.enrollments.push(enrollment);

    return enrollment;
  }

  async cancelEnrollment(enrollmentId: string): Promise<any> {
    const enrollment = this.ctx.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) throw new Error("Enrollment was not found.");

    const termId = enrollment.termId;
    const wasConfirmed = enrollment.status === "CONFIRMED";
    const wasWaitlist = enrollment.status === "WAITLIST";
    const oldPosition = enrollment.waitlistPosition;

    enrollment.status = "CANCELLED";
    enrollment.waitlistPosition = null;

    let promotedStudentId: string | undefined;

    if (wasConfirmed) {
      const nextCandidate = this.ctx.enrollments.find(
        (e) => e.termId === termId && e.status === "WAITLIST" && e.waitlistPosition === 1
      );

      if (nextCandidate) {
        promotedStudentId = nextCandidate.studentId;
        nextCandidate.status = "CONFIRMED";
        nextCandidate.waitlistPosition = null;

        for (const item of this.ctx.enrollments) {
          if (
            item.termId === termId &&
            item.status === "WAITLIST" &&
            item.waitlistPosition &&
            item.waitlistPosition > 1
          ) {
            item.waitlistPosition -= 1;
          }
        }
      }
    } else if (wasWaitlist && oldPosition) {
      for (const item of this.ctx.enrollments) {
        if (
          item.termId === termId &&
          item.status === "WAITLIST" &&
          item.waitlistPosition &&
          item.waitlistPosition > oldPosition
        ) {
          item.waitlistPosition -= 1;
        }
      }
    }

    return { success: true, promotedStudentId };
  }

  async getLecturers(): Promise<any[]> {
    return [];
  }
  async getClassrooms(): Promise<any[]> {
    return [];
  }
  async getStudents(): Promise<any[]> {
    return this.ctx.students;
  }
  async getAnalytics(): Promise<any> {
    return {};
  }
}

class InMemoryAttendanceRepository {
  constructor(private ctx: SharedDatabaseContext) {}

  async getTeachingDays(termId: string): Promise<any[]> {
    return this.ctx.teachingDays.filter((d) => d.termId === termId);
  }

  async createTeachingDay(dto: CreateTeachingDayDto): Promise<string> {
    const id = `day-${this.ctx.teachingDays.length + 1}`;
    this.ctx.teachingDays.push({
      id,
      termId: dto.termId,
      dayDate: dto.dayDate,
      hours: dto.hours,
      topic: dto.topic.trim(),
      lecturerId: dto.lecturerId || null,
    });
    return id;
  }

  async getAttendanceForDay(teachingDayId: string): Promise<any[]> {
    const day = this.ctx.teachingDays.find((d) => d.id === teachingDayId);
    if (!day) return [];
    return this.ctx.enrollments
      .filter(
        (e) => e.termId === day.termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
      )
      .map((e) => {
        const att = this.ctx.attendanceRecords.find(
          (a) => a.teachingDayId === teachingDayId && a.studentId === e.studentId
        );
        return {
          teachingDayId,
          studentId: e.studentId,
          studentName: e.studentName,
          studentEmail: e.studentEmail,
          isPresent: att ? att.isPresent : false,
          note: att ? att.note : null,
        };
      });
  }

  async markAttendance(dto: MarkAttendanceDto): Promise<void> {
    const existingIndex = this.ctx.attendanceRecords.findIndex(
      (a) => a.teachingDayId === dto.teachingDayId && a.studentId === dto.studentId
    );
    if (existingIndex >= 0) {
      this.ctx.attendanceRecords[existingIndex].isPresent = dto.isPresent;
      this.ctx.attendanceRecords[existingIndex].note = dto.note || null;
    } else {
      this.ctx.attendanceRecords.push({
        id: `att-${this.ctx.attendanceRecords.length + 1}`,
        teachingDayId: dto.teachingDayId,
        studentId: dto.studentId,
        isPresent: dto.isPresent,
        note: dto.note || null,
      });
    }
  }

  async getAttendanceSummary(termId: string): Promise<AttendanceSummaryDto[]> {
    const termDays = this.ctx.teachingDays.filter((d) => d.termId === termId);
    const totalDays = termDays.length;
    const confirmedEnrollments = this.ctx.enrollments.filter(
      (e) => e.termId === termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
    );

    return confirmedEnrollments.map((enr) => {
      const attendedCount = termDays.filter((d) => {
        const att = this.ctx.attendanceRecords.find(
          (a) => a.teachingDayId === d.id && a.studentId === enr.studentId
        );
        return att && att.isPresent;
      }).length;

      const percentage = totalDays > 0 ? Math.round((attendedCount / totalDays) * 1000) / 10 : 0;
      const cert = this.ctx.certificates.find((c) => c.enrollmentId === enr.id);

      return {
        studentId: enr.studentId,
        studentName: enr.studentName,
        studentEmail: enr.studentEmail,
        enrollmentId: enr.id,
        totalDays,
        attendedDays: attendedCount,
        attendancePercentage: percentage,
        qualifiesForCertificate: percentage >= 70,
        certificateIssued: Boolean(cert),
        certificateNumber: cert ? cert.certificateNumber : undefined,
      };
    });
  }
}

class InMemoryCertificateRepository {
  constructor(private ctx: SharedDatabaseContext) {}

  async getNextCertificateNumber(): Promise<string> {
    this.ctx.certCounter += 1;
    const year = new Date().getFullYear();
    const seq = String(this.ctx.certCounter).padStart(4, "0");
    return `AT-${year}-${seq}`;
  }

  async findAll(): Promise<CertificateResponseDto[]> {
    return this.ctx.certificates.map((c) => ({ ...c }));
  }

  async findById(id: string): Promise<CertificateResponseDto | null> {
    const found = this.ctx.certificates.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async issueCertificate(dto: IssueCertificateDto): Promise<CertificateResponseDto> {
    const enrollment = this.ctx.enrollments.find((e) => e.id === dto.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found.");

    const existingCert = this.ctx.certificates.find((c) => c.enrollmentId === dto.enrollmentId);
    if (existingCert) {
      throw new Error("A certificate has already been issued for this enrollment.");
    }

    const termDays = this.ctx.teachingDays.filter((d) => d.termId === enrollment.termId);
    const totalDays = termDays.length;
    const attendedDays = termDays.filter((d) => {
      const att = this.ctx.attendanceRecords.find(
        (a) => a.teachingDayId === d.id && a.studentId === enrollment.studentId
      );
      return att && att.isPresent;
    }).length;

    const rate = totalDays > 0 ? (attendedDays / totalDays) * 100 : 100;
    const roundedRate = Math.round(rate * 10) / 10;
    const certNumber = await this.getNextCertificateNumber();
    const issueDate = new Date().toISOString().split("T")[0];

    const domainCert = new Certificate({
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      termId: enrollment.termId,
      courseTitle: "Domain Edge Cases Course",
      certificateNumber: certNumber,
      issueDate,
      attendanceRate: roundedRate,
      hasWaiver: dto.hasWaiver,
      waiverReason: dto.waiverReason,
    });

    const createdDto: CertificateResponseDto = {
      id: `cert-${this.ctx.certificates.length + 1}`,
      enrollmentId: domainCert.enrollmentId,
      studentId: domainCert.studentId,
      studentName: domainCert.studentName || enrollment.studentName,
      studentEmail: enrollment.studentEmail || "student@example.com",
      termId: domainCert.termId,
      courseTitle: domainCert.courseTitle || "Course Title",
      certificateNumber: domainCert.certificateNumber,
      issueDate: domainCert.issueDate,
      attendanceRate: domainCert.attendanceRate,
      hasWaiver: domainCert.hasWaiver,
      waiverReason: domainCert.waiverReason || undefined,
      createdAt: new Date().toISOString(),
    };

    this.ctx.certificates.push(createdDto);
    enrollment.status = "COMPLETED";

    return createdDto;
  }

  async completeTerm(
    termId: string
  ): Promise<{ issuedCount: number; certificates: CertificateResponseDto[] }> {
    const term = this.ctx.terms.find((t) => t.id === termId);
    if (term) term.status = "COMPLETED";

    const eligibleEnrollments = this.ctx.enrollments.filter(
      (e) => e.termId === termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
    );

    const issued: CertificateResponseDto[] = [];
    for (const enr of eligibleEnrollments) {
      const alreadyIssued = this.ctx.certificates.some((c) => c.enrollmentId === enr.id);
      if (alreadyIssued) continue;

      const termDays = this.ctx.teachingDays.filter((d) => d.termId === termId);
      const totalDays = termDays.length;
      const attended = termDays.filter((d) => {
        const att = this.ctx.attendanceRecords.find(
          (a) => a.teachingDayId === d.id && a.studentId === enr.studentId
        );
        return att && att.isPresent;
      }).length;
      const rate = totalDays > 0 ? (attended / totalDays) * 100 : 100;

      if (rate >= 70) {
        const cert = await this.issueCertificate({ enrollmentId: enr.id });
        issued.push(cert);
      }
    }

    return { issuedCount: issued.length, certificates: issued };
  }
}

describe("Domain Edge Cases & Boundary Conditions (Jest Suite)", () => {
  let ctx: SharedDatabaseContext;
  let termRepo: InMemoryTermRepository;
  let attRepo: InMemoryAttendanceRepository;
  let certRepo: InMemoryCertificateRepository;
  let termService: TermService;
  let certService: CertificateService;
  let attendanceService: AttendanceService;

  beforeEach(() => {
    ctx = new SharedDatabaseContext();
    termRepo = new InMemoryTermRepository(ctx);
    attRepo = new InMemoryAttendanceRepository(ctx);
    certRepo = new InMemoryCertificateRepository(ctx);
    termService = new TermService(termRepo as unknown as PostgresTermRepository);
    certService = new CertificateService(certRepo as unknown as PostgresCertificateRepository);
    attendanceService = new AttendanceService(attRepo as unknown as PostgresAttendanceRepository);
  });

  // =========================================================================
  // 1. Kaskádový posun ve frontě náhradníků při vícenásobném zrušení přihlášky (ADR-02)
  // =========================================================================
  describe("1. Cascading Waitlist Progression upon Multiple Consecutive Cancellations (ADR-02)", () => {
    it("handles multi-step consecutive cancellations, promoting candidates one by one and shifting positions", async () => {
      // 1. Create a course term with capacity of 2 spots
      const termId = await termService.createTerm({
        courseId: "course-adv-ts",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 2,
      });

      // 2. Confirmed students S1 and S2 take the 2 available spots
      const s1 = await termService.createEnrollment(termId, {
        firstName: "Alice",
        lastName: "Confirmed-1",
        email: "alice@company.com",
      });
      const s2 = await termService.createEnrollment(termId, {
        firstName: "Bob",
        lastName: "Confirmed-2",
        email: "bob@company.com",
      });

      expect(s1.status).toBe("CONFIRMED");
      expect(s2.status).toBe("CONFIRMED");

      // 3. Three additional students join the waitlist: S3 (#1), S4 (#2), S5 (#3)
      const s3 = await termService.createEnrollment(termId, {
        firstName: "Charlie",
        lastName: "Waitlist-1",
        email: "charlie@company.com",
      });
      const s4 = await termService.createEnrollment(termId, {
        firstName: "David",
        lastName: "Waitlist-2",
        email: "david@company.com",
      });
      const s5 = await termService.createEnrollment(termId, {
        firstName: "Eva",
        lastName: "Waitlist-3",
        email: "eva@company.com",
      });

      expect(s3.status).toBe("WAITLIST");
      expect(s3.waitlistPosition).toBe(1);
      expect(s4.status).toBe("WAITLIST");
      expect(s4.waitlistPosition).toBe(2);
      expect(s5.status).toBe("WAITLIST");
      expect(s5.waitlistPosition).toBe(3);

      // Verify term occupancy: 2 confirmed, 3 waitlist, 0 available spots
      let term = await termService.getTermById(termId);
      expect(term.confirmedCount).toBe(2);
      expect(term.waitlistCount).toBe(3);
      expect((term as any).availableSpots).toBe(0);

      // --- CANCELLATION STEP 1: S1 cancels ---
      const cancel1 = await termService.cancelEnrollment(s1.id);
      expect(cancel1.success).toBe(true);
      expect(cancel1.promotedStudentId).toBe(s3.studentId); // Charlie promoted!

      let enrollments = await termService.getEnrollmentsForTerm(termId);
      expect(enrollments.find((e) => e.id === s1.id)?.status).toBe("CANCELLED");
      expect(enrollments.find((e) => e.id === s3.id)?.status).toBe("CONFIRMED");
      expect(enrollments.find((e) => e.id === s3.id)?.waitlistPosition).toBeNull();
      expect(enrollments.find((e) => e.id === s4.id)?.waitlistPosition).toBe(1); // David shifted from #2 to #1
      expect(enrollments.find((e) => e.id === s5.id)?.waitlistPosition).toBe(2); // Eva shifted from #3 to #2

      // --- CANCELLATION STEP 2: S2 cancels (second consecutive cancellation) ---
      const cancel2 = await termService.cancelEnrollment(s2.id);
      expect(cancel2.success).toBe(true);
      expect(cancel2.promotedStudentId).toBe(s4.studentId); // David promoted!

      enrollments = await termService.getEnrollmentsForTerm(termId);
      expect(enrollments.find((e) => e.id === s2.id)?.status).toBe("CANCELLED");
      expect(enrollments.find((e) => e.id === s4.id)?.status).toBe("CONFIRMED");
      expect(enrollments.find((e) => e.id === s4.id)?.waitlistPosition).toBeNull();
      expect(enrollments.find((e) => e.id === s5.id)?.waitlistPosition).toBe(1); // Eva shifted from #2 to #1

      // --- CANCELLATION STEP 3: S3 cancels (third consecutive cancellation) ---
      const cancel3 = await termService.cancelEnrollment(s3.id);
      expect(cancel3.success).toBe(true);
      expect(cancel3.promotedStudentId).toBe(s5.studentId); // Eva promoted!

      enrollments = await termService.getEnrollmentsForTerm(termId);
      expect(enrollments.find((e) => e.id === s3.id)?.status).toBe("CANCELLED");
      expect(enrollments.find((e) => e.id === s5.id)?.status).toBe("CONFIRMED");
      expect(enrollments.find((e) => e.id === s5.id)?.waitlistPosition).toBeNull();

      // Waitlist is now completely empty
      term = await termService.getTermById(termId);
      expect(term.confirmedCount).toBe(2); // S4 and S5 are confirmed
      expect(term.waitlistCount).toBe(0);
      expect((term as any).availableSpots).toBe(0);

      // --- CANCELLATION STEP 4: S4 cancels when waitlist is empty ---
      const cancel4 = await termService.cancelEnrollment(s4.id);
      expect(cancel4.success).toBe(true);
      expect(cancel4.promotedStudentId).toBeUndefined(); // Nobody to promote

      term = await termService.getTermById(termId);
      expect(term.confirmedCount).toBe(1); // Only S5 remains
      expect(term.waitlistCount).toBe(0);
      expect((term as any).availableSpots).toBe(1); // Spot is freed up for public registration!
    });

    it("correctly shifts queue when a student in the middle of waitlist cancels", async () => {
      const termId = await termService.createTerm({
        courseId: "course-queue",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 1,
      });

      // 1 confirmed, 3 waitlisted
      const confirmed = await termService.createEnrollment(termId, {
        firstName: "A",
        lastName: "A",
        email: "a@test.cz",
      });
      const w1 = await termService.createEnrollment(termId, {
        firstName: "B",
        lastName: "B",
        email: "b@test.cz",
      });
      const w2 = await termService.createEnrollment(termId, {
        firstName: "C",
        lastName: "C",
        email: "c@test.cz",
      });
      const w3 = await termService.createEnrollment(termId, {
        firstName: "D",
        lastName: "D",
        email: "d@test.cz",
      });

      expect(w1.waitlistPosition).toBe(1);
      expect(w2.waitlistPosition).toBe(2);
      expect(w3.waitlistPosition).toBe(3);

      // Candidate at position #2 (w2) cancels their waitlist spot!
      const cancelResult = await termService.cancelEnrollment(w2.id);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.promotedStudentId).toBeUndefined();

      const list = await termService.getEnrollmentsForTerm(termId);
      expect(list.find((e) => e.id === w1.id)?.waitlistPosition).toBe(1); // Unchanged
      expect(list.find((e) => e.id === w2.id)?.status).toBe("CANCELLED");
      expect(list.find((e) => e.id === w3.id)?.waitlistPosition).toBe(2); // Shifted from #3 to #2

      // Now confirmed student cancels -> w1 is promoted!
      await termService.cancelEnrollment(confirmed.id);
      const afterList = await termService.getEnrollmentsForTerm(termId);
      expect(afterList.find((e) => e.id === w1.id)?.status).toBe("CONFIRMED");
      expect(afterList.find((e) => e.id === w3.id)?.waitlistPosition).toBe(1); // Shifted from #2 to #1
    });
  });

  // =========================================================================
  // 2. Hraniční kalkulace docházky 70.0 % vs 69.9 % a výjimky lektora (ADR-01)
  // =========================================================================
  describe("2. Attendance Calculation Boundary Conditions (70.0% vs 69.9%) and Lecturer Waiver (ADR-01)", () => {
    it("qualifies student and allows certificate without waiver at exactly 70.0% attendance", () => {
      // Direct Domain Entity Validation
      const cert70 = new Certificate({
        enrollmentId: "enr-70",
        studentId: "stu-70",
        termId: "term-70",
        certificateNumber: "AT-2026-0070",
        issueDate: "2026-11-30",
        attendanceRate: 70.0,
      });

      expect(cert70.attendanceRate).toBe(70.0);
      expect(cert70.hasWaiver).toBe(false);
      expect(cert70.waiverReason).toBeNull();
    });

    it("strictly rejects certificate without waiver at 69.9% attendance rate", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "enr-699",
          studentId: "stu-699",
          termId: "term-699",
          certificateNumber: "AT-2026-0699",
          issueDate: "2026-11-30",
          attendanceRate: 69.9,
          hasWaiver: false,
        });
      }).toThrow(
        "Student does not meet the 70% attendance requirement (69.9%). An instructor waiver with written reason is required."
      );
    });

    it("approves certificate at 69.9% attendance when valid waiver justification (>= 5 chars) is provided", () => {
      const cert = new Certificate({
        enrollmentId: "enr-699-w",
        studentId: "stu-699-w",
        termId: "term-699",
        certificateNumber: "AT-2026-0699",
        issueDate: "2026-11-30",
        attendanceRate: 69.9,
        hasWaiver: true,
        waiverReason: "Approved by lecturer based on excellent submission of final project.",
      });

      expect(cert.hasWaiver).toBe(true);
      expect(cert.waiverReason).toContain("excellent submission");
    });

    it("rejects waiver when justification consists solely of whitespace or fewer than 5 characters after trimming", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "enr-ws",
          studentId: "stu-ws",
          termId: "term-ws",
          certificateNumber: "AT-2026-0088",
          issueDate: "2026-11-30",
          attendanceRate: 50.0,
          hasWaiver: true,
          waiverReason: "   abc   ", // 3 characters after trimming
        });
      }).toThrow("Instructor waiver requires a written justification of at least 5 characters.");
    });

    it("allows certificate issuance even at 0.0% attendance if legitimate waiver is granted", () => {
      const zeroCert = new Certificate({
        enrollmentId: "enr-zero",
        studentId: "stu-zero",
        termId: "term-zero",
        certificateNumber: "AT-2026-0000",
        issueDate: "2026-11-30",
        attendanceRate: 0.0,
        hasWaiver: true,
        waiverReason:
          "Student was hospitalized, completed all theoretical and practical exams remotely with 98% grade.",
      });

      expect(zeroCert.attendanceRate).toBe(0.0);
      expect(zeroCert.hasWaiver).toBe(true);
    });

    it("calculates discrete attendance percentage accurately over 10 teaching days (7/10 = 70.0% vs 6/10 = 60.0%)", async () => {
      const termId = await termService.createTerm({
        courseId: "course-calc",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        capacity: 5,
      });

      // Create 10 teaching days
      const dayIds: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const dayId = await attendanceService.createTeachingDay({
          termId,
          dayDate: `2026-10-${String(i).padStart(2, "0")}`,
          hours: 4,
          topic: `Block ${i}: Subject Overview`,
        });
        dayIds.push(dayId);
      }

      // Student 1: Attends exactly 7 days (70.0%)
      const s1 = await termService.createEnrollment(termId, {
        firstName: "Seven",
        lastName: "Days",
        email: "seven@days.cz",
      });
      for (let i = 0; i < 7; i++) {
        await attendanceService.markAttendance({
          teachingDayId: dayIds[i],
          studentId: s1.studentId,
          isPresent: true,
        });
      }

      // Student 2: Attends 6 days (60.0%)
      const s2 = await termService.createEnrollment(termId, {
        firstName: "Six",
        lastName: "Days",
        email: "six@days.cz",
      });
      for (let i = 0; i < 6; i++) {
        await attendanceService.markAttendance({
          teachingDayId: dayIds[i],
          studentId: s2.studentId,
          isPresent: true,
        });
      }

      const summary = await attendanceService.getAttendanceSummary(termId);
      const summ1 = summary.find((s) => s.studentId === s1.studentId);
      const summ2 = summary.find((s) => s.studentId === s2.studentId);

      expect(summ1?.totalDays).toBe(10);
      expect(summ1?.attendedDays).toBe(7);
      expect(summ1?.attendancePercentage).toBe(70.0);
      expect(summ1?.qualifiesForCertificate).toBe(true);

      expect(summ2?.totalDays).toBe(10);
      expect(summ2?.attendedDays).toBe(6);
      expect(summ2?.attendancePercentage).toBe(60.0);
      expect(summ2?.qualifiesForCertificate).toBe(false);
    });

    it("supports toggling attendance mark from true to false and verifies recalculated percentage", async () => {
      const termId = await termService.createTerm({
        courseId: "course-toggle",
        startDate: "2026-10-01",
        endDate: "2026-10-10",
        capacity: 2,
      });

      const dayId = await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-10-05",
        hours: 6,
        topic: "Toggle Day",
      });

      const enr = await termService.createEnrollment(termId, {
        firstName: "Toggle",
        lastName: "User",
        email: "toggle@user.cz",
      });

      // 1. Mark present
      await attendanceService.markAttendance({
        teachingDayId: dayId,
        studentId: enr.studentId,
        isPresent: true,
      });
      let summary = await attendanceService.getAttendanceSummary(termId);
      expect(summary[0].attendedDays).toBe(1);
      expect(summary[0].attendancePercentage).toBe(100.0);

      // 2. Correct error: Mark absent
      await attendanceService.markAttendance({
        teachingDayId: dayId,
        studentId: enr.studentId,
        isPresent: false,
        note: "Absence confirmed",
      });
      summary = await attendanceService.getAttendanceSummary(termId);
      expect(summary[0].attendedDays).toBe(0);
      expect(summary[0].attendancePercentage).toBe(0.0);
      expect(summary[0].qualifiesForCertificate).toBe(false);
    });
  });

  // =========================================================================
  // 3. Neplatné stavy a duplicitní registrace se stejným e-mailem (ADR-03)
  // =========================================================================
  describe("3. Invalid States & Duplicate Email Registration Validation (ADR-03)", () => {
    it("rejects duplicate registration attempt when student is already confirmed in the term", async () => {
      const termId = await termService.createTerm({
        courseId: "course-dupl",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 5,
      });

      await termService.createEnrollment(termId, {
        firstName: "Jan",
        lastName: "Novak",
        email: "jan.novak@firma.cz",
      });

      // Duplicate registration with exact email
      await expect(
        termService.createEnrollment(termId, {
          firstName: "Jan",
          lastName: "Novak",
          email: "jan.novak@firma.cz",
        })
      ).rejects.toThrow("Student is already enrolled or on the waitlist for this term.");
    });

    it("rejects duplicate registration attempt with mixed casing and outer spaces", async () => {
      const termId = await termService.createTerm({
        courseId: "course-dupl-case",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 5,
      });

      await termService.createEnrollment(termId, {
        firstName: "Petra",
        lastName: "Svobodova",
        email: "petra.svobodova@seznam.cz",
      });

      // Attempt duplicate with spaces and upper case
      await expect(
        termService.createEnrollment(termId, {
          firstName: "Petra",
          lastName: "Svobodova",
          email: "   PETRA.SVOBODOVA@SEZNAM.CZ   ",
        })
      ).rejects.toThrow("Student is already enrolled or on the waitlist for this term.");
    });

    it("rejects duplicate registration when student is currently on the waitlist", async () => {
      const termId = await termService.createTerm({
        courseId: "course-wait-dupl",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 1, // Only 1 spot
      });

      // S1 fills capacity
      await termService.createEnrollment(termId, {
        firstName: "First",
        lastName: "Student",
        email: "first@email.cz",
      });

      // S2 placed on waitlist
      await termService.createEnrollment(termId, {
        firstName: "Second",
        lastName: "Waitlist",
        email: "second@email.cz",
      });

      // S2 attempts registering again in the same term
      await expect(
        termService.createEnrollment(termId, {
          firstName: "Second",
          lastName: "Waitlist",
          email: "second@email.cz",
        })
      ).rejects.toThrow("Student is already enrolled or on the waitlist for this term.");
    });

    it("allows a student to re-enroll in the same term if their previous enrollment was cancelled", async () => {
      const termId = await termService.createTerm({
        courseId: "course-reenroll",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 5,
      });

      const enr1 = await termService.createEnrollment(termId, {
        firstName: "Tomas",
        lastName: "Marny",
        email: "tomas.marny@seznam.cz",
      });

      // Cancel the enrollment
      await termService.cancelEnrollment(enr1.id);

      // Re-enrollment must now be permitted because active status is CANCELLED
      const enr2 = await termService.createEnrollment(termId, {
        firstName: "Tomas",
        lastName: "Marny",
        email: "tomas.marny@seznam.cz",
      });

      expect(enr2.status).toBe("CONFIRMED");
      expect(enr2.id).not.toBe(enr1.id);
    });

    it("enforces ADR-03 rule: prevents concurrent confirmed enrollments in different terms of same course", async () => {
      const termA = await termService.createTerm({
        courseId: "shared-course-id",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        capacity: 10,
      });

      const termB = await termService.createTerm({
        courseId: "shared-course-id",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        capacity: 10,
      });

      // Enroll in Term A
      await termService.createEnrollment(termA, {
        firstName: "Eva",
        lastName: "Kralova",
        email: "eva.kralova@example.cz",
      });

      // Attempt enrolling into Term B of identical course
      await expect(
        termService.createEnrollment(termB, {
          firstName: "Eva",
          lastName: "Kralova",
          email: "eva.kralova@example.cz",
        })
      ).rejects.toThrow(
        "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule)."
      );
    });

    it("throws clear error when attempting to enroll into non-existent term", async () => {
      await expect(
        termService.createEnrollment("non-existent-term-id", {
          firstName: "Lost",
          lastName: "User",
          email: "lost@user.cz",
        })
      ).rejects.toThrow("Course term was not found.");
    });
  });

  // =========================================================================
  // 4. Chování při uzavření termínu, kde žádný student nesplnil podmínky (ADR-01)
  // =========================================================================
  describe("4. Term Closure Behavior When No Students Meet Conditions (ADR-01)", () => {
    it("completes term gracefully with issuedCount = 0 and empty certificates list when attendance is below 70%", async () => {
      const termId = await termService.createTerm({
        courseId: "course-low-attendance",
        startDate: "2026-11-01",
        endDate: "2026-11-15",
        capacity: 5,
      });

      // 4 teaching days
      const d1 = await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-11-02",
        hours: 4,
        topic: "Day 1",
      });
      const d2 = await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-11-04",
        hours: 4,
        topic: "Day 2",
      });
      await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-11-09",
        hours: 4,
        topic: "Day 3",
      });
      await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-11-11",
        hours: 4,
        topic: "Day 4",
      });

      // Student 1 attends 1/4 days (25%)
      const s1 = await termService.createEnrollment(termId, {
        firstName: "S1",
        lastName: "Low",
        email: "s1@low.cz",
      });
      await attendanceService.markAttendance({
        teachingDayId: d1,
        studentId: s1.studentId,
        isPresent: true,
      });

      // Student 2 attends 2/4 days (50%)
      const s2 = await termService.createEnrollment(termId, {
        firstName: "S2",
        lastName: "Low",
        email: "s2@low.cz",
      });
      await attendanceService.markAttendance({
        teachingDayId: d1,
        studentId: s2.studentId,
        isPresent: true,
      });
      await attendanceService.markAttendance({
        teachingDayId: d2,
        studentId: s2.studentId,
        isPresent: true,
      });

      // Student 3 attends 0/4 days (0%)
      await termService.createEnrollment(termId, {
        firstName: "S3",
        lastName: "Zero",
        email: "s3@zero.cz",
      });

      // Close the term
      const result = await certService.completeTerm(termId);

      expect(result.issuedCount).toBe(0);
      expect(result.certificates).toHaveLength(0);

      // Verify term status is now COMPLETED
      const term = await termService.getTermById(termId);
      expect(term.status).toBe("COMPLETED");

      // Verify no certificates exist in repository yet
      const allCerts = await certService.getAllCertificates();
      expect(allCerts).toHaveLength(0);

      // Calling completeTerm second time is idempotent
      const secondResult = await certService.completeTerm(termId);
      expect(secondResult.issuedCount).toBe(0);

      // S2 obtains lecturer waiver later -> single certificate is issued!
      const waiverCert = await certService.issueCertificate({
        enrollmentId: s2.id,
        hasWaiver: true,
        waiverReason:
          "Lecturer verified student completed comprehensive substitute programming assignment.",
      });

      expect(waiverCert.studentId).toBe(s2.studentId);
      expect(waiverCert.attendanceRate).toBe(50.0);
      expect(waiverCert.hasWaiver).toBe(true);

      const certsAfterWaiver = await certService.getAllCertificates();
      expect(certsAfterWaiver).toHaveLength(1);
    });
  });

  // =========================================================================
  // 5. Validace správnosti formátu a sekvence certifikátů
  // =========================================================================
  describe("5. Certificate Format & Sequence Counter Invariants (AT-YYYY-XXXX)", () => {
    it("generates strictly sequential and zero-padded certificate numbers", async () => {
      const year = new Date().getFullYear();
      const num1 = await certRepo.getNextCertificateNumber();
      const num2 = await certRepo.getNextCertificateNumber();
      const num3 = await certRepo.getNextCertificateNumber();

      expect(num1).toBe(`AT-${year}-0001`);
      expect(num2).toBe(`AT-${year}-0002`);
      expect(num3).toBe(`AT-${year}-0003`);
    });

    it("prevents duplicate certificate issuance for the exact same enrollment", async () => {
      const termId = await termService.createTerm({
        courseId: "course-cert-dupl",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 5,
      });

      const dayId = await attendanceService.createTeachingDay({
        termId,
        dayDate: "2026-11-05",
        hours: 8,
        topic: "Full day",
      });

      const enr = await termService.createEnrollment(termId, {
        firstName: "Cert",
        lastName: "Dupl",
        email: "cert.dupl@test.cz",
      });

      await attendanceService.markAttendance({
        teachingDayId: dayId,
        studentId: enr.studentId,
        isPresent: true,
      });

      // First issuance succeeds
      const cert1 = await certService.issueCertificate({ enrollmentId: enr.id });
      expect(cert1.certificateNumber).toMatch(/^AT-\d{4}-\d{4,}$/);

      // Second issuance for same enrollment must be rejected
      await expect(certService.issueCertificate({ enrollmentId: enr.id })).rejects.toThrow(
        "A certificate has already been issued for this enrollment."
      );
    });

    it("verifies Certificate entity boundary validations and format constraints", () => {
      // Valid high-sequence numbers
      const validCert = new Certificate({
        enrollmentId: "e100",
        studentId: "s100",
        termId: "t100",
        certificateNumber: "AT-2026-10500",
        issueDate: "2026-12-01",
        attendanceRate: 100,
      });
      expect(validCert.certificateNumber).toBe("AT-2026-10500");

      // Invalid patterns
      const invalidFormats = [
        "at-2026-0001", // lowercase prefix
        "AT20260001", // missing hyphens
        "AT-26-0001", // two-digit year
        "AT-2026-12", // sequence fewer than 4 digits
        "AT-2026-XXXX", // non-numeric sequence
        "AT-2026-", // missing sequence
      ];

      for (const fmt of invalidFormats) {
        expect(() => {
          new Certificate({
            enrollmentId: "e1",
            studentId: "s1",
            termId: "t1",
            certificateNumber: fmt,
            issueDate: "2026-12-01",
            attendanceRate: 100,
          });
        }).toThrow(/Invalid certificate number format/);
      }
    });

    it("validates attendance rate range constraints (0 to 100)", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-12-01",
          attendanceRate: -0.1,
        });
      }).toThrow("Attendance rate must be a percentage between 0 and 100.");

      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-12-01",
          attendanceRate: 100.1,
        });
      }).toThrow("Attendance rate must be a percentage between 0 and 100.");
    });
  });

  // =========================================================================
  // 6. Extrémní doménové invarianty a zátěžové stavy (Stress & Extreme Conditions)
  // =========================================================================
  describe("6. Extreme Domain Invariants & Stress Conditions", () => {
    it("handles extreme queue load with 25+ waitlisted candidates without gap or index drift (ADR-02)", async () => {
      const termId = await termService.createTerm({
        courseId: "course-stress-queue",
        startDate: "2026-11-01",
        endDate: "2026-11-30",
        capacity: 2,
      });

      // 2 confirmed spots
      const s1 = await termService.createEnrollment(termId, {
        firstName: "Confirmed",
        lastName: "One",
        email: "c1@stress.cz",
      });
      const s2 = await termService.createEnrollment(termId, {
        firstName: "Confirmed",
        lastName: "Two",
        email: "c2@stress.cz",
      });
      expect(s1.status).toBe("CONFIRMED");
      expect(s2.status).toBe("CONFIRMED");

      // Register 25 waitlisted candidates
      const waitlistedIds: string[] = [];
      for (let i = 1; i <= 25; i++) {
        const enr = await termService.createEnrollment(termId, {
          firstName: `WaitlistStudent`,
          lastName: `${i}`,
          email: `waitlist${i}@stress.cz`,
        });
        expect(enr.status).toBe("WAITLIST");
        expect(enr.waitlistPosition).toBe(i);
        waitlistedIds.push(enr.id);
      }

      const term = await termService.getTermById(termId);
      expect(term.confirmedCount).toBe(2);
      expect(term.waitlistCount).toBe(25);

      // Cancel Confirmed S1 -> Waitlist #1 promoted, remaining 24 shift down
      const cancel1 = await termService.cancelEnrollment(s1.id);
      expect(cancel1.success).toBe(true);

      let list = await termService.getEnrollmentsForTerm(termId);
      const promoted = list.find((e) => e.id === waitlistedIds[0]);
      expect(promoted?.status).toBe("CONFIRMED");
      expect(promoted?.waitlistPosition).toBeNull();

      // Verify the remaining 24 candidates now have positions 1 through 24
      const activeWaitlistAfterPromotion = list
        .filter((e) => e.status === "WAITLIST")
        .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));
      expect(activeWaitlistAfterPromotion).toHaveLength(24);
      activeWaitlistAfterPromotion.forEach((item, index) => {
        expect(item.waitlistPosition).toBe(index + 1);
      });

      // Cancel a candidate in the middle of the waitlist (e.g. position 10)
      const middleCandidate = activeWaitlistAfterPromotion[9]; // 10th item (position 10)
      const cancelMiddle = await termService.cancelEnrollment(middleCandidate.id);
      expect(cancelMiddle.success).toBe(true);

      list = await termService.getEnrollmentsForTerm(termId);
      const remainingWaitlist = list
        .filter((e) => e.status === "WAITLIST")
        .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));

      expect(remainingWaitlist).toHaveLength(23);
      // Strictly consecutive positions 1, 2, ..., 23 with zero duplicates and zero gaps
      remainingWaitlist.forEach((item, index) => {
        expect(item.waitlistPosition).toBe(index + 1);
      });
    });

    it("handles idempotent cancellation when attempting to cancel an already cancelled enrollment", async () => {
      const termId = await termService.createTerm({
        courseId: "course-idempotent-cancel",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 1,
      });

      const s1 = await termService.createEnrollment(termId, {
        firstName: "S1",
        lastName: "One",
        email: "s1@idem.cz",
      });
      const s2 = await termService.createEnrollment(termId, {
        firstName: "S2",
        lastName: "Two",
        email: "s2@idem.cz",
      });
      expect(s2.waitlistPosition).toBe(1);

      // Cancel S1 first time -> promotes S2
      const firstCancel = await termService.cancelEnrollment(s1.id);
      expect(firstCancel.success).toBe(true);
      expect(firstCancel.promotedStudentId).toBe(s2.studentId);

      let list = await termService.getEnrollmentsForTerm(termId);
      expect(list.find((e) => e.id === s1.id)?.status).toBe("CANCELLED");
      expect(list.find((e) => e.id === s2.id)?.status).toBe("CONFIRMED");

      // Attempt to cancel S1 a second time -> idempotent, no error, no side effects
      const secondCancel = await termService.cancelEnrollment(s1.id);
      expect(secondCancel.success).toBe(true);
      expect(secondCancel.promotedStudentId).toBeUndefined();

      list = await termService.getEnrollmentsForTerm(termId);
      expect(list.find((e) => e.id === s1.id)?.status).toBe("CANCELLED");
      expect(list.find((e) => e.id === s2.id)?.status).toBe("CONFIRMED");
    });

    it("strictly rejects enrollment attempt on a non-existent course term", async () => {
      await expect(
        termService.createEnrollment("00000000-0000-0000-0000-000000000000", {
          firstName: "Ghost",
          lastName: "Student",
          email: "ghost@nowhere.com",
        })
      ).rejects.toThrow("Course term was not found.");
    });

    it("validates date chronology and constraints across CourseTerm and TeachingDay entities", () => {
      // Chronology invariant in CourseTerm
      expect(() => {
        new CourseTerm({
          courseId: "c-chrono",
          startDate: "2026-12-01",
          endDate: "2026-11-01",
          capacity: 10,
        });
      }).toThrow("Start date cannot be after end date.");

      expect(() => {
        new CourseTerm({
          courseId: "c-cap",
          startDate: "2026-11-01",
          endDate: "2026-11-10",
          capacity: 0,
        });
      }).toThrow("Term capacity must be a positive integer.");

      // Invariants in TeachingDay
      expect(() => {
        new TeachingDay({
          termId: "t-date",
          dayDate: "",
          hours: 4,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day requires a valid date.");

      expect(() => {
        new TeachingDay({
          termId: "t-hours",
          dayDate: "2026-11-05",
          hours: -2,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day hours must be a positive integer.");
    });

    it("enforces robust lecturer waiver validation under stress (empty, whitespace, special unicode characters)", () => {
      // Whitespace and control character justification (< 5 effective characters)
      expect(() => {
        new Certificate({
          enrollmentId: "e-ws",
          studentId: "s-ws",
          termId: "t-ws",
          certificateNumber: "AT-2026-0099",
          issueDate: "2026-11-30",
          attendanceRate: 65.0,
          hasWaiver: true,
          waiverReason: " \n\t   ", // only whitespace
        });
      }).toThrow("Instructor waiver requires a written justification of at least 5 characters.");

      // Valid unicode waiver justification
      const unicodeCert = new Certificate({
        enrollmentId: "e-uni",
        studentId: "s-uni",
        termId: "t-uni",
        certificateNumber: "AT-2026-0099",
        issueDate: "2026-11-30",
        attendanceRate: 65.0,
        hasWaiver: true,
        waiverReason: "Lékařská zpráva doložena a uznána lektorem ⚕️",
      });
      expect(unicodeCert.hasWaiver).toBe(true);
      expect(unicodeCert.waiverReason).toContain("Lékařská zpráva");
    });
  });
});
