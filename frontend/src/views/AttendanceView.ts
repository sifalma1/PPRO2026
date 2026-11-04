/**
 * Attendance View
 * Daily teaching day blocks, student attendance tracking, and 70% rule summary (ADR-01, ADR-05)
 */
import { TeachingDay, AttendanceRosterStudent, AttendanceSummaryItem, CourseTerm } from "../types";
import { attendanceApi, CreateTeachingDayPayload } from "../api/attendanceApi";
import { termsApi } from "../api/termsApi";
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
  }

  public async load(): Promise<void> {
    try {
      this.terms = await termsApi.getAll();
      this.renderTermSelect();

      if (this.terms.length > 0) {
        if (!this.selectedTermId || !this.terms.some((t) => t.id === this.selectedTermId)) {
          this.selectedTermId = this.terms[0].id;
        }
        if (this.termSelect) this.termSelect.value = this.selectedTermId;
        await this.loadTermDetails();
      }
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst termíny pro docházku.");
    }
  }

  private renderTermSelect(): void {
    if (!this.termSelect) return;
    this.termSelect.innerHTML = this.terms
      .map(
        (t) => `<option value="${t.id}">${t.courseTitle} (${t.startDate} až ${t.endDate})</option>`
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
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst data docházky.");
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
        <td class="font-bold text-slate-900 dark:text-white">${day.dayDate}</td>
        <td class="text-xs">${day.topic}</td>
        <td class="text-xs font-semibold">${day.hours} hod.</td>
        <td class="text-xs text-slate-500">${day.lecturerName || "Neuveden"}</td>
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
      this.rosterDaySubtitle.textContent = `Téma: ${day.topic} • Lektor: ${day.lecturerName || "Neurčen"} • Rozsah: ${day.hours} hod.`;
    }

    try {
      this.roster = await attendanceApi.getDayAttendance(day.id);
      this.renderRoster();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst prezenční listinu dne.");
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
        <td class="font-bold text-slate-900 dark:text-white">${student.studentName}</td>
        <td class="text-xs text-slate-500">${student.studentEmail}</td>
        <td>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="att-checkbox w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" data-student="${student.studentId}" ${student.isPresent ? "checked" : ""}>
            <span class="text-xs font-semibold ${student.isPresent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"} label-status">
              ${student.isPresent ? "Přítomen" : "Nepřítomen"}
            </span>
          </label>
        </td>
        <td>
          <input type="text" class="att-note input-tw py-1 text-xs" data-student="${student.studentId}" value="${student.note || ""}" placeholder="Poznámka / omluva...">
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

      // Refresh days and summary
      await this.loadTermDetails();
    } catch (err: any) {
      Toast.error(err.message || "Chyba při ukládání docházky.");
    }
  }

  private renderSummary(): void {
    if (!this.summaryTableBody) return;
    this.summaryTableBody.innerHTML = "";

    if (this.summary.length === 0) {
      this.summaryTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            Dosud nejsou k dispozici žádná data pro souhrn docházky.
          </td>
        </tr>
      `;
      return;
    }

    this.summary.forEach((item) => {
      const qualifiesBadge = item.qualifiesForCertificate
        ? `<span class="badge-chip badge-chip-green font-medium">Splněno (${item.attendancePercentage} %)</span>`
        : `<span class="badge-chip badge-chip-red font-medium">Nesplněno (${item.attendancePercentage} %)</span>`;

      let certBadge = "";
      if (item.certificateIssued) {
        certBadge = `<span class="badge-chip badge-chip-blue font-mono">Vystaveno (${item.certificateNumber})</span>`;
      } else if (item.qualifiesForCertificate) {
        certBadge = '<span class="badge-chip badge-chip-yellow">Čeká na uzavření</span>';
      } else {
        certBadge =
          '<span class="badge-chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Vyžaduje výjimku</span>';
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${item.studentName}</td>
        <td class="text-xs text-slate-500">${item.studentEmail}</td>
        <td class="text-xs font-medium">${item.attendedDays} z ${item.totalDays} dnů</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900 dark:text-white">${item.attendancePercentage} %</span>
            <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div class="h-full ${item.qualifiesForCertificate ? "bg-emerald-500" : "bg-rose-500"} rounded-full" style="width: ${Math.min(100, item.attendancePercentage)}%;"></div>
            </div>
          </div>
        </td>
        <td>${qualifiesBadge}</td>
        <td>${certBadge}</td>
      `;

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
    } catch (err: any) {
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
    } catch (err: any) {
      if (this.formTeachingDayError) {
        this.formTeachingDayError.textContent = err.message || "Chyba při vytváření výukového dne.";
        this.formTeachingDayError.style.display = "block";
      }
    }
  }
}
