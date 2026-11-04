import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TeachingDay } from "../src/domain/entities/TeachingDay.js";
import { Attendance } from "../src/domain/entities/Attendance.js";
import { Certificate } from "../src/domain/entities/Certificate.js";

describe("Attendance and Certificate Entities (Unit Tests - ADR-01 & ADR-05)", () => {
  test("Successfully creates valid teaching day", () => {
    const day = new TeachingDay({
      termId: "term-101",
      dayDate: "2026-11-15",
      hours: 6,
      topic: "Introduction to Advanced Node.js",
    });

    assert.strictEqual(day.termId, "term-101");
    assert.strictEqual(day.hours, 6);
    assert.strictEqual(day.topic, "Introduction to Advanced Node.js");
  });

  test("Throws error for teaching day with non-positive hours or short topic", () => {
    assert.throws(
      () => {
        new TeachingDay({
          termId: "term-101",
          dayDate: "2026-11-15",
          hours: 0,
          topic: "Topic",
        });
      },
      { message: "Teaching day hours must be a positive integer." }
    );

    assert.throws(
      () => {
        new TeachingDay({
          termId: "term-101",
          dayDate: "2026-11-15",
          hours: 4,
          topic: "AB",
        });
      },
      { message: "Teaching day topic must be at least 3 characters long." }
    );
  });

  test("Successfully creates attendance record", () => {
    const att = new Attendance({
      teachingDayId: "day-1",
      studentId: "student-1",
      isPresent: true,
      note: "Participated actively",
    });

    assert.strictEqual(att.isPresent, true);
    assert.strictEqual(att.note, "Participated actively");
  });

  test("Issues certificate automatically when attendance rate >= 70% (ADR-01)", () => {
    const cert = new Certificate({
      enrollmentId: "enr-1",
      studentId: "stu-1",
      termId: "term-1",
      certificateNumber: "AT-2026-0042",
      issueDate: "2026-11-30",
      attendanceRate: 85.5,
    });

    assert.strictEqual(cert.certificateNumber, "AT-2026-0042");
    assert.strictEqual(cert.attendanceRate, 85.5);
    assert.strictEqual(cert.hasWaiver, false);
  });

  test("Rejects certificate issuance when attendance rate < 70% without lecturer waiver (ADR-01)", () => {
    assert.throws(
      () => {
        new Certificate({
          enrollmentId: "enr-2",
          studentId: "stu-2",
          termId: "term-1",
          certificateNumber: "AT-2026-0043",
          issueDate: "2026-11-30",
          attendanceRate: 65.0,
          hasWaiver: false,
        });
      },
      {
        message:
          "Student does not meet the 70% attendance requirement (65.0%). An instructor waiver with written reason is required.",
      }
    );
  });

  test("Allows certificate when attendance < 70% with valid lecturer waiver and written justification (ADR-01)", () => {
    const cert = new Certificate({
      enrollmentId: "enr-3",
      studentId: "stu-3",
      termId: "term-1",
      certificateNumber: "AT-2026-0044",
      issueDate: "2026-11-30",
      attendanceRate: 66.7,
      hasWaiver: true,
      waiverReason:
        "Lecturer waiver granted due to documented medical leave and completed makeup project.",
    });

    assert.strictEqual(cert.hasWaiver, true);
    assert.ok(cert.waiverReason?.includes("medical leave"));
  });

  test("Rejects certificate waiver if written justification is missing or too short", () => {
    assert.throws(
      () => {
        new Certificate({
          enrollmentId: "enr-4",
          studentId: "stu-4",
          termId: "term-1",
          certificateNumber: "AT-2026-0045",
          issueDate: "2026-11-30",
          attendanceRate: 60.0,
          hasWaiver: true,
          waiverReason: "Ok", // < 5 chars
        });
      },
      { message: "Instructor waiver requires a written justification of at least 5 characters." }
    );
  });

  test("Validates certificate numbering format: AT-YYYY-XXXX", () => {
    assert.throws(
      () => {
        new Certificate({
          enrollmentId: "enr-5",
          studentId: "stu-5",
          termId: "term-1",
          certificateNumber: "INVALID-NUM-123",
          issueDate: "2026-11-30",
          attendanceRate: 90.0,
        });
      },
      {
        message:
          "Invalid certificate number format 'INVALID-NUM-123'. Expected format: AT-YYYY-XXXX",
      }
    );
  });
});
