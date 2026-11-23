/**
 * Lecturers & Classrooms View - Akademie Trutnov
 * Overview of external educators, contacts, specializations, taught hours, and classroom spaces
 */
import { Lecturer, Classroom } from "../types";
import { dictionariesApi } from "../api/dictionariesApi";
import { Toast } from "../components/Toast";

export class LecturersView {
  private lecturers: Lecturer[] = [];
  private classrooms: Classroom[] = [];

  private lecturersTableBody: HTMLElement | null = null;
  private classroomsTableBody: HTMLElement | null = null;

  public init(): void {
    this.lecturersTableBody = document.getElementById("lecturers-table-body");
    this.classroomsTableBody = document.getElementById("classrooms-table-body");
    this.load();
  }

  public async load(): Promise<void> {
    try {
      const [lecturers, classrooms] = await Promise.all([
        dictionariesApi.getLecturers(),
        dictionariesApi.getClassrooms(),
      ]);

      this.lecturers = lecturers;
      this.classrooms = classrooms;

      this.renderLecturers();
      this.renderClassrooms();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst lektory a učebny.";
      Toast.error(msg);
    }
  }

  private renderLecturers(): void {
    if (!this.lecturersTableBody) return;
    this.lecturersTableBody.innerHTML = "";

    if (this.lecturers.length === 0) {
      this.lecturersTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            V databázi zatím nejsou žádní lektoři.
          </td>
        </tr>
      `;
      return;
    }

    this.lecturers.forEach((l) => {
      const tr = document.createElement("tr");
      const initials = l.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      tr.innerHTML = `
        <td>
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-md bg-[#f0e3c8] dark:bg-[#251e30] text-[#6e4e1b] dark:text-[#f8df95] border border-[#caa049] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              ${initials}
            </div>
            <div>
              <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${l.name}</div>
            </div>
          </div>
        </td>
        <td class="text-xs">
          <div class="font-mono text-[#5c4318] dark:text-[#eeddbb] font-medium">${l.email}</div>
          <div class="font-mono text-[#8c6d3b] dark:text-[#c4a974] text-xs tabular-nums">${l.phone || "-"}</div>
        </td>
        <td class="text-xs">
          <span class="inline-block px-2.5 py-0.5 rounded text-xs bg-[#f5ebd6] dark:bg-[#1a1424] text-[#5c4318] dark:text-[#fce8bd] font-medium border border-[#caa049]/50">
            ${l.specialization || "Lektor"}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <strong class="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs tabular-nums">${l.taughtHours} hod.</strong>
            <span class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] tabular-nums">(${l.termCount} termínů)</span>
          </div>
        </td>
      `;
      this.lecturersTableBody?.appendChild(tr);
    });
  }

  private renderClassrooms(): void {
    if (!this.classroomsTableBody) return;
    this.classroomsTableBody.innerHTML = "";

    if (this.classrooms.length === 0) {
      this.classroomsTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            V databázi zatím nejsou žádné učebny.
          </td>
        </tr>
      `;
      return;
    }

    this.classrooms.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${c.name}</div>
        </td>
        <td class="text-xs text-[#6e5223] dark:text-[#d1b88e]">${c.address}</td>
        <td>
          <span class="font-mono font-bold text-xs text-[#5c4318] dark:text-[#fce28b] bg-[#f5ebd6] dark:bg-[#1a1424] px-2.5 py-0.5 rounded border border-[#caa049]">
            ${c.capacity} studentů
          </span>
        </td>
      `;
      this.classroomsTableBody?.appendChild(tr);
    });
  }
}
