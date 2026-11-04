/**
 * Analytics & Reports View
 * Managerial dashboards: classroom and term capacity utilization, lecturer workload, and multi-course students
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
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst manažerské výkazy.");
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
        "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 transition-all";

      const isOverbooked = t.waitlist > 0;

      card.innerHTML = `
        <div class="flex justify-between items-center text-xs mb-2">
          <span class="font-bold text-slate-900 dark:text-white truncate pr-2">
            ${t.courseTitle}
            <span class="font-normal text-slate-400">(${t.period})</span>
          </span>
          <div class="shrink-0 text-right">
            <span class="font-bold text-slate-800 dark:text-slate-200">${t.confirmed} / ${t.capacity}</span>
            <span class="text-slate-500 font-semibold ml-1">(${t.fillRate} %)</span>
          </div>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
          <div class="h-full ${t.fillRate >= 100 ? "bg-amber-500" : "bg-blue-600"} rounded-full transition-all duration-300" style="width: ${Math.min(100, t.fillRate)}%;"></div>
        </div>
        ${
          isOverbooked
            ? `<div class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                ${t.waitlist} ${t.waitlist === 1 ? "student čeká" : "studenti čekají"} v pořadníku
               </div>`
            : `<div class="text-[11px] text-slate-400">Volná místa: ${Math.max(0, t.capacity - t.confirmed)}</div>`
        }
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

    this.data!.lecturerStats.forEach((l) => {
      const card = document.createElement("div");
      card.className =
        "p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex justify-between items-center text-xs";

      card.innerHTML = `
        <span class="font-bold text-slate-900 dark:text-white">${l.name}</span>
        <div class="flex items-center gap-2">
          <span class="font-bold text-blue-600 dark:text-blue-400">${l.taughtHours} odučených hodin</span>
          <span class="text-slate-400">(${l.termCount} termínů)</span>
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
        <div class="py-8 text-center text-xs text-slate-400">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `;
      return;
    }

    this.data!.multiCourseStudents.forEach((s) => {
      const card = document.createElement("div");
      card.className =
        "p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs";

      const coursesTags = s.courses
        .map(
          (c) =>
            `<span class="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">${c}</span>`
        )
        .join(" ");

      card.innerHTML = `
        <div>
          <div class="font-bold text-slate-900 dark:text-white text-sm">
            ${s.student}
            <span class="font-normal text-xs text-slate-400 ml-1">(${s.email})</span>
            ${s.organization ? `<span class="font-normal text-xs text-blue-600 dark:text-blue-400 ml-1.5">• ${s.organization}</span>` : ""}
          </div>
          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <span class="text-slate-400 text-[11px]">Zapsané kurzy:</span>
            ${coursesTags}
          </div>
        </div>
        <div class="shrink-0 self-start sm:self-auto">
          <span class="badge-chip badge-chip-green font-bold text-xs">
            ${s.courseCount} kurzy
          </span>
        </div>
      `;

      this.studentsListContainer?.appendChild(card);
    });
  }
}
