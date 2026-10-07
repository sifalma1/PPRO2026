/**
 * Klientská aplikace Akademie Trutnov – přehledná správa kurzů a agendy
 */
document.addEventListener("DOMContentLoaded", () => {
  // Stav aplikace
  let activeTab = "kurzy";
  let kurzyData = [];
  let terminyData = [];
  let selectedTerminId = null;

  // Záložky
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

      if (target === "kurzy") loadKurzy();
      if (target === "terminy") loadTerminy();
      if (target === "lektori") loadLektoriAndUcebny();
      if (target === "prehledy") loadAnalytics();
    });
  });

  // ==================== MODÁLNÍ OKNA ====================
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

  // ==================== ZÁLOŽKA 1: KURZY ====================
  const kurzyList = document.getElementById("kurzy-list");
  const filterSearchKurz = document.getElementById("filter-search-kurz");
  const filterChips = document.querySelectorAll(".filter-chip");
  const btnOpenCreateKurz = document.getElementById("btn-open-create-kurz");
  const modalKurz = document.getElementById("modal-kurz");
  const formKurz = document.getElementById("form-kurz");
  const formKurzError = document.getElementById("form-kurz-error");

  let kurzFilterType = "all";

  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      kurzFilterType = chip.getAttribute("data-filter");
      renderKurzy();
    });
  });

  filterSearchKurz.addEventListener("input", () => renderKurzy());

  btnOpenCreateKurz.addEventListener("click", () => {
    document.getElementById("modal-kurz-title").textContent = "Nový kurz";
    document.getElementById("kurz-id").value = "";
    formKurz.reset();
    formKurzError.style.display = "none";
    modalKurz.style.display = "flex";
  });

  async function loadKurzy() {
    try {
      const res = await fetch("/api/kurzy");
      const json = await res.json();
      if (json.success) {
        kurzyData = json.data;
        renderKurzy();
      }
    } catch (e) {
      showToast("Chyba při načítání kurzů.", "error");
    }
  }

  function renderKurzy() {
    kurzyList.innerHTML = "";
    const q = filterSearchKurz.value.toLowerCase().trim();

    const filtered = kurzyData.filter(k => {
      if (kurzFilterType === "accredited" && !k.jeAkreditovany) return false;
      if (kurzFilterType === "standard" && k.jeAkreditovany) return false;
      if (q && !k.nazev.toLowerCase().includes(q) && !k.anotace.toLowerCase().includes(q)) return false;
      return true;
    });

    if (filtered.length === 0) {
      kurzyList.innerHTML = `<p class="section-desc">Nenalezeny žádné kurzy odpovídající filtru.</p>`;
      return;
    }

    filtered.forEach(k => {
      const card = document.createElement("div");
      card.className = "course-card";

      const badge = k.jeAkreditovany
        ? `<span class="badge badge-accredited">Akreditováno MŠMT</span>`
        : `<span class="badge badge-standard">Firemní školení</span>`;

      const price = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(k.cena);

      card.innerHTML = `
        <div>
          <div class="course-card-header">
            ${badge}
          </div>
          <h3>${escapeHtml(k.nazev)}</h3>
          <p class="course-desc">${escapeHtml(k.anotace)}</p>
        </div>
        <div>
          <div class="course-meta-row">
            <span>Dotace: <strong>${k.rozsahHodin} hod.</strong></span>
            <span class="course-price">${price}</span>
          </div>
          <div class="course-actions">
            <button class="btn btn-secondary btn-sm btn-edit-kurz" data-id="${k.id}">Upravit</button>
            <button class="btn-danger-text btn-delete-kurz" data-id="${k.id}" data-name="${escapeHtml(k.nazev)}">Smazat</button>
          </div>
        </div>
      `;

      card.querySelector(".btn-edit-kurz").addEventListener("click", () => openEditKurz(k));
      card.querySelector(".btn-delete-kurz").addEventListener("click", () => deleteKurz(k.id, k.nazev));

      kurzyList.appendChild(card);
    });
  }

  function openEditKurz(k) {
    document.getElementById("modal-kurz-title").textContent = "Upravit kurz";
    document.getElementById("kurz-id").value = k.id;
    document.getElementById("kurz-nazev").value = k.nazev;
    document.getElementById("kurz-anotace").value = k.anotace;
    document.getElementById("kurz-rozsah").value = k.rozsahHodin;
    document.getElementById("kurz-cena").value = k.cena;
    document.getElementById("kurz-akreditovany").checked = k.jeAkreditovany;
    formKurzError.style.display = "none";
    modalKurz.style.display = "flex";
  }

  formKurz.addEventListener("submit", async (e) => {
    e.preventDefault();
    formKurzError.style.display = "none";

    const id = document.getElementById("kurz-id").value.trim();
    const payload = {
      nazev: document.getElementById("kurz-nazev").value.trim(),
      anotace: document.getElementById("kurz-anotace").value.trim(),
      rozsahHodin: parseInt(document.getElementById("kurz-rozsah").value, 10),
      cena: parseFloat(document.getElementById("kurz-cena").value),
      jeAkreditovany: document.getElementById("kurz-akreditovany").checked
    };

    try {
      const url = id ? `/api/kurzy/${id}` : "/api/kurzy";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Uložení selhalo.");

      showToast(id ? "Kurz byl upraven." : "Nový kurz byl úspěšně vytvořen.");
      modalKurz.style.display = "none";
      loadKurzy();
    } catch (err) {
      formKurzError.textContent = err.message;
      formKurzError.style.display = "block";
    }
  });

  async function deleteKurz(id, name) {
    if (!confirm(`Opravdu si přejete smazat kurz "${name}"?`)) return;
    try {
      const res = await fetch(`/api/kurzy/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Kurz byl smazán.");
        loadKurzy();
      } else {
        showToast(json.error, "error");
      }
    } catch (e) {
      showToast("Chyba při komunikaci se serverem.", "error");
    }
  }

  // ==================== ZÁLOŽKA 2: TERMÍNY & POŘADNÍK ====================
  const terminyTableBody = document.getElementById("terminy-table-body");
  const terminDetailBox = document.getElementById("termin-detail-box");
  const detailTerminNazev = document.getElementById("detail-termin-nazev");
  const detailTerminInfo = document.getElementById("detail-termin-info");
  const prihlaskyTableBody = document.getElementById("prihlasky-table-body");
  const btnOpenCreateTermin = document.getElementById("btn-open-create-termin");
  const btnOpenEnroll = document.getElementById("btn-open-enroll");
  const modalTermin = document.getElementById("modal-termin");
  const modalPrihlaska = document.getElementById("modal-prihlaska");
  const formTermin = document.getElementById("form-termin");
  const formPrihlaska = document.getElementById("form-prihlaska");

  async function loadTerminy() {
    try {
      const res = await fetch("/api/terminy");
      const json = await res.json();
      if (json.success) {
        terminyData = json.data;
        renderTerminy();
        if (selectedTerminId) {
          loadPrihlaskyForTermin(selectedTerminId);
        }
      }
    } catch (e) {
      showToast("Chyba při načítání termínů.", "error");
    }
  }

  function renderTerminy() {
    terminyTableBody.innerHTML = "";
    if (terminyData.length === 0) {
      terminyTableBody.innerHTML = `<tr><td colspan="7" class="section-desc">Zatím nebyly vypsány žádné termíny.</td></tr>`;
      return;
    }

    terminyData.forEach(t => {
      const tr = document.createElement("tr");

      const obsazeno = t.potvrzenoPocet;
      const kapacita = t.kapacita;
      const poradnik = t.poradnikPocet;
      const isFull = obsazeno >= kapacita;

      let kapacitaBadge = `<span class="badge ${isFull ? 'badge-standard' : 'badge-accredited'}">${obsazeno} / ${kapacita}</span>`;
      if (poradnik > 0) {
        kapacitaBadge += ` <span class="badge" style="background:#fef9c3;color:#ca8a04;">+${poradnik} náhradník(ů)</span>`;
      }

      const lektoriStr = t.lektori && t.lektori.length > 0
        ? t.lektori.map(l => l.jmeno).join(", ")
        : "Neuveden";

      tr.innerHTML = `
        <td><strong>${escapeHtml(t.kurzNazev)}</strong></td>
        <td>${t.datumOd} – ${t.datumDo}</td>
        <td>${escapeHtml(t.ucebnaNazev)}</td>
        <td>${kapacitaBadge}</td>
        <td>${escapeHtml(lektoriStr)}</td>
        <td><span class="status-pill status-${t.stav.toLowerCase()}">${t.stav}</span></td>
        <td class="text-right">
          <button class="btn btn-secondary btn-sm btn-show-enrolls" data-id="${t.id}">Přihlášky</button>
          <button class="btn btn-primary btn-sm btn-enroll-student" data-id="${t.id}" data-nazev="${escapeHtml(t.kurzNazev)}">Přihlásit</button>
        </td>
      `;

      tr.querySelector(".btn-show-enrolls").addEventListener("click", () => {
        selectedTerminId = t.id;
        loadPrihlaskyForTermin(t.id);
      });

      tr.querySelector(".btn-enroll-student").addEventListener("click", () => {
        openEnrollModal(t);
      });

      terminyTableBody.appendChild(tr);
    });
  }

  async function loadPrihlaskyForTermin(terminId) {
    try {
      const termin = terminyData.find(t => t.id === terminId);
      if (!termin) return;

      const res = await fetch(`/api/terminy/${terminId}/prihlasky`);
      const json = await res.json();
      if (json.success) {
        detailTerminNazev.textContent = `Přihlášky a Pořadník: ${termin.kurzNazev}`;
        detailTerminInfo.textContent = `Termín: ${termin.datumOd} až ${termin.datumDo} • Učebna: ${termin.ucebnaNazev} • Kapacita: ${termin.potvrzenoPocet}/${termin.kapacita} (Náhradníci v pořadníku: ${termin.poradnikPocet})`;
        terminDetailBox.style.display = "block";
        renderPrihlasky(json.data);
      }
    } catch (e) {
      showToast("Chyba při načítání přihlášek.", "error");
    }
  }

  function renderPrihlasky(prihlasky) {
    prihlaskyTableBody.innerHTML = "";
    if (prihlasky.length === 0) {
      prihlaskyTableBody.innerHTML = `<tr><td colspan="6" class="section-desc">Na tento termín zatím není nikdo přihlášen.</td></tr>`;
      return;
    }

    prihlasky.forEach(p => {
      const tr = document.createElement("tr");

      let stavLabel = "";
      if (p.stav === "POTVRZENA") {
        stavLabel = `<span class="status-pill status-potvrzena">Potvrzeno (Účastník)</span>`;
      } else if (p.stav === "PORADNIK") {
        stavLabel = `<span class="status-pill status-poradnik">Pořadník: Náhradník #${p.poradiVPoradniku}</span>`;
      } else {
        stavLabel = `<span class="status-pill status-zrusena">Zrušeno</span>`;
      }

      const dateStr = new Date(p.datumPodani).toLocaleString("cs-CZ");

      const actionBtn = p.stav !== "ZRUSENA"
        ? `<button class="btn-danger-text btn-cancel-enroll" data-id="${p.id}" data-name="${escapeHtml(p.studentJmeno)}">Zrušit přihlášku</button>`
        : `<span class="section-desc">Archivováno</span>`;

      tr.innerHTML = `
        <td><strong>${escapeHtml(p.studentJmeno)}</strong></td>
        <td>${escapeHtml(p.studentEmail)}</td>
        <td>${escapeHtml(p.studentTelefon || "-")} / ${escapeHtml(p.studentOrganizace || "Fyzická osoba")}</td>
        <td>${dateStr}</td>
        <td>${stavLabel}</td>
        <td class="text-right">${actionBtn}</td>
      `;

      if (p.stav !== "ZRUSENA") {
        tr.querySelector(".btn-cancel-enroll").addEventListener("click", () => cancelPrihlaska(p.id, p.studentJmeno));
      }

      prihlaskyTableBody.appendChild(tr);
    });
  }

  function openEnrollModal(termin) {
    document.getElementById("prihlaska-termin-id").value = termin.id;
    const isFull = termin.potvrzenoPocet >= termin.kapacita;
    document.getElementById("prihlaska-termin-notice").innerHTML = `
      <strong>${escapeHtml(termin.kurzNazev)}</strong> (${termin.datumOd} – ${termin.datumDo})<br>
      Aktuální obsazenost: <strong>${termin.potvrzenoPocet} z ${termin.kapacita} míst</strong>.
      ${isFull ? '<br><span style="color:#ca8a04;">Kapacita je plná. Student bude zařazen do pořadníku náhradníků.</span>' : ''}
    `;
    formPrihlaska.reset();
    document.getElementById("form-prihlaska-error").style.display = "none";
    modalPrihlaska.style.display = "flex";
  }

  btnOpenEnroll.addEventListener("click", () => {
    if (selectedTerminId) {
      const t = terminyData.find(item => item.id === selectedTerminId);
      if (t) openEnrollModal(t);
    }
  });

  formPrihlaska.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("form-prihlaska-error");
    errorEl.style.display = "none";

    const terminId = document.getElementById("prihlaska-termin-id").value;
    const payload = {
      jmeno: document.getElementById("student-jmeno").value.trim(),
      prijmeni: document.getElementById("student-prijmeni").value.trim(),
      email: document.getElementById("student-email").value.trim(),
      telefon: document.getElementById("student-telefon").value.trim(),
      organizace: document.getElementById("student-organizace").value.trim(),
      poznamka: document.getElementById("student-poznamka").value.trim()
    };

    try {
      const res = await fetch(`/api/terminy/${terminId}/prihlasky`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Přihlášení se nezdařilo.");

      showToast(json.message);
      modalPrihlaska.style.display = "none";
      await loadTerminy();
      loadPrihlaskyForTermin(terminId);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
  });

  async function cancelPrihlaska(prihlaskaId, studentName) {
    if (!confirm(`Opravdu zrušit přihlášku studenta "${studentName}"? Pokud existují náhradníci v pořadníku, uvolněné místo bude ihned nabídnuto prvnímu z nich.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/prihlasky/${prihlaskaId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        await loadTerminy();
        if (selectedTerminId) loadPrihlaskyForTermin(selectedTerminId);
      } else {
        showToast(json.error, "error");
      }
    } catch (e) {
      showToast("Chyba při komunikaci se serverem.", "error");
    }
  }

  // Založení nového termínu
  btnOpenCreateTermin.addEventListener("click", async () => {
    const selectKurz = document.getElementById("termin-kurz-select");
    const selectUcebna = document.getElementById("termin-ucebna-select");
    const selectLektor = document.getElementById("termin-lektor-select");

    // Načtení výběrů
    selectKurz.innerHTML = kurzyData.map(k => `<option value="${k.id}">${k.nazev}</option>`).join("");
    
    const [ucebnyRes, lektoriRes] = await Promise.all([fetch("/api/ucebny"), fetch("/api/lektori")]);
    const ucebnyJson = await ucebnyRes.json();
    const lektoriJson = await lektoriRes.json();

    selectUcebna.innerHTML = `<option value="">-- Bez učebny --</option>` + ucebnyJson.data.map(u => `<option value="${u.id}">${u.nazev} (kapacita ${u.kapacita})</option>`).join("");
    selectLektor.innerHTML = `<option value="">-- Bez lektora --</option>` + lektoriJson.data.map(l => `<option value="${l.id}">${l.jmeno}</option>`).join("");

    formTermin.reset();
    document.getElementById("form-termin-error").style.display = "none";
    modalTermin.style.display = "flex";
  });

  formTermin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("form-termin-error");
    errorEl.style.display = "none";

    const lektorVal = document.getElementById("termin-lektor-select").value;
    const payload = {
      kurzId: document.getElementById("termin-kurz-select").value,
      ucebnaId: document.getElementById("termin-ucebna-select").value || undefined,
      datumOd: document.getElementById("termin-datum-od").value,
      datumDo: document.getElementById("termin-datum-do").value,
      kapacita: parseInt(document.getElementById("termin-kapacita").value, 10),
      lektorIds: lektorVal ? [lektorVal] : []
    };

    try {
      const res = await fetch("/api/terminy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Vypsání termínu selhalo.");

      showToast("Nový termín byl úspěšně vypsán.");
      modalTermin.style.display = "none";
      loadTerminy();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    }
  });

  // ==================== ZÁLOŽKA 3: LEKTOŘI & UČEBNY ====================
  async function loadLektoriAndUcebny() {
    try {
      const [lRes, uRes] = await Promise.all([fetch("/api/lektori"), fetch("/api/ucebny")]);
      const lJson = await lRes.json();
      const uJson = await uRes.json();

      const lTbody = document.getElementById("lektori-table-body");
      lTbody.innerHTML = lJson.data.map(l => `
        <tr>
          <td><strong>${escapeHtml(l.jmeno)}</strong></td>
          <td>${escapeHtml(l.email)}<br><small class="section-desc">${escapeHtml(l.telefon || "")}</small></td>
          <td>${escapeHtml(l.specializace || "-")}</td>
          <td>${l.terminuPocet} termínů (${l.oduchenoHodin} hod.)</td>
        </tr>
      `).join("");

      const uTbody = document.getElementById("ucebny-table-body");
      uTbody.innerHTML = uJson.data.map(u => `
        <tr>
          <td><strong>${escapeHtml(u.nazev)}</strong></td>
          <td>${escapeHtml(u.adresa)}</td>
          <td><strong>${u.kapacita}</strong> míst</td>
        </tr>
      `).join("");
    } catch (e) {
      showToast("Chyba při načítání lektorů a učeben.", "error");
    }
  }

  // ==================== ZÁLOŽKA 4: PŘEHLEDY & VÝKAZY ====================
  document.getElementById("btn-refresh-analytics").addEventListener("click", () => loadAnalytics());

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/prehledy");
      const json = await res.json();
      if (!json.success) return;

      const data = json.data;

      // 1. Termíny
      const terminyList = document.getElementById("analytics-terminy-list");
      terminyList.innerHTML = data.terminyStats.map(t => `
        <div class="analytics-row">
          <div>
            <strong>${escapeHtml(t.kurzNazev)}</strong> (${t.datum})<br>
            <small class="section-desc">Obsazeno: ${t.potvrzeno} z ${t.kapacita} míst ${t.poradnik > 0 ? `(+${t.poradnik} v pořadníku)` : ''}</small>
          </div>
          <span class="badge ${t.procentoNaplneni >= 100 ? 'badge-standard' : 'badge-accredited'}">
            ${t.procentoNaplneni}%
          </span>
        </div>
      `).join("");

      // 2. Lektoři
      const lektoriList = document.getElementById("analytics-lektori-list");
      lektoriList.innerHTML = data.lektoriStats.map(l => `
        <div class="analytics-row">
          <div>
            <strong>${escapeHtml(l.jmeno)}</strong><br>
            <small class="section-desc">Garantovaných / odučených termínů: ${l.pocetTerminu}</small>
          </div>
          <strong>${l.oduchenoHodin} hodin</strong>
        </div>
      `).join("");

      // 3. Studenti
      const studentiList = document.getElementById("analytics-studenti-list");
      if (data.studentiViceKurzu.length === 0) {
        studentiList.innerHTML = `<p class="section-desc">Zatím žádný student není zapsán na více než 1 kurz.</p>`;
      } else {
        studentiList.innerHTML = data.studentiViceKurzu.map(s => `
          <div class="analytics-row">
            <div>
              <strong>${escapeHtml(s.student)}</strong> (${escapeHtml(s.email)}) — ${escapeHtml(s.organizace || "Fyzická osoba")}<br>
              <small class="section-desc">Navštěvované kurzy: ${s.kurzy.join(", ")}</small>
            </div>
            <span class="badge badge-accredited">${s.pocetKurzu} kurzy</span>
          </div>
        `).join("");
      }
    } catch (e) {
      showToast("Chyba při načítání přehledů.", "error");
    }
  }

  // ==================== POMOCNÉ FUNKCE ====================
  function showToast(msg, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  }

  // Úvodní načtení
  loadKurzy();
});
