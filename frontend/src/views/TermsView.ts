/**
 * Terms & Waitlist View
 * Manages course terms, capacity enforcement, student enrollments and waitlist promotion (ADR-02)
 */
import { CourseTerm, Enrollment } from "../types";
import { termsApi, CreateTermPayload, CreateEnrollmentPayload } from "../api/termsApi";
import { coursesApi } from "../api/coursesApi";
import { dictionariesApi } from "../api/dictionariesApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class TermsView {
  private terms: CourseTerm[] = [];
  private selectedTermId: string | null = null;
  private enrollments: Enrollment[] = [];

  private termsTableBody: HTMLElement | null = null;
  private termDetailBox: HTMLElement | null = null;
  private detailTermTitle: HTMLElement | null = null;
  private detailTermInfo: HTMLElement | null = null;
  private enrollmentsTableBody: HTMLElement | null = null;

  private formTerm: HTMLFormElement | null = null;
  private formTermError: HTMLElement | null = null;
  private formEnrollment: HTMLFormElement | null = null;
  private formEnrollmentError: HTMLElement | null = null;
  private enrollmentTermNotice: HTMLElement | null = null;

  public init(): void {
    this.termsTableBody = document.getElementById("terms-table-body");
    this.termDetailBox = document.getElementById("term-detail-box");
    this.detailTermTitle = document.getElementById("detail-term-title");
    this.detailTermInfo = document.getElementById("detail-term-info");
    this.enrollmentsTableBody = document.getElementById("enrollments-table-body");

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
  }

  public async load(): Promise<void> {
    try {
      this.terms = await termsApi.getAll();
      this.renderTerms();

      if (this.selectedTermId) {
        await this.selectTerm(this.selectedTermId);
      }
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst termíny kurzů.");
    }
  }

  public getTerms(): CourseTerm[] {
    return this.terms;
  }

  public getSelectedTermId(): string | null {
    return this.selectedTermId;
  }

  private renderTerms(): void {
    if (!this.termsTableBody) return;
    this.termsTableBody.innerHTML = "";

    if (this.terms.length === 0) {
      this.termsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-10 text-slate-400">
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
        statusBadge = '<span class="badge-chip badge-chip-yellow">Kapacita naplněna</span>';
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

      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${term.courseTitle}</td>
        <td class="text-xs">${term.startDate} až ${term.endDate}</td>
        <td class="text-xs text-slate-600 dark:text-slate-300">${term.classroomName || "Neuvedena"}</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900 dark:text-white">${term.confirmedCount} / ${term.capacity}</span>
            <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div class="h-full ${isFull ? "bg-amber-500" : "bg-blue-600"} rounded-full" style="width: ${Math.min(100, Math.round((term.confirmedCount / term.capacity) * 100))}%;"></div>
            </div>
          </div>
          ${
            term.waitlistCount > 0
              ? `<div class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">${term.waitlistCount} v pořadníku</div>`
              : ""
          }
        </td>
        <td class="text-xs text-slate-500 dark:text-slate-400">${lecturersList}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-view-term" data-id="${term.id}">
            Detail & Přihlášky
          </button>
        </td>
      `;

      const viewBtn = tr.querySelector(".btn-view-term");
      viewBtn?.addEventListener("click", () => this.selectTerm(term.id));

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
      this.detailTermInfo.textContent = `Termín: ${term.startDate} až ${term.endDate} • Učebna: ${term.classroomName} • Obsazenost: ${term.confirmedCount} / ${term.capacity} míst (V pořadníku: ${term.waitlistCount})`;
    }

    try {
      this.enrollments = await termsApi.getEnrollments(termId);
      this.renderEnrollments();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst přihlášky k termínu.");
    }
  }

  private renderEnrollments(): void {
    if (!this.enrollmentsTableBody) return;
    this.enrollmentsTableBody.innerHTML = "";

    if (this.enrollments.length === 0) {
      this.enrollmentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            Na tento termín se zatím nikdo nepřihlásil.
          </td>
        </tr>
      `;
      return;
    }

    this.enrollments.forEach((enr) => {
      let statusHtml = "";
      if (enr.status === "CONFIRMED") {
        statusHtml = '<span class="badge-chip badge-chip-green font-medium">Potvrzeno</span>';
      } else if (enr.status === "WAITLIST") {
        statusHtml = `<span class="badge-chip badge-chip-yellow font-medium">Náhradník #${enr.waitlistPosition || 1}</span>`;
      } else if (enr.status === "CANCELLED") {
        statusHtml = '<span class="badge-chip badge-chip-red font-medium">Zrušeno</span>';
      } else if (enr.status === "COMPLETED") {
        statusHtml = '<span class="badge-chip badge-chip-blue font-medium">Absolvováno</span>';
      }

      const dateStr = new Date(enr.submittedAt).toLocaleString("cs-CZ", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const canCancel = enr.status === "CONFIRMED" || enr.status === "WAITLIST";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${enr.studentName}</td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${enr.studentEmail}</td>
        <td class="text-xs">${enr.studentPhone || "-"} ${enr.studentOrganization ? `<span class="text-slate-400">(${enr.studentOrganization})</span>` : ""}</td>
        <td class="text-xs text-slate-500">${dateStr}</td>
        <td>${statusHtml}</td>
        <td class="text-right">
          ${
            canCancel
              ? `<button class="btn-danger-tw btn-sm-tw btn-cancel-enroll" data-id="${enr.id}">Zrušit účast</button>`
              : '<span class="text-slate-400 text-xs">-</span>'
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
      ? `Opravdu chcete zrušit účast studenta ${enr.studentName}? Zrušením se uvolní místo a první náhradník z pořadníku bude automaticky povýšen na potvrzeného!`
      : `Opravdu chcete odebrat studenta ${enr.studentName} z pořadníku náhradníků?`;

    const confirmed = window.confirm(promptMsg);
    if (!confirmed) return;

    try {
      const res = await termsApi.cancelEnrollment(enr.id);
      Toast.success(res.message);
      await this.load();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se zrušit přihlášku.");
    }
  }

  private async openCreateTermModal(): Promise<void> {
    if (this.formTerm) this.formTerm.reset();
    if (this.formTermError) this.formTermError.style.display = "none";

    try {
      const [courses, classrooms, lecturers] = await Promise.all([
        coursesApi.getAll(),
        dictionariesApi.getClassrooms(),
        dictionariesApi.getLecturers(),
      ]);

      const courseSelect = document.getElementById("term-course-select") as HTMLSelectElement;
      const roomSelect = document.getElementById("term-classroom-select") as HTMLSelectElement;
      const lectSelect = document.getElementById("term-lecturer-select") as HTMLSelectElement;

      if (courseSelect) {
        courseSelect.innerHTML = courses
          .map(
            (c) =>
              `<option value="${c.id}">${c.title} (${c.hours}h • ${Number(c.price).toLocaleString("cs-CZ")} Kč)</option>`
          )
          .join("");
      }

      if (roomSelect) {
        roomSelect.innerHTML =
          `<option value="">-- Bez učebny (bude upřesněno) --</option>` +
          classrooms
            .map((r) => `<option value="${r.id}">${r.name} (kapacita ${r.capacity})</option>`)
            .join("");
      }

      if (lectSelect) {
        lectSelect.innerHTML =
          `<option value="">-- Zvolte lektora --</option>` +
          lecturers
            .map(
              (l) => `<option value="${l.id}">${l.name} (${l.specialization || "Lektor"})</option>`
            )
            .join("");
      }

      Modal.open("modal-term");
    } catch (err: any) {
      Toast.error("Nepodařilo se načíst číselníky pro vypsání termínu.");
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
    const lectId = (document.getElementById("term-lecturer-select") as HTMLSelectElement).value;

    const payload: CreateTermPayload = {
      courseId,
      classroomId,
      startDate,
      endDate,
      capacity,
      lecturerIds: lectId ? [lectId] : undefined,
    };

    try {
      await termsApi.create(payload);
      Toast.success("Nový termín kurzu byl úspěšně vypsán.");
      Modal.close("modal-term");
      await this.load();
    } catch (err: any) {
      if (this.formTermError) {
        this.formTermError.textContent = err.message || "Chyba při vypisování termínu.";
        this.formTermError.style.display = "block";
      }
    }
  }

  private openEnrollmentModal(): void {
    if (!this.selectedTermId) {
      Toast.warning("Nejprve vyberte termín ze seznamu výše.");
      return;
    }

    const term = this.terms.find((t) => t.id === this.selectedTermId);
    if (!term) return;

    if (this.formEnrollment) this.formEnrollment.reset();
    if (this.formEnrollmentError) this.formEnrollmentError.style.display = "none";

    const hiddenId = document.getElementById("enrollment-term-id") as HTMLInputElement;
    if (hiddenId) hiddenId.value = term.id;

    const isFull = term.confirmedCount >= term.capacity;
    if (this.enrollmentTermNotice) {
      this.enrollmentTermNotice.innerHTML = `
        <div class="font-bold text-slate-900 dark:text-white mb-0.5">Termín: ${term.courseTitle}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Období: ${term.startDate} až ${term.endDate} • Obsazeno ${term.confirmedCount} z ${term.capacity} míst</div>
        ${
          isFull
            ? `<div class="p-2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                ⚠️ Kapacita kurzu je plně obsazena! Student bude zařazen jako náhradník #${term.waitlistCount + 1} do pořadníku (ADR-02).
               </div>`
            : `<div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                ✓ Volná místa k dispozici – student získá ihned potvrzené místo v kurzu.
               </div>`
        }
      `;
    }

    Modal.open("modal-enrollment");
  }

  private async handleEnrollmentSubmit(): Promise<void> {
    if (!this.selectedTermId || !this.formEnrollment) return;
    if (this.formEnrollmentError) this.formEnrollmentError.style.display = "none";

    const payload: CreateEnrollmentPayload = {
      firstName: (document.getElementById("student-first-name") as HTMLInputElement).value.trim(),
      lastName: (document.getElementById("student-last-name") as HTMLInputElement).value.trim(),
      email: (document.getElementById("student-email") as HTMLInputElement).value.trim(),
      phone:
        (document.getElementById("student-phone") as HTMLInputElement).value.trim() || undefined,
      organization:
        (document.getElementById("student-organization") as HTMLInputElement).value.trim() ||
        undefined,
      note: (document.getElementById("student-note") as HTMLInputElement).value.trim() || undefined,
    };

    try {
      const res = await termsApi.createEnrollment(this.selectedTermId, payload);
      Toast.success(res.message);
      Modal.close("modal-enrollment");
      await this.load();
    } catch (err: any) {
      if (this.formEnrollmentError) {
        this.formEnrollmentError.textContent = err.message || "Chyba při odesílání přihlášky.";
        this.formEnrollmentError.style.display = "block";
      }
    }
  }
}
