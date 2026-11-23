/**
 * Student Portal View - Akademie Trutnov
 * Personal dashboard for authenticated students:
 * active enrollments, waitlist queue status, attendance rates, and issued certificates.
 */
import { authApi } from "../api/authApi";
import { StudentDashboardData } from "../types";
import { Toast } from "../components/Toast";
import { Modal } from "../components/Modal";
import { certificatesApi } from "../api/certificatesApi";

export class StudentPortalView {
  private container: HTMLElement | null = null;
  private dashboardData: StudentDashboardData | null = null;

  public init(): void {
    this.container = document.getElementById("tab-student");
    this.bindEvents();

    // Listen for auth changes
    document.addEventListener("akademie:auth-changed", () => {
      if (authApi.isStudent()) {
        this.load();
      } else {
        this.render();
      }
    });
  }

  private bindEvents(): void {
    // Delegated click for certificate preview
    this.container?.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const certBtn = target.closest<HTMLButtonElement>(".btn-student-cert-preview");
      if (certBtn) {
        const certCode = certBtn.getAttribute("data-cert");
        if (certCode) {
          await this.previewCertificate(certCode);
        }
      }

      const loginBtn = target.closest("#btn-student-portal-login");
      if (loginBtn) {
        Modal.open("modal-login");
      }
    });
  }

  public async load(): Promise<void> {
    if (!authApi.isAuthenticated()) {
      this.render();
      return;
    }

    try {
      this.dashboardData = await authApi.getStudentDashboard();
      this.render();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Nepodařilo se načíst data klientského portálu.";
      Toast.error(msg);
      this.render();
    }
  }

  private render(): void {
    if (!this.container) return;

    const user = authApi.getUser();

    // 1. Unauthenticated state
    if (!user) {
      this.container.innerHTML = `
        <div class="card-box text-center py-12 max-w-xl mx-auto">
          <div class="w-12 h-12 rounded-full bg-[#f4ebce] dark:bg-[#251e30] text-[#8c6d3b] dark:text-[#f8df95] flex items-center justify-center mx-auto mb-3 border border-[#caa049]">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mb-1">
            Klientský portál studenta Akademie Trutnov
          </h3>
          <p class="text-xs text-[#7c5e2d] dark:text-[#c4a974] max-w-sm mx-auto mb-4 leading-relaxed">
            Pro zobrazení Vašich podaných přihlášek, pozice v pořadníku náhradníků, evidence docházky a vydaných osvědčení se prosím přihlaste.
          </p>
          <button id="btn-student-portal-login" class="btn-primary-tw mx-auto flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Přihlásit se jako student</span>
          </button>
        </div>
      `;
      return;
    }

    const data = this.dashboardData;
    const student = data?.student || {
      id: user.studentId || user.id,
      name: user.name,
      email: user.email || user.username,
      organization: "Akademie Trutnov",
    };

    const enrollments = data?.enrollments || [];
    const certificates = data?.certificates || [];
    const attendance = data?.attendance || [];

    // Calculate metrics
    const confirmedCount = enrollments.filter((e) => e.status === "CONFIRMED").length;
    const waitlistCount = enrollments.filter((e) => e.status === "WAITLIST").length;
    const avgAttendance =
      attendance.length > 0
        ? Math.round(attendance.reduce((acc, curr) => acc + curr.percentage, 0) / attendance.length)
        : 100;

    this.container.innerHTML = `
      <div class="space-y-6">
        <!-- Student Info Header -->
        <div class="card-box">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4]">
                    ${student.name}
                  </h2>
                  <span class="badge-chip badge-chip-blue font-mono text-xs">Student</span>
                </div>
                <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-0.5 flex flex-wrap items-center gap-3">
                  <span>${student.email}</span>
                  ${student.organization ? `<span class="opacity-80">• ${student.organization}</span>` : ""}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary-tw btn-sm-tw"
                onclick="document.dispatchEvent(new CustomEvent('akademie:switch-tab', { detail: { tab: 'courses' } }))"
              >
                Katalog kurzů
              </button>
            </div>
          </div>
        </div>

        <!-- KPI Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Aktivní přihlášky</div>
              <div class="text-xl font-bold font-mono tabular-nums text-[#4a3512] dark:text-[#faeed4] mt-0.5">${confirmedCount}</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Pořadník náhradníků</div>
              <div class="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">${waitlistCount}</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Průměrná docházka</div>
              <div class="text-xl font-bold font-mono tabular-nums ${avgAttendance >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"} mt-0.5">${avgAttendance} %</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Získaná osvědčení</div>
              <div class="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">${certificates.length}</div>
            </div>
          </div>
        </div>

        <!-- Enrollments Table -->
        <div class="table-box-wrap">
          <div class="table-box-header px-5 py-3.5 flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider font-display text-[#4a3512] dark:text-[#fce8bd]">
              Moje zapsané kurzy & termíny
            </h3>
            <span class="badge-chip badge-chip-slate font-mono text-xs">${enrollments.length} zápisů</span>
          </div>

          <div class="overflow-x-auto">
            <table class="table-tw">
              <thead>
                <tr>
                  <th>Vzdělávací program</th>
                  <th>Termín konání</th>
                  <th>Učebna</th>
                  <th>Stav přihlášky</th>
                  <th>Docházka</th>
                  <th class="text-right">Osvědčení</th>
                </tr>
              </thead>
              <tbody>
                ${
                  enrollments.length === 0
                    ? `<tr><td colspan="6" class="py-8 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">Zatím nemáte žádné aktivní přihlášky. Vyberte si kurz v katalogu!</td></tr>`
                    : enrollments
                        .map((enr) => {
                          const attItem = attendance.find((a) => a.termId === enr.termId);
                          const certItem = certificates.find(
                            (c) => c.courseTitle === enr.courseTitle
                          );

                          let statusBadge = "";
                          if (enr.status === "CONFIRMED") {
                            statusBadge =
                              '<span class="badge-chip badge-chip-green">Potvrzena</span>';
                          } else if (enr.status === "WAITLIST") {
                            statusBadge = `<span class="badge-chip badge-chip-amber">Náhradník #${enr.waitlistPosition || 1}</span>`;
                          } else if (enr.status === "COMPLETED") {
                            statusBadge =
                              '<span class="badge-chip badge-chip-blue">Absolvováno</span>';
                          } else {
                            statusBadge = `<span class="badge-chip badge-chip-slate">${enr.status}</span>`;
                          }

                          const pct = attItem ? attItem.percentage : 100;
                          const qualifies = pct >= 70;

                          return `
                            <tr>
                              <td class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">
                                ${enr.courseTitle}
                              </td>
                              <td class="font-mono text-xs text-[#5c4318] dark:text-[#e2d5b8]">
                                ${enr.startDate} až ${enr.endDate}
                              </td>
                              <td class="text-xs text-[#6e5223] dark:text-[#d1b88e]">
                                ${enr.classroomName || "Centrum Trutnov"}
                              </td>
                              <td>${statusBadge}</td>
                              <td>
                                <div class="flex items-center gap-1.5">
                                  <span class="font-mono font-bold text-xs tabular-nums ${qualifies ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700"}">
                                    ${pct}%
                                  </span>
                                  ${qualifies ? '<span class="text-xs text-emerald-600 font-medium">✓ Splněno (≥ 70 %)</span>' : '<span class="text-xs text-amber-600 font-medium">&lt; 70%</span>'}
                                </div>
                              </td>
                              <td class="text-right">
                                ${
                                  certItem
                                    ? `<button class="btn-student-cert-preview badge-chip badge-chip-blue font-mono text-xs cursor-pointer hover:border-amber-400 transition-colors" data-cert="${certItem.certificateNumber}">
                                        ${certItem.certificateNumber}
                                      </button>`
                                    : qualifies
                                      ? '<span class="text-xs text-[#8c6d3b] dark:text-[#c4a974]">Připraveno k vydání</span>'
                                      : '<span class="text-amber-600/50 text-xs font-mono">–</span>'
                                }
                              </td>
                            </tr>
                          `;
                        })
                        .join("")
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Issued Certificates Gallery -->
        ${
          certificates.length > 0
            ? `
          <div class="card-box">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#caa049]/40">
              <h3 class="text-xs font-bold uppercase tracking-wider font-display text-[#4a3512] dark:text-[#fce8bd]">
                Vydaná osvědčení o absolvování
              </h3>
              <span class="badge-chip badge-chip-green">MŠMT Akreditace</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${certificates
                .map(
                  (c) => `
                <div class="p-3.5 rounded-xl border border-[#caa049]/40 bg-[#fbf5e6]/80 dark:bg-[#1a1424] flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div class="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                      ${c.certificateNumber}
                    </div>
                    <div class="text-xs font-bold font-display text-[#4a3512] dark:text-[#faeed4] mt-0.5">
                      ${c.courseTitle}
                    </div>
                    <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-1 tabular-nums font-mono">
                      Vydáno: ${c.issueDate} • Docházka: ${c.attendanceRate}%
                    </div>
                  </div>
                  <button
                    class="btn-student-cert-preview btn-secondary-tw btn-sm-tw shrink-0"
                    data-cert="${c.certificateNumber}"
                  >
                    Náhled osvědčení
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  private async previewCertificate(code: string): Promise<void> {
    try {
      const allCerts = await certificatesApi.getAll();
      const cert = allCerts.find((c) => c.certificateNumber === code);
      if (!cert) {
        Toast.error(`Osvědčení s kódem ${code} nebylo nalezeno.`);
        return;
      }

      // Populate certificate preview modal
      const codeEl = document.getElementById("preview-cert-number");
      const nameEl = document.getElementById("preview-cert-student-name");
      const courseEl = document.getElementById("preview-cert-course-title");
      const dateEl = document.getElementById("preview-cert-date");
      const rateEl = document.getElementById("preview-cert-attendance-rate");
      const hoursEl = document.getElementById("preview-cert-hours");

      if (codeEl) codeEl.textContent = cert.certificateNumber;
      if (nameEl) nameEl.textContent = cert.studentName;
      if (courseEl) courseEl.textContent = cert.courseTitle;
      if (dateEl) dateEl.textContent = cert.issueDate;
      if (rateEl) rateEl.textContent = `${cert.attendanceRate}%`;
      if (hoursEl) hoursEl.textContent = "40";

      Modal.open("modal-certificate-preview");
    } catch {
      Toast.error("Chyba při otevírání náhledu osvědčení.");
    }
  }
}
