/**
 * Client Application - Akademie Trutnov Information System
 * Clean, responsive SPA interface adhering to 3-tier architecture with Tailwind CSS styling.
 */
document.addEventListener("DOMContentLoaded", () => {
  // Global application state
  let activeTab = "courses";
  let coursesData = [];
  let termsData = [];
  let selectedTermId = null;
  let selectedTeachingDayId = null;

  // ==================== THEME (DARK / LIGHT MODE) ====================
  const themeToggle = document.getElementById("theme-toggle");
  const iconMoon = themeToggle.querySelector(".icon-moon");
  const iconSun = themeToggle.querySelector(".icon-sun");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      iconMoon.classList.add("hidden");
      iconSun.classList.remove("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      iconMoon.classList.remove("hidden");
      iconSun.classList.add("hidden");
    }
    localStorage.setItem("akademie_theme", theme);
  }

  const savedTheme = localStorage.getItem("akademie_theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // ==================== TAB NAVIGATION ====================
  const navTabs = document.querySelectorAll(".nav-tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      navTabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(`[data-tab="${target}"]`).forEach(t => t.classList.add("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add("active");
      activeTab = target;

      if (target === "courses") loadCourses();
      if (target === "terms") loadTerms();
      if (target === "attendance") loadAttendanceTab();
      if (target === "certificates") loadCertificates();
      if (target === "lecturers") loadLecturersAndClassrooms();
      if (target === "analytics") loadAnalytics();
    });
  });

  // ==================== MODALS ====================
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      const m = document.getElementById(modalId);
      if (m) m.style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.style.display = "none";
    }
  });

  // ==================== TOAST NOTIFICATIONS ====================
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    const isSuccess = type === "success";
    toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs font-medium border flex flex-col gap-0.5 animate-fadeIn transition-all duration-300 ${
      isSuccess 
        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-emerald-500/50 shadow-emerald-500/10' 
        : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-500/50 shadow-rose-500/10'
    }`;
    toast.innerHTML = `
      <div class="font-bold flex items-center gap-1.5 ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">
        <span class="w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
        ${isSuccess ? 'Úspěch' : 'Upozornění'}
      </div>
      <div class="text-slate-600 dark:text-slate-300">${message}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ==================== TAB 1: COURSES ====================
  const coursesList = document.getElementById("courses-list");
  const filterSearchCourse = document.getElementById("filter-search-course");
  const filterChips = document.querySelectorAll(".filter-chip");
  const btnOpenCreateCourse = document.getElementById("btn-open-create-course");
  const modalCourse = document.getElementById("modal-course");
  const formCourse = document.getElementById("form-course");
  const formCourseError = document.getElementById("form-course-error");

  let courseFilterType = "all";

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => {
        c.className = "filter-chip px-3 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700";
      });
      chip.className = "filter-chip px-3 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold";
      courseFilterType = chip.getAttribute("data-filter");
      renderCourses();
    });
  });

  filterSearchCourse.addEventListener("input", () => renderCourses());

  btnOpenCreateCourse.addEventListener("click", () => {
    document.getElementById("modal-course-title").textContent = "Nový kurz";
    document.getElementById("course-id").value = "";
    formCourse.reset();
    formCourseError.style.display = "none";
    modalCourse.style.display = "flex";
  });

  async function loadCourses() {
    try {
      const res = await fetch("/api/courses");
      const json = await res.json();
      if (json.success) {
        coursesData = json.data;
        renderCourses();
      }
    } catch {
      showToast("Chyba při načítání kurzů.", "error");
    }
  }

  function renderCourses() {
    coursesList.innerHTML = "";
    const search = filterSearchCourse.value.toLowerCase().trim();

    const filtered = coursesData.filter(c => {
      if (courseFilterType === "accredited" && !c.isAccredited) return false;
      if (courseFilterType === "standard" && c.isAccredited) return false;
      if (search && !c.title.toLowerCase().includes(search) && !c.annotation.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      coursesList.innerHTML = `<div class="col-span-full py-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">Žádné kurzy neodpovídají zadanému filtru.</div>`;
      return;
    }

    filtered.forEach(course => {
      const card = document.createElement("div");
      card.className = "card-box flex flex-col justify-between";
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            ${course.isAccredited 
              ? '<span class="badge-chip badge-chip-green">Akreditováno MŠMT</span>' 
              : '<span class="badge-chip badge-chip-blue">Firemní školení</span>'}
            <span class="text-base font-bold text-slate-900 dark:text-white">${Number(course.price).toLocaleString("cs-CZ")} Kč</span>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">${course.title}</h3>
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
      coursesList.appendChild(card);
    });

    document.querySelectorAll(".btn-edit-course").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const c = coursesData.find(item => item.id === id);
        if (!c) return;
        document.getElementById("modal-course-title").textContent = "Upravit kurz";
        document.getElementById("course-id").value = c.id;
        document.getElementById("course-title").value = c.title;
        document.getElementById("course-annotation").value = c.annotation;
        document.getElementById("course-hours").value = c.hours;
        document.getElementById("course-price").value = c.price;
        document.getElementById("course-accredited").checked = c.isAccredited;
        formCourseError.style.display = "none";
        modalCourse.style.display = "flex";
      });
    });

    document.querySelectorAll(".btn-delete-course").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Opravdu chcete tento kurz smazat? Budou odstraněny i všechny navázané termíny.")) {
          try {
            const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
              showToast("Kurz byl úspěšně smazán.");
              loadCourses();
            } else {
              showToast(json.error || "Chyba při mazání kurzu.", "error");
            }
          } catch {
            showToast("Chyba při spojení se serverem.", "error");
          }
        }
      });
    });
  }

  formCourse.addEventListener("submit", async (e) => {
    e.preventDefault();
    formCourseError.style.display = "none";
    const id = document.getElementById("course-id").value;
    const payload = {
      title: document.getElementById("course-title").value.trim(),
      annotation: document.getElementById("course-annotation").value.trim(),
      hours: parseInt(document.getElementById("course-hours").value, 10),
      price: parseFloat(document.getElementById("course-price").value),
      isAccredited: document.getElementById("course-accredited").checked
    };

    try {
      const url = id ? `/api/courses/${id}` : "/api/courses";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(id ? "Kurz byl aktualizován." : "Nový kurz byl vytvořen.");
        modalCourse.style.display = "none";
        loadCourses();
      } else {
        formCourseError.textContent = json.error || "Chyba při ukládání kurzu.";
        formCourseError.style.display = "block";
      }
    } catch {
      formCourseError.textContent = "Chyba spojení se serverem.";
      formCourseError.style.display = "block";
    }
  });

  // ==================== TAB 2: TERMS & WAITLIST ====================
  const termsTableBody = document.getElementById("terms-table-body");
  const termDetailBox = document.getElementById("term-detail-box");
  const detailTermTitle = document.getElementById("detail-term-title");
  const detailTermInfo = document.getElementById("detail-term-info");
  const enrollmentsTableBody = document.getElementById("enrollments-table-body");
  const btnOpenCreateTerm = document.getElementById("btn-open-create-term");
  const modalTerm = document.getElementById("modal-term");
  const formTerm = document.getElementById("form-term");
  const formTermError = document.getElementById("form-term-error");

  const btnOpenEnroll = document.getElementById("btn-open-enroll");
  const modalEnrollment = document.getElementById("modal-enrollment");
  const formEnrollment = document.getElementById("form-enrollment");
  const formEnrollmentError = document.getElementById("form-enrollment-error");
  const enrollmentTermNotice = document.getElementById("enrollment-term-notice");

  btnOpenCreateTerm.addEventListener("click", async () => {
    formTerm.reset();
    formTermError.style.display = "none";
    await populateCourseAndVenueSelects();
    modalTerm.style.display = "flex";
  });

  btnOpenEnroll.addEventListener("click", () => {
    if (!selectedTermId) return;
    const term = termsData.find(t => t.id === selectedTermId);
    if (!term) return;

    formEnrollment.reset();
    formEnrollmentError.style.display = "none";
    document.getElementById("enrollment-term-id").value = term.id;
    const isFull = term.confirmedCount >= term.capacity;
    enrollmentTermNotice.innerHTML = `
      Termín: <strong>${term.courseTitle}</strong> (${term.startDate} až ${term.endDate})<br>
      Aktuální obsazenost: <strong>${term.confirmedCount} / ${term.capacity}</strong> míst.<br>
      ${isFull 
        ? '<span class="text-amber-600 dark:text-amber-400 font-semibold">Kapacita je plná! Student bude automaticky zařazen do pořadníku (Waiting list).</span>' 
        : '<span class="text-emerald-600 dark:text-emerald-400">Volná místa k dispozici – přihláška bude ihned potvrzena.</span>'}
    `;
    modalEnrollment.style.display = "flex";
  });

  async function loadTerms() {
    try {
      const res = await fetch("/api/terms");
      const json = await res.json();
      if (json.success) {
        termsData = json.data;
        renderTerms();
      }
    } catch {
      showToast("Chyba při načítání termínů.", "error");
    }
  }

  function renderTerms() {
    termsTableBody.innerHTML = "";
    if (termsData.length === 0) {
      termsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">Dosud nebyly vypsány žádné termíny.</td></tr>`;
      return;
    }

    termsData.forEach(t => {
      const isFull = t.confirmedCount >= t.capacity;
      const statusBadge = t.status === "COMPLETED"
        ? '<span class="badge-chip badge-chip-blue">Ukončen</span>'
        : isFull 
          ? '<span class="badge-chip badge-chip-yellow">Naplněno (Pořadník)</span>' 
          : '<span class="badge-chip badge-chip-green">Volná místa</span>';

      const lecturersText = t.lecturers && t.lecturers.length > 0 
        ? t.lecturers.map(l => l.name).join(", ") 
        : "Nepřiřazen";

      const tr = document.createElement("tr");
      if (t.id === selectedTermId) tr.classList.add("row-selected");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${t.courseTitle}</td>
        <td>${t.startDate} až ${t.endDate}</td>
        <td>${t.classroomName}</td>
        <td>
          <div class="font-semibold">${t.confirmedCount} / ${t.capacity} potvrzeno</div>
          ${t.waitlistCount > 0 ? `<div class="text-xs text-amber-600 dark:text-amber-400 font-medium">${t.waitlistCount} v pořadníku</div>` : ''}
        </td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${lecturersText}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-view-term" data-id="${t.id}">Přihlášky & Pořadník</button>
        </td>
      `;
      termsTableBody.appendChild(tr);
    });

    document.querySelectorAll(".btn-view-term").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        showTermDetail(id);
      });
    });
  }

  async function showTermDetail(termId) {
    selectedTermId = termId;
    renderTerms();
    const term = termsData.find(t => t.id === termId);
    if (!term) return;

    detailTermTitle.textContent = `Přihlášky a pořadník: ${term.courseTitle}`;
    detailTermInfo.textContent = `Termín: ${term.startDate} až ${term.endDate} • Učebna: ${term.classroomName} • Obsazenost: ${term.confirmedCount} / ${term.capacity} míst (V pořadníku: ${term.waitlistCount})`;
    termDetailBox.style.display = "block";

    try {
      const res = await fetch(`/api/terms/${termId}/enrollments`);
      const json = await res.json();
      if (json.success) {
        renderEnrollments(json.data);
      }
    } catch {
      showToast("Chyba při načítání přihlášek.", "error");
    }
  }

  function renderEnrollments(list) {
    enrollmentsTableBody.innerHTML = "";
    if (list.length === 0) {
      enrollmentsTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">Na tento termín se zatím nikdo nepřihlásil.</td></tr>`;
      return;
    }

    list.forEach(e => {
      let statusHtml = "";
      if (e.status === "CONFIRMED") {
        statusHtml = `<span class="badge-chip badge-chip-green">Potvrzena</span>`;
      } else if (e.status === "WAITLIST") {
        statusHtml = `<span class="badge-chip badge-chip-yellow">Náhradník #${e.waitlistPosition}</span>`;
      } else if (e.status === "CANCELLED") {
        statusHtml = `<span class="badge-chip badge-chip-red">Zrušena</span>`;
      } else if (e.status === "COMPLETED") {
        statusHtml = `<span class="badge-chip badge-chip-blue">Absolvováno</span>`;
      }

      const dateStr = new Date(e.submittedAt).toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" });
      const canCancel = e.status === "CONFIRMED" || e.status === "WAITLIST";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${e.studentName}</td>
        <td>${e.studentEmail}</td>
        <td class="text-xs">${e.studentPhone || '-'} ${e.studentOrganization ? `<span class="text-slate-400">(${e.studentOrganization})</span>` : ''}</td>
        <td class="text-xs text-slate-500">${dateStr}</td>
        <td>${statusHtml}</td>
        <td class="text-right">
          ${canCancel ? `<button class="btn-danger-tw btn-sm-tw btn-cancel-enroll" data-id="${e.id}">Zrušit účast</button>` : '<span class="text-slate-400">-</span>'}
        </td>
      `;
      enrollmentsTableBody.appendChild(tr);
    });

    document.querySelectorAll(".btn-cancel-enroll").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Opravdu zrušit tuto přihlášku? Pokud uvolníte potvrzené místo, automaticky postoupí první náhradník z pořadníku!")) {
          try {
            const res = await fetch(`/api/enrollments/${id}/cancel`, { method: "POST" });
            const json = await res.json();
            if (json.success) {
              showToast(json.message);
              loadTerms();
              showTermDetail(selectedTermId);
            } else {
              showToast(json.error || "Chyba při rušení přihlášky.", "error");
            }
          } catch {
            showToast("Chyba spojení se serverem.", "error");
          }
        }
      });
    });
  }

  async function populateCourseAndVenueSelects() {
    const courseSel = document.getElementById("term-course-select");
    const roomSel = document.getElementById("term-classroom-select");
    const lectSel = document.getElementById("term-lecturer-select");

    const [cRes, rRes, lRes] = await Promise.all([
      fetch("/api/courses"),
      fetch("/api/classrooms"),
      fetch("/api/lecturers")
    ]);
    const cJson = await cRes.json();
    const rJson = await rRes.json();
    const lJson = await lRes.json();

    courseSel.innerHTML = cJson.data.map(c => `<option value="${c.id}">${c.title} (${c.hours}h • ${c.price} Kč)</option>`).join("");
    roomSel.innerHTML = `<option value="">-- Bez učebny (bude upřesněno) --</option>` +
      rJson.data.map(r => `<option value="${r.id}">${r.name} (kapacita ${r.capacity})</option>`).join("");
    lectSel.innerHTML = `<option value="">-- Zvolte lektora --</option>` +
      lJson.data.map(l => `<option value="${l.id}">${l.name} (${l.specialization || 'Lektor'})</option>`).join("");
  }

  formTerm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formTermError.style.display = "none";
    const lectId = document.getElementById("term-lecturer-select").value;
    const payload = {
      courseId: document.getElementById("term-course-select").value,
      classroomId: document.getElementById("term-classroom-select").value || undefined,
      startDate: document.getElementById("term-start-date").value,
      endDate: document.getElementById("term-end-date").value,
      capacity: parseInt(document.getElementById("term-capacity").value, 10),
      lecturerIds: lectId ? [lectId] : undefined
    };

    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast("Nový termín byl úspěšně vypsán.");
        modalTerm.style.display = "none";
        loadTerms();
      } else {
        formTermError.textContent = json.error || "Chyba při vypisování termínu.";
        formTermError.style.display = "block";
      }
    } catch {
      formTermError.textContent = "Chyba spojení se serverem.";
      formTermError.style.display = "block";
    }
  });

  formEnrollment.addEventListener("submit", async (e) => {
    e.preventDefault();
    formEnrollmentError.style.display = "none";
    const termId = document.getElementById("enrollment-term-id").value;
    const payload = {
      firstName: document.getElementById("student-first-name").value.trim(),
      lastName: document.getElementById("student-last-name").value.trim(),
      email: document.getElementById("student-email").value.trim(),
      phone: document.getElementById("student-phone").value.trim() || undefined,
      organization: document.getElementById("student-organization").value.trim() || undefined,
      note: document.getElementById("student-note").value.trim() || undefined
    };

    try {
      const res = await fetch(`/api/terms/${termId}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        modalEnrollment.style.display = "none";
        loadTerms();
        showTermDetail(termId);
      } else {
        formEnrollmentError.textContent = json.error || "Chyba při přihlašování studenta.";
        formEnrollmentError.style.display = "block";
      }
    } catch {
      formEnrollmentError.textContent = "Chyba spojení se serverem.";
      formEnrollmentError.style.display = "block";
    }
  });

  // ==================== TAB 3: ATTENDANCE & TEACHING DAYS (ADR-01, ADR-05) ====================
  const attendanceTermSelect = document.getElementById("attendance-term-select");
  const teachingDaysTableBody = document.getElementById("teaching-days-table-body");
  const attendanceRosterBody = document.getElementById("attendance-roster-body");
  const attendanceSummaryTableBody = document.getElementById("attendance-summary-table-body");
  const btnOpenCreateDay = document.getElementById("btn-open-create-day");
  const btnSaveAttendance = document.getElementById("btn-save-attendance");
  const modalTeachingDay = document.getElementById("modal-teaching-day");
  const formTeachingDay = document.getElementById("form-teaching-day");
  const formTeachingDayError = document.getElementById("form-teaching-day-error");
  const attendanceDayTitle = document.getElementById("attendance-day-title");
  const attendanceDaySubtitle = document.getElementById("attendance-day-subtitle");
  const attendanceDaysCount = document.getElementById("attendance-days-count");

  async function loadAttendanceTab() {
    try {
      const res = await fetch("/api/terms");
      const json = await res.json();
      if (!json.success) return;

      attendanceTermSelect.innerHTML = json.data.map(t => `<option value="${t.id}">${t.courseTitle} (${t.startDate} až ${t.endDate})</option>`).join("");
      if (json.data.length > 0) {
        if (!selectedTermId || !json.data.some(t => t.id === selectedTermId)) {
          selectedTermId = json.data[0].id;
        }
        attendanceTermSelect.value = selectedTermId;
        loadTeachingDaysForTerm(selectedTermId);
      }
    } catch {
      showToast("Chyba při načítání termínů pro docházku.", "error");
    }
  }

  attendanceTermSelect.addEventListener("change", () => {
    selectedTermId = attendanceTermSelect.value;
    selectedTeachingDayId = null;
    loadTeachingDaysForTerm(selectedTermId);
  });

  btnOpenCreateDay.addEventListener("click", async () => {
    if (!selectedTermId) return;
    document.getElementById("day-term-id").value = selectedTermId;
    formTeachingDay.reset();
    formTeachingDayError.style.display = "none";

    const lRes = await fetch("/api/lecturers");
    const lJson = await lRes.json();
    const lSelect = document.getElementById("day-lecturer-select");
    lSelect.innerHTML = `<option value="">-- Zvolte lektora --</option>` +
      lJson.data.map(l => `<option value="${l.id}">${l.name}</option>`).join("");

    modalTeachingDay.style.display = "flex";
  });

  formTeachingDay.addEventListener("submit", async (e) => {
    e.preventDefault();
    formTeachingDayError.style.display = "none";
    const termId = document.getElementById("day-term-id").value;
    const payload = {
      dayDate: document.getElementById("day-date").value,
      hours: parseInt(document.getElementById("day-hours").value, 10),
      topic: document.getElementById("day-topic").value.trim(),
      lecturerId: document.getElementById("day-lecturer-select").value || undefined
    };

    try {
      const res = await fetch(`/api/attendance/terms/${termId}/days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast("Výukový den byl vytvořen.");
        modalTeachingDay.style.display = "none";
        loadTeachingDaysForTerm(termId);
      } else {
        formTeachingDayError.textContent = json.error || "Chyba při vytváření výukového dne.";
        formTeachingDayError.style.display = "block";
      }
    } catch {
      formTeachingDayError.textContent = "Chyba spojení se serverem.";
      formTeachingDayError.style.display = "block";
    }
  });

  async function loadTeachingDaysForTerm(termId) {
    try {
      const [daysRes, sumRes] = await Promise.all([
        fetch(`/api/attendance/terms/${termId}/days`),
        fetch(`/api/attendance/terms/${termId}/summary`)
      ]);
      const daysJson = await daysRes.json();
      const sumJson = await sumRes.json();

      if (daysJson.success) renderTeachingDays(daysJson.data);
      if (sumJson.success) renderAttendanceSummary(sumJson.data);
    } catch {
      showToast("Chyba při načítání výukových dnů.", "error");
    }
  }

  function renderTeachingDays(days) {
    teachingDaysTableBody.innerHTML = "";
    attendanceDaysCount.textContent = `${days.length} dnů`;

    if (days.length === 0) {
      teachingDaysTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">Tento termín zatím nemá vypsané žádné výukové dny.</td></tr>`;
      attendanceRosterBody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">Přidejte nejprve výukové dny tlačítkem výše.</td></tr>`;
      btnSaveAttendance.style.display = "none";
      return;
    }

    days.forEach(d => {
      const tr = document.createElement("tr");
      if (d.id === selectedTeachingDayId) tr.classList.add("row-selected");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${d.dayDate}</td>
        <td>${d.topic}</td>
        <td>${d.hours} hod.</td>
        <td class="text-xs text-slate-500">${d.lecturerName || 'Neuveden'}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-select-day" data-id="${d.id}" data-date="${d.dayDate}" data-topic="${d.topic}">
            Zapsat (${d.presentCount}/${d.attendanceCount})
          </button>
        </td>
      `;
      teachingDaysTableBody.appendChild(tr);
    });

    document.querySelectorAll(".btn-select-day").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const date = btn.getAttribute("data-date");
        const topic = btn.getAttribute("data-topic");
        loadAttendanceRoster(id, date, topic);
      });
    });

    if (!selectedTeachingDayId && days.length > 0) {
      loadAttendanceRoster(days[0].id, days[0].dayDate, days[0].topic);
    }
  }

  async function loadAttendanceRoster(dayId, dayDate, topic) {
    selectedTeachingDayId = dayId;
    attendanceDayTitle.textContent = `Prezenční listina: ${dayDate}`;
    attendanceDaySubtitle.textContent = `Téma: ${topic}`;
    btnSaveAttendance.style.display = "inline-flex";

    try {
      const res = await fetch(`/api/attendance/days/${dayId}`);
      const json = await res.json();
      if (json.success) renderRoster(json.data);
    } catch {
      showToast("Chyba při načítání docházky pro den.", "error");
    }
  }

  function renderRoster(students) {
    attendanceRosterBody.innerHTML = "";
    if (students.length === 0) {
      attendanceRosterBody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">Na tomto termínu nejsou žádní potvrzení studenti.</td></tr>`;
      btnSaveAttendance.style.display = "none";
      return;
    }

    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${s.studentName}</td>
        <td class="text-xs text-slate-500">${s.studentEmail}</td>
        <td>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="att-checkbox w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" data-student="${s.studentId}" ${s.isPresent ? 'checked' : ''}>
            <span class="text-xs font-semibold ${s.isPresent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">${s.isPresent ? 'Přítomen' : 'Nepřítomen'}</span>
          </label>
        </td>
        <td>
          <input type="text" class="att-note input-tw py-1 text-xs" data-student="${s.studentId}" value="${s.note || ''}" placeholder="Poznámka / omluva...">
        </td>
      `;
      attendanceRosterBody.appendChild(tr);
    });
  }

  btnSaveAttendance.addEventListener("click", async () => {
    if (!selectedTeachingDayId) return;
    const checkboxes = document.querySelectorAll(".att-checkbox");
    let count = 0;

    for (const cb of checkboxes) {
      const studentId = cb.getAttribute("data-student");
      const isPresent = cb.checked;
      const noteInput = document.querySelector(`.att-note[data-student="${studentId}"]`);
      const note = noteInput ? noteInput.value.trim() : "";

      await fetch(`/api/attendance/days/${selectedTeachingDayId}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, isPresent, note })
      });
      count++;
    }

    showToast(`Docházka byla uložena pro ${count} studentů.`);
    loadTeachingDaysForTerm(selectedTermId);
  });

  function renderAttendanceSummary(summary) {
    attendanceSummaryTableBody.innerHTML = "";
    if (summary.length === 0) {
      attendanceSummaryTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">Žádní potvrzení studenti k zobrazení.</td></tr>`;
      return;
    }

    summary.forEach(s => {
      const qualifiesBadge = s.qualifiesForCertificate
        ? `<span class="badge-chip badge-chip-green">Splněno (${s.attendancePercentage} %)</span>`
        : `<span class="badge-chip badge-chip-red">Nesplněno (${s.attendancePercentage} %)</span>`;

      const certBadge = s.certificateIssued
        ? `<span class="badge-chip badge-chip-blue font-mono">Vystaveno (${s.certificateNumber})</span>`
        : s.qualifiesForCertificate
          ? `<span class="badge-chip badge-chip-yellow">Čeká na vystavení</span>`
          : `<span class="badge-chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Vyžaduje výjimku</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${s.studentName}</td>
        <td class="text-xs text-slate-500">${s.studentEmail}</td>
        <td class="text-xs">${s.attendedDays} z ${s.totalDays} dnů</td>
        <td class="font-bold">${s.attendancePercentage} %</td>
        <td>${qualifiesBadge}</td>
        <td>${certBadge}</td>
      `;
      attendanceSummaryTableBody.appendChild(tr);
    });
  }

  // ==================== TAB 4: CERTIFICATES & ABSOLVENTI (ADR-01) ====================
  const certificatesTableBody = document.getElementById("certificates-table-body");
  const completeTermSelect = document.getElementById("complete-term-select");
  const btnCompleteTerm = document.getElementById("btn-complete-term");
  const btnOpenIssueWaiver = document.getElementById("btn-open-issue-waiver");
  const modalWaiver = document.getElementById("modal-waiver");
  const formWaiver = document.getElementById("form-waiver");
  const formWaiverError = document.getElementById("form-waiver-error");
  const waiverEnrollmentSelect = document.getElementById("waiver-enrollment-select");

  async function loadCertificates() {
    try {
      const [certRes, termRes] = await Promise.all([
        fetch("/api/certificates"),
        fetch("/api/terms")
      ]);
      const certJson = await certRes.json();
      const termJson = await termRes.json();

      if (certJson.success) renderCertificates(certJson.data);
      if (termJson.success) {
        completeTermSelect.innerHTML = `<option value="">-- Zvolte termín k uzavření --</option>` +
          termJson.data.map(t => `<option value="${t.id}">${t.courseTitle} (${t.status})</option>`).join("");
      }
    } catch {
      showToast("Chyba při načítání osvědčení.", "error");
    }
  }

  function renderCertificates(list) {
    certificatesTableBody.innerHTML = "";
    if (list.length === 0) {
      certificatesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">Zatím nebyla vystavena žádná osvědčení.</td></tr>`;
      return;
    }

    list.forEach(c => {
      const waiverHtml = c.hasWaiver
        ? `<span class="badge-chip badge-chip-yellow" title="${c.waiverReason || ''}">Lektorská výjimka (ADR-01)</span>`
        : `<span class="badge-chip badge-chip-green">Standardní (≥ 70 %)</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong class="text-blue-600 dark:text-blue-400 font-mono text-sm tracking-wide">${c.certificateNumber}</strong></td>
        <td><strong class="text-slate-900 dark:text-white">${c.studentName}</strong><br><span class="text-xs text-slate-400">${c.studentEmail}</span></td>
        <td>${c.courseTitle}</td>
        <td class="text-xs text-slate-500">${c.issueDate}</td>
        <td><strong class="text-slate-900 dark:text-white">${c.attendanceRate} %</strong></td>
        <td>${waiverHtml}</td>
      `;
      certificatesTableBody.appendChild(tr);
    });
  }

  btnCompleteTerm.addEventListener("click", async () => {
    const termId = completeTermSelect.value;
    if (!termId) {
      showToast("Nejprve vyberte termín kurzu k uzavření.", "error");
      return;
    }

    if (confirm("Opravdu chcete uzavřít tento termín? Systém automaticky vystaví certifikáty všem studentům, kteří splnili alespoň 70% docházku!")) {
      try {
        const res = await fetch(`/api/terms/${termId}/complete`, { method: "POST" });
        const json = await res.json();
        if (json.success) {
          showToast(json.message);
          loadCertificates();
        } else {
          showToast(json.error || "Chyba při uzavírání termínu.", "error");
        }
      } catch {
        showToast("Chyba spojení se serverem.", "error");
      }
    }
  });

  btnOpenIssueWaiver.addEventListener("click", async () => {
    formWaiver.reset();
    formWaiverError.style.display = "none";

    try {
      const res = await fetch("/api/terms");
      const json = await res.json();
      if (!json.success) return;

      waiverEnrollmentSelect.innerHTML = `<option value="">Načítám studenty...</option>`;
      modalWaiver.style.display = "flex";

      let options = "";
      for (const t of json.data) {
        const eRes = await fetch(`/api/terms/${t.id}/enrollments`);
        const eJson = await eRes.json();
        if (eJson.success) {
          for (const enr of eJson.data) {
            if (enr.status === "CONFIRMED" || enr.status === "COMPLETED") {
              options += `<option value="${enr.id}">${enr.studentName} – ${t.courseTitle} (${enr.studentEmail})</option>`;
            }
          }
        }
      }

      waiverEnrollmentSelect.innerHTML = options || `<option value="">Žádní způsobilí studenti</option>`;
    } catch {
      showToast("Chyba při načítání přihlášek pro výjimku.", "error");
    }
  });

  formWaiver.addEventListener("submit", async (e) => {
    e.preventDefault();
    formWaiverError.style.display = "none";
    const enrollmentId = waiverEnrollmentSelect.value;
    const waiverReason = document.getElementById("waiver-reason").value.trim();

    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          hasWaiver: true,
          waiverReason
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Osvědčení č. ${json.data.certificateNumber} bylo úspěšně vystaveno na základě výjimky!`);
        modalWaiver.style.display = "none";
        loadCertificates();
      } else {
        formWaiverError.textContent = json.error || "Chyba při vystavování osvědčení.";
        formWaiverError.style.display = "block";
      }
    } catch {
      formWaiverError.textContent = "Chyba spojení se serverem.";
      formWaiverError.style.display = "block";
    }
  });

  // ==================== TAB 5: LECTURERS & CLASSROOMS ====================
  const lecturersTableBody = document.getElementById("lecturers-table-body");
  const classroomsTableBody = document.getElementById("classrooms-table-body");

  async function loadLecturersAndClassrooms() {
    try {
      const [lRes, cRes] = await Promise.all([
        fetch("/api/lecturers"),
        fetch("/api/classrooms")
      ]);
      const lJson = await lRes.json();
      const cJson = await cRes.json();

      if (lJson.success) renderLecturers(lJson.data);
      if (cJson.success) renderClassrooms(cJson.data);
    } catch {
      showToast("Chyba při načítání lektorů a učeben.", "error");
    }
  }

  function renderLecturers(list) {
    lecturersTableBody.innerHTML = "";
    list.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${l.name}</td>
        <td>${l.email}<br><span class="text-xs text-slate-400">${l.phone || '-'}</span></td>
        <td class="text-xs">${l.specialization || 'Neuvedena'}</td>
        <td><strong class="text-blue-600 dark:text-blue-400">${l.taughtHours} hod.</strong> <span class="text-xs text-slate-400">(${l.termCount} termínů)</span></td>
      `;
      lecturersTableBody.appendChild(tr);
    });
  }

  function renderClassrooms(list) {
    classroomsTableBody.innerHTML = "";
    list.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-bold text-slate-900 dark:text-white">${c.name}</td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${c.address}</td>
        <td><span class="badge-chip badge-chip-blue font-bold">${c.capacity} studentů</span></td>
      `;
      classroomsTableBody.appendChild(tr);
    });
  }

  // ==================== TAB 6: ANALYTICS & REPORTS ====================
  const analyticsTermsList = document.getElementById("analytics-terms-list");
  const analyticsLecturersList = document.getElementById("analytics-lecturers-list");
  const analyticsStudentsList = document.getElementById("analytics-students-list");
  const btnRefreshAnalytics = document.getElementById("btn-refresh-analytics");

  btnRefreshAnalytics.addEventListener("click", () => loadAnalytics());

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) renderAnalytics(json.data);
    } catch {
      showToast("Chyba při načítání manažerských výkazů.", "error");
    }
  }

  function renderAnalytics(data) {
    // 1. Term capacities
    analyticsTermsList.innerHTML = "";
    data.termStats.forEach(t => {
      const bar = document.createElement("div");
      bar.className = "p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60";
      bar.innerHTML = `
        <div class="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span class="font-bold text-slate-900 dark:text-white">${t.courseTitle} <span class="font-normal text-slate-400">(${t.period})</span></span>
          <span>${t.confirmed} / ${t.capacity} (${t.fillRate} %) ${t.waitlist > 0 ? `• <span class="text-amber-500 font-bold">${t.waitlist} v pořadníku</span>` : ''}</span>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600 rounded-full transition-all duration-300" style="width: ${Math.min(100, t.fillRate)}%;"></div>
        </div>
      `;
      analyticsTermsList.appendChild(bar);
    });

    // 2. Lecturer hours
    analyticsLecturersList.innerHTML = "";
    data.lecturerStats.forEach(l => {
      const item = document.createElement("div");
      item.className = "p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs";
      item.innerHTML = `
        <span class="font-bold text-slate-900 dark:text-white">${l.name}</span>
        <span class="font-semibold text-blue-600 dark:text-blue-400">${l.taughtHours} odučených hodin <span class="font-normal text-slate-400">(${l.termCount} termínů)</span></span>
      `;
      analyticsLecturersList.appendChild(item);
    });

    // 3. Multi-course students
    analyticsStudentsList.innerHTML = "";
    if (data.multiCourseStudents.length === 0) {
      analyticsStudentsList.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">V tomto roce zatím žádný student neabsolvoval více než 1 kurz.</div>`;
    } else {
      data.multiCourseStudents.forEach(s => {
        const item = document.createElement("div");
        item.className = "p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs";
        item.innerHTML = `
          <div>
            <strong class="text-slate-900 dark:text-white">${s.student}</strong> (${s.email}) ${s.organization ? `• ${s.organization}` : ''}
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Zapsané kurzy: ${s.courses.join(", ")}
            </div>
          </div>
          <span class="badge-chip badge-chip-green self-start sm:self-auto">${s.courseCount} kurzy</span>
        `;
        analyticsStudentsList.appendChild(item);
      });
    }
  }

  // Initial load
  loadCourses();
});
