/**
 * Main Application Orchestrator
 * Akademie Trutnov Information System (PPRO 2026/2027)
 */
import "./style.css";
import { Modal } from "./components/Modal";
import { Header } from "./components/Header";
import { CoursesView } from "./views/CoursesView";
import { TermsView } from "./views/TermsView";
import { AttendanceView } from "./views/AttendanceView";
import { CertificatesView } from "./views/CertificatesView";
import { LecturersView } from "./views/LecturersView";
import { AnalyticsView } from "./views/AnalyticsView";

class App {
  private header: Header;
  private coursesView: CoursesView;
  private termsView: TermsView;
  private attendanceView: AttendanceView;
  private certificatesView: CertificatesView;
  private lecturersView: LecturersView;
  private analyticsView: AnalyticsView;

  constructor() {
    // 1. Initialize modal subsystem
    Modal.init();

    // 2. Instantiate views
    this.coursesView = new CoursesView();
    this.termsView = new TermsView();
    this.attendanceView = new AttendanceView();
    this.certificatesView = new CertificatesView();
    this.lecturersView = new LecturersView();
    this.analyticsView = new AnalyticsView();

    // 3. Initialize Header with tab navigation
    this.header = new Header({
      activeTab: "courses",
      onTabChange: (tabId) => this.handleTabChange(tabId),
    });
  }

  public init(): void {
    // Bind header navigation and dark mode toggle
    this.header.bindEvents();

    // Initialize all views
    this.coursesView.init();
    this.termsView.init();
    this.attendanceView.init();
    this.certificatesView.init();
    this.lecturersView.init();
    this.analyticsView.init();

    // Check system connection status
    this.checkHealth();
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
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
      } else {
        throw new Error("Chyba spojení");
      }
    } catch {
      statusPill.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Offline
      `;
      statusPill.className =
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800";
    }
  }
}

// Bootstrap once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
