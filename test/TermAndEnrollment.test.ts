import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CourseTerm } from "../src/domain/entities/CourseTerm.js";
import { Enrollment } from "../src/domain/entities/Enrollment.js";

describe("CourseTerm and Enrollment Entities & Waiting List (Unit Tests)", () => {
  test("Successfully creates valid course term with capacity", () => {
    const term = new CourseTerm({
      courseId: "course-123",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      capacity: 15
    });

    assert.strictEqual(term.courseId, "course-123");
    assert.strictEqual(term.capacity, 15);
    assert.strictEqual(term.status, "PLANNED");
    assert.strictEqual(term.isFull, false);
    assert.strictEqual(term.availableSpots, 15);
  });

  test("Correctly detects full capacity", () => {
    const term = new CourseTerm({
      courseId: "course-123",
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      capacity: 5,
      confirmedCount: 5
    });

    assert.strictEqual(term.isFull, true);
    assert.strictEqual(term.availableSpots, 0);
  });

  test("Throws error when end date precedes start date", () => {
    assert.throws(
      () => {
        new CourseTerm({
          courseId: "course-123",
          startDate: "2026-12-01",
          endDate: "2026-11-01", // before start date
          capacity: 10
        });
      },
      { message: "Start date cannot be after end date." }
    );
  });

  test("Throws error when term capacity is non-positive", () => {
    assert.throws(
      () => {
        new CourseTerm({
          courseId: "course-123",
          startDate: "2026-11-01",
          endDate: "2026-11-30",
          capacity: 0
        });
      },
      { message: "Term capacity must be a positive integer." }
    );
  });

  test("Waitlisted enrollment requires a positive sequential position number (ADR-02)", () => {
    assert.throws(
      () => {
        new Enrollment({
          termId: "term-1",
          studentId: "student-1",
          status: "WAITLIST",
          waitlistPosition: 0 // invalid position
        });
      },
      { message: "Waitlisted enrollment must have a positive waitlist position number." }
    );

    const validWaitlist = new Enrollment({
      termId: "term-1",
      studentId: "student-1",
      status: "WAITLIST",
      waitlistPosition: 1
    });

    assert.strictEqual(validWaitlist.isWaitlisted, true);
    assert.strictEqual(validWaitlist.waitlistPosition, 1);
  });
});
