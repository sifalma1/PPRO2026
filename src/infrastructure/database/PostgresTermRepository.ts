import { Pool } from "pg";
import { CreateTermDto } from "../../application/dto/TermDto.js";
import { CreateEnrollmentDto } from "../../application/dto/EnrollmentDto.js";

export class PostgresTermRepository {
  constructor(private readonly db: Pool) {}

  public async findAll(): Promise<any[]> {
    const sql = `
      SELECT 
        t.id, t.course_id, c.title as course_title, c.price as course_price, c.hours as course_hours,
        t.classroom_id, cl.name as classroom_name, cl.capacity as classroom_capacity,
        t.start_date, t.end_date, t.capacity, t.status,
        COUNT(e.id) FILTER (WHERE e.status = 'CONFIRMED') as confirmed_count,
        COUNT(e.id) FILTER (WHERE e.status = 'WAITLIST') as waitlist_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', l.id, 'name', l.first_name || ' ' || l.last_name, 'role', tl.role)
          ) FILTER (WHERE l.id IS NOT NULL), '[]'
        ) as lecturers
      FROM course_terms t
      JOIN courses c ON c.id = t.course_id
      LEFT JOIN classrooms cl ON cl.id = t.classroom_id
      LEFT JOIN enrollments e ON e.term_id = t.id
      LEFT JOIN term_lecturers tl ON tl.term_id = t.id
      LEFT JOIN lecturers l ON l.id = tl.lecturer_id
      GROUP BY t.id, c.title, c.price, c.hours, cl.name, cl.capacity
      ORDER BY t.start_date ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      courseId: r.course_id,
      courseTitle: r.course_title,
      coursePrice: Number(r.course_price),
      courseHours: Number(r.course_hours),
      classroomId: r.classroom_id,
      classroomName: r.classroom_name || "Unassigned",
      classroomCapacity: r.classroom_capacity ? Number(r.classroom_capacity) : null,
      startDate: r.start_date instanceof Date ? r.start_date.toISOString().split("T")[0] : String(r.start_date).split("T")[0],
      endDate: r.end_date instanceof Date ? r.end_date.toISOString().split("T")[0] : String(r.end_date).split("T")[0],
      capacity: r.capacity,
      status: r.status,
      confirmedCount: parseInt(r.confirmed_count, 10),
      waitlistCount: parseInt(r.waitlist_count, 10),
      lecturers: r.lecturers
    }));
  }

  public async findById(id: string): Promise<any | null> {
    const list = await this.findAll();
    return list.find(t => t.id === id) || null;
  }

  public async createTerm(data: CreateTermDto): Promise<string> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // Validate classroom capacity constraint if classroom is specified
      if (data.classroomId) {
        const roomRes = await client.query("SELECT capacity FROM classrooms WHERE id = $1", [data.classroomId]);
        if (roomRes.rows.length > 0) {
          const maxCap = roomRes.rows[0].capacity;
          if (data.capacity > maxCap) {
            throw new Error(`Term capacity (${data.capacity}) exceeds classroom maximum capacity (${maxCap}).`);
          }
        }
      }

      const insertSql = `
        INSERT INTO course_terms (course_id, classroom_id, start_date, end_date, capacity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const res = await client.query(insertSql, [
        data.courseId,
        data.classroomId || null,
        data.startDate,
        data.endDate,
        data.capacity
      ]);
      const termId = res.rows[0].id;

      if (data.lecturerIds && data.lecturerIds.length > 0) {
        for (const lecturerId of data.lecturerIds) {
          await client.query(
            "INSERT INTO term_lecturers (term_id, lecturer_id, role) VALUES ($1, $2, 'lead')",
            [termId, lecturerId]
          );
        }
      }

      await client.query("COMMIT");
      return termId;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  public async updateTermStatus(termId: string, status: string): Promise<boolean> {
    const res = await this.db.query(
      "UPDATE course_terms SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, termId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  public async getEnrollmentsForTerm(termId: string): Promise<any[]> {
    const sql = `
      SELECT 
        e.id, e.term_id, e.student_id, e.submitted_at, e.status, e.waitlist_position, e.note,
        s.first_name, s.last_name, s.email, s.phone, s.organization
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.term_id = $1
      ORDER BY 
        CASE 
          WHEN e.status = 'CONFIRMED' THEN 1
          WHEN e.status = 'WAITLIST' THEN 2
          WHEN e.status = 'COMPLETED' THEN 3
          ELSE 4
        END,
        e.waitlist_position ASC,
        e.submitted_at ASC;
    `;
    const res = await this.db.query(sql, [termId]);
    return res.rows.map(r => ({
      id: r.id,
      termId: r.term_id,
      studentId: r.student_id,
      studentName: `${r.first_name} ${r.last_name}`,
      studentEmail: r.email,
      studentPhone: r.phone,
      studentOrganization: r.organization,
      submittedAt: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : String(r.submitted_at),
      status: r.status,
      waitlistPosition: r.waitlist_position,
      note: r.note
    }));
  }

  /**
   * Enroll a student into a course term with strict capacity check,
   * automatic waitlist placement (ADR-02), and concurrent registration validation (ADR-03).
   */
  public async createEnrollment(termId: string, studentData: CreateEnrollmentDto): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // 1. Find or create student
      let studentId: string;
      const normalizedEmail = studentData.email.trim().toLowerCase();
      const sRes = await client.query("SELECT id FROM students WHERE email = $1", [normalizedEmail]);
      if (sRes.rows.length > 0) {
        studentId = sRes.rows[0].id;
      } else {
        const insStudent = `
          INSERT INTO students (first_name, last_name, email, phone, organization)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        const insRes = await client.query(insStudent, [
          studentData.firstName.trim(),
          studentData.lastName.trim(),
          normalizedEmail,
          studentData.phone ? studentData.phone.trim() : null,
          studentData.organization ? studentData.organization.trim() : null
        ]);
        studentId = insRes.rows[0].id;
      }

      // 2. Concurrency rule ADR-03:
      // Student cannot have multiple active confirmed registrations for terms of the SAME course.
      const termInfo = await client.query("SELECT course_id, capacity FROM course_terms WHERE id = $1", [termId]);
      if (termInfo.rows.length === 0) throw new Error("Course term was not found.");
      const courseId = termInfo.rows[0].course_id;
      const capacity = termInfo.rows[0].capacity;

      const sameCourseCheck = `
        SELECT e.id FROM enrollments e
        JOIN course_terms ct ON ct.id = e.term_id
        WHERE ct.course_id = $1 AND e.student_id = $2 AND e.status = 'CONFIRMED'
      `;
      const sameCourseRes = await client.query(sameCourseCheck, [courseId, studentId]);
      if (sameCourseRes.rows.length > 0) {
        throw new Error("Student already has an active confirmed enrollment for this course in another term (ADR-03 rule).");
      }

      // Check if student already has active enrollment in THIS term
      const duplRes = await client.query(
        "SELECT id, status FROM enrollments WHERE term_id = $1 AND student_id = $2 AND status IN ('CONFIRMED', 'WAITLIST')",
        [termId, studentId]
      );
      if (duplRes.rows.length > 0) {
        throw new Error("Student is already enrolled or on the waitlist for this term.");
      }

      // 3. Count confirmed spots
      const countRes = await client.query(
        "SELECT COUNT(*) FROM enrollments WHERE term_id = $1 AND status = 'CONFIRMED'",
        [termId]
      );
      const confirmedCount = parseInt(countRes.rows[0].count, 10);

      let status: string;
      let waitlistPosition: number | null = null;

      if (confirmedCount < capacity) {
        status = "CONFIRMED";
      } else {
        // Capacity reached: Place student on waitlist (ADR-02)
        status = "WAITLIST";
        const maxPosRes = await client.query(
          "SELECT COALESCE(MAX(waitlist_position), 0) as max_pos FROM enrollments WHERE term_id = $1 AND status = 'WAITLIST'",
          [termId]
        );
        waitlistPosition = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;
      }

      // 4. Insert enrollment
      const insEnrollment = `
        INSERT INTO enrollments (term_id, student_id, status, waitlist_position, note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, submitted_at, status, waitlist_position;
      `;
      const eRes = await client.query(insEnrollment, [
        termId,
        studentId,
        status,
        waitlistPosition,
        studentData.note || null
      ]);

      await client.query("COMMIT");

      return {
        id: eRes.rows[0].id,
        termId,
        studentId,
        studentName: `${studentData.firstName} ${studentData.lastName}`,
        status: eRes.rows[0].status,
        waitlistPosition: eRes.rows[0].waitlist_position,
        submittedAt: eRes.rows[0].submitted_at
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel enrollment with automatic waitlist advancement (ADR-02).
   * When a confirmed spot is cancelled, candidate #1 is automatically promoted.
   */
  public async cancelEnrollment(enrollmentId: string): Promise<{ success: boolean; promotedStudentId?: string }> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      const eRes = await client.query(
        "SELECT id, term_id, status, waitlist_position FROM enrollments WHERE id = $1",
        [enrollmentId]
      );
      if (eRes.rows.length === 0) throw new Error("Enrollment was not found.");

      const enrollment = eRes.rows[0];
      const termId = enrollment.term_id;
      const wasConfirmed = enrollment.status === "CONFIRMED";
      const wasWaitlist = enrollment.status === "WAITLIST";
      const oldPosition = enrollment.waitlist_position;

      // Soft delete/update: Set status to CANCELLED per business rule
      await client.query(
        "UPDATE enrollments SET status = 'CANCELLED', waitlist_position = NULL, updated_at = NOW() WHERE id = $1",
        [enrollmentId]
      );

      let promotedStudentId: string | undefined;

      if (wasConfirmed) {
        // Find first waitlisted student
        const nextRes = await client.query(
          "SELECT id, student_id FROM enrollments WHERE term_id = $1 AND status = 'WAITLIST' AND waitlist_position = 1",
          [termId]
        );
        if (nextRes.rows.length > 0) {
          const nextWaitlistId = nextRes.rows[0].id;
          promotedStudentId = nextRes.rows[0].student_id;

          // Promote to confirmed
          await client.query(
            "UPDATE enrollments SET status = 'CONFIRMED', waitlist_position = NULL, updated_at = NOW() WHERE id = $1",
            [nextWaitlistId]
          );

          // Shift remaining waitlisted students forward by 1 position
          await client.query(
            "UPDATE enrollments SET waitlist_position = waitlist_position - 1 WHERE term_id = $1 AND status = 'WAITLIST' AND waitlist_position > 1",
            [termId]
          );
        }
      } else if (wasWaitlist && oldPosition) {
        // Shift remaining positions behind this student
        await client.query(
          "UPDATE enrollments SET waitlist_position = waitlist_position - 1 WHERE term_id = $1 AND status = 'WAITLIST' AND waitlist_position > $2",
          [termId, oldPosition]
        );
      }

      await client.query("COMMIT");
      return { success: true, promotedStudentId };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  public async getLecturers(): Promise<any[]> {
    const sql = `
      SELECT 
        l.id, l.first_name, l.last_name, l.email, l.phone, l.specialization,
        COUNT(DISTINCT tl.term_id) as term_count,
        COALESCE(SUM(td.hours), 0) as taught_hours
      FROM lecturers l
      LEFT JOIN term_lecturers tl ON tl.lecturer_id = l.id
      LEFT JOIN teaching_days td ON td.lecturer_id = l.id
      GROUP BY l.id
      ORDER BY l.last_name ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      specialization: r.specialization,
      termCount: parseInt(r.term_count, 10),
      taughtHours: parseInt(r.taught_hours, 10)
    }));
  }

  public async getClassrooms(): Promise<any[]> {
    const sql = "SELECT id, name, address, capacity FROM classrooms ORDER BY name ASC";
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      address: r.address,
      capacity: Number(r.capacity)
    }));
  }

  public async getStudents(): Promise<any[]> {
    const sql = `
      SELECT 
        s.id, s.first_name, s.last_name, s.email, s.phone, s.organization,
        COUNT(e.id) as enrollment_count
      FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status IN ('CONFIRMED', 'COMPLETED')
      GROUP BY s.id
      ORDER BY s.last_name ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      organization: r.organization,
      enrollmentCount: parseInt(r.enrollment_count, 10)
    }));
  }

  public async getAnalytics(): Promise<any> {
    const terms = await this.findAll();
    const lecturers = await this.getLecturers();

    // Multi-course students in the year
    const multiCourseSql = `
      SELECT 
        s.id, s.first_name, s.last_name, s.email, s.organization,
        COUNT(DISTINCT t.course_id) as course_count,
        array_agg(DISTINCT c.title) as courses
      FROM students s
      JOIN enrollments e ON e.student_id = s.id AND e.status IN ('CONFIRMED', 'COMPLETED')
      JOIN course_terms t ON t.id = e.term_id
      JOIN courses c ON c.id = t.course_id
      GROUP BY s.id
      HAVING COUNT(DISTINCT t.course_id) > 1;
    `;
    const multiRes = await this.db.query(multiCourseSql);

    return {
      termStats: terms.map(t => ({
        id: t.id,
        courseTitle: t.courseTitle,
        period: `${t.startDate} - ${t.endDate}`,
        capacity: t.capacity,
        confirmed: t.confirmedCount,
        waitlist: t.waitlistCount,
        fillRate: t.capacity > 0 ? Math.round((t.confirmedCount / t.capacity) * 100) : 0
      })),
      lecturerStats: lecturers.map(l => ({
        name: l.name,
        specialization: l.specialization,
        taughtHours: l.taughtHours,
        termCount: l.termCount
      })),
      multiCourseStudents: multiRes.rows.map(s => ({
        student: `${s.first_name} ${s.last_name}`,
        email: s.email,
        organization: s.organization,
        courseCount: parseInt(s.course_count, 10),
        courses: s.courses
      }))
    };
  }
}
