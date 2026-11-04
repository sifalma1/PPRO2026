/**
 * Analytics & Reports View - Akademie Trutnov
 * Managerial dashboards: classroom and term capacity utilization, lecturer workload,
 * and multi-course students (Bod 8 zadání).
 */
import { AnalyticsData } from "../types";
import { dictionariesApi } from "../api/dictionariesApi";
import { Toast } from "../components/Toast";

export class AnalyticsView {
  private data: AnalyticsData | null = null;

  private termsListContainer: HTMLElement | null = null;
  private lecturersListContainer: HTMLElement | null = null;
  private studentsListContainer: HTMLElement | null = null;
  private btnRefresh: HTMLElement | null = null;

  public init(): void {
    this.termsListContainer = document.getElementById("analytics-terms-list");
    this.lecturersListContainer = document.getElementById("analytics-lecturers-list");
    this.studentsListContainer = document.getElementById("analytics-students-list");
    this.btnRefresh = document.getElementById("btn-refresh-analytics");

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    this.btnRefresh?.addEventListener("click", async () => {
      await this.load(true);
    });
  }

  public async load(showFeedback = false): Promise<void> {
    try {
      this.data = await dictionariesApi.getAnalytics();
      this.render();
      if (showFeedback) {
        Toast.success("Manažerské statistiky byly aktualizovány.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst manažerské výkazy.";
      Toast.error(msg);
    }
  }

  private render(): void {
    if (!this.data) return;

    this.renderTermStats();
    this.renderLecturerStats();
    this.renderMultiCourseStudents();
  }

  private renderTermStats(): void {
    if (!this.termsListContainer) return;
    this.termsListContainer.innerHTML = "";

    if (this.data!.termStats.length === 0) {
      this.termsListContainer.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádné termíny pro analýzu vytížení.
        </div>
      `;
      return;
    }

    this.data!.termStats.forEach((t) => {
      const card = document.createElement("div");
      card.className =
        "p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 transition-all";

      const isOverbooked = t.waitlist > 0;
      const fillPercentage = Math.min(100, t.fillRate);

      card.innerHTML = `
        <div class="flex justify-between items-center text-xs mb-1.5">
          <span class="font-bold text-slate-900 dark:text-white truncate pr-2">
            ${t.courseTitle}
            <span class="font-mono text-xs text-slate-400 font-normal">(${t.period})</span>
          </span>
          <div class="shrink-0 text-right font-mono text-xs tabular-nums">
            <span class="font-bold text-slate-800 dark:text-slate-200">${t.confirmed} / ${t.capacity}</span>
            <span class="${t.fillRate >= 100 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} font-bold ml-1">
              (${t.fillRate} %)
            </span>
          </div>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
          <div
            class="h-full rounded-full transition-all duration-300 ${t.fillRate >= 100 ? "bg-amber-500" : "bg-emerald-600"}"
            style="width: ${fillPercentage}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          ${
            isOverbooked
              ? `<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  ADR-02: ${t.waitlist} ${t.waitlist === 1 ? "náhradník čeká" : "náhradníci čekají"} v pořadníku
                 </span>`
              : `<span class="text-slate-400 font-mono tabular-nums">Volná místa: ${Math.max(0, t.capacity - t.confirmed)}</span>`
          }
          <span class="text-slate-400 font-mono text-xs tabular-nums">Kapacita: ${t.capacity}</span>
        </div>
      `;

      this.termsListContainer?.appendChild(card);
    });
  }

  private renderLecturerStats(): void {
    if (!this.lecturersListContainer) return;
    this.lecturersListContainer.innerHTML = "";

    if (this.data!.lecturerStats.length === 0) {
      this.lecturersListContainer.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádná data o lektorech.
        </div>
      `;
      return;
    }

    // Find max hours for relative bars
    const maxHours = Math.max(...this.data!.lecturerStats.map((l) => l.taughtHours), 1);

    this.data!.lecturerStats.forEach((l) => {
      const card = document.createElement("div");
      card.className =
        "p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs";

      const barPercentage = Math.round((l.taughtHours / maxHours) * 100);

      card.innerHTML = `
        <div class="flex justify-between items-center mb-1">
          <span class="font-bold text-slate-900 dark:text-white">${l.name}</span>
          <div class="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <strong class="text-emerald-700 dark:text-emerald-400 font-bold">${l.taughtHours} hod.</strong>
            <span class="text-slate-400">(${l.termCount} termínů)</span>
          </div>
        </div>
        <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style="width: ${barPercentage}%;"
          ></div>
        </div>
      `;

      this.lecturersListContainer?.appendChild(card);
    });
  }

  private renderMultiCourseStudents(): void {
    if (!this.studentsListContainer) return;
    this.studentsListContainer.innerHTML = "";

    if (this.data!.multiCourseStudents.length === 0) {
      this.studentsListContainer.innerHTML = `
        <div class="py-6 text-center text-xs text-slate-400">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `;
      return;
    }

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "overflow-x-auto";

    tableWrapper.innerHTML = `
      <table class="table-tw">
        <thead>
          <tr>
            <th>Student</th>
            <th>Kontakt (E-mail)</th>
            <th>Organizace</th>
            <th>Počet kurzů</th>
            <th>Navštěvované programy</th>
          </tr>
        </thead>
        <tbody id="multi-students-table-body"></tbody>
      </table>
    `;

    const tbody = tableWrapper.querySelector("#multi-students-table-body");

    this.data!.multiCourseStudents.forEach((st) => {
      const tr = document.createElement("tr");

      const coursesBadges = st.courses
        .map(
          (c) =>
            `<span class="inline-block px-2.5 py-0.5 rounded text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mr-1 mb-1 font-medium">${c}</span>`
        )
        .join("");

      tr.innerHTML = `
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${st.student}</div>
        </td>
        <td class="font-mono text-xs text-slate-600 dark:text-slate-400">${st.email}</td>
        <td class="text-xs text-slate-500">${st.organization || "-"}</td>
        <td>
          <span class="badge-chip badge-chip-green font-mono">
            ${st.courseCount} kurzy
          </span>
        </td>
        <td class="py-2">${coursesBadges}</td>
      `;

      tbody?.appendChild(tr);
    });

    this.studentsListContainer.appendChild(tableWrapper);
  }
}
