import { Pool } from "pg";
import { Certificate } from "../../domain/entities/Certificate.js";
import {
  CertificateResponseDto,
  IssueCertificateDto,
} from "../../application/dto/CertificateDto.js";

export class PostgresCertificateRepository {
  constructor(private readonly db: Pool) {}

  public async findAll(): Promise<CertificateResponseDto[]> {
    const sql = `
      SELECT 
        c.id, c.enrollment_id, c.student_id, c.term_id, c.certificate_number,
        c.issue_date, c.attendance_rate, c.has_waiver, c.waiver_reason, c.created_at,
        s.first_name, s.last_name, s.email as student_email, s.organization as student_org,
        co.title as course_title
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      JOIN course_terms t ON t.id = c.term_id
      JOIN courses co ON co.id = t.course_id
      ORDER BY c.issue_date DESC, c.certificate_number DESC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map((r) => this.mapToDto(r));
  }

  public async findById(id: string): Promise<CertificateResponseDto | null> {
    const sql = `
      SELECT 
        c.id, c.enrollment_id, c.student_id, c.term_id, c.certificate_number,
        c.issue_date, c.attendance_rate, c.has_waiver, c.waiver_reason, c.created_at,
        s.first_name, s.last_name, s.email as student_email, s.organization as student_org,
        co.title as course_title
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      JOIN course_terms t ON t.id = c.term_id
      JOIN courses co ON co.id = t.course_id
      WHERE c.id = $1;
    `;
    const res = await this.db.query(sql, [id]);
    if (res.rows.length === 0) return null;
    return this.mapToDto(res.rows[0]);
  }

  /**
   * Generates the next sequential certificate number: AT-YYYY-XXXX
   * e.g., AT-2026-0001
   */
  public async getNextCertificateNumber(client?: any): Promise<string> {
    const currentYear = new Date().getFullYear();
    const dbClient = client || (await this.db.connect());
    const shouldRelease = !client;

    try {
      const sql = `
        INSERT INTO certificate_counter (year, last_seq)
        VALUES ($1, 1)
        ON CONFLICT (year)
        DO UPDATE SET last_seq = certificate_counter.last_seq + 1
        RETURNING last_seq;
      `;
      const res = await dbClient.query(sql, [currentYear]);
      const seq = res.rows[0].last_seq;
      const formattedSeq = String(seq).padStart(4, "0");
      return `AT-${currentYear}-${formattedSeq}`;
    } finally {
      if (shouldRelease) dbClient.release();
    }
  }

  /**
   * Issues an official certificate for a student enrollment.
   * Validates ADR-01 (70% attendance or waiver).
   */
  public async issueCertificate(dto: IssueCertificateDto): Promise<CertificateResponseDto> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // 1. Get enrollment & term info
      const eRes = await client.query(
        `SELECT e.id, e.term_id, e.student_id, e.status, t.course_id, c.title as course_title
         FROM enrollments e
         JOIN course_terms t ON t.id = e.term_id
         JOIN courses c ON c.id = t.course_id
         WHERE e.id = $1`,
        [dto.enrollmentId]
      );
      if (eRes.rows.length === 0) throw new Error("Enrollment not found.");
      const enrollment = eRes.rows[0];

      // Check if certificate already issued
      const existingCert = await client.query(
        "SELECT id FROM certificates WHERE enrollment_id = $1",
        [dto.enrollmentId]
      );
      if (existingCert.rows.length > 0) {
        throw new Error("A certificate has already been issued for this enrollment.");
      }

      // 2. Compute attendance percentage
      const attRes = await client.query(
        `SELECT 
           COUNT(td.id) as total_days,
           COUNT(a.id) FILTER (WHERE a.is_present = TRUE) as attended_days
         FROM teaching_days td
         LEFT JOIN attendance a ON a.teaching_day_id = td.id AND a.student_id = $1
         WHERE td.term_id = $2`,
        [enrollment.student_id, enrollment.term_id]
      );

      const totalDays = parseInt(attRes.rows[0].total_days, 10) || 0;
      const attendedDays = parseInt(attRes.rows[0].attended_days, 10) || 0;
      const attendanceRate = totalDays > 0 ? (attendedDays / totalDays) * 100 : 100;

      // 3. Domain validation via Certificate entity
      const certNumber = await this.getNextCertificateNumber(client);
      const issueDate = new Date().toISOString().split("T")[0];

      const domainCert = new Certificate({
        enrollmentId: enrollment.id,
        studentId: enrollment.student_id,
        termId: enrollment.term_id,
        certificateNumber: certNumber,
        issueDate,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        hasWaiver: dto.hasWaiver,
        waiverReason: dto.waiverReason,
      });

      // 4. Insert certificate
      const insCertSql = `
        INSERT INTO certificates (enrollment_id, student_id, term_id, certificate_number, issue_date, attendance_rate, has_waiver, waiver_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
      const certRes = await client.query(insCertSql, [
        domainCert.enrollmentId,
        domainCert.studentId,
        domainCert.termId,
        domainCert.certificateNumber,
        domainCert.issueDate,
        domainCert.attendanceRate,
        domainCert.hasWaiver,
        domainCert.waiverReason,
      ]);

      // 5. Update enrollment status to COMPLETED
      await client.query(
        "UPDATE enrollments SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1",
        [dto.enrollmentId]
      );

      await client.query("COMMIT");

      return (await this.findById(certRes.rows[0].id))!;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Complete a course term:
   * Sets course_term status to 'COMPLETED', evaluates all confirmed students,
   * automatically issues certificates to all who meet the 70% requirement.
   */
  public async completeTerm(
    termId: string
  ): Promise<{ issuedCount: number; certificates: CertificateResponseDto[] }> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // Update term status
      await client.query(
        "UPDATE course_terms SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1",
        [termId]
      );

      // Find all confirmed students without certificates
      const enrollmentsRes = await client.query(
        `SELECT e.id
         FROM enrollments e
         LEFT JOIN certificates c ON c.enrollment_id = e.id
         WHERE e.term_id = $1 AND e.status IN ('CONFIRMED', 'COMPLETED') AND c.id IS NULL`,
        [termId]
      );

      await client.query("COMMIT");

      const issued: CertificateResponseDto[] = [];
      for (const row of enrollmentsRes.rows) {
        try {
          const cert = await this.issueCertificate({ enrollmentId: row.id });
          issued.push(cert);
        } catch {
          // If attendance < 70% and no waiver provided, student is skipped until teacher grants waiver
        }
      }

      return { issuedCount: issued.length, certificates: issued };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  private mapToDto(r: any): CertificateResponseDto {
    return {
      id: r.id,
      enrollmentId: r.enrollment_id,
      studentId: r.student_id,
      studentName: `${r.first_name} ${r.last_name}`,
      studentEmail: r.student_email,
      studentOrganization: r.student_org,
      termId: r.term_id,
      courseTitle: r.course_title,
      certificateNumber: r.certificate_number,
      issueDate:
        r.issue_date instanceof Date
          ? r.issue_date.toISOString().split("T")[0]
          : String(r.issue_date).split("T")[0],
      attendanceRate: Number(r.attendance_rate),
      hasWaiver: Boolean(r.has_waiver),
      waiverReason: r.waiver_reason,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  }
}
