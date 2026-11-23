/**
 * Terms & Waitlist View - Akademie Trutnov
 * Manages course terms, capacity limits, segmented meters, waitlist queuing (ADR-02),
 * and student enrollments.
 */
import { CourseTerm, Enrollment } from "../types";
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

    // Listen for auth state changes
    document.addEventListener("akademie:auth-changed", () => {
      this.renderTerms();
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
              title="Zobrazit detail přihlášek a pořadník náhradníků"
            >
              Přihlášky (${term.confirmedCount + term.waitlistCount})
            </button>
            <button
              class="btn-ghost-tw btn-sm-tw btn-jump-attendance text-emerald-700 dark:text-emerald-400"
              data-id="${term.id}"
              title="Přejít do evidence docházky pro tento termín"
            >
              Docházka
            </button>
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
    if (this.detailTermTitle) {
      this.detailTermTitle.textContent = `Přihlášky a pořadník: ${term.courseTitle}`;
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
    if (!this.enrollmentsTableBody) return;
    this.enrollmentsTableBody.innerHTML = "";

    if (this.enrollments.length === 0) {
      this.enrollmentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            Na tento termín se zatím nikdo nepřihlásil. Použijte tlačítko "Zaregistrovat studenta" výše.
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
        <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e]">${enr.studentEmail}</td>
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
  }

  private async handleCancelEnrollment(enr: Enrollment): Promise<void> {
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

    const term = this.terms.find((t) => t.id === this.selectedTermId);
    if (!term) return;

    if (this.formEnrollment) this.formEnrollment.reset();
    if (this.formEnrollmentError) this.formEnrollmentError.style.display = "none";

    const termIdInput = document.getElementById("enrollment-term-id") as HTMLInputElement;
    if (termIdInput) termIdInput.value = this.selectedTermId;

    if (this.enrollmentTermNotice) {
      const isFull = term.confirmedCount >= term.capacity;
      this.enrollmentTermNotice.innerHTML = `
        <div class="p-2.5 rounded-lg ${isFull ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300" : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"} text-xs mb-3">
          <strong>${term.courseTitle}</strong> (${term.startDate} až ${term.endDate})<br/>
          Obsazeno: ${term.confirmedCount} z ${term.capacity} míst.
          ${
            isFull
              ? `<span class="block mt-1 font-semibold text-amber-900 dark:text-amber-200">Kapacita termínu je naplněna! Student bude automaticky zařazen do pořadníku na pozici Náhradník #${term.waitlistCount + 1}.</span>`
              : '<span class="block mt-1 text-emerald-900 dark:text-emerald-200">Na termínu jsou volná místa – student bude zaregistrován jako POTVRZENÝ.</span>'
          }
        </div>
      `;
    }

    Modal.open("modal-enrollment");
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
