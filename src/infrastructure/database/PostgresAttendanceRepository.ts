import { Pool } from "pg";
import {
  CreateTeachingDayDto,
  MarkAttendanceDto,
  AttendanceSummaryDto,
} from "../../application/dto/AttendanceDto.js";

export class PostgresAttendanceRepository {
  constructor(private readonly db: Pool) {}

  public async getTeachingDays(termId: string): Promise<any[]> {
    const sql = `
      SELECT 
        td.id, td.term_id, td.lecturer_id, td.day_date, td.hours, td.topic,
        COALESCE(l.first_name || ' ' || l.last_name, 'Unassigned') as lecturer_name,
        COUNT(a.id) as attendance_records,
        COUNT(a.id) FILTER (WHERE a.is_present = TRUE) as present_records
      FROM teaching_days td
      LEFT JOIN lecturers l ON l.id = td.lecturer_id
      LEFT JOIN attendance a ON a.teaching_day_id = td.id
      WHERE td.term_id = $1
      GROUP BY td.id, l.first_name, l.last_name
      ORDER BY td.day_date ASC;
    `;
    const res = await this.db.query(sql, [termId]);
    return res.rows.map((r) => ({
      id: r.id,
      termId: r.term_id,
      lecturerId: r.lecturer_id,
      lecturerName: r.lecturer_name,
      dayDate:
        r.day_date instanceof Date
          ? r.day_date.toISOString().split("T")[0]
          : String(r.day_date).split("T")[0],
      hours: r.hours,
      topic: r.topic,
      attendanceCount: parseInt(r.attendance_records, 10),
      presentCount: parseInt(r.present_records, 10),
    }));
  }

  public async createTeachingDay(dto: CreateTeachingDayDto): Promise<string> {
    const sql = `
      INSERT INTO teaching_days (term_id, lecturer_id, day_date, hours, topic)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const res = await this.db.query(sql, [
      dto.termId,
      dto.lecturerId || null,
      dto.dayDate,
      dto.hours,
      dto.topic,
    ]);
    return res.rows[0].id;
  }

  public async getAttendanceForDay(teachingDayId: string): Promise<any[]> {
    const sql = `
      SELECT 
        td.id as teaching_day_id,
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.email as student_email,
        COALESCE(a.is_present, FALSE) as is_present,
        a.note
      FROM teaching_days td
      JOIN enrollments e ON e.term_id = td.term_id AND e.status IN ('CONFIRMED', 'COMPLETED')
      JOIN students s ON s.id = e.student_id
      LEFT JOIN attendance a ON a.teaching_day_id = td.id AND a.student_id = s.id
      WHERE td.id = $1
      ORDER BY s.last_name ASC;
    `;
    const res = await this.db.query(sql, [teachingDayId]);
    return res.rows.map((r) => ({
      teachingDayId: r.teaching_day_id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      isPresent: Boolean(r.is_present),
      note: r.note,
    }));
  }

  public async markAttendance(dto: MarkAttendanceDto): Promise<void> {
    const sql = `
      INSERT INTO attendance (teaching_day_id, student_id, is_present, note)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (teaching_day_id, student_id)
      DO UPDATE SET is_present = EXCLUDED.is_present, note = EXCLUDED.note;
    `;
    await this.db.query(sql, [dto.teachingDayId, dto.studentId, dto.isPresent, dto.note || null]);
  }

  /**
   * Calculates attendance summary for each enrolled student in a term.
   * Evaluates ADR-01 (70% attendance criteria).
   */
  public async getAttendanceSummary(termId: string): Promise<AttendanceSummaryDto[]> {
    const sql = `
      WITH total_days AS (
        SELECT COUNT(id) as total_count FROM teaching_days WHERE term_id = $1
      )
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.email as student_email,
        e.id as enrollment_id,
        (SELECT total_count FROM total_days) as total_days,
        COUNT(a.id) FILTER (WHERE a.is_present = TRUE) as attended_days,
        c.id as certificate_id,
        c.certificate_number
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      LEFT JOIN teaching_days td ON td.term_id = e.term_id
      LEFT JOIN attendance a ON a.teaching_day_id = td.id AND a.student_id = s.id
      LEFT JOIN certificates c ON c.enrollment_id = e.id
      WHERE e.term_id = $1 AND e.status IN ('CONFIRMED', 'COMPLETED')
      GROUP BY s.id, s.first_name, s.last_name, s.email, e.id, c.id, c.certificate_number
      ORDER BY s.last_name ASC;
    `;
    const res = await this.db.query(sql, [termId]);
    return res.rows.map((r) => {
      const total = parseInt(r.total_days, 10) || 0;
      const attended = parseInt(r.attended_days, 10) || 0;
      const percentage = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
      return {
        studentId: r.student_id,
        studentName: r.student_name,
        studentEmail: r.student_email,
        enrollmentId: r.enrollment_id,
        totalDays: total,
        attendedDays: attended,
        attendancePercentage: percentage,
        qualifiesForCertificate: percentage >= 70,
        certificateIssued: Boolean(r.certificate_id),
        certificateNumber: r.certificate_number || undefined,
      };
    });
  }
}
