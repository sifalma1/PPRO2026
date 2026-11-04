import { describe, it, expect, beforeEach } from "@jest/globals";
import { TeachingDay } from "../../src/domain/entities/TeachingDay.js";
import { Attendance } from "../../src/domain/entities/Attendance.js";
import { AttendanceService } from "../../src/application/services/AttendanceService.js";
import { PostgresAttendanceRepository } from "../../src/infrastructure/database/PostgresAttendanceRepository.js";
import {
  AttendanceSummaryDto,
  CreateTeachingDayDto,
  MarkAttendanceDto,
} from "../../src/application/dto/AttendanceDto.js";

/**
 * In-memory repository for isolated Attendance and Teaching Day testing
 */
class InMemoryAttendanceRepository {
  public teachingDays: any[] = [];
  public attendanceRecords: any[] = [];
  public enrolledStudents: any[] = [];

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
    return this.enrolledStudents
      .filter((s) => s.termId === day.termId)
      .map((s) => {
        const att = this.attendanceRecords.find(
          (a) => a.teachingDayId === teachingDayId && a.studentId === s.id
        );
        return {
          teachingDayId,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          studentEmail: s.email,
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

    const termStudents = this.enrolledStudents.filter((s) => s.termId === termId);

    return termStudents.map((s) => {
      const attendedCount = termDays.filter((d) => {
        const att = this.attendanceRecords.find(
          (a) => a.teachingDayId === d.id && a.studentId === s.id
        );
        return att && att.isPresent;
      }).length;

      const percentage = totalDays > 0 ? Math.round((attendedCount / totalDays) * 1000) / 10 : 0;

      return {
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentEmail: s.email,
        enrollmentId: s.enrollmentId,
        totalDays,
        attendedDays: attendedCount,
        attendancePercentage: percentage,
        qualifiesForCertificate: percentage >= 70,
        certificateIssued: false,
      };
    });
  }
}

describe("TeachingDay, Attendance Domain Entities and AttendanceService (Jest Unit Tests)", () => {
  describe("TeachingDay Domain Entity Validation", () => {
    it("creates a valid teaching day with all attributes", () => {
      const day = new TeachingDay({
        termId: "term-101",
        dayDate: "2026-11-15",
        hours: 6,
        topic: "Advanced PostgreSQL and Indexing Strategies",
        lecturerId: "lecturer-1",
        lecturerName: "Dr. Petr Dvorak",
      });

      expect(day.termId).toBe("term-101");
      expect(day.dayDate).toBe("2026-11-15");
      expect(day.hours).toBe(6);
      expect(day.topic).toBe("Advanced PostgreSQL and Indexing Strategies");
      expect(day.lecturerId).toBe("lecturer-1");
      expect(day.lecturerName).toBe("Dr. Petr Dvorak");
    });

    it("trims whitespace from topic", () => {
      const day = new TeachingDay({
        termId: "term-101",
        dayDate: "2026-11-15",
        hours: 4,
        topic: "   Clean Architecture Patterns   ",
      });

      expect(day.topic).toBe("Clean Architecture Patterns");
    });

    it("throws an error when termId is missing", () => {
      expect(() => {
        new TeachingDay({
          termId: "",
          dayDate: "2026-11-15",
          hours: 4,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day must be assigned to a course term.");
    });

    it("throws an error when dayDate is missing", () => {
      expect(() => {
        new TeachingDay({
          termId: "term-1",
          dayDate: "",
          hours: 4,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day requires a valid date.");
    });

    it("throws an error when hours are not a positive integer", () => {
      expect(() => {
        new TeachingDay({
          termId: "term-1",
          dayDate: "2026-11-15",
          hours: 0,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day hours must be a positive integer.");

      expect(() => {
        new TeachingDay({
          termId: "term-1",
          dayDate: "2026-11-15",
          hours: -4,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day hours must be a positive integer.");

      expect(() => {
        new TeachingDay({
          termId: "term-1",
          dayDate: "2026-11-15",
          hours: 3.5,
          topic: "Valid Topic",
        });
      }).toThrow("Teaching day hours must be a positive integer.");
    });

    it("throws an error when topic has fewer than 3 characters", () => {
      expect(() => {
        new TeachingDay({
          termId: "term-1",
          dayDate: "2026-11-15",
          hours: 4,
          topic: "AB",
        });
      }).toThrow("Teaching day topic must be at least 3 characters long.");
    });
  });

  describe("Attendance Domain Entity Validation", () => {
    it("creates a valid attendance entry", () => {
      const att = new Attendance({
        teachingDayId: "day-10",
        studentId: "stu-20",
        studentName: "Jana Mala",
        isPresent: true,
        note: "Submitted practical assignment on time",
      });

      expect(att.teachingDayId).toBe("day-10");
      expect(att.studentId).toBe("stu-20");
      expect(att.studentName).toBe("Jana Mala");
      expect(att.isPresent).toBe(true);
      expect(att.note).toBe("Submitted practical assignment on time");
    });

    it("coerces falsy isPresent to boolean false", () => {
      const att = new Attendance({
        teachingDayId: "day-10",
        studentId: "stu-20",
        isPresent: false,
      });

      expect(att.isPresent).toBe(false);
      expect(att.note).toBeNull();
    });

    it("throws an error when teachingDayId or studentId is missing", () => {
      expect(() => {
        new Attendance({
          teachingDayId: "",
          studentId: "stu-1",
          isPresent: true,
        });
      }).toThrow("Attendance record must reference a teaching day.");

      expect(() => {
        new Attendance({
          teachingDayId: "day-1",
          studentId: "",
          isPresent: true,
        });
      }).toThrow("Attendance record must reference a student.");
    });
  });

  describe("AttendanceService & 70% Calculation Rule (ADR-01 & ADR-05)", () => {
    let repo: InMemoryAttendanceRepository;
    let service: AttendanceService;

    beforeEach(() => {
      repo = new InMemoryAttendanceRepository();
      service = new AttendanceService(repo as unknown as PostgresAttendanceRepository);
    });

    it("validates input when creating a teaching day in AttendanceService", async () => {
      await expect(
        service.createTeachingDay({
          termId: "",
          dayDate: "2026-11-10",
          hours: 4,
          topic: "Valid Topic",
        })
      ).rejects.toThrow("Term ID is required.");

      await expect(
        service.createTeachingDay({
          termId: "term-1",
          dayDate: "",
          hours: 4,
          topic: "Valid Topic",
        })
      ).rejects.toThrow("Date is required.");

      await expect(
        service.createTeachingDay({
          termId: "term-1",
          dayDate: "2026-11-10",
          hours: 0,
          topic: "Valid Topic",
        })
      ).rejects.toThrow("Hours must be a positive integer.");

      await expect(
        service.createTeachingDay({
          termId: "term-1",
          dayDate: "2026-11-10",
          hours: 4,
          topic: "A",
        })
      ).rejects.toThrow("Topic must be at least 3 characters long.");
    });

    it("validates input when marking attendance in AttendanceService", async () => {
      await expect(
        service.markAttendance({
          teachingDayId: "",
          studentId: "stu-1",
          isPresent: true,
        })
      ).rejects.toThrow("Teaching day ID is required.");

      await expect(
        service.markAttendance({
          teachingDayId: "day-1",
          studentId: "",
          isPresent: true,
        })
      ).rejects.toThrow("Student ID is required.");
    });

    it("calculates attendance rate accurately and determines 70% threshold (ADR-01)", async () => {
      const termId = "term-web-101";

      // Create 10 teaching days
      const dayIds: string[] = [];
      for (let i = 1; i <= 10; i++) {
        const dayId = await service.createTeachingDay({
          termId,
          dayDate: `2026-11-${String(i).padStart(2, "0")}`,
          hours: 4,
          topic: `Block ${i} - Module content`,
        });
        dayIds.push(dayId);
      }

      // Add 3 enrolled students
      repo.enrolledStudents.push(
        {
          id: "s1",
          firstName: "Student",
          lastName: "100%",
          email: "s1@test.cz",
          enrollmentId: "e1",
          termId,
        },
        {
          id: "s2",
          firstName: "Student",
          lastName: "70%",
          email: "s2@test.cz",
          enrollmentId: "e2",
          termId,
        },
        {
          id: "s3",
          firstName: "Student",
          lastName: "60%",
          email: "s3@test.cz",
          enrollmentId: "e3",
          termId,
        }
      );

      // Student 1 attends 10/10 days (100%)
      for (const dayId of dayIds) {
        await service.markAttendance({ teachingDayId: dayId, studentId: "s1", isPresent: true });
      }

      // Student 2 attends exactly 7/10 days (70%)
      for (let i = 0; i < 7; i++) {
        await service.markAttendance({
          teachingDayId: dayIds[i],
          studentId: "s2",
          isPresent: true,
        });
      }
      for (let i = 7; i < 10; i++) {
        await service.markAttendance({
          teachingDayId: dayIds[i],
          studentId: "s2",
          isPresent: false,
          note: "Excused illness",
        });
      }

      // Student 3 attends 6/10 days (60%)
      for (let i = 0; i < 6; i++) {
        await service.markAttendance({
          teachingDayId: dayIds[i],
          studentId: "s3",
          isPresent: true,
        });
      }
      for (let i = 6; i < 10; i++) {
        await service.markAttendance({
          teachingDayId: dayIds[i],
          studentId: "s3",
          isPresent: false,
        });
      }

      // Calculate summaries
      const summaries = await service.getAttendanceSummary(termId);
      expect(summaries).toHaveLength(3);

      const sum1 = summaries.find((s) => s.studentId === "s1");
      expect(sum1?.attendedDays).toBe(10);
      expect(sum1?.attendancePercentage).toBe(100.0);
      expect(sum1?.qualifiesForCertificate).toBe(true);

      const sum2 = summaries.find((s) => s.studentId === "s2");
      expect(sum2?.attendedDays).toBe(7);
      expect(sum2?.attendancePercentage).toBe(70.0);
      expect(sum2?.qualifiesForCertificate).toBe(true); // Exactly 70% qualifies!

      const sum3 = summaries.find((s) => s.studentId === "s3");
      expect(sum3?.attendedDays).toBe(6);
      expect(sum3?.attendancePercentage).toBe(60.0);
      expect(sum3?.qualifiesForCertificate).toBe(false); // < 70% does not qualify!
    });
  });
});
