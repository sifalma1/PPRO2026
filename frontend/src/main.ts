/**
 * Main Application Orchestrator - Akademie Trutnov
 * High-performance enterprise dashboard, tab coordination, modal orchestration,
 * RBAC authentication (Admin & Student), and keyboard shortcut handling.
 */
import "./style.css";
import { Modal } from "./components/Modal";
import { Header } from "./components/Header";
import { Toast } from "./components/Toast";
import { authApi } from "./api/authApi";
import { CoursesView } from "./views/CoursesView";
import { TermsView } from "./views/TermsView";
import { AttendanceView } from "./views/AttendanceView";
import { CertificatesView } from "./views/CertificatesView";
import { LecturersView } from "./views/LecturersView";
import { AnalyticsView } from "./views/AnalyticsView";
import { StudentPortalView } from "./views/StudentPortalView";

class App {
  private header: Header;
  private coursesView: CoursesView;
  private termsView: TermsView;
  private attendanceView: AttendanceView;
  private certificatesView: CertificatesView;
  private lecturersView: LecturersView;
  private analyticsView: AnalyticsView;
  private studentPortalView: StudentPortalView;

  constructor() {
    // 1. Initialize modal subsystem
    Modal.init();

    // 2. Instantiate views with cross-tab callbacks
    this.coursesView = new CoursesView({
      onScheduleTerm: (courseId) => this.handleScheduleCourse(courseId),
    });

    this.termsView = new TermsView({
      onSwitchToAttendance: (termId) => this.handleSwitchToAttendance(termId),
    });

    this.attendanceView = new AttendanceView();
    this.certificatesView = new CertificatesView();
    this.lecturersView = new LecturersView();
    this.analyticsView = new AnalyticsView();
    this.studentPortalView = new StudentPortalView();

    // 3. Initialize Header with tab navigation
    this.header = new Header({
      activeTab: "courses",
      onTabChange: (tabId) => this.handleTabChange(tabId),
    });
  }

  public init(): void {
    // Restore session and verify auth
    authApi.restoreSession();

    // Bind header navigation and dark mode toggle
    this.header.bindEvents();

    // Initialize all views
    this.coursesView.init();
    this.termsView.init();
    this.attendanceView.init();
    this.certificatesView.init();
    this.lecturersView.init();
    this.analyticsView.init();
    this.studentPortalView.init();

    // Bind shortcuts button and '?' key
    this.bindGlobalShortcuts();

    // Bind Login dialog events
    this.bindLoginEvents();

    // Listen for custom events
    this.bindCustomEvents();

    // Check system connection status
    this.checkHealth();
  }

  private bindLoginEvents(): void {
    const formLogin = document.getElementById("form-login") as HTMLFormElement;
    const loginError = document.getElementById("form-login-error");
    const usernameInput = document.getElementById("login-username") as HTMLInputElement;
    const passwordInput = document.getElementById("login-password") as HTMLInputElement;
    const prefillAdminBtn = document.getElementById("btn-prefill-admin");
    const prefillStudentBtn = document.getElementById("btn-prefill-student");

    // Prefill buttons
    prefillAdminBtn?.addEventListener("click", () => {
      if (usernameInput) usernameInput.value = "admin";
      if (passwordInput) passwordInput.value = "admin123";
      if (loginError) loginError.classList.add("hidden");
    });

    prefillStudentBtn?.addEventListener("click", () => {
      if (usernameInput) usernameInput.value = "jan.novak@firma.cz";
      if (passwordInput) passwordInput.value = "student123";
      if (loginError) loginError.classList.add("hidden");
    });

    // Form submit
    formLogin?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loginError) loginError.classList.add("hidden");

      const username = usernameInput?.value || "";
      const password = passwordInput?.value || "";

      try {
        const { user } = await authApi.login(username, password);
        Modal.close("modal-login");
        Toast.success(`Vítejte, ${user.name}! Byli jste úspěšně přihlášeni.`);

        // If student logged in, redirect directly to student portal
        if (user.role === "student") {
          this.header.setActiveTab("student");
          this.handleTabChange("student");
        } else {
          // If admin logged in, reload current view to show admin controls
          this.handleTabChange("courses");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Neplatné přihlašovací jméno nebo heslo.";
        if (loginError) {
          loginError.textContent = msg;
          loginError.classList.remove("hidden");
        } else {
          Toast.error(msg);
        }
      }
    });
  }

  private bindGlobalShortcuts(): void {
    const btnShortcuts = document.getElementById("btn-open-shortcuts");
    btnShortcuts?.addEventListener("click", () => {
      Modal.open("modal-shortcuts");
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        Modal.open("modal-shortcuts");
      }
    });
  }

  private bindCustomEvents(): void {
    // Custom event: Schedule a course
    document.addEventListener("akademie:schedule-course", ((
      e: CustomEvent<{ courseId: string }>
    ) => {
      if (e.detail?.courseId) {
        this.handleScheduleCourse(e.detail.courseId);
      }
    }) as EventListener);

    // Custom event: Switch tab
    document.addEventListener("akademie:switch-tab", ((
      e: CustomEvent<{ tab: string; termId?: string; openWaiver?: boolean }>
    ) => {
      const { tab, termId, openWaiver } = e.detail || {};
      if (tab) {
        this.header.setActiveTab(tab);
        this.handleTabChange(tab);

        if (tab === "attendance" && termId) {
          setTimeout(() => this.attendanceView.selectTermById(termId), 100);
        } else if (tab === "certificates" && openWaiver) {
          setTimeout(() => this.certificatesView.openWaiverModal(), 100);
        }
      }
    }) as EventListener);
  }

  private handleScheduleCourse(courseId: string): void {
    this.header.setActiveTab("terms");
    this.termsView.load().then(() => {
      this.termsView.openCreateTermModal(courseId);
    });
  }

  private handleSwitchToAttendance(termId: string): void {
    this.header.setActiveTab("attendance");
    this.attendanceView.load(termId);
  }

  private handleTabChange(tabId: string): void {
    switch (tabId) {
      case "courses":
        this.coursesView.load();
        break;
      case "terms":
        this.termsView.load();
        break;
      case "attendance":
        this.attendanceView.load();
        break;
      case "certificates":
        this.certificatesView.load();
        break;
      case "lecturers":
        this.lecturersView.load();
        break;
      case "analytics":
        this.analyticsView.load();
        break;
      case "student":
        this.studentPortalView.load();
        break;
    }
  }

  private async checkHealth(): Promise<void> {
    const statusPill = document.getElementById("system-status-indicator");
    if (!statusPill) return;

    try {
      const res = await fetch("/health");
      if (res.ok) {
        statusPill.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Systém aktivní
        `;
        statusPill.className =
          "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80";
      } else {
        throw new Error("Chyba spojení");
      }
    } catch {
      statusPill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Offline
      `;
      statusPill.className =
        "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80";
    }
  }
}

// Bootstrap once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
