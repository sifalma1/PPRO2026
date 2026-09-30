/**
 * Klientská logika pro správu kurzů (Akademie Trutnov Demo)
 */
document.addEventListener("DOMContentLoaded", () => {
  // Stav aplikace
  let coursesState = [];
  let currentFilter = "all";
  let searchQuery = "";
  let searchDebounceTimer = null;

  // DOM elementy
  const coursesGrid = document.getElementById("courses-grid");
  const loadingSpinner = document.getElementById("loading-spinner");
  const emptyState = document.getElementById("empty-state");
  const inputSearch = document.getElementById("input-search");
  const btnClearSearch = document.getElementById("btn-clear-search");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const btnCreateKurz = document.getElementById("btn-create-kurz");
  
  // Modální okno
  const modalKurz = document.getElementById("modal-kurz");
  const modalTitle = document.getElementById("modal-title");
  const modalClose = document.getElementById("modal-close");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const kurzForm = document.getElementById("kurz-form");
  const formError = document.getElementById("form-error");

  // Formulářové prvky
  const formKurzId = document.getElementById("form-kurz-id");
  const formNazev = document.getElementById("form-nazev");
  const formAnotace = document.getElementById("form-anotace");
  const formRozsah = document.getElementById("form-rozsah");
  const formCena = document.getElementById("form-cena");
  const formAkreditovany = document.getElementById("form-akreditovany");

  // Statistiky
  const statTotalCourses = document.getElementById("stat-total-courses");
  const statAccreditedCourses = document.getElementById("stat-accredited-courses");
  const statTotalHours = document.getElementById("stat-total-hours");

  /**
   * Načtení kurzů z backend REST API
   */
  async function loadCourses() {
    showLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilter === "accredited") params.append("akreditovany", "true");
      if (currentFilter === "standard") params.append("akreditovany", "false");
      if (searchQuery.trim().length > 0) params.append("search", searchQuery.trim());

      const url = `/api/kurzy?${params.toString()}`;
      const response = await fetch(url);
      const json = await response.json();

      if (json.success) {
        coursesState = json.data;
        renderCourses(coursesState);
        updateStatistics();
      } else {
        showToast("Chyba při načítání kurzů: " + json.error, "error");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Nepodařilo se připojit k serveru.", "error");
    } finally {
      showLoading(false);
    }
  }

  /**
   * Vykreslení karet kurzů v gridu
   */
  function renderCourses(courses) {
    coursesGrid.innerHTML = "";

    if (courses.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    courses.forEach(course => {
      const card = document.createElement("div");
      card.className = `course-card ${course.jeAkreditovany ? "is-accredited" : ""}`;

      const badgeHtml = course.jeAkreditovany
        ? `<span class="course-badge badge-accredited">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
             Akreditováno MŠMT
           </span>`
        : `<span class="course-badge badge-standard">Firemní vzdělávání</span>`;

      const formattedPrice = new Intl.NumberFormat("cs-CZ", {
        style: "currency",
        currency: "CZK",
        maximumFractionDigits: 0
      }).format(course.cena);

      card.innerHTML = `
        <div class="card-content">
          <div class="card-top">
            ${badgeHtml}
          </div>
          <h3 class="course-title">${escapeHtml(course.nazev)}</h3>
          <p class="course-annotation">${escapeHtml(course.anotace)}</p>
        </div>

        <div class="card-bottom">
          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">Rozsah</span>
              <span class="meta-val">${course.rozsahHodin} hod.</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Cena kurzu</span>
              <span class="meta-val meta-price">${formattedPrice}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-edit-outline" data-id="${course.id}" title="Upravit kurz">
              ✏️ Upravit
            </button>
            <button class="btn btn-danger-outline" data-id="${course.id}" data-name="${escapeHtml(course.nazev)}" title="Smazat kurz">
              🗑️ Smazat
            </button>
          </div>
        </div>
      `;

      // Event listenery pro akční tlačítka
      const editBtn = card.querySelector(".btn-edit-outline");
      editBtn.addEventListener("click", () => openEditModal(course));

      const deleteBtn = card.querySelector(".btn-danger-outline");
      deleteBtn.addEventListener("click", () => handleDeleteCourse(course.id, course.nazev));

      coursesGrid.appendChild(card);
    });
  }

  /**
   * Přepočet souhrnných statistik
   */
  function updateStatistics() {
    const total = coursesState.length;
    const accredited = coursesState.filter(c => c.jeAkreditovany).length;
    const totalHours = coursesState.reduce((sum, c) => sum + (c.rozsahHodin || 0), 0);

    statTotalCourses.textContent = total;
    statAccreditedCourses.textContent = accredited;
    statTotalHours.textContent = `${totalHours} hod.`;
  }

  /**
   * Otevření modálu pro nový kurz
   */
  function openCreateModal() {
    modalTitle.textContent = "Založit nový vzdělávací kurz";
    formKurzId.value = "";
    kurzForm.reset();
    formError.style.display = "none";
    modalKurz.style.display = "flex";
    formNazev.focus();
  }

  /**
   * Otevření modálu pro editaci existujícího kurzu
   */
  function openEditModal(course) {
    modalTitle.textContent = "Upravit parametry kurzu";
    formKurzId.value = course.id;
    formNazev.value = course.nazev;
    formAnotace.value = course.anotace;
    formRozsah.value = course.rozsahHodin;
    formCena.value = course.cena;
    formAkreditovany.checked = course.jeAkreditovany;
    formError.style.display = "none";
    modalKurz.style.display = "flex";
    formNazev.focus();
  }

  /**
   * Zavření modálu
   */
  function closeModal() {
    modalKurz.style.display = "none";
    formError.style.display = "none";
    kurzForm.reset();
  }

  /**
   * Odeslání formuláře (Create / Update)
   */
  kurzForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.style.display = "none";

    const id = formKurzId.value.trim();
    const payload = {
      nazev: formNazev.value.trim(),
      anotace: formAnotace.value.trim(),
      rozsahHodin: parseInt(formRozsah.value, 10),
      cena: parseFloat(formCena.value),
      jeAkreditovany: formAkreditovany.checked
    };

    try {
      const isEdit = id.length > 0;
      const url = isEdit ? `/api/kurzy/${id}` : "/api/kurzy";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Operace se nezdařila.");
      }

      showToast(isEdit ? "Kurz byl úspěšně upraven." : "Nový kurz byl úspěšně vytvořen.", "success");
      closeModal();
      await loadCourses();
    } catch (err) {
      formError.textContent = err.message;
      formError.style.display = "block";
    }
  });

  /**
   * Smazání kurzu s potvrzením
   */
  async function handleDeleteCourse(id, name) {
    if (!confirm(`Opravdu si přejete smazat kurz "${name}"? Tato akce je nevratná.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/kurzy/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        showToast("Kurz byl smazán.", "success");
        await loadCourses();
      } else {
        showToast("Chyba při mazání: " + json.error, "error");
      }
    } catch (err) {
      showToast("Chyba při komunikaci se serverem.", "error");
    }
  }

  /**
   * Zobrazení toast notifikace
   */
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === "success" ? "✓" : "⚠️"}</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function showLoading(show) {
    loadingSpinner.style.display = show ? "block" : "none";
    if (show) {
      coursesGrid.style.opacity = "0.5";
    } else {
      coursesGrid.style.opacity = "1";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  }

  // Event Listenery
  btnCreateKurz.addEventListener("click", openCreateModal);
  modalClose.addEventListener("click", closeModal);
  modalCancelBtn.addEventListener("click", closeModal);
  modalKurz.addEventListener("click", (e) => {
    if (e.target === modalKurz) closeModal();
  });

  // Filtrační taby
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.getAttribute("data-filter");
      loadCourses();
    });
  });

  // Vyhledávání s debouncem
  inputSearch.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    btnClearSearch.style.display = searchQuery.length > 0 ? "block" : "none";
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadCourses();
    }, 300);
  });

  btnClearSearch.addEventListener("click", () => {
    inputSearch.value = "";
    searchQuery = "";
    btnClearSearch.style.display = "none";
    loadCourses();
  });

  // Klávesová zkratka Escape pro zavření modálu
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalKurz.style.display === "flex") {
      closeModal();
    }
  });

  // Úvodní načtení dat
  loadCourses();
});
