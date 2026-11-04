/**
 * Client Application - Akademie Trutnov Information System
 * Clean, responsive SPA interface adhering to 3-tier architecture.
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
    localStorage.setItem("akademie_theme", theme);
    if (theme === "dark") {
      iconMoon.style.display = "none";
      iconSun.style.display = "block";
    } else {
      iconMoon.style.display = "block";
      iconSun.style.display = "none";
    }
  }

  const savedTheme = localStorage.getItem("akademie_theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // ==================== TAB NAVIGATION ====================
  const navTabs = document.querySelectorAll(".nav-tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      navTabs.forEach(t => t.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${target}`).classList.add("active");
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
      document.getElementById(modalId).style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      e.target.style.display = "none";
    }
  });

  // ==================== TOAST NOTIFICATIONS ====================
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 2px;">${type === "success" ? "Úspěch" : "Chyba"}</div>
      <div>${message}</div>
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
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
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
    } catch (e) {
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
      coursesList.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Žádné kurzy neodpovídají zadanému filtru.</div>`;
      return;
    }

    filtered.forEach(course => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-header">
          <span class="badge ${course.isAccredited ? 'badge-accredited' : 'badge-standard'}">
            ${course.isAccredited ? 'Akreditováno MŠMT' : 'Firemní školení'}
          </span>
          <span class="card-price">${Number(course.price).toLocaleString("cs-CZ")} Kč</span>
        </div>
        <h3 class="card-title">${course.title}</h3>
        <p class="card-desc">${course.annotation}</p>
        <div class="card-footer">
          <span class="card-hours">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${course.hours} hodin výuky
          </span>
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary btn-edit-course" data-id="${course.id}">Upravit</button>
            <button class="btn btn-sm btn-danger btn-delete-course" data-id="${course.id}">Smazat</button>
          </div>
        </div>
      `;
      coursesList.appendChild(card);
    });

    // Edit course handlers
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

    // Delete course handlers
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
      ${isFull ? '<span style="color:var(--warning); font-weight:600;">Kapacita je plná! Student bude automaticky zařazen do pořadníku (Waiting list).</span>' : '<span style="color:var(--success);">Volná místa k dispozici – přihláška bude ihned potvrzena.</span>'}
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
      termsTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Dosud nebyly vypsány žádné termíny.</td></tr>`;
      return;
    }

    termsData.forEach(t => {
      const isFull = t.confirmedCount >= t.capacity;
      const statusBadge = t.status === "COMPLETED"
        ? '<span class="badge" style="background:#e0f2fe; color:#0369a1;">Ukončen</span>'
        : isFull 
          ? '<span class="badge badge-warning">Naplněno (Pořadník)</span>' 
          : '<span class="badge badge-success">Volná místa</span>';

      const lecturersText = t.lecturers && t.lecturers.length > 0 
        ? t.lecturers.map(l => l.name).join(", ") 
        : "Nepřiřazen";

      const tr = document.createElement("tr");
      if (t.id === selectedTermId) tr.classList.add("row-selected");
      tr.innerHTML = `
        <td><strong>${t.courseTitle}</strong></td>
        <td>${t.startDate} až ${t.endDate}</td>
        <td>${t.classroomName}</td>
        <td>
          <div style="font-weight:600;">${t.confirmedCount} / ${t.capacity} potvrzeno</div>
          ${t.waitlistCount > 0 ? `<div style="font-size:12px; color:var(--warning);">${t.waitlistCount} v pořadníku</div>` : ''}
        </td>
        <td>${lecturersText}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-secondary btn-view-term" data-id="${t.id}">Přihlášky & Pořadník</button>
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
      enrollmentsTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Na tento termín se zatím nikdo nepřihlásil.</td></tr>`;
      return;
    }

    list.forEach(e => {
      let statusHtml = "";
      if (e.status === "CONFIRMED") {
        statusHtml = `<span class="badge badge-success">Potvrzena</span>`;
      } else if (e.status === "WAITLIST") {
        statusHtml = `<span class="badge badge-warning">Náhradník #${e.waitlistPosition}</span>`;
      } else if (e.status === "CANCELLED") {
        statusHtml = `<span class="badge badge-danger">Zrušena</span>`;
      } else if (e.status === "COMPLETED") {
        statusHtml = `<span class="badge" style="background:#e0f2fe; color:#0369a1;">Absolvováno</span>`;
      }

      const dateStr = new Date(e.submittedAt).toLocaleString("cs-CZ", { dateStyle: "short", timeStyle: "short" });
      const canCancel = e.status === "CONFIRMED" || e.status === "WAITLIST";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${e.studentName}</strong></td>
        <td>${e.studentEmail}</td>
        <td>${e.studentPhone || '-'} ${e.studentOrganization ? `(${e.studentOrganization})` : ''}</td>
        <td>${dateStr}</td>
        <td>${statusHtml}</td>
        <td class="text-right">
          ${canCancel ? `<button class="btn btn-sm btn-danger btn-cancel-enroll" data-id="${e.id}">Zrušit účast</button>` : '-'}
        </td>
      `;
      enrollmentsTableBody.appendChild(tr);
    });

    // Cancel enrollment with waitlist cascading (ADR-02)
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
      teachingDaysTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Tento termín zatím nemá vypsané žádné výukové dny.</td></tr>`;
      attendanceRosterBody.innerHTML = `<tr><td colspan="4" class="empty-state">Přidejte nejprve výukové dny tlačítkem výše.</td></tr>`;
      btnSaveAttendance.style.display = "none";
      return;
    }

    days.forEach(d => {
      const tr = document.createElement("tr");
      if (d.id === selectedTeachingDayId) tr.classList.add("row-selected");
      tr.innerHTML = `
        <td><strong>${d.dayDate}</strong></td>
        <td>${d.topic}</td>
        <td>${d.hours} hod.</td>
        <td>${d.lecturerName || 'Neuveden'}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-secondary btn-select-day" data-id="${d.id}" data-date="${d.dayDate}" data-topic="${d.topic}">
            Zapsat docházku (${d.presentCount}/${d.attendanceCount})
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

    // Auto-select first day if none selected
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
      attendanceRosterBody.innerHTML = `<tr><td colspan="4" class="empty-state">Na tomto termínu nejsou žádní potvrzení studenti.</td></tr>`;
      btnSaveAttendance.style.display = "none";
      return;
    }

    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${s.studentName}</strong></td>
        <td>${s.studentEmail}</td>
        <td>
          <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" class="att-checkbox" data-student="${s.studentId}" ${s.isPresent ? 'checked' : ''}>
            <span>${s.isPresent ? 'Přítomen' : 'Nepřítomen'}</span>
          </label>
        </td>
        <td>
          <input type="text" class="att-note" data-student="${s.studentId}" value="${s.note || ''}" placeholder="Poznámka / omluva..." style="padding:4px 8px; font-size:12px; border-radius:4px; border:1px solid var(--border); width:100%;">
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
      attendanceSummaryTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Žádní potvrzení studenti k zobrazení.</td></tr>`;
      return;
    }

    summary.forEach(s => {
      const qualifiesBadge = s.qualifiesForCertificate
        ? `<span class="badge badge-success">Splněno (${s.attendancePercentage} %)</span>`
        : `<span class="badge badge-danger">Nesplněno (${s.attendancePercentage} %)</span>`;

      const certBadge = s.certificateIssued
        ? `<span class="badge" style="background:#e0f2fe; color:#0369a1;">Vystaveno (${s.certificateNumber})</span>`
        : s.qualifiesForCertificate
          ? `<span class="badge badge-warning">Čeká na vystavení</span>`
          : `<span class="badge" style="background:var(--bg-subtle);">Vyžaduje výjimku</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${s.studentName}</strong></td>
        <td>${s.studentEmail}</td>
        <td>${s.attendedDays} z ${s.totalDays} dnů</td>
        <td><strong>${s.attendancePercentage} %</strong></td>
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
      certificatesTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Zatím nebyla vystavena žádná osvědčení.</td></tr>`;
      return;
    }

    list.forEach(c => {
      const waiverHtml = c.hasWaiver
        ? `<span class="badge badge-warning" title="${c.waiverReason || ''}">Lektorská výjimka (ADR-01)</span>`
        : `<span class="badge badge-success">Standardní (≥ 70 %)</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color:var(--primary); font-family:monospace; font-size:14px;">${c.certificateNumber}</strong></td>
        <td><strong>${c.studentName}</strong><br><span style="font-size:12px; color:var(--text-muted);">${c.studentEmail}</span></td>
        <td>${c.courseTitle}</td>
        <td>${c.issueDate}</td>
        <td><strong>${c.attendanceRate} %</strong></td>
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
      // Find students who don't have certificates yet across terms
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
        <td><strong>${l.name}</strong></td>
        <td>${l.email}<br><span style="font-size:12px; color:var(--text-muted);">${l.phone || '-'}</span></td>
        <td>${l.specialization || 'Neuvedena'}</td>
        <td><strong>${l.taughtHours} hod.</strong> (${l.termCount} termínů)</td>
      `;
      lecturersTableBody.appendChild(tr);
    });
  }

  function renderClassrooms(list) {
    classroomsTableBody.innerHTML = "";
    list.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${c.name}</strong></td>
        <td>${c.address}</td>
        <td><span class="badge badge-standard">${c.capacity} studentů</span></td>
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
      bar.className = "analytics-item";
      bar.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
          <span><strong>${t.courseTitle}</strong> (${t.period})</span>
          <span>${t.confirmed} / ${t.capacity} (${t.fillRate} %) ${t.waitlist > 0 ? `• <span style="color:var(--warning);">${t.waitlist} v pořadníku</span>` : ''}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${Math.min(100, t.fillRate)}%;"></div>
        </div>
      `;
      analyticsTermsList.appendChild(bar);
    });

    // 2. Lecturer hours
    analyticsLecturersList.innerHTML = "";
    data.lecturerStats.forEach(l => {
      const item = document.createElement("div");
      item.className = "analytics-item";
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:13px;">
          <span><strong>${l.name}</strong></span>
          <span><strong>${l.taughtHours} odučených hodin</strong> (${l.termCount} vyučovaných termínů)</span>
        </div>
      `;
      analyticsLecturersList.appendChild(item);
    });

    // 3. Multi-course students
    analyticsStudentsList.innerHTML = "";
    if (data.multiCourseStudents.length === 0) {
      analyticsStudentsList.innerHTML = `<div class="empty-state">V tomto roce zatím žádný student neabsolvoval více než 1 kurz.</div>`;
    } else {
      data.multiCourseStudents.forEach(s => {
        const item = document.createElement("div");
        item.className = "analytics-item";
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${s.student}</strong> (${s.email}) ${s.organization ? `• ${s.organization}` : ''}
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                Zapsané kurzy: ${s.courses.join(", ")}
              </div>
            </div>
            <span class="badge badge-success">${s.courseCount} kurzy</span>
          </div>
        `;
        analyticsStudentsList.appendChild(item);
      });
    }
  }

  // Initial load
  loadCourses();
});
