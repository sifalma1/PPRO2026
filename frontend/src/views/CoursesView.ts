/**
 * Courses View
 * Manages course catalog, search & filtering, creation and editing modal
 */
import { Course } from "../types";
import { coursesApi, CreateCoursePayload } from "../api/coursesApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class CoursesView {
  private courses: Course[] = [];
  private filterType: "all" | "accredited" | "standard" = "all";
  private searchQuery = "";
  private isEditing = false;
  private editingCourseId: string | null = null;

  private container: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private filterChips: NodeListOf<HTMLButtonElement> | null = null;
  private form: HTMLFormElement | null = null;
  private formError: HTMLElement | null = null;
  private modalTitle: HTMLElement | null = null;

  public init(): void {
    this.container = document.getElementById("courses-list");
    this.searchInput = document.getElementById("filter-search-course") as HTMLInputElement;
    this.filterChips = document.querySelectorAll<HTMLButtonElement>(".filter-chip");
    this.form = document.getElementById("form-course") as HTMLFormElement;
    this.formError = document.getElementById("form-course-error");
    this.modalTitle = document.getElementById("modal-course-title");

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    // Search input
    this.searchInput?.addEventListener("input", (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this.render();
    });

    // Filter chips
    this.filterChips?.forEach((chip) => {
      chip.addEventListener("click", () => {
        this.filterChips?.forEach((c) => {
          c.className =
            "filter-chip px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";
        });
        chip.className =
          "filter-chip px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800";
        this.filterType = (chip.getAttribute("data-filter") as any) || "all";
        this.render();
      });
    });

    // Open create modal button
    const btnOpenCreate = document.getElementById("btn-open-create-course");
    btnOpenCreate?.addEventListener("click", () => {
      this.openCreateModal();
    });

    // Form submit
    this.form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });
  }

  public async load(): Promise<void> {
    try {
      this.courses = await coursesApi.getAll();
      this.render();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst seznam kurzů.");
    }
  }

  private render(): void {
    if (!this.container) return;
    this.container.innerHTML = "";

    const filtered = this.courses.filter((course) => {
      if (this.filterType === "accredited" && !course.isAccredited) return false;
      if (this.filterType === "standard" && course.isAccredited) return false;
      if (this.searchQuery) {
        const matchesTitle = course.title.toLowerCase().includes(this.searchQuery);
        const matchesAnnotation = course.annotation.toLowerCase().includes(this.searchQuery);
        if (!matchesTitle && !matchesAnnotation) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Žádné kurzy neodpovídají zadanému filtru.</p>
          <p class="text-xs text-slate-400 mt-1">Zkuste změnit vyhledávací dotaz nebo vybrat jinou kategorii.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((course) => {
      const card = document.createElement("div");
      card.className =
        "card-box flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200";

      const formattedPrice = Number(course.price).toLocaleString("cs-CZ");

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            ${
              course.isAccredited
                ? '<span class="badge-chip badge-chip-green font-medium">Akreditováno MŠMT</span>'
                : '<span class="badge-chip badge-chip-blue font-medium">Firemní kurz</span>'
            }
            <span class="text-base font-bold text-slate-900 dark:text-white">${formattedPrice} Kč</span>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">${course.title}</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">${course.annotation}</p>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between mt-auto">
          <span class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${course.hours} hodin výuky
          </span>
          <div class="flex items-center gap-2">
            <button class="btn-secondary-tw btn-sm-tw btn-edit-course" data-id="${course.id}">Upravit</button>
            <button class="btn-danger-tw btn-sm-tw btn-delete-course" data-id="${course.id}">Smazat</button>
          </div>
        </div>
      `;

      // Edit event
      const editBtn = card.querySelector(".btn-edit-course");
      editBtn?.addEventListener("click", () => this.openEditModal(course));

      // Delete event
      const deleteBtn = card.querySelector(".btn-delete-course");
      deleteBtn?.addEventListener("click", () => this.handleDelete(course));

      this.container?.appendChild(card);
    });
  }

  private openCreateModal(): void {
    this.isEditing = false;
    this.editingCourseId = null;

    if (this.modalTitle) this.modalTitle.textContent = "Nový kurz";
    if (this.form) this.form.reset();
    if (this.formError) this.formError.style.display = "none";

    Modal.open("modal-course");
  }

  private openEditModal(course: Course): void {
    this.isEditing = true;
    this.editingCourseId = course.id;

    if (this.modalTitle) this.modalTitle.textContent = "Upravit kurz";
    if (this.formError) this.formError.style.display = "none";

    const titleInput = document.getElementById("course-title") as HTMLInputElement;
    const annotInput = document.getElementById("course-annotation") as HTMLTextAreaElement;
    const hoursInput = document.getElementById("course-hours") as HTMLInputElement;
    const priceInput = document.getElementById("course-price") as HTMLInputElement;
    const accredInput = document.getElementById("course-accredited") as HTMLInputElement;
    const idInput = document.getElementById("course-id") as HTMLInputElement;

    if (titleInput) titleInput.value = course.title;
    if (annotInput) annotInput.value = course.annotation;
    if (hoursInput) hoursInput.value = course.hours.toString();
    if (priceInput) priceInput.value = course.price.toString();
    if (accredInput) accredInput.checked = course.isAccredited;
    if (idInput) idInput.value = course.id;

    Modal.open("modal-course");
  }

  private async handleSubmit(): Promise<void> {
    if (!this.form) return;
    if (this.formError) this.formError.style.display = "none";

    const title = (document.getElementById("course-title") as HTMLInputElement).value.trim();
    const annotation = (
      document.getElementById("course-annotation") as HTMLTextAreaElement
    ).value.trim();
    const hours = parseInt((document.getElementById("course-hours") as HTMLInputElement).value, 10);
    const price = parseFloat((document.getElementById("course-price") as HTMLInputElement).value);
    const isAccredited = (document.getElementById("course-accredited") as HTMLInputElement).checked;

    const payload: CreateCoursePayload = {
      title,
      annotation,
      hours,
      price,
      isAccredited,
    };

    try {
      if (this.isEditing && this.editingCourseId) {
        await coursesApi.update(this.editingCourseId, payload);
        Toast.success("Kurz byl úspěšně aktualizován.");
      } else {
        await coursesApi.create(payload);
        Toast.success("Nový kurz byl úspěšně vytvořen.");
      }

      Modal.close("modal-course");
      await this.load();
    } catch (err: any) {
      if (this.formError) {
        this.formError.textContent = err.message || "Chyba při ukládání kurzu.";
        this.formError.style.display = "block";
      }
    }
  }

  private async handleDelete(course: Course): Promise<void> {
    const confirmed = window.confirm(
      `Opravdu chcete smazat kurz "${course.title}"? Smažou se i všechny navázané termíny a přihlášky.`
    );
    if (!confirmed) return;

    try {
      const msg = await coursesApi.delete(course.id);
      Toast.success(msg);
      await this.load();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se smazat kurz.");
    }
  }
}
