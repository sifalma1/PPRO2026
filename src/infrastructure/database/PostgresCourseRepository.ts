import { Pool } from "pg";
import { Course } from "../../domain/entities/Course.js";
import { ICourseRepository, CourseFilter } from "../../domain/repositories/ICourseRepository.js";

export class PostgresCourseRepository implements ICourseRepository {
  constructor(private readonly db: Pool) {}

  public async findAll(filter?: CourseFilter): Promise<Course[]> {
    let query = `
      SELECT id, title, annotation, hours, price, is_accredited, created_at, updated_at
      FROM courses
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.isAccredited !== undefined) {
      params.push(filter.isAccredited);
      query += ` AND is_accredited = $${params.length}`;
    }

    if (filter?.query) {
      params.push(`%${filter.query.toLowerCase()}%`);
      query += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(annotation) LIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;

    const res = await this.db.query(query, params);
    return res.rows.map((row) => this.mapToEntity(row));
  }

  public async findById(id: string): Promise<Course | null> {
    const res = await this.db.query(
      `SELECT id, title, annotation, hours, price, is_accredited, created_at, updated_at
       FROM courses
       WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async create(course: Course): Promise<Course> {
    const res = await this.db.query(
      `INSERT INTO courses (title, annotation, hours, price, is_accredited)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, annotation, hours, price, is_accredited, created_at, updated_at`,
      [course.title, course.annotation, course.hours, course.price, course.isAccredited]
    );

    return this.mapToEntity(res.rows[0]);
  }

  public async update(id: string, course: Course): Promise<Course | null> {
    const res = await this.db.query(
      `UPDATE courses
       SET title = $1, annotation = $2, hours = $3, price = $4, is_accredited = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, title, annotation, hours, price, is_accredited, created_at, updated_at`,
      [course.title, course.annotation, course.hours, course.price, course.isAccredited, id]
    );

    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.query("DELETE FROM courses WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapToEntity(row: any): Course {
    return new Course({
      id: row.id,
      title: row.title,
      annotation: row.annotation,
      hours: row.hours,
      price: Number(row.price),
      isAccredited: row.is_accredited,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
