import { Pool } from "pg";
import { Termin } from "../../domain/entities/Termin.js";
import { Prihlaska, StavPrihlasky } from "../../domain/entities/Prihlaska.js";

export interface CreateTerminDto {
  kurzId: string;
  ucebnaId?: string;
  datumOd: string;
  datumDo: string;
  kapacita: number;
  lektorIds?: string[];
}

export class PostgresTerminRepository {
  constructor(private readonly db: Pool) {}

  public async findAll(): Promise<any[]> {
    const sql = `
      SELECT 
        t.id, t.kurz_id, k.nazev as kurz_nazev, k.cena as kurz_cena, k.rozsah_hodin as kurz_rozsah,
        t.ucebna_id, u.nazev as ucebna_nazev, u.maximalni_kapacita,
        t.datum_od, t.datum_do, t.kapacita, t.stav,
        COUNT(p.id) FILTER (WHERE p.stav = 'POTVRZENA') as potvrzeno_pocet,
        COUNT(p.id) FILTER (WHERE p.stav = 'PORADNIK') as poradnik_pocet,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', l.id, 'jmeno', l.jmeno || ' ' || l.prijmeni, 'role', tl.role)
          ) FILTER (WHERE l.id IS NOT NULL), '[]'
        ) as lektori
      FROM terminy t
      JOIN kurzy k ON k.id = t.kurz_id
      LEFT JOIN ucebny u ON u.id = t.ucebna_id
      LEFT JOIN prihlasky p ON p.termin_id = t.id
      LEFT JOIN termin_lektori tl ON tl.termin_id = t.id
      LEFT JOIN lektori l ON l.id = tl.lektor_id
      GROUP BY t.id, k.nazev, k.cena, k.rozsah_hodin, u.nazev, u.maximalni_kapacita
      ORDER BY t.datum_od ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      kurzId: r.kurz_id,
      kurzNazev: r.kurz_nazev,
      kurzCena: Number(r.kurz_cena),
      kurzRozsah: Number(r.kurz_rozsah),
      ucebnaId: r.ucebna_id,
      ucebnaNazev: r.ucebna_nazev || "Neuvedena",
      datumOd: r.datum_od.toISOString().split("T")[0],
      datumDo: r.datum_do.toISOString().split("T")[0],
      kapacita: r.kapacita,
      stav: r.stav,
      potvrzenoPocet: parseInt(r.potvrzeno_pocet, 10),
      poradnikPocet: parseInt(r.poradnik_pocet, 10),
      lektori: r.lektori
    }));
  }

  public async findById(id: string): Promise<any | null> {
    const list = await this.findAll();
    return list.find(t => t.id === id) || null;
  }

  public async createTermin(data: CreateTerminDto): Promise<string> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const insertSql = `
        INSERT INTO terminy (kurz_id, ucebna_id, datum_od, datum_do, kapacita)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const res = await client.query(insertSql, [
        data.kurzId,
        data.ucebnaId || null,
        data.datumOd,
        data.datumDo,
        data.kapacita
      ]);
      const terminId = res.rows[0].id;

      if (data.lektorIds && data.lektorIds.length > 0) {
        for (const lektorId of data.lektorIds) {
          await client.query(
            "INSERT INTO termin_lektori (termin_id, lektor_id, role) VALUES ($1, $2, 'hlavni')",
            [terminId, lektorId]
          );
        }
      }

      await client.query("COMMIT");
      return terminId;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  public async getPrihlaskyForTermin(terminId: string): Promise<any[]> {
    const sql = `
      SELECT 
        p.id, p.termin_id, p.student_id, p.datum_podani, p.stav, p.poradi_v_poradniku, p.poznamka,
        s.jmeno, s.prijmeni, s.email, s.telefon, s.organizace
      FROM prihlasky p
      JOIN studenti s ON s.id = p.student_id
      WHERE p.termin_id = $1
      ORDER BY 
        CASE 
          WHEN p.stav = 'POTVRZENA' THEN 1
          WHEN p.stav = 'PORADNIK' THEN 2
          ELSE 3
        END,
        p.poradi_v_poradniku ASC,
        p.datum_podani ASC;
    `;
    const res = await this.db.query(sql, [terminId]);
    return res.rows.map(r => ({
      id: r.id,
      terminId: r.termin_id,
      studentId: r.student_id,
      studentJmeno: `${r.jmeno} ${r.prijmeni}`,
      studentEmail: r.email,
      studentTelefon: r.telefon,
      studentOrganizace: r.organizace,
      datumPodani: r.datum_podani.toISOString(),
      stav: r.stav as StavPrihlasky,
      poradiVPoradniku: r.poradi_v_poradniku,
      poznamka: r.poznamka
    }));
  }

  /**
   * Založení přihlášky s řízením kapacity a pořadníku (ADR-02)
   */
  public async createPrihlaska(terminId: string, studentData: { jmeno: string; prijmeni: string; email: string; telefon?: string; organizace?: string; poznamka?: string }): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // 1. Vyhledání nebo vytvoření studenta
      let studentId: string;
      const findStudentSql = "SELECT id FROM studenti WHERE email = $1";
      const sRes = await client.query(findStudentSql, [studentData.email.trim().toLowerCase()]);
      if (sRes.rows.length > 0) {
        studentId = sRes.rows[0].id;
      } else {
        const insertStudent = `
          INSERT INTO studenti (jmeno, prijmeni, email, telefon, organizace)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `;
        const insRes = await client.query(insertStudent, [
          studentData.jmeno.trim(),
          studentData.prijmeni.trim(),
          studentData.email.trim().toLowerCase(),
          studentData.telefon || null,
          studentData.organizace || null
        ]);
        studentId = insRes.rows[0].id;
      }

      // 2. Kontrola, zda už student nemá aktivní přihlášku na tento termín
      const checkDupl = `
        SELECT id, stav FROM prihlasky 
        WHERE termin_id = $1 AND student_id = $2 AND stav IN ('POTVRZENA', 'PORADNIK')
      `;
      const duplRes = await client.query(checkDupl, [terminId, studentId]);
      if (duplRes.rows.length > 0) {
        throw new Error("Student již má na tento termín aktivní přihlášku nebo je zapsán v pořadníku.");
      }

      // 3. Zjištění kapacity a aktuálního počtu potvrzených míst
      const capRes = await client.query("SELECT kapacita FROM terminy WHERE id = $1", [terminId]);
      if (capRes.rows.length === 0) throw new Error("Termín nebyl nalezen.");
      const kapacita = capRes.rows[0].kapacita;

      const countRes = await client.query(
        "SELECT COUNT(*) FROM prihlasky WHERE termin_id = $1 AND stav = 'POTVRZENA'",
        [terminId]
      );
      const potvrzenoPocet = parseInt(countRes.rows[0].count, 10);

      let stav: StavPrihlasky;
      let poradi: number | null = null;

      if (potvrzenoPocet < kapacita) {
        stav = "POTVRZENA";
      } else {
        // Kapacita je vyčerpána -> zařazení do pořadníku
        stav = "PORADNIK";
        const maxPoradiRes = await client.query(
          "SELECT COALESCE(MAX(poradi_v_poradniku), 0) as max_p FROM prihlasky WHERE termin_id = $1 AND stav = 'PORADNIK'",
          [terminId]
        );
        poradi = parseInt(maxPoradiRes.rows[0].max_p, 10) + 1;
      }

      // 4. Vložení přihlášky
      const insPrihlaskaSql = `
        INSERT INTO prihlasky (termin_id, student_id, stav, poradi_v_poradniku, poznamka)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, datum_podani, stav, poradi_v_poradniku;
      `;
      const pRes = await client.query(insPrihlaskaSql, [
        terminId,
        studentId,
        stav,
        poradi,
        studentData.poznamka || null
      ]);

      await client.query("COMMIT");

      return {
        id: pRes.rows[0].id,
        terminId,
        studentId,
        studentJmeno: `${studentData.jmeno} ${studentData.prijmeni}`,
        stav: pRes.rows[0].stav,
        poradiVPoradniku: pRes.rows[0].poradi_v_poradniku,
        datumPodani: pRes.rows[0].datum_podani
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Zrušení přihlášky a automatický posun náhradníka z pořadníku (ADR-02)
   */
  public async cancelPrihlaska(prihlaskaId: string): Promise<{ success: boolean; posunutyStudentId?: string }> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");

      // 1. Zjištění informací o rušené přihlášce
      const pRes = await client.query(
        "SELECT id, termin_id, stav, poradi_v_poradniku FROM prihlasky WHERE id = $1",
        [prihlaskaId]
      );
      if (pRes.rows.length === 0) throw new Error("Přihláška nebyla nalezena.");

      const prihlaska = pRes.rows[0];
      const terminId = prihlaska.termin_id;
      const bylaPotvrzena = prihlaska.stav === "POTVRZENA";
      const bylaVPoradniku = prihlaska.stav === "PORADNIK";
      const puvodniPoradi = prihlaska.poradi_v_poradniku;

      // 2. Označení za zrušenou (nemažeme historii dle zadání!)
      await client.query(
        "UPDATE prihlasky SET stav = 'ZRUSENA', poradi_v_poradniku = NULL, updated_at = NOW() WHERE id = $1",
        [prihlaskaId]
      );

      let posunutyStudentId: string | undefined;

      // 3. Pokud byla potvrzená, uvolnilo se místo -> posun prvního z pořadníku
      if (bylaPotvrzena) {
        const nextRes = await client.query(
          "SELECT id, student_id FROM prihlasky WHERE termin_id = $1 AND stav = 'PORADNIK' AND poradi_v_poradniku = 1",
          [terminId]
        );
        if (nextRes.rows.length > 0) {
          const firstInWaitlistId = nextRes.rows[0].id;
          posunutyStudentId = nextRes.rows[0].student_id;

          // Povýšení náhradníka na potvrzenou přihlášku
          await client.query(
            "UPDATE prihlasky SET stav = 'POTVRZENA', poradi_v_poradniku = NULL, updated_at = NOW() WHERE id = $1",
            [firstInWaitlistId]
          );

          // Posun všech zbývajících náhradníků o 1 pozici dopředu
          await client.query(
            "UPDATE prihlasky SET poradi_v_poradniku = poradi_v_poradniku - 1 WHERE termin_id = $1 AND stav = 'PORADNIK' AND poradi_v_poradniku > 1",
            [terminId]
          );
        }
      } else if (bylaVPoradniku && puvodniPoradi) {
        // Pokud byla v pořadníku, posuneme náhradníky za ním
        await client.query(
          "UPDATE prihlasky SET poradi_v_poradniku = poradi_v_poradniku - 1 WHERE termin_id = $1 AND stav = 'PORADNIK' AND poradi_v_poradniku > $2",
          [terminId, puvodniPoradi]
        );
      }

      await client.query("COMMIT");
      return { success: true, posunutyStudentId };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  public async getLektori(): Promise<any[]> {
    const sql = `
      SELECT 
        l.id, l.jmeno, l.prijmeni, l.email, l.telefon, l.specializace,
        COUNT(DISTINCT tl.termin_id) as terminu_pocet,
        COALESCE(SUM(k.rozsah_hodin), 0) as oducheno_hodin
      FROM lektori l
      LEFT JOIN termin_lektori tl ON tl.lektor_id = l.id
      LEFT JOIN terminy t ON t.id = tl.termin_id
      LEFT JOIN kurzy k ON k.id = t.kurz_id
      GROUP BY l.id
      ORDER BY l.prijmeni ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      jmeno: `${r.jmeno} ${r.prijmeni}`,
      email: r.email,
      telefon: r.telefon,
      specializace: r.specializace,
      terminuPocet: parseInt(r.terminu_pocet, 10),
      oduchenoHodin: parseInt(r.oducheno_hodin, 10)
    }));
  }

  public async getUcebny(): Promise<any[]> {
    const sql = "SELECT id, nazev, adresa, maximalni_kapacita as kapacita FROM ucebny ORDER BY nazev ASC";
    const res = await this.db.query(sql);
    return res.rows;
  }

  public async getStudenti(): Promise<any[]> {
    const sql = `
      SELECT 
        s.id, s.jmeno, s.prijmeni, s.email, s.telefon, s.organizace,
        COUNT(p.id) as pocet_prihlasek
      FROM studenti s
      LEFT JOIN prihlasky p ON p.student_id = s.id AND p.stav IN ('POTVRZENA', 'DOKONCENA')
      GROUP BY s.id
      ORDER BY s.prijmeni ASC;
    `;
    const res = await this.db.query(sql);
    return res.rows.map(r => ({
      id: r.id,
      jmeno: `${r.jmeno} ${r.prijmeni}`,
      email: r.email,
      telefon: r.telefon,
      organizace: r.organizace,
      pocetPrihlasek: parseInt(r.pocet_prihlasek, 10)
    }));
  }

  /**
   * Analytické přehledy požadované v bodě 8 zadání:
   * - Naplněnost termínů
   * - Kolik hodin odučil který lektor
   * - Kdo se přihlásil na víc než jeden kurz
   */
  public async getAnalytics(): Promise<any> {
    // 1. Naplněnost termínů
    const terminy = await this.findAll();

    // 2. Lektoři a hodiny
    const lektori = await this.getLektori();

    // 3. Studenti na více než 1 kurzu
    const multiKurzSql = `
      SELECT 
        s.id, s.jmeno, s.prijmeni, s.email, s.organizace,
        COUNT(DISTINCT t.kurz_id) as pocet_kurzu,
        array_agg(DISTINCT k.nazev) as kurzy
      FROM studenti s
      JOIN prihlasky p ON p.student_id = s.id AND p.stav IN ('POTVRZENA', 'DOKONCENA')
      JOIN terminy t ON t.id = p.termin_id
      JOIN kurzy k ON k.id = t.kurz_id
      GROUP BY s.id
      HAVING COUNT(DISTINCT t.kurz_id) > 1;
    `;
    const multiRes = await this.db.query(multiKurzSql);

    return {
      terminyStats: terminy.map(t => ({
        id: t.id,
        kurzNazev: t.kurzNazev,
        datum: `${t.datumOd} až ${t.datumDo}`,
        kapacita: t.kapacita,
        potvrzeno: t.potvrzenoPocet,
        poradnik: t.poradnikPocet,
        procentoNaplneni: Math.round((t.potvrzenoPocet / t.kapacita) * 100)
      })),
      lektoriStats: lektori.map(l => ({
        jmeno: l.jmeno,
        oduchenoHodin: l.oduchenoHodin,
        pocetTerminu: l.terminuPocet
      })),
      studentiViceKurzu: multiRes.rows.map(s => ({
        student: `${s.jmeno} ${s.prijmeni}`,
        email: s.email,
        organizace: s.organizace,
        pocetKurzu: parseInt(s.pocet_kurzu, 10),
        kurzy: s.kurzy
      }))
    };
  }
}
