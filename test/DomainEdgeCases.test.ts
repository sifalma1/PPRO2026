import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Certificate } from "../src/domain/entities/Certificate.js";
import { TermService } from "../src/application/services/TermService.js";
import { CertificateService } from "../src/application/services/CertificateService.js";
import { AttendanceService } from "../src/application/services/AttendanceService.js";
import { PostgresTermRepository } from "../src/infrastructure/database/PostgresTermRepository.js";
import { PostgresCertificateRepository } from "../src/infrastructure/database/PostgresCertificateRepository.js";
import { PostgresAttendanceRepository } from "../src/infrastructure/database/PostgresAttendanceRepository.js";
import {
  CertificateResponseDto,
  IssueCertificateDto,
} from "../src/application/dto/CertificateDto.js";
import {
  CreateTeachingDayDto,
  MarkAttendanceDto,
  AttendanceSummaryDto,
} from "../src/application/dto/AttendanceDto.js";
import { CreateEnrollmentDto } from "../src/application/dto/EnrollmentDto.js";

/**
 * In-memory repository for Node native test runner edge case suite.
 */
class InMemoryEdgeCaseRepository {
  public terms: any[] = [];
  public students: any[] = [];
  public enrollments: any[] = [];
  public teachingDays: any[] = [];
  public attendanceRecords: any[] = [];
  public certificates: CertificateResponseDto[] = [];
  private certCounter: number = 0;

  async findAll(): Promise<any[]> {
    return this.terms.map((t) => {
      const termEnrollments = this.enrollments.filter((e) => e.termId === t.id);
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
    const id = `term-${this.terms.length + 1}`;
    this.terms.push({
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
    return this.enrollments.filter((e) => e.termId === termId);
  }

  async createEnrollment(termId: string, studentData: CreateEnrollmentDto): Promise<any> {
    const term = this.terms.find((t) => t.id === termId);
    if (!term) throw new Error("Course term was not found.");

    const normalizedEmail = studentData.email.trim().toLowerCase();
    let student = this.students.find((s) => s.email.toLowerCase() === normalizedEmail);
    if (!student) {
      student = {
        id: `stu-${this.students.length + 1}`,
        firstName: studentData.firstName.trim(),
        lastName: studentData.lastName.trim(),
        email: normalizedEmail,
      };
      this.students.push(student);
    }

    const duplicate = this.enrollments.some(
      (e) =>
        e.termId === termId &&
        e.studentId === student.id &&
        (e.status === "CONFIRMED" || e.status === "WAITLIST")
    );
    if (duplicate) {
      throw new Error("Student is already enrolled or on the waitlist for this term.");
    }

    const activeSameCourse = this.enrollments.some((e) => {
      if (e.studentId !== student.id || e.status !== "CONFIRMED" || e.termId === termId)
        return false;
      const otherTerm = this.terms.find((t) => t.id === e.termId);
      return otherTerm && otherTerm.courseId === term.courseId;
    });
    if (activeSameCourse) {
      throw new Error(
        "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule)."
      );
    }

    const confirmedCount = this.enrollments.filter(
      (e) => e.termId === termId && e.status === "CONFIRMED"
    ).length;

    let status: "CONFIRMED" | "WAITLIST";
    let waitlistPosition: number | null = null;

    if (confirmedCount < term.capacity) {
      status = "CONFIRMED";
    } else {
      status = "WAITLIST";
      const waitlist = this.enrollments.filter(
        (e) => e.termId === termId && e.status === "WAITLIST"
      );
      const maxPos = waitlist.reduce((max, e) => Math.max(max, e.waitlistPosition || 0), 0);
      waitlistPosition = maxPos + 1;
    }

    const enrollment = {
      id: `enr-${this.enrollments.length + 1}`,
      termId,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      status,
      waitlistPosition,
      submittedAt: new Date().toISOString(),
    };
    this.enrollments.push(enrollment);

    return enrollment;
  }

  async cancelEnrollment(enrollmentId: string): Promise<any> {
    const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) throw new Error("Enrollment was not found.");

    const termId = enrollment.termId;
    const wasConfirmed = enrollment.status === "CONFIRMED";
    const wasWaitlist = enrollment.status === "WAITLIST";
    const oldPosition = enrollment.waitlistPosition;

    enrollment.status = "CANCELLED";
    enrollment.waitlistPosition = null;

    let promotedStudentId: string | undefined;

    if (wasConfirmed) {
      const nextCandidate = this.enrollments.find(
        (e) => e.termId === termId && e.status === "WAITLIST" && e.waitlistPosition === 1
      );

      if (nextCandidate) {
        promotedStudentId = nextCandidate.studentId;
        nextCandidate.status = "CONFIRMED";
        nextCandidate.waitlistPosition = null;

        for (const item of this.enrollments) {
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
      for (const item of this.enrollments) {
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

  async getTeachingDays(termId: string): Promise<any[]> {
    return this.teachingDays.filter((d) => d.termId === termId);
  }

  async createTeachingDay(dto: CreateTeachingDayDto): Promise<string> {
    const id = `day-${this.teachingDays.length + 1}`;
    this.teachingDays.push({
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
    const day = this.teachingDays.find((d) => d.id === teachingDayId);
    if (!day) return [];
    return this.enrollments
      .filter(
        (e) => e.termId === day.termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
      )
      .map((e) => {
        const att = this.attendanceRecords.find(
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
    const existingIndex = this.attendanceRecords.findIndex(
      (a) => a.teachingDayId === dto.teachingDayId && a.studentId === dto.studentId
    );
    if (existingIndex >= 0) {
      this.attendanceRecords[existingIndex].isPresent = dto.isPresent;
      this.attendanceRecords[existingIndex].note = dto.note || null;
    } else {
      this.attendanceRecords.push({
        id: `att-${this.attendanceRecords.length + 1}`,
        teachingDayId: dto.teachingDayId,
        studentId: dto.studentId,
        isPresent: dto.isPresent,
        note: dto.note || null,
      });
    }
  }

  async getAttendanceSummary(termId: string): Promise<AttendanceSummaryDto[]> {
    const termDays = this.teachingDays.filter((d) => d.termId === termId);
    const totalDays = termDays.length;
    const confirmedEnrollments = this.enrollments.filter(
      (e) => e.termId === termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
    );

    return confirmedEnrollments.map((enr) => {
      const attendedCount = termDays.filter((d) => {
        const att = this.attendanceRecords.find(
          (a) => a.teachingDayId === d.id && a.studentId === enr.studentId
        );
        return att && att.isPresent;
      }).length;

      const percentage = totalDays > 0 ? Math.round((attendedCount / totalDays) * 1000) / 10 : 0;
      const cert = this.certificates.find((c) => c.enrollmentId === enr.id);

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

  async getNextCertificateNumber(): Promise<string> {
    this.certCounter += 1;
    const year = new Date().getFullYear();
    const seq = String(this.certCounter).padStart(4, "0");
    return `AT-${year}-${seq}`;
  }

  async getAllCertificates(): Promise<CertificateResponseDto[]> {
    return this.certificates.map((c) => ({ ...c }));
  }

  async findCertificateById(id: string): Promise<CertificateResponseDto | null> {
    const found = this.certificates.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async issueCertificate(dto: IssueCertificateDto): Promise<CertificateResponseDto> {
    const enrollment = this.enrollments.find((e) => e.id === dto.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found.");

    const existingCert = this.certificates.find((c) => c.enrollmentId === dto.enrollmentId);
    if (existingCert) {
      throw new Error("A certificate has already been issued for this enrollment.");
    }

    const termDays = this.teachingDays.filter((d) => d.termId === enrollment.termId);
    const totalDays = termDays.length;
    const attendedDays = termDays.filter((d) => {
      const att = this.attendanceRecords.find(
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
      courseTitle: "Node Test Edge Cases",
      certificateNumber: certNumber,
      issueDate,
      attendanceRate: roundedRate,
      hasWaiver: dto.hasWaiver,
      waiverReason: dto.waiverReason,
    });

    const createdDto: CertificateResponseDto = {
      id: `cert-${this.certificates.length + 1}`,
      enrollmentId: domainCert.enrollmentId,
      studentId: domainCert.studentId,
      studentName: domainCert.studentName || enrollment.studentName,
      studentEmail: enrollment.studentEmail || "test@example.com",
      termId: domainCert.termId,
      courseTitle: domainCert.courseTitle || "Node Edge Case Course",
      certificateNumber: domainCert.certificateNumber,
      issueDate: domainCert.issueDate,
      attendanceRate: domainCert.attendanceRate,
      hasWaiver: domainCert.hasWaiver,
      waiverReason: domainCert.waiverReason || undefined,
      createdAt: new Date().toISOString(),
    };

    this.certificates.push(createdDto);
    enrollment.status = "COMPLETED";

    return createdDto;
  }

  async completeTerm(
    termId: string
  ): Promise<{ issuedCount: number; certificates: CertificateResponseDto[] }> {
    const term = this.terms.find((t) => t.id === termId);
    if (term) term.status = "COMPLETED";

    const eligibleEnrollments = this.enrollments.filter(
      (e) => e.termId === termId && (e.status === "CONFIRMED" || e.status === "COMPLETED")
    );

    const issued: CertificateResponseDto[] = [];
    for (const enr of eligibleEnrollments) {
      const alreadyIssued = this.certificates.some((c) => c.enrollmentId === enr.id);
      if (alreadyIssued) continue;

      const termDays = this.teachingDays.filter((d) => d.termId === termId);
      const totalDays = termDays.length;
      const attended = termDays.filter((d) => {
        const att = this.attendanceRecords.find(
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

  async getLecturers(): Promise<any[]> {
    return [];
  }
  async getClassrooms(): Promise<any[]> {
    return [];
  }
  async getStudents(): Promise<any[]> {
    return this.students;
  }
  async getAnalytics(): Promise<any> {
    return {};
  }
}

describe("Domain Edge Cases (Node Test Runner - ADR-01, ADR-02, ADR-03)", () => {
  let repo: InMemoryEdgeCaseRepository;
  let termService: TermService;
  let certService: CertificateService;
  let attendanceService: AttendanceService;

  beforeEach(() => {
    repo = new InMemoryEdgeCaseRepository();
    termService = new TermService(repo as unknown as PostgresTermRepository);
    certService = new CertificateService(repo as unknown as PostgresCertificateRepository);
    attendanceService = new AttendanceService(repo as unknown as PostgresAttendanceRepository);
  });

  test("Cascading promotion across 3 consecutive cancellations of confirmed spots (ADR-02)", async () => {
    const termId = await termService.createTerm({
      courseId: "c-node-cascade",
      startDate: "2026-11-01",
      endDate: "2026-11-20",
      capacity: 2,
    });

    const s1 = await termService.createEnrollment(termId, {
      firstName: "S1",
      lastName: "One",
      email: "s1@c.cz",
    });
    const s2 = await termService.createEnrollment(termId, {
      firstName: "S2",
      lastName: "Two",
      email: "s2@c.cz",
    });
    const s3 = await termService.createEnrollment(termId, {
      firstName: "S3",
      lastName: "Three",
      email: "s3@c.cz",
    });
    const s4 = await termService.createEnrollment(termId, {
      firstName: "S4",
      lastName: "Four",
      email: "s4@c.cz",
    });
    const s5 = await termService.createEnrollment(termId, {
      firstName: "S5",
      lastName: "Five",
      email: "s5@c.cz",
    });

    assert.strictEqual(s1.status, "CONFIRMED");
    assert.strictEqual(s2.status, "CONFIRMED");
    assert.strictEqual(s3.waitlistPosition, 1);
    assert.strictEqual(s4.waitlistPosition, 2);
    assert.strictEqual(s5.waitlistPosition, 3);

    // Cancel S1 -> S3 promoted
    await termService.cancelEnrollment(s1.id);
    let list = await termService.getEnrollmentsForTerm(termId);
    assert.strictEqual(list.find((e) => e.id === s3.id)?.status, "CONFIRMED");
    assert.strictEqual(list.find((e) => e.id === s4.id)?.waitlistPosition, 1);
    assert.strictEqual(list.find((e) => e.id === s5.id)?.waitlistPosition, 2);

    // Cancel S2 -> S4 promoted
    await termService.cancelEnrollment(s2.id);
    list = await termService.getEnrollmentsForTerm(termId);
    assert.strictEqual(list.find((e) => e.id === s4.id)?.status, "CONFIRMED");
    assert.strictEqual(list.find((e) => e.id === s5.id)?.waitlistPosition, 1);

    // Cancel S3 -> S5 promoted
    await termService.cancelEnrollment(s3.id);
    list = await termService.getEnrollmentsForTerm(termId);
    assert.strictEqual(list.find((e) => e.id === s5.id)?.status, "CONFIRMED");

    const term = await termService.getTermById(termId);
    assert.strictEqual(term.confirmedCount, 2); // S4 and S5
    assert.strictEqual(term.waitlistCount, 0);
  });

  test("Boundary attendance calculation 70.0% vs 69.9% with and without waiver (ADR-01)", () => {
    // 70.0% passes without waiver
    const cert70 = new Certificate({
      enrollmentId: "e70",
      studentId: "s70",
      termId: "t70",
      certificateNumber: "AT-2026-0070",
      issueDate: "2026-11-30",
      attendanceRate: 70.0,
      hasWaiver: false,
    });
    assert.strictEqual(cert70.attendanceRate, 70.0);

    // 69.9% fails without waiver
    assert.throws(
      () => {
        new Certificate({
          enrollmentId: "e699",
          studentId: "s699",
          termId: "t699",
          certificateNumber: "AT-2026-0699",
          issueDate: "2026-11-30",
          attendanceRate: 69.9,
          hasWaiver: false,
        });
      },
      {
        message:
          "Student does not meet the 70% attendance requirement (69.9%). An instructor waiver with written reason is required.",
      }
    );

    // 69.9% passes with valid waiver
    const cert699Waiver = new Certificate({
      enrollmentId: "e699w",
      studentId: "s699w",
      termId: "t699",
      certificateNumber: "AT-2026-0699",
      issueDate: "2026-11-30",
      attendanceRate: 69.9,
      hasWaiver: true,
      waiverReason: "Passed special substitute practical assignment with high honors.",
    });
    assert.strictEqual(cert699Waiver.hasWaiver, true);
  });

  test("Rejects duplicate registration in same term and prevents duplicate active registration for same course (ADR-03)", async () => {
    const termId = await termService.createTerm({
      courseId: "course-unique-dup",
      startDate: "2026-11-01",
      endDate: "2026-11-20",
      capacity: 2,
    });

    await termService.createEnrollment(termId, {
      firstName: "Marek",
      lastName: "Dvorak",
      email: "marek.dvorak@example.cz",
    });

    // Re-register in same term -> fails
    await assert.rejects(
      async () => {
        await termService.createEnrollment(termId, {
          firstName: "Marek",
          lastName: "Dvorak",
          email: "  MAREK.DVORAK@EXAMPLE.CZ  ",
        });
      },
      { message: "Student is already enrolled or on the waitlist for this term." }
    );

    // Create another term of same course
    const term2Id = await termService.createTerm({
      courseId: "course-unique-dup",
      startDate: "2026-12-01",
      endDate: "2026-12-20",
      capacity: 5,
    });

    // Attempting to enroll in term2 of same course -> fails (ADR-03)
    await assert.rejects(
      async () => {
        await termService.createEnrollment(term2Id, {
          firstName: "Marek",
          lastName: "Dvorak",
          email: "marek.dvorak@example.cz",
        });
      },
      {
        message:
          "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule).",
      }
    );
  });

  test("Term closure when no students meet 70% threshold transitions term to COMPLETED with 0 issued certificates", async () => {
    const termId = await termService.createTerm({
      courseId: "course-no-certs",
      startDate: "2026-11-01",
      endDate: "2026-11-10",
      capacity: 5,
    });

    const d1 = await attendanceService.createTeachingDay({
      termId,
      dayDate: "2026-11-02",
      hours: 4,
      topic: "Day 1",
    });
    const d2 = await attendanceService.createTeachingDay({
      termId,
      dayDate: "2026-11-03",
      hours: 4,
      topic: "Day 2",
    });

    // Student attends 0/2 days
    await termService.createEnrollment(termId, {
      firstName: "Zero",
      lastName: "Att",
      email: "zero@att.cz",
    });

    const completion = await certService.completeTerm(termId);
    assert.strictEqual(completion.issuedCount, 0);
    assert.strictEqual(completion.certificates.length, 0);

    const term = await termService.getTermById(termId);
    assert.strictEqual(term.status, "COMPLETED");
  });

  test("Certificate sequence formatting and uniqueness enforcement", async () => {
    const num1 = await repo.getNextCertificateNumber();
    const num2 = await repo.getNextCertificateNumber();
    const year = new Date().getFullYear();

    assert.strictEqual(num1, `AT-${year}-0001`);
    assert.strictEqual(num2, `AT-${year}-0002`);

    assert.throws(
      () => {
        new Certificate({
          enrollmentId: "e-inv",
          studentId: "s-inv",
          termId: "t-inv",
          certificateNumber: "INVALID-NUM",
          issueDate: "2026-11-30",
          attendanceRate: 100,
        });
      },
      { message: "Invalid certificate number format 'INVALID-NUM'. Expected format: AT-YYYY-XXXX" }
    );
  });

  test("Idempotent cancellation and non-existent term rejection", async () => {
    const termId = await termService.createTerm({
      courseId: "course-idem-node",
      startDate: "2026-11-01",
      endDate: "2026-11-20",
      capacity: 1,
    });

    const enr = await termService.createEnrollment(termId, {
      firstName: "A",
      lastName: "B",
      email: "ab@node.cz",
    });
    const cancelResult1 = await termService.cancelEnrollment(enr.id);
    assert.strictEqual(cancelResult1.success, true);

    // Cancel again -> idempotent
    const cancelResult2 = await termService.cancelEnrollment(enr.id);
    assert.strictEqual(cancelResult2.success, true);
    assert.strictEqual(cancelResult2.promotedStudentId, undefined);

    // Non-existent term
    await assert.rejects(
      async () => {
        await termService.createEnrollment("non-existent-term", {
          firstName: "C",
          lastName: "D",
          email: "cd@node.cz",
        });
      },
      { message: "Course term was not found." }
    );
  });
});
