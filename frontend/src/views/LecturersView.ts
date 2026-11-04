/**
 * Lecturers & Classrooms View
 * Overview of educators, contact information, specializations, taught hours, and training rooms
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
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst lektory a učebny.");
    }
  }

  private renderLecturers(): void {
    if (!this.lecturersTableBody) return;
    this.lecturersTableBody.innerHTML = "";

    if (this.lecturers.length === 0) {
      this.lecturersTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádní lektoři.
          </td>
        </tr>
      `;
      return;
    }

    this.lecturers.forEach((l) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
              ${l.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">${l.name}</div>
            </div>
          </div>
        </td>
        <td class="text-xs">
          <div class="text-slate-800 dark:text-slate-200 font-medium">${l.email}</div>
          <div class="text-slate-400">${l.phone || "-"}</div>
        </td>
        <td class="text-xs">
          <span class="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            ${l.specialization || "Lektor"}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <strong class="text-blue-600 dark:text-blue-400 font-bold text-sm">${l.taughtHours} hod.</strong>
            <span class="text-xs text-slate-400">(${l.termCount} termínů)</span>
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
          <td colspan="3" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádné učebny.
          </td>
        </tr>
      `;
      return;
    }

    this.classrooms.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${c.name}</td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${c.address}</td>
        <td>
          <span class="badge-chip badge-chip-blue font-bold">
            ${c.capacity} studentů
          </span>
        </td>
      `;
      this.classroomsTableBody?.appendChild(tr);
    });
  }
}
