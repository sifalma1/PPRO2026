/**
 * Terms & Waitlist View - Akademie Trutnov
 * Manages course terms, capacity limits, segmented meters, waitlist queuing,
 * and student enrollments.
 */
import { CourseTerm, Enrollment, RegisteredStudent } from "../types";
import { termsApi, CreateTermPayload, CreateEnrollmentPayload } from "../api/termsApi";
import { coursesApi } from "../api/coursesApi";
import { dictionariesApi } from "../api/dictionariesApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { authApi } from "../api/authApi";

export class TermsView {
  private terms: CourseTerm[] = [];
  private selectedTermId: string | null = null;
  private enrollments: Enrollment[] = [];
  private cachedStudents: RegisteredStudent[] = [];

  private termsTableBody: HTMLElement | null = null;
  private termDetailBox: HTMLElement | null = null;
  private detailTermTitle: HTMLElement | null = null;
  private detailTermInfo: HTMLElement | null = null;
  private enrollmentsTableBody: HTMLElement | null = null;
  private kpiTermsCount: HTMLElement | null = null;
  private kpiWaitlistStatus: HTMLElement | null = null;

  private formTerm: HTMLFormElement | null = null;
  private formTermError: HTMLElement | null = null;
  private formEnrollment: HTMLFormElement | null = null;
  private formEnrollmentError: HTMLElement | null = null;
  private enrollmentTermNotice: HTMLElement | null = null;

  private onSwitchToAttendance?: (termId: string) => void;

  constructor(options?: { onSwitchToAttendance?: (termId: string) => void }) {
    this.onSwitchToAttendance = options?.onSwitchToAttendance;
  }

  public init(): void {
    this.termsTableBody = document.getElementById("terms-table-body");
    this.termDetailBox = document.getElementById("term-detail-box");
    this.detailTermTitle = document.getElementById("detail-term-title");
    this.detailTermInfo = document.getElementById("detail-term-info");
    this.enrollmentsTableBody = document.getElementById("enrollments-table-body");
    this.kpiTermsCount = document.getElementById("kpi-terms-count");
    this.kpiWaitlistStatus = document.getElementById("kpi-waitlist-status");

    this.formTerm = document.getElementById("form-term") as HTMLFormElement;
    this.formTermError = document.getElementById("form-term-error");
    this.formEnrollment = document.getElementById("form-enrollment") as HTMLFormElement;
    this.formEnrollmentError = document.getElementById("form-enrollment-error");
    this.enrollmentTermNotice = document.getElementById("enrollment-term-notice");

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    // Open create term modal
    const btnOpenCreateTerm = document.getElementById("btn-open-create-term");
    btnOpenCreateTerm?.addEventListener("click", async () => {
      await this.openCreateTermModal();
    });

    // Submit term form
    this.formTerm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleCreateTermSubmit();
    });

    // Open enrollment modal
    const btnOpenEnroll = document.getElementById("btn-open-enroll");
    btnOpenEnroll?.addEventListener("click", () => {
      this.openEnrollmentModal();
    });

    // Submit enrollment form
    this.formEnrollment?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleEnrollmentSubmit();
    });

    // Student selection dropdown for Admin
    const selectStudent = document.getElementById("select-existing-student") as HTMLSelectElement;
    selectStudent?.addEventListener("change", () => {
      const studentId = selectStudent.value;
      const firstNameInput = document.getElementById("student-first-name") as HTMLInputElement;
      const lastNameInput = document.getElementById("student-last-name") as HTMLInputElement;
      const emailInput = document.getElementById("student-email") as HTMLInputElement;
      const phoneInput = document.getElementById("student-phone") as HTMLInputElement;
      const orgInput = document.getElementById("student-organization") as HTMLInputElement;

      if (!studentId) {
        if (firstNameInput) firstNameInput.value = "";
        if (lastNameInput) lastNameInput.value = "";
        if (emailInput) emailInput.value = "";
        if (phoneInput) phoneInput.value = "";
        if (orgInput) orgInput.value = "";
        return;
      }

      const student = this.cachedStudents.find((s) => s.id === studentId);
      if (student) {
        if (firstNameInput) firstNameInput.value = student.firstName;
        if (lastNameInput) lastNameInput.value = student.lastName;
        if (emailInput) emailInput.value = student.email;
        if (phoneInput) phoneInput.value = student.phone || "";
        if (orgInput) orgInput.value = student.organization || "";
      }
    });

    // Listen for auth state changes
    document.addEventListener("akademie:auth-changed", () => {
      this.renderTerms();
      if (this.selectedTermId) {
        this.selectTerm(this.selectedTermId);
      }
    });
  }

  public async load(): Promise<void> {
    try {
      this.terms = await termsApi.getAll();

      // Update KPI
      if (this.kpiTermsCount) {
        this.kpiTermsCount.textContent = this.terms.length.toString();
      }
      const totalWaitlist = this.terms.reduce((acc, t) => acc + (t.waitlistCount || 0), 0);
      if (this.kpiWaitlistStatus) {
        this.kpiWaitlistStatus.textContent =
          totalWaitlist > 0
            ? `${totalWaitlist} náhradníků v pořadníku`
            : "Pořadník náhradníků prázdný";
      }

      this.renderTerms();

      if (this.selectedTermId) {
        await this.selectTerm(this.selectedTermId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst termíny kurzů.";
      Toast.error(msg);
    }
  }

  public getTerms(): CourseTerm[] {
    return this.terms;
  }

  public getSelectedTermId(): string | null {
    return this.selectedTermId;
  }

  private renderTerms(): void {
    const btnOpenCreateTerm = document.getElementById("btn-open-create-term");
    if (btnOpenCreateTerm) {
      btnOpenCreateTerm.style.display = authApi.isAdmin() ? "inline-flex" : "none";
    }

    if (!this.termsTableBody) return;
    this.termsTableBody.innerHTML = "";

    if (this.terms.length === 0) {
      this.termsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-10 text-amber-800/60 dark:text-amber-200/50 italic">
            Dosud nebyly vypsány žádné termíny kurzů.
          </td>
        </tr>
      `;
      return;
    }

    this.terms.forEach((term) => {
      const isFull = term.confirmedCount >= term.capacity;
      const isCompleted = term.status === "COMPLETED";

      let statusBadge = "";
      if (isCompleted) {
        statusBadge = '<span class="badge-chip badge-chip-blue">Ukončen</span>';
      } else if (isFull) {
        statusBadge = '<span class="badge-chip badge-chip-yellow">Kapacita plná</span>';
      } else {
        statusBadge = '<span class="badge-chip badge-chip-green">Volná místa</span>';
      }

      const lecturersList =
        term.lecturers && term.lecturers.length > 0
          ? term.lecturers.map((l) => l.name).join(", ")
          : "Nepřiřazen";

      const tr = document.createElement("tr");
      if (term.id === this.selectedTermId) {
        tr.classList.add("row-selected");
      }

      const fillPercentage = Math.min(100, Math.round((term.confirmedCount / term.capacity) * 100));

      tr.innerHTML = `
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${term.courseTitle}</div>
          <div class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] mt-0.5">ID: ${term.id.slice(0, 8)}...</div>
        </td>
        <td class="font-mono text-xs tabular-nums text-[#5c4318] dark:text-[#e2d5b8]">
          <span>${term.startDate}</span>
          <span class="text-amber-500/70 mx-1">→</span>
          <span>${term.endDate}</span>
        </td>
        <td class="text-xs text-[#5c4318] dark:text-[#e2d5b8]">
          <div class="font-medium">${term.classroomName || "Neuvedena"}</div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold tabular-nums ${isFull ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}">
              ${term.confirmedCount} / ${term.capacity}
            </span>
            <div class="w-20 forged-meter-track">
              <div
                class="h-full rounded-xs transition-all duration-300 ${isFull ? "bg-amber-500" : "bg-emerald-600"}"
                style="width: ${fillPercentage}%;"
              ></div>
            </div>
          </div>
          ${
            term.waitlistCount > 0
              ? `<div class="mt-1">
                  <span class="badge-chip badge-chip-yellow text-xs">
                    ${term.waitlistCount} ${term.waitlistCount === 1 ? "náhradník" : "náhradníci"} v pořadníku
                  </span>
                 </div>`
              : `<div class="text-xs text-[#8c6d3b] dark:text-[#c4a974] mt-0.5 font-mono tabular-nums">Volno: ${Math.max(0, term.capacity - term.confirmedCount)} míst</div>`
          }
        </td>
        <td class="text-xs text-[#6e5223] dark:text-[#d1b88e]">${lecturersList}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="inline-flex items-center gap-1.5">
            <button
              class="btn-secondary-tw btn-sm-tw btn-view-term"
              data-id="${term.id}"
              title="Zobrazit detail termínu"
            >
              ${authApi.isAdmin() ? `Přihlášky (${term.confirmedCount + term.waitlistCount})` : `Detail & Zápis`}
            </button>
            ${
              authApi.isAdmin()
                ? `<button
                    class="btn-ghost-tw btn-sm-tw btn-jump-attendance text-emerald-700 dark:text-emerald-400"
                    data-id="${term.id}"
                    title="Přejít do evidence docházky pro tento termín"
                  >
                    Docházka
                  </button>`
                : ""
            }
          </div>
        </td>
      `;

      const viewBtn = tr.querySelector(".btn-view-term");
      viewBtn?.addEventListener("click", () => this.selectTerm(term.id));

      const attBtn = tr.querySelector(".btn-jump-attendance");
      attBtn?.addEventListener("click", () => {
        if (this.onSwitchToAttendance) {
          this.onSwitchToAttendance(term.id);
        } else {
          document.dispatchEvent(
            new CustomEvent("akademie:switch-tab", {
              detail: { tab: "attendance", termId: term.id },
            })
          );
        }
      });

      this.termsTableBody?.appendChild(tr);
    });
  }

  public async selectTerm(termId: string): Promise<void> {
    this.selectedTermId = termId;
    this.renderTerms();

    const term = this.terms.find((t) => t.id === termId);
    if (!term) return;

    if (this.termDetailBox) this.termDetailBox.style.display = "block";

    const btnOpenEnroll = document.getElementById("btn-open-enroll");
    if (btnOpenEnroll) {
      if (authApi.isAdmin()) {
        btnOpenEnroll.innerHTML = `
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Zapsat studenta (Admin)
        `;
      } else {
        btnOpenEnroll.innerHTML = `
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Přihlásit se na termín
        `;
      }
    }

    if (this.detailTermTitle) {
      if (authApi.isAdmin()) {
        this.detailTermTitle.textContent = `Evidence přihlášek a pořadník: ${term.courseTitle}`;
      } else if (authApi.isStudent()) {
        this.detailTermTitle.textContent = `Detail termínu a má účast: ${term.courseTitle}`;
      } else {
        this.detailTermTitle.textContent = `Veřejný přehled termínu: ${term.courseTitle}`;
      }
    }
    if (this.detailTermInfo) {
      this.detailTermInfo.innerHTML = `
        Termín: <strong class="font-mono text-[#4a3512] dark:text-[#faeed4]">${term.startDate} až ${term.endDate}</strong> •
        Učebna: <strong class="text-[#4a3512] dark:text-[#faeed4]">${term.classroomName}</strong> •
        Obsazenost: <strong class="font-mono text-[#4a3512] dark:text-[#faeed4]">${term.confirmedCount} / ${term.capacity} míst</strong>
        ${term.waitlistCount > 0 ? ` • (<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono">${term.waitlistCount} v pořadníku</span>)` : ""}
      `;
    }

    try {
      this.enrollments = await termsApi.getEnrollments(termId);
      this.renderEnrollments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst přihlášky k termínu.";
      Toast.error(msg);
    }
  }

  private renderEnrollments(): void {
    const adminHint = document.getElementById("term-detail-admin-hint");
    const adminTableWrap = document.getElementById("term-enrollments-table-wrap");
    const publicViewWrap = document.getElementById("term-public-view-wrap");

    const term = this.terms.find((t) => t.id === this.selectedTermId);
    if (!term) return;

    const isAdmin = authApi.isAdmin();
    const isStudent = authApi.isStudent();
    const currentUser = authApi.getUser();

    if (isAdmin) {
      // 1. ADMIN VIEW: Full student roster with contact details, notes, and cancel buttons
      if (adminHint) adminHint.classList.remove("hidden");
      if (adminTableWrap) adminTableWrap.classList.remove("hidden");
      if (publicViewWrap) publicViewWrap.classList.add("hidden");

      if (!this.enrollmentsTableBody) return;
      this.enrollmentsTableBody.innerHTML = "";

      if (this.enrollments.length === 0) {
        this.enrollmentsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
              Na tento termín se zatím nikdo nepřihlásil. Použijte tlačítko "Zapsat studenta (Admin)" výše.
            </td>
          </tr>
        `;
        return;
      }

      this.enrollments.forEach((enr) => {
        let statusHtml = "";
        if (enr.status === "CONFIRMED") {
          statusHtml = '<span class="badge-chip badge-chip-green">Potvrzeno</span>';
        } else if (enr.status === "WAITLIST") {
          statusHtml = `<span class="badge-chip badge-chip-yellow">Náhradník #${enr.waitlistPosition || 1}</span>`;
        } else if (enr.status === "CANCELLED") {
          statusHtml = '<span class="badge-chip badge-chip-red">Zrušeno</span>';
        } else if (enr.status === "COMPLETED") {
          statusHtml = '<span class="badge-chip badge-chip-blue">Absolvováno</span>';
        }

        const dateStr = new Date(enr.submittedAt).toLocaleString("cs-CZ", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const canCancel = enr.status === "CONFIRMED" || enr.status === "WAITLIST";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${enr.studentName}</div>
            ${enr.note ? `<div class="text-xs text-[#8c6d3b] dark:text-[#c4a974] mt-0.5 truncate max-w-xs font-mono">Pozn.: ${enr.note}</div>` : ""}
          </td>
          <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e]">${enr.studentEmail || "-"}</td>
          <td class="text-xs">
            <div class="font-mono text-[#5c4318] dark:text-[#e2d5b8] tabular-nums">${enr.studentPhone || "-"}</div>
            ${enr.studentOrganization ? `<div class="text-xs text-[#8c6d3b] dark:text-[#c4a974]">${enr.studentOrganization}</div>` : ""}
          </td>
          <td class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] tabular-nums">${dateStr}</td>
          <td>${statusHtml}</td>
          <td class="text-right">
            ${
              canCancel
                ? `<button class="btn-ghost-tw btn-sm-tw btn-cancel-enroll text-rose-700 dark:text-rose-400 hover:bg-rose-900/15" data-id="${enr.id}">
                    Zrušit účast
                   </button>`
                : '<span class="text-amber-600/50 text-xs font-mono">-</span>'
            }
          </td>
        `;

        const cancelBtn = tr.querySelector(".btn-cancel-enroll");
        cancelBtn?.addEventListener("click", () => this.handleCancelEnrollment(enr));

        this.enrollmentsTableBody?.appendChild(tr);
      });
      return;
    }

    // 2. NON-ADMIN (Student or Anonymous Visitor): Hide private table, show privacy-compliant card
    if (adminHint) adminHint.classList.add("hidden");
    if (adminTableWrap) adminTableWrap.classList.add("hidden");
    if (publicViewWrap) publicViewWrap.classList.remove("hidden");

    if (isStudent && currentUser) {
      // Logged in student: check if student has registration on this term
      const studentEmail = (currentUser.email || "").toLowerCase();
      const studentId = currentUser.studentId;
      const myEnrollment = this.enrollments.find((e) => {
        return (
          (studentId && e.studentId === studentId) ||
          (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail)
        );
      });

      if (myEnrollment) {
        const isConfirmed = myEnrollment.status === "CONFIRMED";
        const isWaitlist = myEnrollment.status === "WAITLIST";
        const isCancelled = myEnrollment.status === "CANCELLED";
        const isCompleted = myEnrollment.status === "COMPLETED";

        let myBadge = "";
        if (isConfirmed) {
          myBadge =
            '<span class="badge-chip badge-chip-green text-sm px-2.5 py-1">Potvrzená registrace (Místo zajištěno)</span>';
        } else if (isWaitlist) {
          myBadge = `<span class="badge-chip badge-chip-yellow text-sm px-2.5 py-1">V pořadníku náhradníků (Pozice #${myEnrollment.waitlistPosition || 1})</span>`;
        } else if (isCancelled) {
          myBadge =
            '<span class="badge-chip badge-chip-red text-sm px-2.5 py-1">Vaše účast byla zrušena</span>';
        } else if (isCompleted) {
          myBadge =
            '<span class="badge-chip badge-chip-blue text-sm px-2.5 py-1">Kurz byl úspěšně absolvován</span>';
        }

        const dateStr = new Date(myEnrollment.submittedAt).toLocaleDateString("cs-CZ");
        const canCancel = isConfirmed || isWaitlist;

        if (publicViewWrap) {
          publicViewWrap.innerHTML = `
            <div class="card-box border border-[#caa049]/40 p-5 rounded-xl bg-[#fdfaf2] dark:bg-[#1a130d] shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#caa049]/20">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wider text-[#8c6d3b] dark:text-[#caa049]">Vaše přihláška na termín</div>
                  <h4 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mt-0.5">${term.courseTitle}</h4>
                </div>
                <div>${myBadge}</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Harmonogram výuky</div>
                  <div class="font-mono font-bold text-[#4a3512] dark:text-[#faeed4] mt-0.5">${term.startDate} až ${term.endDate}</div>
                </div>
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Učebna Trutnov</div>
                  <div class="font-bold text-[#4a3512] dark:text-[#faeed4] mt-0.5">${term.classroomName}</div>
                </div>
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Datum přihlášení</div>
                  <div class="font-mono text-[#4a3512] dark:text-[#faeed4] mt-0.5">${dateStr}</div>
                </div>
              </div>
              ${
                canCancel
                  ? `<div class="flex items-center justify-between pt-3 border-t border-[#caa049]/20">
                      <span class="text-xs text-[#7c5e2d] dark:text-[#c4a974]">V případě změny plánů můžete svou účast odvolat.</span>
                      <button id="btn-cancel-my-enrollment" class="btn-ghost-tw btn-sm-tw text-rose-700 dark:text-rose-400 hover:bg-rose-900/15">
                        Zrušit mou účast na termínu
                      </button>
                    </div>`
                  : ""
              }
            </div>
          `;

          const cancelMyBtn = publicViewWrap.querySelector("#btn-cancel-my-enrollment");
          cancelMyBtn?.addEventListener("click", () => this.handleCancelEnrollment(myEnrollment));
        }
        return;
      }
    }

    // Student NOT enrolled OR Anonymous Visitor
    const isFull = term.confirmedCount >= term.capacity;
    const vacancies = Math.max(0, term.capacity - term.confirmedCount);

    if (publicViewWrap) {
      publicViewWrap.innerHTML = `
        <div class="card-box border border-[#caa049]/40 p-6 rounded-xl bg-[#fdfaf2] dark:bg-[#1a130d] text-center max-w-2xl mx-auto shadow-sm">
          <h4 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mb-1">
            Obsazenost kurzu: ${term.courseTitle}
          </h4>
          <p class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mb-4">
            Termín: <strong>${term.startDate} až ${term.endDate}</strong> • Místo: <strong>${term.classroomName}</strong>
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 max-w-md mx-auto text-left">
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Kapacita</div>
              <div class="text-lg font-bold font-mono text-[#4a3512] dark:text-[#faeed4]">${term.capacity} míst</div>
            </div>
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Potvrzeno</div>
              <div class="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">${term.confirmedCount} studentů</div>
            </div>
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30 col-span-2 sm:col-span-1">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Stav míst</div>
              <div class="text-sm font-bold ${isFull ? "text-amber-600 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"} mt-1">
                ${isFull ? `Plno (${term.waitlistCount} náhradníků)` : `Volno (${vacancies} míst)`}
              </div>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/20 text-xs text-[#6e4e1b] dark:text-[#faeed4] mb-5">
            Z důvodu ochrany osobních údajů (GDPR) je kompletní jmenný seznam přihlášených účastníků a docházka přístupná pouze administrátorům centra.
          </div>

          <button id="btn-public-enroll-cta" class="btn-primary-tw inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Přihlásit se na tento termín
          </button>
        </div>
      `;

      const ctaBtn = publicViewWrap.querySelector("#btn-public-enroll-cta");
      ctaBtn?.addEventListener("click", () => this.openEnrollmentModal());
    }
  }

  private async handleCancelEnrollment(enr: Enrollment): Promise<void> {
    const currentUser = authApi.getUser();
    const isAdmin = authApi.isAdmin();
    const isOwn =
      currentUser &&
      ((currentUser.studentId && enr.studentId === currentUser.studentId) ||
        (currentUser.email &&
          enr.studentEmail &&
          currentUser.email.toLowerCase() === enr.studentEmail.toLowerCase()));

    if (!isAdmin && !isOwn) {
      Toast.error(
        "Nemáte oprávnění zrušit tuto přihlášku. Můžete zrušit pouze svou vlastní účast."
      );
      return;
    }

    const isConfirmedSpot = enr.status === "CONFIRMED";
    const promptMsg = isConfirmedSpot
      ? `Opravdu chcete zrušit účast studenta ${enr.studentName}?\n\nZrušením se uvolní místo a první náhradník z pořadníku bude automaticky povýšen na potvrzeného!`
      : `Opravdu chcete odebrat studenta ${enr.studentName} z pořadníku náhradníků?`;

    const confirmed = window.confirm(promptMsg);
    if (!confirmed) return;

    try {
      const res = await termsApi.cancelEnrollment(enr.id);
      Toast.success(res.message);
      await this.load();
      if (this.selectedTermId) {
        await this.selectTerm(this.selectedTermId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se zrušit přihlášku.";
      Toast.error(msg);
    }
  }

  public async openCreateTermModal(preselectedCourseId?: string): Promise<void> {
    if (!authApi.isAdmin()) {
      Toast.info("Pro vypsání nového termínu se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    if (this.formTerm) this.formTerm.reset();
    if (this.formTermError) this.formTermError.style.display = "none";

    try {
      const [courses, classrooms, lecturers] = await Promise.all([
        coursesApi.getAll(),
        dictionariesApi.getClassrooms(),
        dictionariesApi.getLecturers(),
      ]);

      const courseSelect = document.getElementById("term-course-select") as HTMLSelectElement;
      if (courseSelect) {
        courseSelect.innerHTML =
          `<option value="">-- Zvolte vzdělávací program --</option>` +
          courses
            .map(
              (c) =>
                `<option value="${c.id}" ${c.id === preselectedCourseId ? "selected" : ""}>${c.title} (${c.hours} hod. – ${c.isAccredited ? "MŠMT" : "Firemní"})</option>`
            )
            .join("");
      }

      const classSelect = document.getElementById("term-classroom-select") as HTMLSelectElement;
      if (classSelect) {
        classSelect.innerHTML =
          `<option value="">-- Vyberte učebnu v Trutnově --</option>` +
          classrooms
            .map(
              (cr) => `<option value="${cr.id}">${cr.name} (kapacita ${cr.capacity} míst)</option>`
            )
            .join("");
      }

      const lectSelect = document.getElementById("term-lecturer-select") as HTMLSelectElement;
      if (lectSelect) {
        lectSelect.innerHTML =
          `<option value="">-- Zvolte garanta kurzu --</option>` +
          lecturers
            .map(
              (l) => `<option value="${l.id}">${l.name} (${l.specialization || "Lektor"})</option>`
            )
            .join("");
      }

      Modal.open("modal-term");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Chyba při přípravě formuláře termínu.";
      Toast.error(msg);
    }
  }

  private async handleCreateTermSubmit(): Promise<void> {
    if (!this.formTerm) return;
    if (this.formTermError) this.formTermError.style.display = "none";

    const courseId = (document.getElementById("term-course-select") as HTMLSelectElement).value;
    const classroomId =
      (document.getElementById("term-classroom-select") as HTMLSelectElement).value || undefined;
    const startDate = (document.getElementById("term-start-date") as HTMLInputElement).value;
    const endDate = (document.getElementById("term-end-date") as HTMLInputElement).value;
    const capacity = parseInt(
      (document.getElementById("term-capacity") as HTMLInputElement).value,
      10
    );
    const lecturerId =
      (document.getElementById("term-lecturer-select") as HTMLSelectElement).value || undefined;

    const payload: CreateTermPayload = {
      courseId,
      classroomId,
      startDate,
      endDate,
      capacity,
      lecturerIds: lecturerId ? [lecturerId] : [],
    };

    try {
      await termsApi.create(payload);
      Toast.success("Nový termín kurzu byl úspěšně vypsán.");
      Modal.close("modal-term");
      await this.load();
    } catch (err: unknown) {
      if (this.formTermError) {
        const msg = err instanceof Error ? err.message : "Chyba při vytváření termínu.";
        this.formTermError.textContent = msg;
        this.formTermError.style.display = "block";
      }
    }
  }

  private openEnrollmentModal(): void {
    if (!this.selectedTermId) {
      Toast.warning("Nejprve vyberte termín ze seznamu.");
      return;
    }

    if (!authApi.isAuthenticated()) {
      Toast.info(
        "Pro přihlášení na kurz se prosím nejprve přihlaste jako student nebo administrátor."
      );
      Modal.open("modal-login");
      return;
    }

    const term = this.terms.find((t) => t.id === this.selectedTermId);
    if (!term) return;

    if (this.formEnrollment) this.formEnrollment.reset();
    if (this.formEnrollmentError) this.formEnrollmentError.style.display = "none";

    const adminSelectWrap = document.getElementById("admin-student-select-wrap");
    const selectStudent = document.getElementById("select-existing-student") as HTMLSelectElement;

    if (authApi.isAdmin()) {
      if (adminSelectWrap) adminSelectWrap.classList.remove("hidden");
      this.loadStudentsForAdmin(selectStudent);
    } else {
      if (adminSelectWrap) adminSelectWrap.classList.add("hidden");
    }

    const termIdInput = document.getElementById("enrollment-term-id") as HTMLInputElement;
    if (termIdInput) termIdInput.value = this.selectedTermId;

    const firstNameInput = document.getElementById("student-first-name") as HTMLInputElement;
    const lastNameInput = document.getElementById("student-last-name") as HTMLInputElement;
    const emailInput = document.getElementById("student-email") as HTMLInputElement;
    const currentUser = authApi.getUser();

    if (authApi.isStudent() && currentUser) {
      const parts = (currentUser.name || "").trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      if (firstNameInput) {
        firstNameInput.value = firstName;
        firstNameInput.readOnly = true;
        firstNameInput.classList.add("bg-amber-100/30", "cursor-not-allowed");
      }
      if (lastNameInput) {
        lastNameInput.value = lastName;
        lastNameInput.readOnly = true;
        lastNameInput.classList.add("bg-amber-100/30", "cursor-not-allowed");
      }
      if (emailInput) {
        emailInput.value = currentUser.email || "";
        emailInput.readOnly = true;
        emailInput.classList.add("bg-amber-100/30", "cursor-not-allowed");
      }
    } else {
      if (firstNameInput) {
        firstNameInput.readOnly = false;
        firstNameInput.classList.remove("bg-amber-100/30", "cursor-not-allowed");
      }
      if (lastNameInput) {
        lastNameInput.readOnly = false;
        lastNameInput.classList.remove("bg-amber-100/30", "cursor-not-allowed");
      }
      if (emailInput) {
        emailInput.readOnly = false;
        emailInput.classList.remove("bg-amber-100/30", "cursor-not-allowed");
      }
    }

    if (this.enrollmentTermNotice) {
      const isFull = term.confirmedCount >= term.capacity;
      const studentNote =
        authApi.isStudent() && currentUser
          ? `<div class="mt-2 pt-2 border-t border-amber-300/40 text-xs font-semibold text-[#5c4318] dark:text-[#fce8bd]">
              Přihlašujete se pod ověřeným profilem: <strong>${currentUser.name}</strong> (${currentUser.email})
             </div>`
          : "";

      this.enrollmentTermNotice.innerHTML = `
        <div class="p-2.5 rounded-lg ${isFull ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300" : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"} text-xs mb-3">
          <strong>${term.courseTitle}</strong> (${term.startDate} až ${term.endDate})<br/>
          Obsazeno: ${term.confirmedCount} z ${term.capacity} míst.
          ${
            isFull
              ? `<span class="block mt-1 font-semibold text-amber-900 dark:text-amber-200">Kapacita termínu je naplněna! Budete zařazen(a) do pořadníku na pozici Náhradník #${term.waitlistCount + 1}.</span>`
              : '<span class="block mt-1 text-emerald-900 dark:text-emerald-200">Na termínu jsou volná místa – registrace bude POTVRZENA.</span>'
          }
          ${studentNote}
        </div>
      `;
    }

    Modal.open("modal-enrollment");
  }

  private async loadStudentsForAdmin(selectElement: HTMLSelectElement | null): Promise<void> {
    if (!selectElement) return;
    try {
      if (this.cachedStudents.length === 0) {
        this.cachedStudents = await dictionariesApi.getStudents();
      }
      selectElement.innerHTML = `
        <option value="">-- Nový student (vyplnit ručně) --</option>
        ${this.cachedStudents
          .map(
            (s) =>
              `<option value="${s.id}">${s.firstName} ${s.lastName} (${s.email}${s.organization ? ` – ${s.organization}` : ""})</option>`
          )
          .join("")}
      `;
      selectElement.value = "";
    } catch {
      // Fallback silently if student dictionary endpoint fails
    }
  }

  private async handleEnrollmentSubmit(): Promise<void> {
    if (!this.selectedTermId || !this.formEnrollment) return;
    if (this.formEnrollmentError) this.formEnrollmentError.style.display = "none";

    const firstName = (
      document.getElementById("student-first-name") as HTMLInputElement
    ).value.trim();
    const lastName = (
      document.getElementById("student-last-name") as HTMLInputElement
    ).value.trim();
    const email = (document.getElementById("student-email") as HTMLInputElement).value.trim();
    const phone = (document.getElementById("student-phone") as HTMLInputElement).value.trim();
    const organization = (
      document.getElementById("student-organization") as HTMLInputElement
    ).value.trim();
    const note = (document.getElementById("student-note") as HTMLInputElement).value.trim();

    const payload: CreateEnrollmentPayload = {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      organization: organization || undefined,
      note: note || undefined,
    };

    try {
      const result = await termsApi.createEnrollment(this.selectedTermId, payload);
      const isConfirmed = result.status === "CONFIRMED";
      if (isConfirmed) {
        Toast.success(`Student ${firstName} ${lastName} byl úspěšně zaregistrován na termín.`);
      } else {
        Toast.warning(
          `Kapacita termínu byla plná. Student ${firstName} ${lastName} byl zařazen do pořadníku na pozici Náhradník #${result.waitlistPosition}.`
        );
      }

      Modal.close("modal-enrollment");
      await this.load();
    } catch (err: unknown) {
      if (this.formEnrollmentError) {
        const msg = err instanceof Error ? err.message : "Chyba při podávání přihlášky.";
        this.formEnrollmentError.textContent = msg;
        this.formEnrollmentError.style.display = "block";
      }
    }
  }
}
