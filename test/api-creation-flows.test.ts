import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

describe("End-to-End API Creation Flows (Akademie Trutnov)", () => {
  let createdCourseId: string;
  let createdTermId: string;
  let createdEnrollmentId1: string;
  let createdEnrollmentId2: string;
  let createdTeachingDayId: string;
  let student1Id: string;
  let student2Id: string;
  let adminHeaders: Record<string, string> = { "Content-Type": "application/json" };

  before(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      });
      const data = await res.json();
      if (data.token) {
        adminHeaders = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
          "x-admin-token": data.token,
        };
      }
    } catch {
      // Server might not require auth in non-production test mode
    }
  });

  // 1. Creating a Course
  it("Flow 1: Creating a Course via POST /api/courses", async () => {
    const payload = {
      title: "QA Testovací kurz – Automatizované testování",
      annotation:
        "Tento kurz slouží pro ověření kompletního toku vytváření entit v rámci QA testů.",
      hours: 40,
      price: 9900,
      isAccredited: true,
    };

    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.ok(json.data.id, "Expected course id in response data");
    assert.equal(json.data.title, payload.title);
    assert.equal(json.data.hours, payload.hours);
    assert.equal(json.data.price, payload.price);
    assert.equal(json.data.isAccredited, true);

    createdCourseId = json.data.id;
  });

  it("Flow 1: Creating a Course with price 0 (free workshop)", async () => {
    const payload = {
      title: "QA Bezplatný úvodní seminář",
      annotation: "Úvodní bezplatný seminář pro ověření nulové ceny v API a doménovém modelu.",
      hours: 4,
      price: 0,
      isAccredited: false,
    };

    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.equal(json.data.price, 0);

    // Clean up free course
    await fetch(`${BASE_URL}/api/courses/${json.data.id}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
  });

  // 2. Creating a Term
  it("Flow 2: Creating a Term via POST /api/terms", async () => {
    assert.ok(createdCourseId, "Course must exist before creating term");

    // Fetch classrooms and lecturers to use valid IDs
    const [cRes, lRes] = await Promise.all([
      fetch(`${BASE_URL}/api/classrooms`),
      fetch(`${BASE_URL}/api/lecturers`),
    ]);
    const cJson = await cRes.json();
    const lJson = await lRes.json();

    const classroomId = cJson.data?.[0]?.id;
    const lecturerId = lJson.data?.[0]?.id;

    const payload = {
      courseId: createdCourseId,
      classroomId: classroomId || undefined,
      startDate: "2026-12-01",
      endDate: "2026-12-15",
      capacity: 1, // Capacity 1 to test waitlist on second enrollment
      lecturerIds: lecturerId ? [lecturerId] : undefined,
    };

    const res = await fetch(`${BASE_URL}/api/terms`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.ok(json.data.id, "Expected term id in response data");

    createdTermId = json.data.id;
  });

  // 3. Creating Enrollments
  it("Flow 3: Creating a Confirmed Enrollment via POST /api/terms/:id/enrollments", async () => {
    assert.ok(createdTermId, "Term must exist before creating enrollment");

    const payload = {
      firstName: "Testovací",
      lastName: "Student1",
      email: `test.student1.${Date.now()}@example.com`,
      phone: "+420 777 111 222",
      organization: "QA Test Org",
      note: "První přihlášený student",
    };

    const res = await fetch(`${BASE_URL}/api/terms/${createdTermId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.equal(json.data.status, "CONFIRMED");
    assert.equal(json.data.waitlistPosition, null);

    createdEnrollmentId1 = json.data.id;
    student1Id = json.data.studentId;
    assert.ok(createdEnrollmentId1, "Expected created enrollment 1 ID");
  });

  it("Flow 3: Creating a Waitlisted Enrollment when capacity is reached (ADR-02)", async () => {
    assert.ok(createdTermId, "Term must exist");

    const payload = {
      firstName: "Náhradník",
      lastName: "Student2",
      email: `test.student2.${Date.now()}@example.com`,
      phone: "+420 777 333 444",
      organization: "QA Test Org 2",
      note: "Druhý přihlášený student - měl by být náhradník",
    };

    const res = await fetch(`${BASE_URL}/api/terms/${createdTermId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.equal(json.data.status, "WAITLIST");
    assert.equal(json.data.waitlistPosition, 1);

    createdEnrollmentId2 = json.data.id;
    student2Id = json.data.studentId;
    assert.ok(createdEnrollmentId2, "Expected created enrollment 2 ID");
    assert.ok(student2Id, "Expected student 2 ID");
  });

  // 4. Creating a Teaching Day
  it("Flow 4: Creating a Teaching Day via POST /api/attendance/terms/:termId/days", async () => {
    assert.ok(createdTermId, "Term must exist");

    const lRes = await fetch(`${BASE_URL}/api/lecturers`);
    const lJson = await lRes.json();
    const lecturerId = lJson.data?.[0]?.id;

    const payload = {
      dayDate: "2026-12-05",
      hours: 6,
      topic: "Blok 1: Úvod do problematiky a základní koncepty",
      lecturerId: lecturerId || undefined,
    };

    const res = await fetch(`${BASE_URL}/api/attendance/terms/${createdTermId}/days`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.ok(json.data.id, "Expected teaching day id");

    createdTeachingDayId = json.data.id;
  });

  // 5. Recording Attendance
  it("Flow 5: Recording Attendance via POST /api/attendance/days/:dayId/mark", async () => {
    assert.ok(createdTeachingDayId, "Teaching day must exist");
    assert.ok(student1Id, "Student 1 must exist");

    // Fetch roster for this day
    const rosterRes = await fetch(`${BASE_URL}/api/attendance/days/${createdTeachingDayId}`);
    const rosterJson = await rosterRes.json();
    assert.equal(rosterRes.status, 200);
    assert.ok(Array.isArray(rosterJson.data), "Expected roster data array");
    assert.equal(rosterJson.data.length, 1, "Only confirmed student should be in roster");
    assert.equal(rosterJson.data[0].studentId, student1Id);

    // Mark attendance
    const markRes = await fetch(`${BASE_URL}/api/attendance/days/${createdTeachingDayId}/mark`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        studentId: student1Id,
        isPresent: true,
        note: "Aktivní účast",
      }),
    });

    const markJson = await markRes.json();
    assert.equal(markRes.status, 200);
    assert.equal(markJson.success, true);

    // Verify attendance summary
    const sumRes = await fetch(`${BASE_URL}/api/attendance/terms/${createdTermId}/summary`);
    const sumJson = await sumRes.json();
    assert.equal(sumRes.status, 200);
    assert.equal(sumJson.data.length, 1);
    assert.equal(sumJson.data[0].attendedDays, 1);
    assert.equal(sumJson.data[0].attendancePercentage, 100);
    assert.equal(sumJson.data[0].qualifiesForCertificate, true);
  });

  // 6. Completing Term and Issuing Certificate
  it("Flow 6a: Completing Term via POST /api/terms/:termId/complete", async () => {
    assert.ok(createdTermId, "Term must exist");

    const res = await fetch(`${BASE_URL}/api/terms/${createdTermId}/complete`, {
      method: "POST",
      headers: adminHeaders,
    });

    const json = await res.json();
    assert.equal(
      res.status,
      200,
      `Expected status 200, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.equal(
      json.data.issuedCount,
      1,
      "Should issue 1 certificate for Student 1 (100% attendance)"
    );
    assert.ok(
      json.data.certificates[0].certificateNumber.startsWith("AT-"),
      "Certificate number format AT-YYYY-XXXX"
    );
  });

  it("Flow 6b: Issuing Certificate with Lecturer Waiver via POST /api/certificates/issue", async () => {
    assert.ok(createdTermId, "Term must exist");

    // Promote student 2 to confirmed first by cancelling student 1 or manually enrolling
    // Let's create an enrollment for a new student with 0% attendance
    const newStudentRes = await fetch(`${BASE_URL}/api/terms/${createdTermId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Nemocný",
        lastName: "Absolvent",
        email: `nemocny.${Date.now()}@example.com`,
      }),
    });
    const newStudentJson = await newStudentRes.json();
    const newEnrollmentId = newStudentJson.data.id;

    // Issue certificate with lecturer waiver (ADR-01)
    const waiverPayload = {
      enrollmentId: newEnrollmentId,
      hasWaiver: true,
      waiverReason:
        "Student omluven z důvodu nemoci, doložil lékařskou zprávu a úspěšně složil komisionální přezkoušení.",
    };

    const res = await fetch(`${BASE_URL}/api/certificates/issue`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(waiverPayload),
    });

    const json = await res.json();
    assert.equal(
      res.status,
      201,
      `Expected status 201, got ${res.status}: ${JSON.stringify(json)}`
    );
    assert.equal(json.success, true);
    assert.equal(json.data.hasWaiver, true);
    assert.equal(json.data.waiverReason, waiverPayload.waiverReason);
    assert.ok(json.data.certificateNumber.startsWith("AT-"));
  });

  after(async () => {
    // Teardown: delete the test course, which cascades to terms, teaching days, enrollments, certificates
    if (createdCourseId) {
      try {
        await fetch(`${BASE_URL}/api/courses/${createdCourseId}`, {
          method: "DELETE",
          headers: adminHeaders,
        });
      } catch {
        // Ignore teardown error in case server is not running
      }
    }
    try {
      const { pool } = await import("../src/infrastructure/database/db.js");
      await pool.query("DELETE FROM students WHERE email LIKE '%@example.com'");
      await pool.query(`
        UPDATE certificate_counter cc
        SET last_seq = COALESCE(
          (SELECT MAX(SUBSTRING(certificate_number FROM 9)::int) FROM certificates WHERE certificate_number LIKE 'AT-' || cc.year || '-%'),
          2
        )
      `);
      await pool.end();
    } catch {
      // Ignore if db pool unavailable
    }
  });
});
