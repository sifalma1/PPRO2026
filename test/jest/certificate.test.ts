import { describe, it, expect, beforeEach } from "@jest/globals";
import { Certificate } from "../../src/domain/entities/Certificate.js";
import { CertificateService } from "../../src/application/services/CertificateService.js";
import { PostgresCertificateRepository } from "../../src/infrastructure/database/PostgresCertificateRepository.js";
import {
  CertificateResponseDto,
  IssueCertificateDto,
} from "../../src/application/dto/CertificateDto.js";

interface MockCertificateEnrollment {
  id: string;
  termId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
  status: string;
}

interface MockTeachingDay {
  id: string;
  termId: string;
}

interface MockAttendanceRecord {
  teachingDayId: string;
  studentId: string;
  isPresent: boolean;
}

/**
 * In-memory repository mock for isolated Certificate testing
 */
class InMemoryCertificateRepository {
  public certificates: CertificateResponseDto[] = [];
  public enrollments: MockCertificateEnrollment[] = [];
  public teachingDays: MockTeachingDay[] = [];
  public attendanceRecords: MockAttendanceRecord[] = [];
  private counter: number = 0;

  async findAll(): Promise<CertificateResponseDto[]> {
    return this.certificates.map((c) => ({ ...c }));
  }

  async findById(id: string): Promise<CertificateResponseDto | null> {
    const found = this.certificates.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async getNextCertificateNumber(): Promise<string> {
    this.counter += 1;
    const year = new Date().getFullYear();
    const seq = String(this.counter).padStart(4, "0");
    return `AT-${year}-${seq}`;
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
      courseTitle: enrollment.courseTitle,
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
      studentName: domainCert.studentName || "Test Student",
      studentEmail: enrollment.studentEmail || "test@example.com",
      termId: domainCert.termId,
      courseTitle: domainCert.courseTitle || "Test Course",
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
}

describe("Certificate Entity and CertificateService (Jest Unit Tests - ADR-01)", () => {
  describe("Certificate Entity Invariants & Validation", () => {
    it("issues a certificate automatically when attendance rate >= 70%", () => {
      const cert = new Certificate({
        enrollmentId: "enr-001",
        studentId: "stu-001",
        termId: "term-001",
        certificateNumber: "AT-2026-0001",
        issueDate: "2026-11-30",
        attendanceRate: 85.0,
      });

      expect(cert.certificateNumber).toBe("AT-2026-0001");
      expect(cert.attendanceRate).toBe(85.0);
      expect(cert.hasWaiver).toBe(false);
      expect(cert.waiverReason).toBeNull();
    });

    it("issues a certificate at exact boundary of 70.0% attendance without waiver", () => {
      const cert = new Certificate({
        enrollmentId: "enr-002",
        studentId: "stu-002",
        termId: "term-001",
        certificateNumber: "AT-2026-0002",
        issueDate: "2026-11-30",
        attendanceRate: 70.0,
      });

      expect(cert.attendanceRate).toBe(70.0);
      expect(cert.hasWaiver).toBe(false);
    });

    it("rejects issuance when attendance < 70% and no lecturer waiver is provided (ADR-01)", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "enr-003",
          studentId: "stu-003",
          termId: "term-001",
          certificateNumber: "AT-2026-0003",
          issueDate: "2026-11-30",
          attendanceRate: 69.9,
          hasWaiver: false,
        });
      }).toThrow(
        "Student does not meet the 70% attendance requirement (69.9%). An instructor waiver with written reason is required."
      );
    });

    it("allows certificate issuance when attendance < 70% if instructor waiver with justification is provided", () => {
      const cert = new Certificate({
        enrollmentId: "enr-004",
        studentId: "stu-004",
        termId: "term-001",
        certificateNumber: "AT-2026-0004",
        issueDate: "2026-11-30",
        attendanceRate: 50.0,
        hasWaiver: true,
        waiverReason: "Student successfully delivered all individual projects and practical tasks.",
      });

      expect(cert.hasWaiver).toBe(true);
      expect(cert.waiverReason).toBe(
        "Student successfully delivered all individual projects and practical tasks."
      );
      expect(cert.attendanceRate).toBe(50.0);
    });

    it("rejects waiver if written justification is missing or shorter than 5 characters", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "enr-005",
          studentId: "stu-005",
          termId: "term-001",
          certificateNumber: "AT-2026-0005",
          issueDate: "2026-11-30",
          attendanceRate: 55.0,
          hasWaiver: true,
          waiverReason: "",
        });
      }).toThrow("Instructor waiver requires a written justification of at least 5 characters.");

      expect(() => {
        new Certificate({
          enrollmentId: "enr-005",
          studentId: "stu-005",
          termId: "term-001",
          certificateNumber: "AT-2026-0005",
          issueDate: "2026-11-30",
          attendanceRate: 55.0,
          hasWaiver: true,
          waiverReason: "Ok",
        });
      }).toThrow("Instructor waiver requires a written justification of at least 5 characters.");
    });

    it("validates official certificate number format AT-YYYY-XXXX", () => {
      // Valid formats
      expect(
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0042",
          issueDate: "2026-11-30",
          attendanceRate: 100,
        }).certificateNumber
      ).toBe("AT-2026-0042");

      expect(
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2027-10023",
          issueDate: "2027-01-15",
          attendanceRate: 100,
        }).certificateNumber
      ).toBe("AT-2027-10023");

      // Invalid formats
      const invalidNumbers = [
        "2026-0042",
        "AT-26-0042",
        "AT-2026-42",
        "CERT-2026-0042",
        "AT_2026_0042",
      ];

      for (const num of invalidNumbers) {
        expect(() => {
          new Certificate({
            enrollmentId: "e1",
            studentId: "s1",
            termId: "t1",
            certificateNumber: num,
            issueDate: "2026-11-30",
            attendanceRate: 100,
          });
        }).toThrow(/Invalid certificate number format/);
      }
    });

    it("validates required references and attendance rate limits", () => {
      expect(() => {
        new Certificate({
          enrollmentId: "",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-11-30",
          attendanceRate: 80,
        });
      }).toThrow("Certificate must reference an enrollment.");

      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-11-30",
          attendanceRate: 80,
        });
      }).toThrow("Certificate must reference a student.");

      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-11-30",
          attendanceRate: 80,
        });
      }).toThrow("Certificate must reference a course term.");

      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-11-30",
          attendanceRate: -5,
        });
      }).toThrow("Attendance rate must be a percentage between 0 and 100.");

      expect(() => {
        new Certificate({
          enrollmentId: "e1",
          studentId: "s1",
          termId: "t1",
          certificateNumber: "AT-2026-0001",
          issueDate: "2026-11-30",
          attendanceRate: 105,
        });
      }).toThrow("Attendance rate must be a percentage between 0 and 100.");
    });
  });

  describe("CertificateService Use Cases & Term Completion", () => {
    let repo: InMemoryCertificateRepository;
    let service: CertificateService;

    beforeEach(() => {
      repo = new InMemoryCertificateRepository();
      service = new CertificateService(repo as unknown as PostgresCertificateRepository);
    });

    it("validates input parameters for issueCertificate and completeTerm", async () => {
      await expect(service.issueCertificate({ enrollmentId: "" })).rejects.toThrow(
        "Enrollment ID is required."
      );

      await expect(service.completeTerm("")).rejects.toThrow("Term ID is required.");
    });

    it("throws an error when retrieving non-existent certificate", async () => {
      await expect(service.getCertificateById("non-existent-id")).rejects.toThrow(
        "Certificate was not found."
      );
    });

    it("automatically completes term and issues certificates for students meeting 70% threshold", async () => {
      const termId = "term-fin-1";

      // Setup 2 teaching days
      repo.teachingDays.push(
        { id: "day-1", termId, hours: 4, topic: "Session 1" },
        { id: "day-2", termId, hours: 4, topic: "Session 2" }
      );

      // Student A attends 2/2 (100%) -> receives cert
      repo.enrollments.push({
        id: "enr-A",
        termId,
        studentId: "stu-A",
        studentName: "Student Alpha",
        status: "CONFIRMED",
      });
      repo.attendanceRecords.push(
        { teachingDayId: "day-1", studentId: "stu-A", isPresent: true },
        { teachingDayId: "day-2", studentId: "stu-A", isPresent: true }
      );

      // Student B attends 1/2 (50%) -> does NOT receive cert automatically
      repo.enrollments.push({
        id: "enr-B",
        termId,
        studentId: "stu-B",
        studentName: "Student Beta",
        status: "CONFIRMED",
      });
      repo.attendanceRecords.push(
        { teachingDayId: "day-1", studentId: "stu-B", isPresent: true },
        { teachingDayId: "day-2", studentId: "stu-B", isPresent: false }
      );

      const completionResult = await service.completeTerm(termId);
      expect(completionResult.issuedCount).toBe(1);
      expect(completionResult.certificates).toHaveLength(1);
      expect(completionResult.certificates[0].studentId).toBe("stu-A");
      expect(completionResult.certificates[0].attendanceRate).toBe(100);

      // Student B can now be issued a certificate with waiver
      const waiverCert = await service.issueCertificate({
        enrollmentId: "enr-B",
        hasWaiver: true,
        waiverReason: "Passed alternative assessment examination with score 92%.",
      });

      expect(waiverCert.studentId).toBe("stu-B");
      expect(waiverCert.hasWaiver).toBe(true);
      expect(waiverCert.attendanceRate).toBe(50);

      // Verify all certificates
      const allCerts = await service.getAllCertificates();
      expect(allCerts).toHaveLength(2);
    });
  });
});
