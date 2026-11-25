import { describe, it, expect, afterAll } from "@jest/globals";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { pool } from "../../src/infrastructure/database/db.js";
import { AuthService } from "../../src/application/services/AuthService.js";

describe("Admin & Student Authentication & RBAC Authorization (Supertest)", () => {
  const app = createApp();
  let adminToken: string;
  let studentToken: string;
  let createdCourseId: string;

  afterAll(async () => {
    // Gracefully end pool connection
    await pool.end();
  });

  describe("1. Authentication Endpoints (/api/auth/login, /api/auth/logout, /api/auth/me)", () => {
    it("POST /api/auth/login successfully authenticates admin with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("admin");
      expect(res.body.user.username).toBe("admin");

      adminToken = res.body.token;
    });

    it("POST /api/auth/login successfully authenticates student with default credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "jan.novak@firma.cz",
        password: "student123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe("student");
      expect(res.body.user.email).toBe("jan.novak@firma.cz");

      studentToken = res.body.token;
    });

    it("POST /api/auth/login accepts generic student username with student password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "student",
        password: "student123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe("student");
    });

    it("POST /api/auth/login rejects invalid password with 401 Unauthorized", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Neplatné přihlašovací jméno nebo heslo.");
    });

    it("GET /api/auth/me returns active session user when Bearer token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user.role).toBe("admin");
    });

    it("GET /api/auth/me rejects missing or invalid token with 401", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-12345");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.authenticated).toBe(false);
    });

    it("GET /api/auth/status returns authenticated: false when unauthenticated", async () => {
      const res = await request(app).get("/api/auth/status");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.user).toBeNull();
    });

    it("POST /api/auth/logout successfully invalidates session token", async () => {
      // Login temporary session
      const loginRes = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });
      const tempToken = loginRes.body.token;

      // Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify token is no longer valid
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempToken}`);
      expect(meRes.status).toBe(401);
    });
  });

  describe("2. Course Catalog Protection (Admin vs. Public vs. Student)", () => {
    it("Public user can GET /api/courses without authentication", async () => {
      const res = await request(app).get("/api/courses");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("Unauthenticated request to POST /api/courses returns 401 Unauthorized", async () => {
      const res = await request(app).post("/api/courses").set("x-enforce-auth", "true").send({
        title: "Neautorizovaný kurz od veřejnosti",
        annotation: "Tento kurz by neměl projít, protože uživatel není přihlášen.",
        hours: 20,
        price: 5000,
        isAccredited: false,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Neautorizovaný přístup");
    });

    it("Student role attempting POST /api/courses returns 403 Forbidden", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          title: "Kurz pokusně vytvořený studentem",
          annotation: "Student nemá oprávnění vytvářet kurzy v katalogu Akademie.",
          hours: 30,
          price: 6000,
          isAccredited: false,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Nedostatečná oprávnění");
    });

    it("Authenticated Admin can successfully create course via POST /api/courses", async () => {
      const res = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Akreditovaný kurz kyberbezpečnosti",
          annotation: "Odborný certifikovaný kurz vytvořený administrátorem systému.",
          hours: 48,
          price: 13500,
          isAccredited: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe("Admin Akreditovaný kurz kyberbezpečnosti");

      createdCourseId = res.body.data.id;
    });

    it("Authenticated Admin can update course via PUT /api/courses/:id", async () => {
      expect(createdCourseId).toBeDefined();

      const res = await request(app)
        .put(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Admin Akreditovaný kurz kyberbezpečnosti (Aktualizováno)",
          price: 14900,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain("(Aktualizováno)");
      expect(res.body.data.price).toBe(14900);
    });

    it("Unauthenticated request to PUT /api/courses/:id returns 401 Unauthorized", async () => {
      const res = await request(app)
        .put(`/api/courses/${createdCourseId}`)
        .set("x-enforce-auth", "true")
        .send({
          title: "Pokus o změnu bez přihlášení",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting DELETE /api/courses/:id returns 403 Forbidden", async () => {
      const res = await request(app)
        .delete(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Admin can delete course via DELETE /api/courses/:id", async () => {
      const res = await request(app)
        .delete(`/api/courses/${createdCourseId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("3. Student Portal Endpoints (/api/student/dashboard)", () => {
    it("Unauthenticated request to /api/student/dashboard returns 401", async () => {
      const res = await request(app).get("/api/student/dashboard");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Student can access /api/student/dashboard and receives rich multi-enrollment structure (CONFIRMED, WAITLIST, COMPLETED)", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.student.email).toBe("jan.novak@firma.cz");

      const enrollments = res.body.data.enrollments;
      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeGreaterThanOrEqual(3);

      // Verify CONFIRMED enrollment
      const confirmedEnr = enrollments.find(
        (e: {
          status: string;
          waitlistPosition?: number | null;
          termId?: string;
          courseTitle?: string;
          courseId?: string;
        }) => e.status === "CONFIRMED"
      );
      expect(confirmedEnr).toBeDefined();
      expect(confirmedEnr?.waitlistPosition).toBeNull();
      expect(confirmedEnr?.termId).toBeDefined();
      expect(confirmedEnr?.courseTitle).toBeDefined();
      expect(confirmedEnr?.courseId).toBeDefined();

      // Verify WAITLIST enrollment with sequential position
      const waitlistEnr = enrollments.find(
        (e: { status: string; waitlistPosition?: number | null }) => e.status === "WAITLIST"
      );
      expect(waitlistEnr).toBeDefined();
      expect(typeof waitlistEnr?.waitlistPosition).toBe("number");
      expect(waitlistEnr?.waitlistPosition).toBeGreaterThanOrEqual(1);

      // Verify COMPLETED enrollment
      const completedEnr = enrollments.find(
        (e: { status: string; termId?: string }) => e.status === "COMPLETED"
      );
      expect(completedEnr).toBeDefined();
      expect(completedEnr?.termId).toBeDefined();
    });

    it("Student dashboard correctly calculates attendance metrics and certificate qualification threshold (>=70%)", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const attendance = res.body.data.attendance;
      expect(Array.isArray(attendance)).toBe(true);
      expect(attendance.length).toBeGreaterThan(0);

      for (const item of attendance) {
        expect(item.termId).toBeDefined();
        expect(item.courseTitle).toBeDefined();
        expect(typeof item.totalDays).toBe("number");
        expect(typeof item.attendedDays).toBe("number");
        expect(typeof item.percentage).toBe("number");
        expect(item.totalDays).toBeGreaterThanOrEqual(item.attendedDays);

        // Verification of ADR-01 70% threshold logic
        if (item.percentage >= 70) {
          expect(item.qualifiesForCertificate).toBe(true);
        } else {
          expect(item.qualifiesForCertificate).toBe(false);
        }
      }
    });

    it("Student dashboard includes valid certificates with sequential numbering format (AT-YYYY-XXXX)", async () => {
      const res = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const certificates = res.body.data.certificates;
      expect(Array.isArray(certificates)).toBe(true);
      expect(certificates.length).toBeGreaterThan(0);

      for (const cert of certificates) {
        expect(cert.id).toBeDefined();
        expect(cert.certificateNumber).toMatch(/^AT-\d{4}-\d{4}$/);
        expect(cert.courseTitle).toBeDefined();
        expect(cert.issueDate).toBeDefined();
        expect(typeof cert.attendanceRate).toBe("number");
      }
    });

    it("Authenticated Admin can preview student dashboard via ?studentId= query parameter", async () => {
      const res = await request(app)
        .get("/api/student/dashboard?studentId=c1111111-1111-4111-8111-111111111111")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.student).toBeDefined();
      expect(res.body.data.enrollments.length).toBeGreaterThanOrEqual(3);
    });

    it("Direct AuthService.getStudentDashboard standalone execution returns complete dashboard structure with fallback demo data", async () => {
      const authService = new AuthService();
      const dashboard = await authService.getStudentDashboard(
        "c1111111-1111-4111-8111-111111111111",
        "jan.novak@firma.cz"
      );

      expect(dashboard).toBeDefined();
      expect(dashboard.student.name).toBe("Jan Novák");
      expect(dashboard.student.email).toBe("jan.novak@firma.cz");

      // Verify all 4 demo enrollments covering CONFIRMED, WAITLIST and COMPLETED
      expect(dashboard.enrollments.length).toBe(4);
      const statuses = dashboard.enrollments.map((e) => e.status);
      expect(statuses).toContain("CONFIRMED");
      expect(statuses).toContain("WAITLIST");
      expect(statuses).toContain("COMPLETED");

      const waitlist = dashboard.enrollments.find((e) => e.status === "WAITLIST");
      expect(waitlist?.waitlistPosition).toBe(1);

      // Verify attendance calculation
      expect(dashboard.attendance.length).toBe(2);
      expect(dashboard.attendance[0].percentage).toBe(100);
      expect(dashboard.attendance[0].qualifiesForCertificate).toBe(true);

      // Verify certificates
      expect(dashboard.certificates.length).toBe(1);
      expect(dashboard.certificates[0].certificateNumber).toBe("AT-2026-0003");
      expect(dashboard.certificates[0].attendanceRate).toBe(100);
    });

    it("Consistency check: term filtering by courseId aligns with enrollments courseIds", async () => {
      // 1. Fetch all terms
      const allTermsRes = await request(app).get("/api/terms");
      expect(allTermsRes.status).toBe(200);
      const allTerms = allTermsRes.body.data;
      expect(allTerms.length).toBeGreaterThan(0);

      // 2. Fetch student dashboard to get a known courseId
      const dashRes = await request(app)
        .get("/api/student/dashboard")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(dashRes.status).toBe(200);
      const enrollments = dashRes.body.data.enrollments;
      const targetCourseId = enrollments[0].courseId;
      expect(targetCourseId).toBeDefined();

      // 3. Filter terms by targetCourseId via query parameter
      const filteredRes = await request(app).get(`/api/terms?courseId=${targetCourseId}`);
      expect(filteredRes.status).toBe(200);
      const filteredTerms = filteredRes.body.data;
      expect(filteredTerms.length).toBeGreaterThan(0);
      expect(filteredTerms.every((t: { courseId?: string }) => t.courseId === targetCourseId)).toBe(
        true
      );

      // 4. Query with non-existent courseId returns empty list
      const emptyRes = await request(app).get("/api/terms?courseId=non-existent-course-id-999");
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data.length).toBe(0);
    });
  });

  describe("4. Anonymous vs Admin Policy Protection for Sensitive Data & Enrollments", () => {
    let termId: string;
    let enrollmentId: string;

    it("Unauthenticated request to GET /api/students returns 401 Unauthorized", async () => {
      const res = await request(app).get("/api/students").set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting GET /api/students returns 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/students")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Admin can access GET /api/students", async () => {
      const res = await request(app)
        .get("/api/students")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("Unauthenticated request to GET /api/analytics returns 401 Unauthorized", async () => {
      const res = await request(app).get("/api/analytics").set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting GET /api/analytics returns 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/analytics")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Admin can access GET /api/analytics", async () => {
      const res = await request(app)
        .get("/api/analytics")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("Unauthenticated request to GET /api/certificates returns 401 Unauthorized", async () => {
      const res = await request(app).get("/api/certificates").set("x-enforce-auth", "true");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Authenticated Admin can access GET /api/certificates", async () => {
      const res = await request(app)
        .get("/api/certificates")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("Unauthenticated request to POST /api/terms/:id/enrollments returns 401 Unauthorized", async () => {
      // Get an existing term
      const termsRes = await request(app).get("/api/terms");
      expect(termsRes.status).toBe(200);
      expect(termsRes.body.data.length).toBeGreaterThan(0);
      termId = termsRes.body.data[0].id;

      const res = await request(app)
        .post(`/api/terms/${termId}/enrollments`)
        .set("x-enforce-auth", "true")
        .send({
          firstName: "Anonym",
          lastName: "Uživatel",
          email: "anonym@example.com",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting to enroll someone else with different email returns 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/terms/${termId}/enrollments`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          firstName: "Cizí",
          lastName: "Student",
          email: "cizi.student@example.com",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Přihlášený student může zapsat pouze sám sebe");
    });

    it("Unauthenticated request to POST /api/enrollments/:id/cancel returns 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/enrollments/00000000-0000-0000-0000-000000000000/cancel")
        .set("x-enforce-auth", "true");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("Student role attempting to cancel another student's enrollment returns 403 Forbidden", async () => {
      // Create an enrollment as admin for a different student
      const enrRes = await request(app)
        .post(`/api/terms/${termId}/enrollments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstName: "Adminem",
          lastName: "Zapsaný",
          email: `zapsany.${Date.now()}@firma.cz`,
        });

      expect(enrRes.status).toBe(201);
      enrollmentId = enrRes.body.data.id;

      // Student Jan Novák tries to cancel this other student's enrollment
      const cancelRes = await request(app)
        .post(`/api/enrollments/${enrollmentId}/cancel`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.success).toBe(false);
      expect(cancelRes.body.error).toContain("Student může zrušit pouze svou vlastní přihlášku");
    });

    it("Authenticated Admin can cancel any enrollment", async () => {
      const cancelRes = await request(app)
        .post(`/api/enrollments/${enrollmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
    });
  });
});
