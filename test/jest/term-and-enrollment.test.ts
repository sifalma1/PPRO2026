import { describe, it, expect } from "@jest/globals";
import { CourseTerm } from "../../src/domain/entities/CourseTerm.js";
import { Enrollment } from "../../src/domain/entities/Enrollment.js";
import { TermService } from "../../src/application/services/TermService.js";
import { PostgresTermRepository } from "../../src/infrastructure/database/PostgresTermRepository.js";

/**
 * Stateful in-memory term and enrollment repository simulating DB transactions & ADR-02 / ADR-03 rules.
 */
class InMemoryTermRepository {
  public terms: any[] = [];
  public enrollments: any[] = [];
  public students: any[] = [];

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

  async createEnrollment(termId: string, studentData: any): Promise<any> {
    const term = this.terms.find((t) => t.id === termId);
    if (!term) throw new Error("Course term was not found.");

    let student = this.students.find(
      (s) => s.email.toLowerCase() === studentData.email.trim().toLowerCase()
    );
    if (!student) {
      student = {
        id: `stu-${this.students.length + 1}`,
        firstName: studentData.firstName.trim(),
        lastName: studentData.lastName.trim(),
        email: studentData.email.trim().toLowerCase(),
      };
      this.students.push(student);
    }

    // ADR-03 Concurrency rule: no duplicate active confirmed registrations for same course
    const activeSameCourse = this.enrollments.some((e) => {
      if (e.studentId !== student.id || e.status !== "CONFIRMED") return false;
      const otherTerm = this.terms.find((t) => t.id === e.termId);
      return otherTerm && otherTerm.courseId === term.courseId;
    });
    if (activeSameCourse) {
      throw new Error(
        "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule)."
      );
    }

    // Duplicate in this term check
    const duplicate = this.enrollments.some(
      (e) =>
        e.termId === termId &&
        e.studentId === student.id &&
        (e.status === "CONFIRMED" || e.status === "WAITLIST")
    );
    if (duplicate) {
      throw new Error("Student is already enrolled or on the waitlist for this term.");
    }

    const confirmedCount = this.enrollments.filter(
      (e) => e.termId === termId && e.status === "CONFIRMED"
    ).length;

    let status: "CONFIRMED" | "WAITLIST";
    let waitlistPosition: number | null = null;

    if (confirmedCount < term.capacity) {
      status = "CONFIRMED";
    } else {
      // Capacity reached: place on waitlist (ADR-02)
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
      // Find candidate #1 on waitlist and promote
      const nextCandidate = this.enrollments.find(
        (e) => e.termId === termId && e.status === "WAITLIST" && e.waitlistPosition === 1
      );

      if (nextCandidate) {
        promotedStudentId = nextCandidate.studentId;
        nextCandidate.status = "CONFIRMED";
        nextCandidate.waitlistPosition = null;

        // Shift remaining waitlisted candidates forward by 1
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
      // Shift remaining waitlist items behind the cancelled one
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

describe("CourseTerm and Enrollment Entities & TermService (Jest Unit Tests)", () => {
  describe("CourseTerm Domain Entity", () => {
    it("creates a course term and computes available spots correctly", () => {
      const term = new CourseTerm({
        courseId: "course-1",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        capacity: 12,
        confirmedCount: 5,
        waitlistCount: 0,
      });

      expect(term.capacity).toBe(12);
      expect(term.confirmedCount).toBe(5);
      expect(term.availableSpots).toBe(7);
      expect(term.isFull).toBe(false);
      expect(term.status).toBe("PLANNED");
    });

    it("detects when course term capacity is fully reached", () => {
      const fullTerm = new CourseTerm({
        courseId: "course-1",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 8,
        confirmedCount: 8,
        waitlistCount: 2,
      });

      expect(fullTerm.isFull).toBe(true);
      expect(fullTerm.availableSpots).toBe(0);
    });

    it("throws an error when start date is after end date", () => {
      expect(() => {
        new CourseTerm({
          courseId: "course-1",
          startDate: "2026-12-15",
          endDate: "2026-12-01",
          capacity: 10,
        });
      }).toThrow("Start date cannot be after end date.");
    });

    it("throws an error when term capacity is zero or negative", () => {
      expect(() => {
        new CourseTerm({
          courseId: "course-1",
          startDate: "2026-11-01",
          endDate: "2026-11-10",
          capacity: 0,
        });
      }).toThrow("Term capacity must be a positive integer.");

      expect(() => {
        new CourseTerm({
          courseId: "course-1",
          startDate: "2026-11-01",
          endDate: "2026-11-10",
          capacity: -5,
        });
      }).toThrow("Term capacity must be a positive integer.");
    });

    it("throws an error when courseId is missing", () => {
      expect(() => {
        new CourseTerm({
          courseId: "",
          startDate: "2026-11-01",
          endDate: "2026-11-10",
          capacity: 10,
        });
      }).toThrow("Course term must be assigned to a course.");
    });
  });

  describe("Enrollment Domain Entity", () => {
    it("creates a confirmed enrollment with status CONFIRMED", () => {
      const enr = new Enrollment({
        termId: "term-1",
        studentId: "stu-1",
        studentName: "Jan Novak",
        studentEmail: "jan.novak@example.com",
        status: "CONFIRMED",
      });

      expect(enr.isConfirmed).toBe(true);
      expect(enr.isWaitlisted).toBe(false);
      expect(enr.waitlistPosition).toBeNull();
    });

    it("creates a waitlisted enrollment with a valid position (ADR-02)", () => {
      const enr = new Enrollment({
        termId: "term-1",
        studentId: "stu-2",
        status: "WAITLIST",
        waitlistPosition: 1,
      });

      expect(enr.isConfirmed).toBe(false);
      expect(enr.isWaitlisted).toBe(true);
      expect(enr.waitlistPosition).toBe(1);
    });

    it("throws an error when waitlisted enrollment has invalid or non-positive position", () => {
      expect(() => {
        new Enrollment({
          termId: "term-1",
          studentId: "stu-2",
          status: "WAITLIST",
          waitlistPosition: 0,
        });
      }).toThrow("Waitlisted enrollment must have a positive waitlist position number.");

      expect(() => {
        new Enrollment({
          termId: "term-1",
          studentId: "stu-2",
          status: "WAITLIST",
          waitlistPosition: null,
        });
      }).toThrow("Waitlisted enrollment must have a positive waitlist position number.");
    });

    it("throws an error when termId or studentId is missing", () => {
      expect(() => {
        new Enrollment({
          termId: "",
          studentId: "stu-1",
          status: "CONFIRMED",
        });
      }).toThrow("Enrollment must reference a course term.");

      expect(() => {
        new Enrollment({
          termId: "term-1",
          studentId: "",
          status: "CONFIRMED",
        });
      }).toThrow("Enrollment must reference a student.");
    });
  });

  describe("TermService Use Cases and Waiting List Workflow (ADR-02 & ADR-03)", () => {
    let mockRepo: InMemoryTermRepository;
    let service: TermService;

    beforeEach(() => {
      mockRepo = new InMemoryTermRepository();
      service = new TermService(mockRepo as unknown as PostgresTermRepository);
    });

    it("validates parameters when creating a term in TermService", async () => {
      await expect(
        service.createTerm({
          courseId: "",
          startDate: "2026-11-01",
          endDate: "2026-11-20",
          capacity: 10,
        })
      ).rejects.toThrow("Course ID is required.");

      await expect(
        service.createTerm({
          courseId: "course-1",
          startDate: "2026-11-20",
          endDate: "2026-11-01",
          capacity: 10,
        })
      ).rejects.toThrow("Start date cannot be after end date.");

      await expect(
        service.createTerm({
          courseId: "course-1",
          startDate: "2026-11-01",
          endDate: "2026-11-20",
          capacity: 0,
        })
      ).rejects.toThrow("Capacity must be a positive integer.");
    });

    it("validates student registration payload in createEnrollment", async () => {
      const termId = await service.createTerm({
        courseId: "course-1",
        startDate: "2026-11-01",
        endDate: "2026-11-20",
        capacity: 5,
      });

      await expect(
        service.createEnrollment(termId, {
          firstName: "",
          lastName: "Novak",
          email: "novak@example.com",
        })
      ).rejects.toThrow("Student first name, last name, and email are required.");
    });

    it("places students into CONFIRMED when capacity allows, and WAITLIST when full (ADR-02)", async () => {
      // Create term with capacity 2
      const termId = await service.createTerm({
        courseId: "course-100",
        startDate: "2026-11-01",
        endDate: "2026-11-15",
        capacity: 2,
      });

      // 1. First student registers -> CONFIRMED
      const enr1 = await service.createEnrollment(termId, {
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
      });
      expect(enr1.status).toBe("CONFIRMED");
      expect(enr1.waitlistPosition).toBeNull();

      // 2. Second student registers -> CONFIRMED (capacity reached: 2/2)
      const enr2 = await service.createEnrollment(termId, {
        firstName: "Bob",
        lastName: "Taylor",
        email: "bob@example.com",
      });
      expect(enr2.status).toBe("CONFIRMED");
      expect(enr2.waitlistPosition).toBeNull();

      // 3. Third student registers -> WAITLIST position 1
      const enr3 = await service.createEnrollment(termId, {
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie@example.com",
      });
      expect(enr3.status).toBe("WAITLIST");
      expect(enr3.waitlistPosition).toBe(1);

      // 4. Fourth student registers -> WAITLIST position 2
      const enr4 = await service.createEnrollment(termId, {
        firstName: "Diana",
        lastName: "Prince",
        email: "diana@example.com",
      });
      expect(enr4.status).toBe("WAITLIST");
      expect(enr4.waitlistPosition).toBe(2);

      // Verify term status
      const termOverview = await service.getTermById(termId);
      expect(termOverview.confirmedCount).toBe(2);
      expect(termOverview.waitlistCount).toBe(2);
      expect(termOverview.isFull).toBe(true);
      expect(termOverview.availableSpots).toBe(0);
    });

    it("promotes #1 waitlisted student to CONFIRMED and shifts remaining queue when a confirmed student cancels (ADR-02)", async () => {
      const termId = await service.createTerm({
        courseId: "course-200",
        startDate: "2026-12-01",
        endDate: "2026-12-10",
        capacity: 1, // Only 1 spot
      });

      // Alice takes the spot
      const alice = await service.createEnrollment(termId, {
        firstName: "Alice",
        lastName: "First",
        email: "alice2@example.com",
      });

      // Bob enters waitlist #1
      const bob = await service.createEnrollment(termId, {
        firstName: "Bob",
        lastName: "Second",
        email: "bob2@example.com",
      });
      expect(bob.status).toBe("WAITLIST");
      expect(bob.waitlistPosition).toBe(1);

      // Charlie enters waitlist #2
      const charlie = await service.createEnrollment(termId, {
        firstName: "Charlie",
        lastName: "Third",
        email: "charlie2@example.com",
      });
      expect(charlie.status).toBe("WAITLIST");
      expect(charlie.waitlistPosition).toBe(2);

      // Alice cancels her confirmed registration!
      const cancelResult = await service.cancelEnrollment(alice.id);
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.promotedStudentId).toBe(bob.studentId);

      // Check current enrollments
      const enrollments = await service.getEnrollmentsForTerm(termId);
      const bobUpdated = enrollments.find((e) => e.id === bob.id);
      const charlieUpdated = enrollments.find((e) => e.id === charlie.id);
      const aliceUpdated = enrollments.find((e) => e.id === alice.id);

      expect(aliceUpdated.status).toBe("CANCELLED");
      expect(bobUpdated.status).toBe("CONFIRMED");
      expect(bobUpdated.waitlistPosition).toBeNull();
      expect(charlieUpdated.status).toBe("WAITLIST");
      expect(charlieUpdated.waitlistPosition).toBe(1); // Shifted from #2 to #1!
    });

    it("enforces ADR-03 rule: student cannot have concurrent confirmed enrollments in different terms of the same course", async () => {
      const termA = await service.createTerm({
        courseId: "course-same",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        capacity: 10,
      });

      const termB = await service.createTerm({
        courseId: "course-same",
        startDate: "2026-11-01",
        endDate: "2026-11-15",
        capacity: 10,
      });

      // Student enrolls in Term A
      await service.createEnrollment(termA, {
        firstName: "Jan",
        lastName: "Novak",
        email: "jan.novak@domain.cz",
      });

      // Attempting to enroll the same student into Term B of the same course must fail
      await expect(
        service.createEnrollment(termB, {
          firstName: "Jan",
          lastName: "Novak",
          email: "jan.novak@domain.cz",
        })
      ).rejects.toThrow(
        "Student already has an active confirmed enrollment for this course in another term (ADR-03 rule)."
      );
    });
  });
});
