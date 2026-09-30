import { Pool } from "pg";
import { Kurz } from "../../domain/entities/Kurz.js";
import { IKurzRepository } from "../../domain/repositories/IKurzRepository.js";

/**
 * PostgreSQL implementace repozitáře pro entitu Kurz.
 */
export class PostgresKurzRepository implements IKurzRepository {
  constructor(private readonly db: Pool) {}

  public async findAll(filter?: { jeAkreditovany?: boolean; query?: string }): Promise<Kurz[]> {
    const conditions: string[] = [];
    const values: (string | boolean)[] = [];

    if (filter?.jeAkreditovany !== undefined) {
      values.push(filter.jeAkreditovany);
      conditions.push(`je_akreditovany = $${values.length}`);
    }

    if (filter?.query && filter.query.trim().length > 0) {
      values.push(`%${filter.query.trim()}%`);
      conditions.push(`(nazev ILIKE $${values.length} OR anotace ILIKE $${values.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `
      SELECT id, nazev, anotace, rozsah_hodin, cena, je_akreditovany, created_at, updated_at
      FROM kurzy
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(sql, values);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  public async findById(id: string): Promise<Kurz | null> {
    const sql = `
      SELECT id, nazev, anotace, rozsah_hodin, cena, je_akreditovany, created_at, updated_at
      FROM kurzy
      WHERE id = $1
    `;
    const result = await this.db.query(sql, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToEntity(result.rows[0]);
  }

  public async create(kurz: Kurz): Promise<Kurz> {
    const sql = `
      INSERT INTO kurzy (nazev, anotace, rozsah_hodin, cena, je_akreditovany)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nazev, anotace, rozsah_hodin, cena, je_akreditovany, created_at, updated_at
    `;
    const values = [
      kurz.nazev,
      kurz.anotace,
      kurz.rozsahHodin,
      kurz.cena,
      kurz.jeAkreditovany
    ];

    const result = await this.db.query(sql, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  public async update(id: string, kurz: Kurz): Promise<Kurz | null> {
    const sql = `
      UPDATE kurzy
      SET nazev = $1, anotace = $2, rozsah_hodin = $3, cena = $4, je_akreditovany = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, nazev, anotace, rozsah_hodin, cena, je_akreditovany, created_at, updated_at
    `;
    const values = [
      kurz.nazev,
      kurz.anotace,
      kurz.rozsahHodin,
      kurz.cena,
      kurz.jeAkreditovany,
      id
    ];

    const result = await this.db.query(sql, values);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToEntity(result.rows[0]);
  }

  public async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM kurzy WHERE id = $1`;
    const result = await this.db.query(sql, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  private mapRowToEntity(row: any): Kurz {
    return new Kurz({
      id: row.id,
      nazev: row.nazev,
      anotace: row.anotace,
      rozsahHodin: row.rozsah_hodin,
      cena: parseFloat(row.cena),
      jeAkreditovany: row.je_akreditovany,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
