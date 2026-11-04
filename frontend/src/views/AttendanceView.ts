/**
 * Attendance View - Akademie Trutnov
 * Daily teaching day blocks, student attendance tracking, bulk actions,
 * and 70% rule compliance matrix (ADR-01, ADR-05).
 */
import { TeachingDay, AttendanceRosterStudent, AttendanceSummaryItem, CourseTerm } from "../types";
import { attendanceApi, CreateTeachingDayPayload } from "../api/attendanceApi";
import { termsApi } from "../api/termsApi";
import { certificatesApi } from "../api/certificatesApi";
import { dictionariesApi } from "../api/dictionariesApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class AttendanceView {
  private terms: CourseTerm[] = [];
  private selectedTermId: string | null = null;
  private teachingDays: TeachingDay[] = [];
  private selectedDayId: string | null = null;
  private roster: AttendanceRosterStudent[] = [];
  private summary: AttendanceSummaryItem[] = [];

  private termSelect: HTMLSelectElement | null = null;
  private daysTableBody: HTMLElement | null = null;
  private daysCountBadge: HTMLElement | null = null;
  private rosterTableBody: HTMLElement | null = null;
  private summaryTableBody: HTMLElement | null = null;
  private rosterDayTitle: HTMLElement | null = null;
  private rosterDaySubtitle: HTMLElement | null = null;
  private btnSaveAttendance: HTMLElement | null = null;
  private btnMarkAll: HTMLElement | null = null;

  private formTeachingDay: HTMLFormElement | null = null;
  private formTeachingDayError: HTMLElement | null = null;

  public init(): void {
    this.termSelect = document.getElementById("attendance-term-select") as HTMLSelectElement;
    this.daysTableBody = document.getElementById("teaching-days-table-body");
    this.daysCountBadge = document.getElementById("attendance-days-count");
    this.rosterTableBody = document.getElementById("attendance-roster-body");
    this.summaryTableBody = document.getElementById("attendance-summary-table-body");
    this.rosterDayTitle = document.getElementById("attendance-day-title");
    this.rosterDaySubtitle = document.getElementById("attendance-day-subtitle");
    this.btnSaveAttendance = document.getElementById("btn-save-attendance");
    this.btnMarkAll = document.getElementById("btn-attendance-mark-all");

    this.formTeachingDay = document.getElementById("form-teaching-day") as HTMLFormElement;
    this.formTeachingDayError = document.getElementById("form-teaching-day-error");

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    // Term select change
    this.termSelect?.addEventListener("change", async () => {
      this.selectedTermId = this.termSelect?.value || null;
      this.selectedDayId = null;
      await this.loadTermDetails();
    });

    // Open create day modal
    const btnOpenCreateDay = document.getElementById("btn-open-create-day");
    btnOpenCreateDay?.addEventListener("click", async () => {
      await this.openCreateDayModal();
    });

    // Form submit: create day
    this.formTeachingDay?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleCreateDaySubmit();
    });

    // Save attendance button
    this.btnSaveAttendance?.addEventListener("click", async () => {
      await this.handleSaveAttendance();
    });

    // Bulk action: Mark all present
    this.btnMarkAll?.addEventListener("click", () => {
      const checkboxes = document.querySelectorAll<HTMLInputElement>(".att-checkbox");
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
      checkboxes.forEach((cb) => {
        cb.checked = !allChecked;
        const studentId = cb.getAttribute("data-student");
        const statusLabel = document.querySelector<HTMLElement>(
          `.label-status[data-student="${studentId}"]`
        );
        if (statusLabel) {
          if (!allChecked) {
            statusLabel.textContent = "Přítomen";
            statusLabel.className =
              "text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status";
          } else {
            statusLabel.textContent = "Nepřítomen";
            statusLabel.className = "text-xs font-semibold text-slate-400 label-status";
          }
        }
      });
      Toast.info(
        allChecked
          ? "Všichni studenti označeni jako nepřítomní."
          : "Všichni studenti označeni jako přítomní."
      );
    });
  }

  public async load(preselectedTermId?: string): Promise<void> {
    try {
      this.terms = await termsApi.getAll();
      this.renderTermSelect();

      if (this.terms.length > 0) {
        if (preselectedTermId && this.terms.some((t) => t.id === preselectedTermId)) {
          this.selectedTermId = preselectedTermId;
        } else if (!this.selectedTermId || !this.terms.some((t) => t.id === this.selectedTermId)) {
          this.selectedTermId = this.terms[0].id;
        }
        if (this.termSelect) this.termSelect.value = this.selectedTermId;
        await this.loadTermDetails();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst termíny pro docházku.";
      Toast.error(msg);
    }
  }

  public selectTermById(termId: string): void {
    if (this.terms.some((t) => t.id === termId)) {
      this.selectedTermId = termId;
      if (this.termSelect) this.termSelect.value = termId;
      this.loadTermDetails();
    }
  }

  private renderTermSelect(): void {
    if (!this.termSelect) return;
    this.termSelect.innerHTML = this.terms
      .map(
        (t) =>
          `<option value="${t.id}" ${t.id === this.selectedTermId ? "selected" : ""}>${t.courseTitle} (${t.startDate} až ${t.endDate})</option>`
      )
      .join("");
  }

  private async loadTermDetails(): Promise<void> {
    if (!this.selectedTermId) return;

    try {
      const [days, summary] = await Promise.all([
        attendanceApi.getDays(this.selectedTermId),
        attendanceApi.getSummary(this.selectedTermId),
      ]);

      this.teachingDays = days;
      this.summary = summary;

      this.renderTeachingDays();
      this.renderSummary();

      if (this.teachingDays.length > 0) {
        const firstDay = this.teachingDays[0];
        await this.selectTeachingDay(firstDay);
      } else {
        this.clearRoster("Tento termín zatím nemá vypsané žádné výukové dny.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst data docházky.";
      Toast.error(msg);
    }
  }

  private renderTeachingDays(): void {
    if (!this.daysTableBody) return;
    this.daysTableBody.innerHTML = "";

    if (this.daysCountBadge) {
      this.daysCountBadge.textContent = `${this.teachingDays.length} dnů`;
    }

    if (this.teachingDays.length === 0) {
      this.daysTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-8 text-slate-400">
            Tento termín zatím nemá vypsané žádné výukové dny.
          </td>
        </tr>
      `;
      return;
    }

    this.teachingDays.forEach((day) => {
      const tr = document.createElement("tr");
      if (day.id === this.selectedDayId) {
        tr.classList.add("row-selected");
      }

      tr.innerHTML = `
        <td class="font-mono text-xs font-bold text-slate-900 dark:text-white">${day.dayDate}</td>
        <td class="text-xs font-medium text-slate-800 dark:text-slate-200">${day.topic}</td>
        <td class="font-mono text-xs text-slate-600 dark:text-slate-400">${day.hours} hod.</td>
        <td class="text-xs text-slate-500">${day.lecturerName || "Neurčen"}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-select-day" data-id="${day.id}">
            Zapsat (${day.presentCount}/${day.attendanceCount})
          </button>
        </td>
      `;

      const selectBtn = tr.querySelector(".btn-select-day");
      selectBtn?.addEventListener("click", () => this.selectTeachingDay(day));

      this.daysTableBody?.appendChild(tr);
    });
  }

  private async selectTeachingDay(day: TeachingDay): Promise<void> {
    this.selectedDayId = day.id;
    this.renderTeachingDays();

    if (this.rosterDayTitle) {
      this.rosterDayTitle.textContent = `Prezenční listina: ${day.dayDate}`;
    }
    if (this.rosterDaySubtitle) {
      this.rosterDaySubtitle.innerHTML = `Téma: <strong class="text-slate-900 dark:text-white">${day.topic}</strong> • Lektor: ${day.lecturerName || "Neurčen"} • Rozsah: <strong class="font-mono">${day.hours} hod.</strong>`;
    }

    try {
      this.roster = await attendanceApi.getDayAttendance(day.id);
      this.renderRoster();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Nepodařilo se načíst prezenční listinu dne.";
      Toast.error(msg);
    }
  }

  private clearRoster(message: string): void {
    if (this.rosterTableBody) {
      this.rosterTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">${message}</td>
        </tr>
      `;
    }
    if (this.btnSaveAttendance) this.btnSaveAttendance.style.display = "none";
  }

  private renderRoster(): void {
    if (!this.rosterTableBody) return;
    this.rosterTableBody.innerHTML = "";

    if (this.roster.length === 0) {
      this.clearRoster("Na tomto termínu nejsou žádní potvrzení studenti.");
      return;
    }

    if (this.btnSaveAttendance) this.btnSaveAttendance.style.display = "inline-flex";

    this.roster.forEach((student) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${student.studentName}</div>
        </td>
        <td class="font-mono text-xs text-slate-500">${student.studentEmail}</td>
        <td>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              class="att-checkbox w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              data-student="${student.studentId}"
              ${student.isPresent ? "checked" : ""}
            />
            <span
              class="text-xs font-semibold label-status ${student.isPresent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}"
              data-student="${student.studentId}"
            >
              ${student.isPresent ? "Přítomen" : "Nepřítomen"}
            </span>
          </label>
        </td>
        <td>
          <input
            type="text"
            class="att-note input-tw py-1 text-xs"
            data-student="${student.studentId}"
            value="${student.note || ""}"
            placeholder="Poznámka / omluva..."
          />
        </td>
      `;

      const cb = tr.querySelector(".att-checkbox") as HTMLInputElement;
      const statusLabel = tr.querySelector(".label-status") as HTMLElement;
      cb?.addEventListener("change", () => {
        if (cb.checked) {
          statusLabel.textContent = "Přítomen";
          statusLabel.className =
            "text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status";
        } else {
          statusLabel.textContent = "Nepřítomen";
          statusLabel.className = "text-xs font-semibold text-slate-400 label-status";
        }
      });

      this.rosterTableBody?.appendChild(tr);
    });
  }

  private async handleSaveAttendance(): Promise<void> {
    if (!this.selectedDayId || !this.selectedTermId) return;

    const checkboxes = document.querySelectorAll<HTMLInputElement>(".att-checkbox");
    let savedCount = 0;

    try {
      for (const cb of checkboxes) {
        const studentId = cb.getAttribute("data-student");
        if (!studentId) continue;

        const isPresent = cb.checked;
        const noteInput = document.querySelector<HTMLInputElement>(
          `.att-note[data-student="${studentId}"]`
        );
        const note = noteInput ? noteInput.value.trim() : undefined;

        await attendanceApi.markAttendance(this.selectedDayId, {
          studentId,
          isPresent,
          note,
        });
        savedCount++;
      }

      Toast.success(`Prezenční listina byla uložena (${savedCount} studentů).`);
      await this.loadTermDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Chyba při ukládání docházky.";
      Toast.error(msg);
    }
  }

  private renderSummary(): void {
    if (!this.summaryTableBody) return;
    this.summaryTableBody.innerHTML = "";

    if (this.summary.length === 0) {
      this.summaryTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400">
            Dosud nejsou k dispozici žádná data pro souhrn docházky.
          </td>
        </tr>
      `;
      return;
    }

    this.summary.forEach((item) => {
      const qualifiesBadge = item.qualifiesForCertificate
        ? `<span class="badge-chip badge-chip-green">Splněno (≥ 70 %)</span>`
        : `<span class="badge-chip badge-chip-red">Nesplněno (< 70 %)</span>`;

      let certBadge = "";
      if (item.certificateIssued) {
        certBadge = `
          <button class="btn-cert-preview font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800 hover:border-sky-400 hover:underline" data-cert="${item.certificateNumber || ""}">
            ${item.certificateNumber} ↗
          </button>
        `;
      } else if (item.qualifiesForCertificate) {
        certBadge = '<span class="badge-chip badge-chip-yellow">Čeká na uzavření</span>';
      } else {
        certBadge = '<span class="badge-chip badge-chip-slate">Nutná výjimka</span>';
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${item.studentName}</div>
        </td>
        <td class="font-mono text-xs text-slate-500">${item.studentEmail}</td>
        <td class="font-mono text-xs">${item.attendedDays} z ${item.totalDays} dnů</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold ${item.qualifiesForCertificate ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}">
              ${item.attendancePercentage} %
            </span>
            <div class="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div
                class="h-full rounded-full transition-all duration-300 ${item.qualifiesForCertificate ? "bg-emerald-600" : "bg-rose-500"}"
                style="width: ${Math.min(100, item.attendancePercentage)}%;"
              ></div>
            </div>
          </div>
        </td>
        <td>${qualifiesBadge}</td>
        <td>${certBadge}</td>
        <td class="text-right">
          ${
            !item.qualifiesForCertificate && !item.certificateIssued
              ? `<button class="btn-secondary-tw btn-sm-tw btn-waiver-shortcut text-amber-700 dark:text-amber-400" data-student="${item.studentId}">
                  Udělit výjimku
                 </button>`
              : '<span class="text-slate-400 text-xs">-</span>'
          }
        </td>
      `;

      // Certificate preview click
      const certBtn = tr.querySelector(".btn-cert-preview");
      certBtn?.addEventListener("click", async () => {
        const certNumber = certBtn.getAttribute("data-cert");
        if (certNumber) {
          const certs = await certificatesApi.getAll();
          const cert = certs.find((c) => c.certificateNumber === certNumber);
          if (cert) {
            document.dispatchEvent(
              new CustomEvent("akademie:preview-certificate", { detail: { certificate: cert } })
            );
          }
        }
      });

      // Waiver shortcut click
      const waiverBtn = tr.querySelector(".btn-waiver-shortcut");
      waiverBtn?.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("akademie:switch-tab", {
            detail: { tab: "certificates", openWaiver: true },
          })
        );
      });

      this.summaryTableBody?.appendChild(tr);
    });
  }

  private async openCreateDayModal(): Promise<void> {
    if (!this.selectedTermId) {
      Toast.warning("Nejprve vyberte termín kurzu.");
      return;
    }

    if (this.formTeachingDay) this.formTeachingDay.reset();
    if (this.formTeachingDayError) this.formTeachingDayError.style.display = "none";

    const hiddenId = document.getElementById("day-term-id") as HTMLInputElement;
    if (hiddenId) hiddenId.value = this.selectedTermId;

    try {
      const lecturers = await dictionariesApi.getLecturers();
      const lectSelect = document.getElementById("day-lecturer-select") as HTMLSelectElement;
      if (lectSelect) {
        lectSelect.innerHTML =
          `<option value="">-- Zvolte lektora pro tento den --</option>` +
          lecturers.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      }

      Modal.open("modal-teaching-day");
    } catch {
      Toast.error("Chyba při načítání seznamu lektorů.");
    }
  }

  private async handleCreateDaySubmit(): Promise<void> {
    if (!this.selectedTermId || !this.formTeachingDay) return;
    if (this.formTeachingDayError) this.formTeachingDayError.style.display = "none";

    const dayDate = (document.getElementById("day-date") as HTMLInputElement).value;
    const hours = parseInt((document.getElementById("day-hours") as HTMLInputElement).value, 10);
    const topic = (document.getElementById("day-topic") as HTMLInputElement).value.trim();
    const lecturerId =
      (document.getElementById("day-lecturer-select") as HTMLSelectElement).value || undefined;

    const payload: CreateTeachingDayPayload = {
      dayDate,
      hours,
      topic,
      lecturerId,
    };

    try {
      await attendanceApi.createDay(this.selectedTermId, payload);
      Toast.success("Výukový den byl úspěšně přidán.");
      Modal.close("modal-teaching-day");
      await this.loadTermDetails();
    } catch (err: unknown) {
      if (this.formTeachingDayError) {
        const msg = err instanceof Error ? err.message : "Chyba při vytváření výukového dne.";
        this.formTeachingDayError.textContent = msg;
        this.formTeachingDayError.style.display = "block";
      }
    }
  }
}
