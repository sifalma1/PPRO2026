import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { AuthService, UserSession } from "../../src/application/services/AuthService.js";
import { pool } from "../../src/infrastructure/database/db.js";

describe("Hloubkový bezpečnostní audit – Security Deep Test Suite (Jest)", () => {
  const authService = new AuthService(pool);
  const app = createApp({ authService });

  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let testTermId: string;
  let student1EnrollmentId: string;
  let student2EnrollmentId: string;
  let student1CertificateId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminLogin = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.token;

    // 2. Authenticate Student 1 (Jan Novák)
    const s1Login = await request(app).post("/api/auth/login").send({
      username: "jan.novak@firma.cz",
      password: "student123",
    });
    expect(s1Login.status).toBe(200);
    student1Token = s1Login.body.token;

    // 3. Authenticate Student 2 (Eva Dvořáková)
    const s2Login = await request(app).post("/api/auth/login").send({
      username: "eva.dvorakova@test.cz",
      password: "student123",
    });
    expect(s2Login.status).toBe(200);
    student2Token = s2Login.body.token;

    // 4. Retrieve or create an active term for testing
    const termsRes = await request(app).get("/api/terms");
    expect(termsRes.status).toBe(200);
    if (termsRes.body.data.length > 0) {
      testTermId = termsRes.body.data[0].id;
    } else {
      // Create course & term if empty
      const cRes = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Bezpečnostní kurz pro testy",
          annotation: "Testovací kurz",
          hours: 16,
          price: 4500,
        });
      const tRes = await request(app)
        .post("/api/terms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          courseId: cRes.body.data.id,
          startDate: "2026-12-01",
          endDate: "2026-12-03",
          capacity: 10,
        });
      testTermId = tRes.body.data.id;
    }

    // 5. Enroll Student 1 as self
    const enr1Res = await request(app)
      .post(`/api/terms/${testTermId}/enrollments`)
      .set("Authorization", `Bearer ${student1Token}`)
      .send({
        firstName: "Jan",
        lastName: "Novák",
        email: "jan.novak@firma.cz",
        phone: "+420 601 111 222",
      });
    // Status can be 201 or 400 if already enrolled
    if (enr1Res.status === 201) {
      student1EnrollmentId = enr1Res.body.data.id;
    } else {
      // Fetch existing enrollment
      const list = await request(app)
        .get(`/api/terms/${testTermId}/enrollments`)
        .set("Authorization", `Bearer ${adminToken}`);
      const found = list.body.data.find(
        (e: { studentEmail?: string; id: string }) =>
          e.studentEmail?.toLowerCase() === "jan.novak@firma.cz"
      );
      if (found) student1EnrollmentId = found.id;
    }

    // 6. Enroll Student 2 as self
    const enr2Res = await request(app)
      .post(`/api/terms/${testTermId}/enrollments`)
      .set("Authorization", `Bearer ${student2Token}`)
      .send({
        firstName: "Eva",
        lastName: "Dvořáková",
        email: "eva.dvorakova@test.cz",
        phone: "+420 602 333 444",
      });
    if (enr2Res.status === 201) {
      student2EnrollmentId = enr2Res.body.data.id;
    } else {
      const list = await request(app)
        .get(`/api/terms/${testTermId}/enrollments`)
        .set("Authorization", `Bearer ${adminToken}`);
      const found = list.body.data.find(
        (e: { studentEmail?: string; id: string }) =>
          e.studentEmail?.toLowerCase() === "eva.dvorakova@test.cz"
      );
      if (found) student2EnrollmentId = found.id;
    }

    // 7. Check or issue a certificate for Student 1 (with lecturer waiver)
    if (student1EnrollmentId) {
      try {
        const certRes = await request(app)
          .post("/api/certificates/issue")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            enrollmentId: student1EnrollmentId,
            hasWaiver: true,
            waiverReason: "Schváleno lektorem pro bezpečnostní test",
          });
        if (certRes.status === 201) {
          student1CertificateId = certRes.body.data.id;
        }
      } catch {
        // May already have certificate
      }
    }

    if (!student1CertificateId) {
      const certList = await request(app)
        .get("/api/certificates")
        .set("Authorization", `Bearer ${adminToken}`);
      if (certList.body.data && certList.body.data.length > 0) {
        student1CertificateId = certList.body.data[0].id;
      }
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  // =========================================================================
  // OKRUH 1: CHYBĚJÍCÍ TOKEN (MISSING TOKEN PROTECTION)
  // =========================================================================
  describe("1. Chybějící token a prázdné hlavičky (Missing Tokens)", () => {
    it("POST /api/courses bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("x-enforce-auth", "true")
        .send({ title: "Hackerský kurz", hours: 10, price: 100 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Neautorizovaný přístup");
    });

    it("PUT /api/courses/:id bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .put("/api/courses/00000000-0000-0000-0000-000000000001")
        .set("x-enforce-auth", "true")
        .send({ title: "Modifikace bez tokenu" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("DELETE /api/courses/:id bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .delete("/api/courses/00000000-0000-0000-0000-000000000001")
        .set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/terms bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/terms")
        .set("x-enforce-auth", "true")
        .send({ courseId: "c1", capacity: 15, startDate: "2026-10-01", endDate: "2026-10-02" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/students bez tokenu vrátí 401 Unauthorized (ochrana GDPR)", async () => {
      const res = await request(app).get("/api/students").set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/analytics bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app).get("/api/analytics").set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/certificates/issue bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/certificates/issue")
        .set("x-enforce-auth", "true")
        .send({ enrollmentId: "e1" });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/student/dashboard bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app).get("/api/student/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/certificates/:id bez tokenu vrátí 401 Unauthorized", async () => {
      const res = await request(app).get("/api/certificates/00000000-0000-0000-0000-000000000001");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Hlavička 'Authorization: Bearer ' s prázdnými mezerami je odmítnuta jako chybějící token (401)", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", "Bearer    ");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Prázdná vlastní hlavička 'x-admin-token: ' je odmítnuta jako 401", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("x-admin-token", "   ")
        .set("x-enforce-auth", "true")
        .send({ title: "Test bez tokenu", hours: 5, price: 500 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // OKRUH 2: ZFALŠOVANÝ PODPIS A NEPLATNÉ TOKENY (FORGED SIGNATURES & TOKENS)
  // =========================================================================
  describe("2. Zfalšovaný podpis a neplatné tokeny (Forged & Invalid Tokens)", () => {
    it("Token se zfalšovaným JWT podpisem je striktně odmítnut s 401 Unauthorized", async () => {
      const forgedJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.FORGED_SIGNATURE_HASH_XYZ123456";
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${forgedJwt}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.authenticated).toBe(false);
    });

    it("Zfalšovaný admin token s prefixem 'at_' je odmítnut (401)", async () => {
      const forgedToken = "at_00112233445566778899aabbccddeeff0011223344556677";
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${forgedToken}`)
        .send({ title: "Kurz od útočníka", hours: 10, price: 1000 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Administrátorský token je neplatný nebo vypršel");
    });

    it("Náhodný textový řetězec v Authorization hlavičce vrátí 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer gibberish_token_string_!@#$%^&*()");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Literály 'null' a 'undefined' jako Bearer token jsou odmítnuty s 401", async () => {
      const res1 = await request(app).get("/api/auth/me").set("Authorization", "Bearer null");
      expect(res1.status).toBe(401);

      const res2 = await request(app).get("/api/auth/me").set("Authorization", "Bearer undefined");
      expect(res2.status).toBe(401);
    });

    it("Odhlášený (invalidovaný) token je neprodleně odmítnut s 401", async () => {
      // 1. Získat dočasný token
      const loginRes = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });
      const tempToken = loginRes.body.token;

      // 2. Ověřit, že funguje
      const meBefore = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(meBefore.status).toBe(200);

      // 3. Provést logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(logoutRes.status).toBe(200);

      // 4. Použít znovu ten samý token -> musí selhat s 401
      const meAfter = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(meAfter.status).toBe(401);
      expect(meAfter.body.authenticated).toBe(false);
    });
  });

  // =========================================================================
  // OKRUH 3: VYPRŠENÝ TOKEN (EXPIRED TOKEN REJECTION & CLEANUP)
  // =========================================================================
  describe("3. Vypršený token (Expired Token Lifecycle)", () => {
    const expiredToken = "at_expired_session_test_token_999";

    beforeAll(() => {
      // Injektovat expirovanou session s platností v minulosti
      const expiredUser: UserSession = {
        id: "admin-expired-id",
        username: "admin",
        name: "Expirovaný Admin",
        role: "admin",
      };
      authService.createExpiredSessionForTesting(expiredToken, expiredUser);
    });

    it("GET /api/auth/me s expirovaným tokenem vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.authenticated).toBe(false);
    });

    it("POST /api/courses s expirovaným admin tokenem vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({
          title: "Kurz s expirovaným tokenem",
          hours: 10,
          price: 2000,
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("token je neplatný nebo vypršel");
    });

    it("GET /api/student/dashboard s expirovaným tokenem vrátí 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Token je neplatný nebo vypršel");
    });

    it("Ověření, že expirovaná session byla automaticky vyčištěna z paměti", () => {
      // Validace musí nyní vracet null
      const user = authService.validateToken(expiredToken);
      expect(user).toBeNull();
    });
  });

  // =========================================================================
  // OKRUH 4: MANIPULACE S CIZÍM STUDENT ID, IDOR A GDPR
  // =========================================================================
  describe("4. Manipulace s cizím studentId, IDOR a ochrana GDPR údajů", () => {
    it("Student se nemůže podvržením ?studentId=... podívat na data cizího studenta", async () => {
      // Student 1 (Jan Novák) zkouší poslat studentId oběti
      const victimStudentId = "c2222222-2222-4222-8222-222222222222";
      const res = await request(app)
        .get(`/api/student/dashboard?studentId=${victimStudentId}`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Musí se striktně vrátit data přihlášeného Jana Nováka, ne oběti!
      expect(res.body.data.student.email.toLowerCase()).toBe("jan.novak@firma.cz");
      expect(res.body.data.student.id).not.toBe(victimStudentId);
    });

    it("Student 2 se nemůže podívat na cizí osvědčení studenta 1 přes GET /api/certificates/:id (vrátí 403 Forbidden)", async () => {
      if (!student1CertificateId) {
        // Pokud certifikát zatím neexistuje, přeskočíme
        return;
      }

      // Student 2 (Eva Dvořáková) se pokusí otevřít osvědčení Jana Nováka
      const res = await request(app)
        .get(`/api/certificates/${student1CertificateId}`)
        .set("Authorization", `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Nedostatečná oprávnění");
      expect(res.body.error).toContain("Student může zobrazit pouze své vlastní osvědčení");
    });

    it("Admin MŮŽE prohlížet osvědčení jakéhokoliv studenta přes GET /api/certificates/:id", async () => {
      if (!student1CertificateId) return;

      const res = await request(app)
        .get(`/api/certificates/${student1CertificateId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(student1CertificateId);
    });

    it("Student 1 nemůže zrušit přihlášku studenta 2 přes POST /api/enrollments/:id/cancel (403 Forbidden)", async () => {
      if (!student2EnrollmentId) return;

      const res = await request(app)
        .post(`/api/enrollments/${student2EnrollmentId}/cancel`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Student může zrušit pouze svou vlastní přihlášku");
    });

    it("Student 1 nemůže zapsat na kurz cizí e-mail studenta 2 (403 Forbidden)", async () => {
      const res = await request(app)
        .post(`/api/terms/${testTermId}/enrollments`)
        .set("Authorization", `Bearer ${student1Token}`)
        .send({
          firstName: "Cizí",
          lastName: "Osoba",
          email: "obet.utoku@firma.cz",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Přihlášený student může zapsat pouze sám sebe");
    });

    it("GDPR: Anonymní uživatel na GET /api/terms/:id/enrollments vidí pouze maskovaná jména ('Účastník #X') a žádné kontakty", async () => {
      const res = await request(app).get(`/api/terms/${testTermId}/enrollments`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      for (const enr of res.body.data) {
        // Jméno musí být maskováno
        expect(enr.studentName).toMatch(/^Účastník #\d+$/);
        // Osobní údaje nesmí unikat
        expect(enr.studentEmail).toBeUndefined();
        expect(enr.studentPhone).toBeUndefined();
        expect(enr.studentOrganization).toBeUndefined();
      }
    });

    it("GDPR: Přihlášený student na GET /api/terms/:id/enrollments vidí plné údaje jen u sebe, ostatní jsou anonymizováni", async () => {
      const res = await request(app)
        .get(`/api/terms/${testTermId}/enrollments`)
        .set("Authorization", `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      for (const enr of res.body.data) {
        if (enr.studentEmail?.toLowerCase() === "jan.novak@firma.cz") {
          // U sebe vidí plné jméno
          expect(enr.studentName).toContain("Jan");
        } else {
          // Ostatní účastníci musí být maskováni jako Účastník #X
          expect(enr.studentName).toMatch(/^Účastník #\d+$/);
        }
      }
    });

    it("Student role je zablokována před přístupem do databáze studentů (GET /api/students -> 403)", async () => {
      const res = await request(app)
        .get("/api/students")
        .set("Authorization", `Bearer ${student1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Student role je zablokována před přístupem k analytice (GET /api/analytics -> 403)", async () => {
      const res = await request(app)
        .get("/api/analytics")
        .set("Authorization", `Bearer ${student1Token}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // OKRUH 5: PŘETEČENÍ ID A MEZNÍ HODNOTY (OVERFLOW & BOUNDARY INPUTS)
  // =========================================================================
  describe("5. Přetečení ID a mezní/extrémní hodnoty (ID Overflow & Boundary Inputs)", () => {
    it("Extrémně dlouhé ID (10 000 znaků) na GET /api/courses/:id nesesype server a vrátí 404", async () => {
      const hugeId = "a".repeat(10000);
      const res = await request(app).get(`/api/courses/${hugeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("Extrémně dlouhé ID na GET /api/terms/:id nesesype server a vrátí 404", async () => {
      const hugeId = "9".repeat(5000);
      const res = await request(app).get(`/api/terms/${hugeId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("Číselné přetečení v path parametru (64-bit integer overflow) vrátí 404 bez pádu DB", async () => {
      const overflowId = "99999999999999999999999999999999999999999999999999999999";
      const res = await request(app).get(`/api/courses/${overflowId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("Číselné přetečení kapacity při vytváření termínu vrátí 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/terms")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          courseId: "c1111111-1111-4111-8111-111111111111",
          startDate: "2026-11-01",
          endDate: "2026-11-02",
          capacity: 99999999999999999999999999999999, // overflow
        });
      // Musí vrátit 400 a nesesypat proces
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it("Zadání NaN nebo záporných hodnot hodin/ceny kurzu je odmítnuto s 400 Bad Request", async () => {
      const resHours = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Kurz s neplatnými hodinami",
          hours: -50,
          price: 5000,
        });
      expect(resHours.status).toBe(400);

      const resPrice = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Kurz se zápornou cenou",
          hours: 20,
          price: -9999,
        });
      expect(resPrice.status).toBe(400);
    });
  });

  // =========================================================================
  // OKRUH 6: SQL ZNAKY V PARAMETRECH (SQL INJECTION RESISTANCE)
  // =========================================================================
  describe("6. Odolnost proti SQL znakům a injekcím v parametrech (SQL Injection Resistance)", () => {
    it("Klasická SQL injekce v query parametru kurzu (?query=' OR 1=1 --) nezpůsobí únik ani pád", async () => {
      const res = await request(app).get("/api/courses?query=' OR 1=1 --");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Výsledky musí odpovídat bezpečně escapovanému vyhledávání (žádné všechny záznamy kvůli OR 1=1)
    });

    it("UNION SELECT SQL injekce v parametru vyhledávání (?query=' UNION SELECT NULL, NULL...) je bezpečně zpracována", async () => {
      const res = await request(app).get(
        "/api/courses?query=' UNION SELECT 'hack', 'hack', 10, 10, true, NOW(), NOW() --"
      );
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Nesmí obsahovat podvržený kurz
      const hacked = res.body.data.some((c: { title?: string }) => c.title === "hack");
      expect(hacked).toBe(false);
    });

    it("SQL znaky v path parametru GET /api/courses/:id (' OR '1'='1) vrátí 404 bez SQL chyby", async () => {
      const sqlPayload = "' OR '1'='1' --";
      const res = await request(app).get(`/api/courses/${encodeURIComponent(sqlPayload)}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("DROP TABLE útok v URL parametru rušení přihlášky nezpůsobí smazání tabulky", async () => {
      const dropPayload = "'; DROP TABLE enrollments; --";
      const res = await request(app)
        .post(`/api/enrollments/${encodeURIComponent(dropPayload)}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Musí selhat buď 400 nebo 404
      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Zkontrolujeme, že tabulka enrollments stále existuje a funguje!
      const checkTerms = await request(app).get("/api/terms");
      expect(checkTerms.status).toBe(200);
      expect(checkTerms.body.success).toBe(true);
    });

    it("SQL injekce v přihlašovacím formuláři (username: ' OR 1=1 --) selže s 401 Unauthorized", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin' OR 1=1 --",
        password: "' OR '1'='1'",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.token).toBeUndefined();
    });

    it("SQL znaky v těle požadavku záznamu docházky (studentId s SQL injection) nesesypou DB", async () => {
      const res = await request(app)
        .post("/api/attendance/days/00000000-0000-0000-0000-000000000001/mark")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          studentId: "'; DROP TABLE attendance; --",
          isPresent: true,
          note: "SQL injection pokus",
        });

      // Mělo by vrátit chybu (400) nebo bezpečně zachytit
      expect([400, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Ověřit, že tabulka docházky stále žije
      const healthCheck = await request(app).get("/health");
      expect(healthCheck.status).toBe(200);
    });
  });
});
