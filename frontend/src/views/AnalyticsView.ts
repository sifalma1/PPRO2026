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
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
          Zatím nejsou k dispozici žádné termíny pro analýzu vytížení.
        </div>
      `;
      return;
    }

    this.data!.termStats.forEach((t) => {
      const card = document.createElement("div");
      card.className =
        "p-3 rounded-lg bg-[#fcf8ee]/80 dark:bg-[#161220] border border-[#caa049]/40 transition-all shadow-xs";

      const isOverbooked = t.waitlist > 0;
      const fillPercentage = Math.min(100, t.fillRate);

      card.innerHTML = `
        <div class="flex justify-between items-center text-xs mb-1.5">
          <span class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] truncate pr-2">
            ${t.courseTitle}
            <span class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] font-normal">(${t.period})</span>
          </span>
          <div class="shrink-0 text-right font-mono text-xs tabular-nums">
            <span class="font-bold text-[#4a3512] dark:text-[#faeed4]">${t.confirmed} / ${t.capacity}</span>
            <span class="${t.fillRate >= 100 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} font-bold ml-1">
              (${t.fillRate} %)
            </span>
          </div>
        </div>
        <div class="w-full forged-meter-track mb-1.5">
          <div
            class="h-full rounded-xs transition-all duration-300 ${t.fillRate >= 100 ? "bg-amber-500" : "bg-emerald-600"}"
            style="width: ${fillPercentage}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          ${
            isOverbooked
              ? `<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
                  ${t.waitlist} ${t.waitlist === 1 ? "náhradník čeká" : "náhradníci čekají"} v pořadníku
                 </span>`
              : `<span class="text-[#8c6d3b] dark:text-[#c4a974] font-mono tabular-nums">Volná místa: ${Math.max(0, t.capacity - t.confirmed)}</span>`
          }
          <span class="text-[#8c6d3b] dark:text-[#c4a974] font-mono text-xs tabular-nums">Kapacita: ${t.capacity}</span>
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
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
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
        "p-3 rounded-lg bg-[#fcf8ee]/80 dark:bg-[#161220] border border-[#caa049]/40 text-xs shadow-xs";

      const barPercentage = Math.round((l.taughtHours / maxHours) * 100);

      card.innerHTML = `
        <div class="flex justify-between items-center mb-1.5">
          <span class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${l.name}</span>
          <div class="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <strong class="text-emerald-700 dark:text-emerald-400 font-bold">${l.taughtHours} hod.</strong>
            <span class="text-[#8c6d3b] dark:text-[#c4a974]">(${l.termCount} termínů)</span>
          </div>
        </div>
        <div class="w-full forged-meter-track">
          <div
            class="h-full bg-emerald-600 rounded-xs transition-all duration-300"
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
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `;
      return;
    }

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-box-wrap mt-2 overflow-x-auto";

    tableWrapper.innerHTML = `
      <table class="table-tw">
        <thead>
          <tr>
            <th>Student</th>
            <th>Kontakt</th>
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
            `<span class="inline-block px-2.5 py-0.5 rounded text-xs bg-[#f5ebd6] dark:bg-[#1a1424] text-[#5c4318] dark:text-[#fce8bd] border border-[#caa049]/50 mr-1 mb-1 font-medium">${c}</span>`
        )
        .join("");

      tr.innerHTML = `
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${st.student}</div>
        </td>
        <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e] break-all sm:break-normal">${st.email}</td>
        <td class="text-xs text-[#7c5e2d] dark:text-[#c4a974] leading-tight">${st.organization || "-"}</td>
        <td>
          <span class="badge-chip badge-chip-green font-mono whitespace-nowrap">
            ${st.courseCount} kurzy
          </span>
        </td>
        <td class="py-2">
          <div class="flex flex-wrap gap-1">${coursesBadges}</div>
        </td>
      `;

      tbody?.appendChild(tr);
    });

    this.studentsListContainer.appendChild(tableWrapper);
  }
}
