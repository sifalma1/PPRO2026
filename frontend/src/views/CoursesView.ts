/**
 * Courses View - Akademie Trutnov
 * High information density catalog, real-time search, MŠMT accreditation badges, modal management,
 * and role-based permissions (Admin vs. Public vs. Student).
 */
import { Course } from "../types";
import { coursesApi, CreateCoursePayload } from "../api/coursesApi";
import { authApi } from "../api/authApi";
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
  private countPill: HTMLElement | null = null;
  private kpiCoursesCount: HTMLElement | null = null;
  private btnOpenCreate: HTMLElement | null = null;

  private form: HTMLFormElement | null = null;
  private formError: HTMLElement | null = null;
  private modalTitle: HTMLElement | null = null;

  private onScheduleTermCallback?: (courseId: string) => void;

  constructor(options?: { onScheduleTerm?: (courseId: string) => void }) {
    this.onScheduleTermCallback = options?.onScheduleTerm;
  }

  public init(): void {
    this.container = document.getElementById("courses-list");
    this.searchInput = document.getElementById("filter-search-course") as HTMLInputElement;
    this.filterChips = document.querySelectorAll<HTMLButtonElement>(".filter-chip");
    this.countPill = document.getElementById("courses-count-pill");
    this.kpiCoursesCount = document.getElementById("kpi-courses-count");
    this.btnOpenCreate = document.getElementById("btn-open-create-course");

    this.form = document.getElementById("form-course") as HTMLFormElement;
    this.formError = document.getElementById("form-course-error");
    this.modalTitle = document.getElementById("modal-course-title");

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    // Quick search bar trigger from header
    const btnQuickSearch = document.getElementById("btn-quick-search");
    btnQuickSearch?.addEventListener("click", () => {
      this.searchInput?.focus();
      this.searchInput?.select();
    });

    // Search input
    this.searchInput?.addEventListener("input", (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase().trim();
      this.render();
    });

    // Filter chips
    this.filterChips?.forEach((chip) => {
      chip.addEventListener("click", () => {
        this.filterChips?.forEach((c) => {
          c.classList.remove("filter-chip-active");
          c.classList.add("filter-chip-inactive");
        });
        chip.classList.remove("filter-chip-inactive");
        chip.classList.add("filter-chip-active");
        this.filterType =
          (chip.getAttribute("data-filter") as "all" | "accredited" | "standard") || "all";
        this.render();
      });
    });

    // Open create modal button
    this.btnOpenCreate?.addEventListener("click", () => {
      if (!authApi.isAdmin()) {
        Toast.info("Pro vytvoření nového kurzu se přihlaste jako administrátor.");
        Modal.open("modal-login");
        return;
      }
      this.openCreateModal();
    });

    // Form submit
    this.form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSubmit();
    });

    // Listen for global auth state changes
    document.addEventListener("akademie:auth-changed", () => {
      this.render();
    });
  }

  public async load(): Promise<void> {
    try {
      this.courses = await coursesApi.getAll();
      if (this.kpiCoursesCount) {
        this.kpiCoursesCount.textContent = this.courses.length.toString();
      }
      this.render();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se načíst seznam kurzů.";
      Toast.error(msg);
    }
  }

  public getCourses(): Course[] {
    return this.courses;
  }

  private render(): void {
    const isAdmin = authApi.isAdmin();

    // Toggle visibility of the "Přidat nový kurz" button based on Admin status
    if (this.btnOpenCreate) {
      if (isAdmin) {
        this.btnOpenCreate.style.display = "inline-flex";
        this.btnOpenCreate.title = "Vytvořit nový vzdělávací program";
      } else {
        this.btnOpenCreate.style.display = "none";
      }
    }

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

    if (this.countPill) {
      this.countPill.textContent = `${filtered.length} z ${this.courses.length} programů`;
    }

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Žádné kurzy neodpovídají zadanému filtru.</p>
          <p class="text-xs text-slate-400 mt-1">Zkuste změnit hledaný výraz nebo zvolit kategorii "Všechny programy".</p>
        </div>
      `;
      return;
    }

    filtered.forEach((course, index) => {
      const card = document.createElement("div");
      card.className = "card-box flex flex-col justify-between transition-all duration-150";

      const formattedPrice = Number(course.price).toLocaleString("cs-CZ");
      const courseCode = `AT-K${String(index + 1).padStart(2, "0")}`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="badge-pill-code">
                ${courseCode}
              </span>
              ${
                course.isAccredited
                  ? '<span class="badge-pill-accredited">MŠMT Akreditace</span>'
                  : '<span class="badge-pill-standard">Firemní program</span>'
              }
            </div>
            <span class="badge-pill-price">
              ${formattedPrice} Kč
            </span>
          </div>

          <h3 class="text-[15px] font-extrabold uppercase font-display text-[#28190c] dark:text-[#f8edd9] mb-2 leading-snug tracking-tight">
            ${course.title}
          </h3>

          <p class="text-xs text-[#5c452b] dark:text-[#c4b39b] mb-4 line-clamp-3 leading-relaxed">
            ${course.annotation}
          </p>
        </div>

        <div class="pt-3 border-t border-amber-900/15 dark:border-amber-500/20 flex items-center justify-between mt-auto gap-2">
          <span class="text-xs font-mono font-bold text-[#634a2c] dark:text-[#dfcaa5] flex items-center gap-1.5 tabular-nums">
            <svg class="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${course.hours} hod.
          </span>
          <div class="flex items-center gap-1.5">
            <button
              class="btn-primary-tw btn-sm-tw btn-schedule-course"
              data-id="${course.id}"
              title="Zobrazit vypsané termíny a přihlášky"
            >
              ${isAdmin ? "Vypsat termín" : "Zobrazit termíny"}
            </button>
            ${
              isAdmin
                ? `
              <button
                class="btn-secondary-tw btn-sm-tw btn-edit-course"
                data-id="${course.id}"
                title="Upravit parametry kurzu"
              >
                Upravit
              </button>
              <button
                class="btn-ghost-tw btn-sm-tw btn-delete-course text-rose-700 dark:text-rose-400 hover:bg-rose-900/10"
                data-id="${course.id}"
                title="Smazat kurz z katalogu"
              >
                Smazat
              </button>
            `
                : ""
            }
          </div>
        </div>
      `;

      // Schedule event
      const scheduleBtn = card.querySelector(".btn-schedule-course");
      scheduleBtn?.addEventListener("click", () => {
        if (isAdmin && this.onScheduleTermCallback) {
          this.onScheduleTermCallback(course.id);
        } else {
          // Switch to terms tab for this course
          document.dispatchEvent(
            new CustomEvent("akademie:schedule-course", { detail: { courseId: course.id } })
          );
        }
      });

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
    if (!authApi.isAdmin()) {
      Toast.info("Pro vytváření kurzů se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    this.isEditing = false;
    this.editingCourseId = null;

    if (this.modalTitle) this.modalTitle.textContent = "Nový vzdělávací program";
    if (this.form) this.form.reset();
    if (this.formError) this.formError.style.display = "none";

    const idInput = document.getElementById("course-id") as HTMLInputElement | null;
    if (idInput) idInput.value = "";

    const accreditedInput = (document.getElementById("course-accredited") ||
      document.getElementById("course-is-accredited")) as HTMLInputElement | null;
    if (accreditedInput) accreditedInput.checked = false;

    Modal.open("modal-course");
  }

  private openEditModal(course: Course): void {
    if (!authApi.isAdmin()) {
      Toast.info("Pro úpravu kurzu se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    this.isEditing = true;
    this.editingCourseId = course.id;

    if (this.modalTitle) this.modalTitle.textContent = "Upravit vzdělávací program";
    if (this.formError) this.formError.style.display = "none";

    // Populate inputs
    const idInput = document.getElementById("course-id") as HTMLInputElement | null;
    const titleInput = document.getElementById("course-title") as HTMLInputElement | null;
    const annotationInput = document.getElementById(
      "course-annotation"
    ) as HTMLTextAreaElement | null;
    const hoursInput = document.getElementById("course-hours") as HTMLInputElement | null;
    const priceInput = document.getElementById("course-price") as HTMLInputElement | null;
    const accreditedInput = (document.getElementById("course-accredited") ||
      document.getElementById("course-is-accredited")) as HTMLInputElement | null;

    if (idInput) idInput.value = course.id;
    if (titleInput) titleInput.value = course.title;
    if (annotationInput) annotationInput.value = course.annotation;
    if (hoursInput) hoursInput.value = course.hours.toString();
    if (priceInput) priceInput.value = course.price.toString();
    if (accreditedInput) accreditedInput.checked = Boolean(course.isAccredited);

    Modal.open("modal-course");
  }

  private async handleSubmit(): Promise<void> {
    if (!authApi.isAdmin()) {
      Toast.error("Chyba: Pro uložení změn v katalogu se musíte přihlásit jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    try {
      const titleInput = document.getElementById("course-title") as HTMLInputElement | null;
      const annotationInput = document.getElementById(
        "course-annotation"
      ) as HTMLTextAreaElement | null;
      const hoursInput = document.getElementById("course-hours") as HTMLInputElement | null;
      const priceInput = document.getElementById("course-price") as HTMLInputElement | null;
      const accreditedInput = (document.getElementById("course-accredited") ||
        document.getElementById("course-is-accredited")) as HTMLInputElement | null;

      if (!titleInput || !annotationInput || !hoursInput || !priceInput) {
        throw new Error("Formulářové prvky se nepodařilo načíst.");
      }

      const payload: CreateCoursePayload = {
        title: titleInput.value.trim(),
        annotation: annotationInput.value.trim(),
        hours: parseInt(hoursInput.value, 10),
        price: parseFloat(priceInput.value),
        isAccredited: Boolean(accreditedInput?.checked),
      };

      if (this.isEditing && this.editingCourseId) {
        await coursesApi.update(this.editingCourseId, payload);
        Toast.success("Vzdělávací program byl úspěšně aktualizován.");
      } else {
        await coursesApi.create(payload);
        Toast.success("Nový vzdělávací program byl úspěšně vytvořen.");
      }

      this.isEditing = false;
      this.editingCourseId = null;
      Modal.close("modal-course");
      await this.load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Chyba při ukládání kurzu.";
      if (this.formError) {
        this.formError.textContent = msg;
        this.formError.style.display = "block";
      } else {
        Toast.error(msg);
      }
    }
  }

  private async handleDelete(course: Course): Promise<void> {
    if (!authApi.isAdmin()) {
      Toast.info("Pro smazání kurzu se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    const confirmed = confirm(
      `Opravdu si přejete smazat kurz "${course.title}"? Dojde ke smazání i všech souvisejících termínů!`
    );
    if (!confirmed) return;

    try {
      await coursesApi.delete(course.id);
      Toast.success(`Kurz "${course.title}" byl úspěšně odstraněn.`);
      await this.load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se smazat kurz.";
      Toast.error(msg);
    }
  }
}
