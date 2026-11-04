(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class e{static activeModals=[];static init(){document.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-close]`);if(r){let t=r.getAttribute(`data-close`);t&&e.close(t)}n.classList.contains(`modal-overlay`)&&e.closeElement(n)}),document.addEventListener(`keydown`,t=>{if(t.key===`Escape`&&this.activeModals.length>0){let t=this.activeModals[this.activeModals.length-1];e.closeElement(t)}})}static open(e){let t=document.getElementById(e);return t?this.openElement(t):null}static openElement(e){e.classList.remove(`hidden`),e.style.display=`flex`,this.activeModals.includes(e)||this.activeModals.push(e),document.body.style.overflow=`hidden`;let t=e.querySelector(`input:not([type=hidden]), select, textarea, button:not([data-close])`);return t&&setTimeout(()=>t.focus(),50),e}static close(e){let t=document.getElementById(e);t&&this.closeElement(t)}static closeElement(e){e.classList.add(`hidden`),e.style.display=`none`,this.activeModals=this.activeModals.filter(t=>t!==e),this.activeModals.length===0&&(document.body.style.overflow=``)}static closeAll(){for(;this.activeModals.length>0;){let e=this.activeModals.pop();e&&(e.classList.add(`hidden`),e.style.display=`none`)}document.body.style.overflow=``}},t=class{activeTab;onTabChange;constructor(e){this.activeTab=e.activeTab,this.onTabChange=e.onTabChange}initTheme(){let e=localStorage.getItem(`akademie_theme`)||(window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`);this.applyTheme(e);let t=document.getElementById(`theme-toggle`);t&&t.addEventListener(`click`,()=>{let e=(document.documentElement.getAttribute(`data-theme`)||`light`)===`dark`?`light`:`dark`;this.applyTheme(e)})}applyTheme(e){document.documentElement.setAttribute(`data-theme`,e);let t=document.querySelector(`.icon-moon`),n=document.querySelector(`.icon-sun`);e===`dark`?(document.documentElement.classList.add(`dark`),t?.classList.add(`hidden`),n?.classList.remove(`hidden`)):(document.documentElement.classList.remove(`dark`),t?.classList.remove(`hidden`),n?.classList.add(`hidden`)),localStorage.setItem(`akademie_theme`,e)}bindEvents(){document.querySelectorAll(`.nav-tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);t&&t!==this.activeTab&&(this.setActiveTab(t),this.onTabChange(t))})}),document.addEventListener(`keydown`,e=>{let t=document.activeElement,n=t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement||t?.getAttribute(`contenteditable`)===`true`;if(e.key===`/`&&!n){e.preventDefault();let t=document.getElementById(`filter-search-course`);this.activeTab!==`courses`&&(this.setActiveTab(`courses`),this.onTabChange(`courses`)),setTimeout(()=>{t?.focus(),t?.select()},50);return}if(n)return;let r={1:`courses`,2:`terms`,3:`attendance`,4:`certificates`,5:`lecturers`,6:`analytics`};if(r[e.key]){e.preventDefault();let t=r[e.key];t!==this.activeTab&&(this.setActiveTab(t),this.onTabChange(t))}}),this.initTheme()}setActiveTab(e){this.activeTab=e,document.querySelectorAll(`.nav-tab-btn`).forEach(t=>{t.getAttribute(`data-tab`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),document.querySelectorAll(`.tab-pane`).forEach(t=>{t.id===`tab-${e}`?(t.classList.remove(`hidden`),t.classList.add(`active`)):(t.classList.remove(`active`),t.classList.add(`hidden`))})}},n=class extends Error{statusCode;details;constructor(e,t,n){super(e),this.name=`ApiError`,this.statusCode=t,this.details=n}};async function r(e,t={}){let r={"Content-Type":`application/json`,Accept:`application/json`,...t.headers},i=await fetch(e,{...t,headers:r}),a;try{a=await i.json()}catch{throw new n(`Neplatná odpověď serveru (${i.status} ${i.statusText})`,i.status)}if(!i.ok||!a.success)throw new n(a.error||a.message||`Chyba požadavku: ${i.status} ${i.statusText}`,i.status,a);return a.data}async function i(e,t={}){let r={"Content-Type":`application/json`,Accept:`application/json`,...t.headers},i=await fetch(e,{...t,headers:r}),a;try{a=await i.json()}catch{throw new n(`Neplatná odpověď serveru (${i.status} ${i.statusText})`,i.status)}if(!i.ok||!a.success)throw new n(a.error||a.message||`Chyba požadavku: ${i.status} ${i.statusText}`,i.status,a);return a}var a={async getAll(){return r(`/api/courses`)},async getById(e){return r(`/api/courses/${e}`)},async create(e){return r(`/api/courses`,{method:`POST`,body:JSON.stringify(e)})},async update(e,t){return r(`/api/courses/${e}`,{method:`PUT`,body:JSON.stringify(t)})},async delete(e){return(await i(`/api/courses/${e}`,{method:`DELETE`})).message||`Kurz byl úspěšně smazán.`}},o=class{static container=null;static ensureContainer(){if(!this.container){let e=document.getElementById(`toast-container`);e||(e=document.createElement(`div`),e.id=`toast-container`,e.className=`toast-stack`,document.body.appendChild(e)),this.container=e}return this.container}static show(e,t=`success`,n,r=4500){let i=this.ensureContainer(),a=document.createElement(`div`),o={success:{bg:`bg-white dark:bg-slate-900`,border:`border-emerald-500/30 dark:border-emerald-500/30 shadow-lg shadow-emerald-950/10`,text:`text-slate-900 dark:text-slate-100`,iconColor:`text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60`,defaultTitle:`Úspěšně provedeno`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`},error:{bg:`bg-white dark:bg-slate-900`,border:`border-rose-500/30 dark:border-rose-500/30 shadow-lg shadow-rose-950/10`,text:`text-slate-900 dark:text-slate-100`,iconColor:`text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60`,defaultTitle:`Došlo k chybě`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`},warning:{bg:`bg-white dark:bg-slate-900`,border:`border-amber-500/30 dark:border-amber-500/30 shadow-lg shadow-amber-950/10`,text:`text-slate-900 dark:text-slate-100`,iconColor:`text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/60`,defaultTitle:`Upozornění`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`},info:{bg:`bg-white dark:bg-slate-900`,border:`border-slate-300 dark:border-slate-700 shadow-lg shadow-slate-950/10`,text:`text-slate-900 dark:text-slate-100`,iconColor:`text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700`,defaultTitle:`Systémová informace`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`}}[t],s=n||o.defaultTitle;a.className=`p-3 rounded-lg border flex items-start gap-2.5 animate-fadeIn transition-all duration-200 min-w-[280px] max-w-sm ${o.bg} ${o.border}`,a.setAttribute(`role`,`alert`),a.innerHTML=`
      <div class="p-1.5 rounded-lg shrink-0 ${o.iconColor}">
        ${o.iconSvg}
      </div>
      <div class="flex-1 min-w-0 pr-2">
        <div class="text-xs font-bold leading-tight ${o.text}">${s}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed break-words">${e}</div>
      </div>
      <button class="toast-close-btn p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors shrink-0">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `,a.querySelector(`.toast-close-btn`)?.addEventListener(`click`,()=>c());let c=()=>{a.style.opacity=`0`,a.style.transform=`translateX(24px) scale(0.95)`,setTimeout(()=>a.remove(),250)};i.appendChild(a),r>0&&setTimeout(c,r)}static success(e,t){this.show(e,`success`,t)}static error(e,t){this.show(e,`error`,t)}static warning(e,t){this.show(e,`warning`,t)}static info(e,t){this.show(e,`info`,t)}},s=class{courses=[];filterType=`all`;searchQuery=``;isEditing=!1;editingCourseId=null;container=null;searchInput=null;filterChips=null;countPill=null;kpiCoursesCount=null;form=null;formError=null;modalTitle=null;onScheduleTermCallback;constructor(e){this.onScheduleTermCallback=e?.onScheduleTerm}init(){this.container=document.getElementById(`courses-list`),this.searchInput=document.getElementById(`filter-search-course`),this.filterChips=document.querySelectorAll(`.filter-chip`),this.countPill=document.getElementById(`courses-count-pill`),this.kpiCoursesCount=document.getElementById(`kpi-courses-count`),this.form=document.getElementById(`form-course`),this.formError=document.getElementById(`form-course-error`),this.modalTitle=document.getElementById(`modal-course-title`),this.bindEvents(),this.load()}bindEvents(){document.getElementById(`btn-quick-search`)?.addEventListener(`click`,()=>{this.searchInput?.focus(),this.searchInput?.select()}),this.searchInput?.addEventListener(`input`,e=>{this.searchQuery=e.target.value.toLowerCase().trim(),this.render()}),this.filterChips?.forEach(e=>{e.addEventListener(`click`,()=>{this.filterChips?.forEach(e=>{e.className=`filter-chip text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800`}),e.className=`filter-chip bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold`,this.filterType=e.getAttribute(`data-filter`)||`all`,this.render()})}),document.getElementById(`btn-open-create-course`)?.addEventListener(`click`,()=>{this.openCreateModal()}),this.form?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleSubmit()})}async load(){try{this.courses=await a.getAll(),this.kpiCoursesCount&&(this.kpiCoursesCount.textContent=this.courses.length.toString()),this.render()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst seznam kurzů.`;o.error(t)}}getCourses(){return this.courses}render(){if(!this.container)return;this.container.innerHTML=``;let e=this.courses.filter(e=>{if(this.filterType===`accredited`&&!e.isAccredited||this.filterType===`standard`&&e.isAccredited)return!1;if(this.searchQuery){let t=e.title.toLowerCase().includes(this.searchQuery),n=e.annotation.toLowerCase().includes(this.searchQuery);if(!t&&!n)return!1}return!0});this.countPill&&(this.countPill.textContent=`${e.length} z ${this.courses.length} programů`),e.length===0?this.container.innerHTML=`
        <div class="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">Žádné kurzy neodpovídají zadanému filtru.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Zkuste změnit hledaný výraz nebo zvolit kategorii "Všechny programy".</p>
        </div>
      `:e.forEach((e,t)=>{let n=document.createElement(`div`);n.className=`card-box flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all duration-150`;let r=Number(e.price).toLocaleString(`cs-CZ`);n.innerHTML=`
        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <div class="flex items-center gap-1.5">
              <span class="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/80">
                ${`AT-K${String(t+1).padStart(2,`0`)}`}
              </span>
              ${e.isAccredited?`<span class="badge-chip badge-chip-green">MŠMT Akreditace</span>`:`<span class="badge-chip badge-chip-slate">Firemní program</span>`}
            </div>
            <span class="text-xs font-bold font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700/80">
              ${r} Kč
            </span>
          </div>

          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug tracking-tight">
            ${e.title}
          </h3>

          <p class="text-xs text-slate-600 dark:text-slate-400 mb-3.5 line-clamp-3 leading-relaxed">
            ${e.annotation}
          </p>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
          <span class="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${e.hours} hod.
          </span>
          <div class="flex items-center gap-1.5">
            <button
              class="btn-primary-tw btn-sm-tw btn-schedule-course"
              data-id="${e.id}"
              title="Vypsat nový termín pro tento kurz"
            >
              Vypsat termín
            </button>
            <button
              class="btn-secondary-tw btn-sm-tw btn-edit-course"
              data-id="${e.id}"
              title="Upravit parametry kurzu"
            >
              Upravit
            </button>
            <button
              class="btn-ghost-tw btn-sm-tw btn-delete-course text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              data-id="${e.id}"
              title="Smazat kurz z katalogu"
            >
              Smazat
            </button>
          </div>
        </div>
      `,n.querySelector(`.btn-schedule-course`)?.addEventListener(`click`,()=>{this.onScheduleTermCallback?this.onScheduleTermCallback(e.id):document.dispatchEvent(new CustomEvent(`akademie:schedule-course`,{detail:{courseId:e.id}}))}),n.querySelector(`.btn-edit-course`)?.addEventListener(`click`,()=>this.openEditModal(e)),n.querySelector(`.btn-delete-course`)?.addEventListener(`click`,()=>this.handleDelete(e)),this.container?.appendChild(n)})}openCreateModal(){this.isEditing=!1,this.editingCourseId=null,this.modalTitle&&(this.modalTitle.textContent=`Nový vzdělávací program`),this.form&&this.form.reset(),this.formError&&(this.formError.style.display=`none`),e.open(`modal-course`)}openEditModal(t){this.isEditing=!0,this.editingCourseId=t.id,this.modalTitle&&(this.modalTitle.textContent=`Upravit vzdělávací program`),this.formError&&(this.formError.style.display=`none`);let n=document.getElementById(`course-title`),r=document.getElementById(`course-annotation`),i=document.getElementById(`course-hours`),a=document.getElementById(`course-price`),o=document.getElementById(`course-accredited`),s=document.getElementById(`course-id`);n&&(n.value=t.title),r&&(r.value=t.annotation),i&&(i.value=t.hours.toString()),a&&(a.value=t.price.toString()),o&&(o.checked=t.isAccredited),s&&(s.value=t.id),e.open(`modal-course`)}async handleSubmit(){if(!this.form)return;this.formError&&(this.formError.style.display=`none`);let t={title:document.getElementById(`course-title`).value.trim(),annotation:document.getElementById(`course-annotation`).value.trim(),hours:parseInt(document.getElementById(`course-hours`).value,10),price:parseFloat(document.getElementById(`course-price`).value),isAccredited:document.getElementById(`course-accredited`).checked};try{this.isEditing&&this.editingCourseId?(await a.update(this.editingCourseId,t),o.success(`Vzdělávací program byl úspěšně aktualizován.`)):(await a.create(t),o.success(`Nový vzdělávací program byl úspěšně vytvořen.`)),e.close(`modal-course`),await this.load()}catch(e){if(this.formError){let t=e instanceof Error?e.message:`Chyba při ukládání kurzu.`;this.formError.textContent=t,this.formError.style.display=`block`}}}async handleDelete(e){if(window.confirm(`Opravdu chcete smazat kurz "${e.title}"? Smažou se i všechny navázané termíny a přihlášky.`))try{let t=await a.delete(e.id);o.success(t),await this.load()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se smazat kurz.`;o.error(t)}}},c={async getAll(){return r(`/api/terms`)},async getById(e){return r(`/api/terms/${e}`)},async create(e){return r(`/api/terms`,{method:`POST`,body:JSON.stringify(e)})},async getEnrollments(e){return r(`/api/terms/${e}/enrollments`)},async createEnrollment(e,t){let n=await i(`/api/terms/${e}/enrollments`,{method:`POST`,body:JSON.stringify(t)});return{enrollment:n.data,message:n.message||`Student byl úspěšně zaregistrován.`}},async cancelEnrollment(e){let t=await i(`/api/enrollments/${e}/cancel`,{method:`POST`});return{message:t.message||`Přihláška byla zrušena.`,promotedEnrollmentId:t.data?.promotedEnrollmentId}}},l={async getLecturers(){return r(`/api/lecturers`)},async getClassrooms(){return r(`/api/classrooms`)},async getAnalytics(){return r(`/api/analytics`)}},u=class{terms=[];selectedTermId=null;enrollments=[];termsTableBody=null;termDetailBox=null;detailTermTitle=null;detailTermInfo=null;enrollmentsTableBody=null;kpiTermsCount=null;kpiWaitlistStatus=null;formTerm=null;formTermError=null;formEnrollment=null;formEnrollmentError=null;enrollmentTermNotice=null;onSwitchToAttendance;constructor(e){this.onSwitchToAttendance=e?.onSwitchToAttendance}init(){this.termsTableBody=document.getElementById(`terms-table-body`),this.termDetailBox=document.getElementById(`term-detail-box`),this.detailTermTitle=document.getElementById(`detail-term-title`),this.detailTermInfo=document.getElementById(`detail-term-info`),this.enrollmentsTableBody=document.getElementById(`enrollments-table-body`),this.kpiTermsCount=document.getElementById(`kpi-terms-count`),this.kpiWaitlistStatus=document.getElementById(`kpi-waitlist-status`),this.formTerm=document.getElementById(`form-term`),this.formTermError=document.getElementById(`form-term-error`),this.formEnrollment=document.getElementById(`form-enrollment`),this.formEnrollmentError=document.getElementById(`form-enrollment-error`),this.enrollmentTermNotice=document.getElementById(`enrollment-term-notice`),this.bindEvents(),this.load()}bindEvents(){document.getElementById(`btn-open-create-term`)?.addEventListener(`click`,async()=>{await this.openCreateTermModal()}),this.formTerm?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateTermSubmit()}),document.getElementById(`btn-open-enroll`)?.addEventListener(`click`,()=>{this.openEnrollmentModal()}),this.formEnrollment?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleEnrollmentSubmit()})}async load(){try{this.terms=await c.getAll(),this.kpiTermsCount&&(this.kpiTermsCount.textContent=this.terms.length.toString());let e=this.terms.reduce((e,t)=>e+(t.waitlistCount||0),0);this.kpiWaitlistStatus&&(this.kpiWaitlistStatus.textContent=e>0?`${e} náhradníků v pořadníku`:`Pořadník náhradníků prázdný`),this.renderTerms(),this.selectedTermId&&await this.selectTerm(this.selectedTermId)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst termíny kurzů.`;o.error(t)}}getTerms(){return this.terms}getSelectedTermId(){return this.selectedTermId}renderTerms(){this.termsTableBody&&(this.termsTableBody.innerHTML=``,this.terms.length===0?this.termsTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-10 text-slate-400">
            Dosud nebyly vypsány žádné termíny kurzů.
          </td>
        </tr>
      `:this.terms.forEach(e=>{let t=e.confirmedCount>=e.capacity,n=e.status===`COMPLETED`,r=``;r=n?`<span class="badge-chip badge-chip-blue">Ukončen</span>`:t?`<span class="badge-chip badge-chip-yellow">Kapacita plná</span>`:`<span class="badge-chip badge-chip-green">Volná místa</span>`;let i=e.lecturers&&e.lecturers.length>0?e.lecturers.map(e=>e.name).join(`, `):`Nepřiřazen`,a=document.createElement(`tr`);e.id===this.selectedTermId&&a.classList.add(`row-selected`);let o=Math.min(100,Math.round(e.confirmedCount/e.capacity*100));a.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.courseTitle}</div>
          <div class="font-mono text-[10px] text-slate-400 mt-0.5">ID: ${e.id.slice(0,8)}...</div>
        </td>
        <td class="font-mono text-xs">
          <span>${e.startDate}</span>
          <span class="text-slate-400 mx-1">→</span>
          <span>${e.endDate}</span>
        </td>
        <td class="text-xs text-slate-700 dark:text-slate-300">
          <div class="font-medium">${e.classroomName||`Neuvedena`}</div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold ${t?`text-amber-600 dark:text-amber-400`:`text-emerald-700 dark:text-emerald-400`}">
              ${e.confirmedCount} / ${e.capacity}
            </span>
            <div class="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div
                class="h-full rounded-full transition-all duration-300 ${t?`bg-amber-500`:`bg-emerald-600`}"
                style="width: ${o}%;"
              ></div>
            </div>
          </div>
          ${e.waitlistCount>0?`<div class="mt-1">
                  <span class="badge-chip badge-chip-yellow text-[10px]">
                    ADR-02: ${e.waitlistCount} ${e.waitlistCount===1?`náhradník`:`náhradníci`}
                  </span>
                 </div>`:`<div class="text-[10px] text-slate-400 mt-0.5 font-mono">Volno: ${Math.max(0,e.capacity-e.confirmedCount)} míst</div>`}
        </td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${i}</td>
        <td>${r}</td>
        <td class="text-right">
          <div class="inline-flex items-center gap-1.5">
            <button
              class="btn-secondary-tw btn-sm-tw btn-view-term"
              data-id="${e.id}"
              title="Zobrazit detail přihlášek a pořadník náhradníků"
            >
              Přihlášky (${e.confirmedCount+e.waitlistCount})
            </button>
            <button
              class="btn-ghost-tw btn-sm-tw btn-jump-attendance text-emerald-700 dark:text-emerald-400"
              data-id="${e.id}"
              title="Přejít do evidence docházky pro tento termín"
            >
              Docházka
            </button>
          </div>
        </td>
      `,a.querySelector(`.btn-view-term`)?.addEventListener(`click`,()=>this.selectTerm(e.id)),a.querySelector(`.btn-jump-attendance`)?.addEventListener(`click`,()=>{this.onSwitchToAttendance?this.onSwitchToAttendance(e.id):document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`attendance`,termId:e.id}}))}),this.termsTableBody?.appendChild(a)}))}async selectTerm(e){this.selectedTermId=e,this.renderTerms();let t=this.terms.find(t=>t.id===e);if(t){this.termDetailBox&&(this.termDetailBox.style.display=`block`),this.detailTermTitle&&(this.detailTermTitle.textContent=`Přihlášky a pořadník: ${t.courseTitle}`),this.detailTermInfo&&(this.detailTermInfo.innerHTML=`
        Termín: <strong class="font-mono text-slate-900 dark:text-white">${t.startDate} až ${t.endDate}</strong> •
        Učebna: <strong class="text-slate-900 dark:text-white">${t.classroomName}</strong> •
        Obsazenost: <strong class="font-mono text-slate-900 dark:text-white">${t.confirmedCount} / ${t.capacity} míst</strong>
        ${t.waitlistCount>0?` • (<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono">${t.waitlistCount} v pořadníku ADR-02</span>)`:``}
      `);try{this.enrollments=await c.getEnrollments(e),this.renderEnrollments()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst přihlášky k termínu.`;o.error(t)}}}renderEnrollments(){this.enrollmentsTableBody&&(this.enrollmentsTableBody.innerHTML=``,this.enrollments.length===0?this.enrollmentsTableBody.innerHTML=`
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            Na tento termín se zatím nikdo nepřihlásil. Použijte tlačítko "Zaregistrovat studenta" výše.
          </td>
        </tr>
      `:this.enrollments.forEach(e=>{let t=``;e.status===`CONFIRMED`?t=`<span class="badge-chip badge-chip-green">Potvrzeno</span>`:e.status===`WAITLIST`?t=`<span class="badge-chip badge-chip-yellow">Náhradník #${e.waitlistPosition||1} (ADR-02)</span>`:e.status===`CANCELLED`?t=`<span class="badge-chip badge-chip-red">Zrušeno</span>`:e.status===`COMPLETED`&&(t=`<span class="badge-chip badge-chip-blue">Absolvováno</span>`);let n=new Date(e.submittedAt).toLocaleString(`cs-CZ`,{dateStyle:`short`,timeStyle:`short`}),r=e.status===`CONFIRMED`||e.status===`WAITLIST`,i=document.createElement(`tr`);i.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.studentName}</div>
          ${e.note?`<div class="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">Pozn.: ${e.note}</div>`:``}
        </td>
        <td class="font-mono text-xs text-slate-600 dark:text-slate-400">${e.studentEmail}</td>
        <td class="text-xs">
          <div class="font-mono text-slate-700 dark:text-slate-300">${e.studentPhone||`-`}</div>
          ${e.studentOrganization?`<div class="text-[11px] text-slate-400">${e.studentOrganization}</div>`:``}
        </td>
        <td class="font-mono text-xs text-slate-500">${n}</td>
        <td>${t}</td>
        <td class="text-right">
          ${r?`<button class="btn-ghost-tw btn-sm-tw btn-cancel-enroll text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40" data-id="${e.id}">
                  Zrušit účast
                 </button>`:`<span class="text-slate-400 text-xs">-</span>`}
        </td>
      `,i.querySelector(`.btn-cancel-enroll`)?.addEventListener(`click`,()=>this.handleCancelEnrollment(e)),this.enrollmentsTableBody?.appendChild(i)}))}async handleCancelEnrollment(e){let t=e.status===`CONFIRMED`?`Opravdu chcete zrušit účast studenta ${e.studentName}?\n\nPravidlo fronty ADR-02: Zrušením se uvolní místo a první náhradník z pořadníku bude automaticky povýšen na potvrzeného!`:`Opravdu chcete odebrat studenta ${e.studentName} z pořadníku náhradníků?`;if(window.confirm(t))try{let t=await c.cancelEnrollment(e.id);o.success(t.message),await this.load()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se zrušit přihlášku.`;o.error(t)}}async openCreateTermModal(t){this.formTerm&&this.formTerm.reset(),this.formTermError&&(this.formTermError.style.display=`none`);try{let[n,r,i]=await Promise.all([a.getAll(),l.getClassrooms(),l.getLecturers()]),o=document.getElementById(`term-course-select`);o&&(o.innerHTML=`<option value="">-- Zvolte vzdělávací program --</option>`+n.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${e.title} (${e.hours} hod. – ${e.isAccredited?`MŠMT`:`Firemní`})</option>`).join(``));let s=document.getElementById(`term-classroom-select`);s&&(s.innerHTML=`<option value="">-- Vyberte učebnu v Trutnově --</option>`+r.map(e=>`<option value="${e.id}">${e.name} (kapacita ${e.capacity} míst)</option>`).join(``));let c=document.getElementById(`term-lecturer-select`);c&&(c.innerHTML=`<option value="">-- Zvolte garanta kurzu --</option>`+i.map(e=>`<option value="${e.id}">${e.name} (${e.specialization||`Lektor`})</option>`).join(``)),e.open(`modal-term`)}catch(e){let t=e instanceof Error?e.message:`Chyba při přípravě formuláře termínu.`;o.error(t)}}async handleCreateTermSubmit(){if(!this.formTerm)return;this.formTermError&&(this.formTermError.style.display=`none`);let t=document.getElementById(`term-course-select`).value,n=document.getElementById(`term-classroom-select`).value||void 0,r=document.getElementById(`term-start-date`).value,i=document.getElementById(`term-end-date`).value,a=parseInt(document.getElementById(`term-capacity`).value,10),s=document.getElementById(`term-lecturer-select`).value||void 0,l={courseId:t,classroomId:n,startDate:r,endDate:i,capacity:a,lecturerIds:s?[s]:[]};try{await c.create(l),o.success(`Nový termín kurzu byl úspěšně vypsán.`),e.close(`modal-term`),await this.load()}catch(e){if(this.formTermError){let t=e instanceof Error?e.message:`Chyba při vytváření termínu.`;this.formTermError.textContent=t,this.formTermError.style.display=`block`}}}openEnrollmentModal(){if(!this.selectedTermId){o.warning(`Nejprve vyberte termín ze seznamu.`);return}let t=this.terms.find(e=>e.id===this.selectedTermId);if(!t)return;this.formEnrollment&&this.formEnrollment.reset(),this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let n=document.getElementById(`enrollment-term-id`);if(n&&(n.value=this.selectedTermId),this.enrollmentTermNotice){let e=t.confirmedCount>=t.capacity;this.enrollmentTermNotice.innerHTML=`
        <div class="p-2.5 rounded-lg ${e?`bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300`:`bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300`} text-xs mb-3">
          <strong>${t.courseTitle}</strong> (${t.startDate} až ${t.endDate})<br/>
          Obsazeno: ${t.confirmedCount} z ${t.capacity} míst.
          ${e?`<span class="block mt-1 font-semibold text-amber-900 dark:text-amber-200">Kapacita termínu je naplněna! Student bude automaticky zařazen do pořadníku na pozici Náhradník #${t.waitlistCount+1} (ADR-02).</span>`:`<span class="block mt-1 text-emerald-900 dark:text-emerald-200">Na termínu jsou volná místa – student bude zaregistrován jako POTVRZENÝ.</span>`}
        </div>
      `}e.open(`modal-enrollment`)}async handleEnrollmentSubmit(){if(!this.selectedTermId||!this.formEnrollment)return;this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let t=document.getElementById(`student-first-name`).value.trim(),n=document.getElementById(`student-last-name`).value.trim(),r=document.getElementById(`student-email`).value.trim(),i=document.getElementById(`student-phone`).value.trim(),a=document.getElementById(`student-organization`).value.trim(),s=document.getElementById(`student-note`).value.trim(),l={firstName:t,lastName:n,email:r,phone:i||void 0,organization:a||void 0,note:s||void 0};try{let r=await c.createEnrollment(this.selectedTermId,l);r.status===`CONFIRMED`?o.success(`Student ${t} ${n} byl úspěšně zaregistrován na termín.`):o.warning(`Kapacita termínu byla plná. Student ${t} ${n} byl zařazen do pořadníku na pozici Náhradník #${r.waitlistPosition} (ADR-02).`),e.close(`modal-enrollment`),await this.load()}catch(e){if(this.formEnrollmentError){let t=e instanceof Error?e.message:`Chyba při podávání přihlášky.`;this.formEnrollmentError.textContent=t,this.formEnrollmentError.style.display=`block`}}}},d={async getDays(e){return r(`/api/attendance/terms/${e}/days`)},async createDay(e,t){return r(`/api/attendance/terms/${e}/days`,{method:`POST`,body:JSON.stringify(t)})},async getDayAttendance(e){return r(`/api/attendance/days/${e}`)},async markAttendance(e,t){return(await i(`/api/attendance/days/${e}/mark`,{method:`POST`,body:JSON.stringify(t)})).message||`Docházka byla uložena.`},async getSummary(e){return r(`/api/attendance/terms/${e}/summary`)}},f={async getAll(){return r(`/api/certificates`)},async getById(e){return r(`/api/certificates/${e}`)},async completeTerm(e){let t=await i(`/api/terms/${e}/complete`,{method:`POST`});return{message:t.message||`Termín byl uzavřen.`,issuedCount:t.data?.issuedCertificatesCount??0}},async issueWithWaiver(e,t){return r(`/api/certificates/issue`,{method:`POST`,body:JSON.stringify({enrollmentId:e,hasWaiver:!0,waiverReason:t})})}},p=class{terms=[];selectedTermId=null;teachingDays=[];selectedDayId=null;roster=[];summary=[];termSelect=null;daysTableBody=null;daysCountBadge=null;rosterTableBody=null;summaryTableBody=null;rosterDayTitle=null;rosterDaySubtitle=null;btnSaveAttendance=null;btnMarkAll=null;formTeachingDay=null;formTeachingDayError=null;init(){this.termSelect=document.getElementById(`attendance-term-select`),this.daysTableBody=document.getElementById(`teaching-days-table-body`),this.daysCountBadge=document.getElementById(`attendance-days-count`),this.rosterTableBody=document.getElementById(`attendance-roster-body`),this.summaryTableBody=document.getElementById(`attendance-summary-table-body`),this.rosterDayTitle=document.getElementById(`attendance-day-title`),this.rosterDaySubtitle=document.getElementById(`attendance-day-subtitle`),this.btnSaveAttendance=document.getElementById(`btn-save-attendance`),this.btnMarkAll=document.getElementById(`btn-attendance-mark-all`),this.formTeachingDay=document.getElementById(`form-teaching-day`),this.formTeachingDayError=document.getElementById(`form-teaching-day-error`),this.bindEvents(),this.load()}bindEvents(){this.termSelect?.addEventListener(`change`,async()=>{this.selectedTermId=this.termSelect?.value||null,this.selectedDayId=null,await this.loadTermDetails()}),document.getElementById(`btn-open-create-day`)?.addEventListener(`click`,async()=>{await this.openCreateDayModal()}),this.formTeachingDay?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateDaySubmit()}),this.btnSaveAttendance?.addEventListener(`click`,async()=>{await this.handleSaveAttendance()}),this.btnMarkAll?.addEventListener(`click`,()=>{let e=document.querySelectorAll(`.att-checkbox`),t=Array.from(e).every(e=>e.checked);e.forEach(e=>{e.checked=!t;let n=e.getAttribute(`data-student`),r=document.querySelector(`.label-status[data-student="${n}"]`);r&&(t?(r.textContent=`Nepřítomen`,r.className=`text-xs font-semibold text-slate-400 label-status`):(r.textContent=`Přítomen`,r.className=`text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status`))}),o.info(t?`Všichni studenti označeni jako nepřítomní.`:`Všichni studenti označeni jako přítomní.`)})}async load(e){try{this.terms=await c.getAll(),this.renderTermSelect(),this.terms.length>0&&(e&&this.terms.some(t=>t.id===e)?this.selectedTermId=e:this.selectedTermId&&this.terms.some(e=>e.id===this.selectedTermId)||(this.selectedTermId=this.terms[0].id),this.termSelect&&(this.termSelect.value=this.selectedTermId),await this.loadTermDetails())}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst termíny pro docházku.`;o.error(t)}}selectTermById(e){this.terms.some(t=>t.id===e)&&(this.selectedTermId=e,this.termSelect&&(this.termSelect.value=e),this.loadTermDetails())}renderTermSelect(){this.termSelect&&(this.termSelect.innerHTML=this.terms.map(e=>`<option value="${e.id}" ${e.id===this.selectedTermId?`selected`:``}>${e.courseTitle} (${e.startDate} až ${e.endDate})</option>`).join(``))}async loadTermDetails(){if(this.selectedTermId)try{let[e,t]=await Promise.all([d.getDays(this.selectedTermId),d.getSummary(this.selectedTermId)]);if(this.teachingDays=e,this.summary=t,this.renderTeachingDays(),this.renderSummary(),this.teachingDays.length>0){let e=this.teachingDays[0];await this.selectTeachingDay(e)}else this.clearRoster(`Tento termín zatím nemá vypsané žádné výukové dny.`)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst data docházky.`;o.error(t)}}renderTeachingDays(){this.daysTableBody&&(this.daysTableBody.innerHTML=``,this.daysCountBadge&&(this.daysCountBadge.textContent=`${this.teachingDays.length} dnů`),this.teachingDays.length===0?this.daysTableBody.innerHTML=`
        <tr>
          <td colspan="5" class="text-center py-8 text-slate-400">
            Tento termín zatím nemá vypsané žádné výukové dny.
          </td>
        </tr>
      `:this.teachingDays.forEach(e=>{let t=document.createElement(`tr`);e.id===this.selectedDayId&&t.classList.add(`row-selected`),t.innerHTML=`
        <td class="font-mono text-xs font-bold text-slate-900 dark:text-white">${e.dayDate}</td>
        <td class="text-xs font-medium text-slate-800 dark:text-slate-200">${e.topic}</td>
        <td class="font-mono text-xs text-slate-600 dark:text-slate-400">${e.hours} hod.</td>
        <td class="text-xs text-slate-500">${e.lecturerName||`Neurčen`}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-select-day" data-id="${e.id}">
            Zapsat (${e.presentCount}/${e.attendanceCount})
          </button>
        </td>
      `,t.querySelector(`.btn-select-day`)?.addEventListener(`click`,()=>this.selectTeachingDay(e)),this.daysTableBody?.appendChild(t)}))}async selectTeachingDay(e){this.selectedDayId=e.id,this.renderTeachingDays(),this.rosterDayTitle&&(this.rosterDayTitle.textContent=`Prezenční listina: ${e.dayDate}`),this.rosterDaySubtitle&&(this.rosterDaySubtitle.innerHTML=`Téma: <strong class="text-slate-900 dark:text-white">${e.topic}</strong> • Lektor: ${e.lecturerName||`Neurčen`} • Rozsah: <strong class="font-mono">${e.hours} hod.</strong>`);try{this.roster=await d.getDayAttendance(e.id),this.renderRoster()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst prezenční listinu dne.`;o.error(t)}}clearRoster(e){this.rosterTableBody&&(this.rosterTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">${e}</td>
        </tr>
      `),this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`none`)}renderRoster(){this.rosterTableBody&&(this.rosterTableBody.innerHTML=``,this.roster.length===0?this.clearRoster(`Na tomto termínu nejsou žádní potvrzení studenti.`):(this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`inline-flex`),this.roster.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.studentName}</div>
        </td>
        <td class="font-mono text-xs text-slate-500">${e.studentEmail}</td>
        <td>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              class="att-checkbox w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
              data-student="${e.studentId}"
              ${e.isPresent?`checked`:``}
            />
            <span
              class="text-xs font-semibold label-status ${e.isPresent?`text-emerald-600 dark:text-emerald-400`:`text-slate-400`}"
              data-student="${e.studentId}"
            >
              ${e.isPresent?`Přítomen`:`Nepřítomen`}
            </span>
          </label>
        </td>
        <td>
          <input
            type="text"
            class="att-note input-tw py-1 text-xs"
            data-student="${e.studentId}"
            value="${e.note||``}"
            placeholder="Poznámka / omluva..."
          />
        </td>
      `;let n=t.querySelector(`.att-checkbox`),r=t.querySelector(`.label-status`);n?.addEventListener(`change`,()=>{n.checked?(r.textContent=`Přítomen`,r.className=`text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status`):(r.textContent=`Nepřítomen`,r.className=`text-xs font-semibold text-slate-400 label-status`)}),this.rosterTableBody?.appendChild(t)})))}async handleSaveAttendance(){if(!this.selectedDayId||!this.selectedTermId)return;let e=document.querySelectorAll(`.att-checkbox`),t=0;try{for(let n of e){let e=n.getAttribute(`data-student`);if(!e)continue;let r=n.checked,i=document.querySelector(`.att-note[data-student="${e}"]`),a=i?i.value.trim():void 0;await d.markAttendance(this.selectedDayId,{studentId:e,isPresent:r,note:a}),t++}o.success(`Prezenční listina byla uložena (${t} studentů).`),await this.loadTermDetails()}catch(e){let t=e instanceof Error?e.message:`Chyba při ukládání docházky.`;o.error(t)}}renderSummary(){this.summaryTableBody&&(this.summaryTableBody.innerHTML=``,this.summary.length===0?this.summaryTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400">
            Dosud nejsou k dispozici žádná data pro souhrn docházky.
          </td>
        </tr>
      `:this.summary.forEach(e=>{let t=e.qualifiesForCertificate?`<span class="badge-chip badge-chip-green">Splněno (≥ 70 %)</span>`:`<span class="badge-chip badge-chip-red">Nesplněno (< 70 %)</span>`,n=``;n=e.certificateIssued?`
          <button class="btn-cert-preview font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-300 dark:border-sky-800 hover:border-sky-400 hover:underline" data-cert="${e.certificateNumber||``}">
            ${e.certificateNumber} ↗
          </button>
        `:e.qualifiesForCertificate?`<span class="badge-chip badge-chip-yellow">Čeká na uzavření</span>`:`<span class="badge-chip badge-chip-slate">Nutná výjimka</span>`;let r=document.createElement(`tr`);r.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.studentName}</div>
        </td>
        <td class="font-mono text-xs text-slate-500">${e.studentEmail}</td>
        <td class="font-mono text-xs">${e.attendedDays} z ${e.totalDays} dnů</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold ${e.qualifiesForCertificate?`text-emerald-700 dark:text-emerald-400`:`text-rose-600 dark:text-rose-400`}">
              ${e.attendancePercentage} %
            </span>
            <div class="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div
                class="h-full rounded-full transition-all duration-300 ${e.qualifiesForCertificate?`bg-emerald-600`:`bg-rose-500`}"
                style="width: ${Math.min(100,e.attendancePercentage)}%;"
              ></div>
            </div>
          </div>
        </td>
        <td>${t}</td>
        <td>${n}</td>
        <td class="text-right">
          ${!e.qualifiesForCertificate&&!e.certificateIssued?`<button class="btn-secondary-tw btn-sm-tw btn-waiver-shortcut text-amber-700 dark:text-amber-400" data-student="${e.studentId}">
                  Udělit výjimku
                 </button>`:`<span class="text-slate-400 text-xs">-</span>`}
        </td>
      `;let i=r.querySelector(`.btn-cert-preview`);i?.addEventListener(`click`,async()=>{let e=i.getAttribute(`data-cert`);if(e){let t=(await f.getAll()).find(t=>t.certificateNumber===e);t&&document.dispatchEvent(new CustomEvent(`akademie:preview-certificate`,{detail:{certificate:t}}))}}),r.querySelector(`.btn-waiver-shortcut`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`certificates`,openWaiver:!0}}))}),this.summaryTableBody?.appendChild(r)}))}async openCreateDayModal(){if(!this.selectedTermId){o.warning(`Nejprve vyberte termín kurzu.`);return}this.formTeachingDay&&this.formTeachingDay.reset(),this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t=document.getElementById(`day-term-id`);t&&(t.value=this.selectedTermId);try{let t=await l.getLecturers(),n=document.getElementById(`day-lecturer-select`);n&&(n.innerHTML=`<option value="">-- Zvolte lektora pro tento den --</option>`+t.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)),e.open(`modal-teaching-day`)}catch{o.error(`Chyba při načítání seznamu lektorů.`)}}async handleCreateDaySubmit(){if(!this.selectedTermId||!this.formTeachingDay)return;this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t={dayDate:document.getElementById(`day-date`).value,hours:parseInt(document.getElementById(`day-hours`).value,10),topic:document.getElementById(`day-topic`).value.trim(),lecturerId:document.getElementById(`day-lecturer-select`).value||void 0};try{await d.createDay(this.selectedTermId,t),o.success(`Výukový den byl úspěšně přidán.`),e.close(`modal-teaching-day`),await this.loadTermDetails()}catch(e){if(this.formTeachingDayError){let t=e instanceof Error?e.message:`Chyba při vytváření výukového dne.`;this.formTeachingDayError.textContent=t,this.formTeachingDayError.style.display=`block`}}}},m=class{certificates=[];terms=[];certificatesTableBody=null;completeTermSelect=null;btnCompleteTerm=null;btnOpenIssueWaiver=null;kpiCertsCount=null;formWaiver=null;formWaiverError=null;waiverEnrollmentSelect=null;init(){this.certificatesTableBody=document.getElementById(`certificates-table-body`),this.completeTermSelect=document.getElementById(`complete-term-select`),this.btnCompleteTerm=document.getElementById(`btn-complete-term`),this.btnOpenIssueWaiver=document.getElementById(`btn-open-issue-waiver`),this.kpiCertsCount=document.getElementById(`kpi-certs-count`),this.formWaiver=document.getElementById(`form-waiver`),this.formWaiverError=document.getElementById(`form-waiver-error`),this.waiverEnrollmentSelect=document.getElementById(`waiver-enrollment-select`),this.bindEvents(),this.load()}bindEvents(){this.btnCompleteTerm?.addEventListener(`click`,async()=>{await this.handleCompleteTerm()}),this.btnOpenIssueWaiver?.addEventListener(`click`,async()=>{await this.openWaiverModal()}),this.formWaiver?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleWaiverSubmit()}),document.getElementById(`btn-print-certificate`)?.addEventListener(`click`,()=>{window.print()}),document.addEventListener(`akademie:preview-certificate`,(e=>{e.detail?.certificate&&this.openCertificatePreview(e.detail.certificate)}))}async load(){try{let[e,t]=await Promise.all([f.getAll(),c.getAll()]);this.certificates=e,this.terms=t,this.kpiCertsCount&&(this.kpiCertsCount.textContent=this.certificates.length.toString()),this.renderCertificates(),this.renderTermSelect()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst osvědčení o absolvování.`;o.error(t)}}getCertificates(){return this.certificates}renderTermSelect(){this.completeTermSelect&&(this.completeTermSelect.innerHTML=`<option value="">-- Zvolte termín kurzu k uzavření --</option>`+this.terms.map(e=>`<option value="${e.id}">${e.courseTitle} (${e.startDate} až ${e.endDate}) [${e.status===`COMPLETED`?`Už uzavřen`:`Aktivní`}]</option>`).join(``))}renderCertificates(){this.certificatesTableBody&&(this.certificatesTableBody.innerHTML=``,this.certificates.length===0?this.certificatesTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-10 text-slate-400">
            Zatím nebyla vystavena žádná osvědčení. Uzavřete termín kurzu nebo udělte lektorskou výjimku.
          </td>
        </tr>
      `:this.certificates.forEach(e=>{let t=e.hasWaiver?`<span class="badge-chip badge-chip-yellow cursor-help" title="Důvod výjimky lektora: ${e.waiverReason||`Schváleno lektorem`}">
            Výjimka lektora (ADR-01)
           </span>`:`<span class="badge-chip badge-chip-green">Standardní (≥ 70 %)</span>`,n=document.createElement(`tr`);n.innerHTML=`
        <td>
          <span class="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
            ${e.certificateNumber}
          </span>
        </td>
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.studentName}</div>
          <div class="font-mono text-[11px] text-slate-500">${e.studentEmail}</div>
        </td>
        <td class="text-xs font-medium text-slate-800 dark:text-slate-200">${e.courseTitle}</td>
        <td class="font-mono text-xs text-slate-500">${e.issueDate}</td>
        <td>
          <span class="font-mono font-bold text-xs ${e.attendanceRate>=70?`text-emerald-700 dark:text-emerald-400`:`text-amber-600 dark:text-amber-400`}">
            ${e.attendanceRate} %
          </span>
        </td>
        <td>${t}</td>
        <td class="text-right">
          <button
            class="btn-secondary-tw btn-sm-tw btn-view-certificate"
            data-id="${e.id}"
            title="Otevřít reprezentativní náhled osvědčení pro tisk"
          >
            Náhled diplomu
          </button>
        </td>
      `,n.querySelector(`.btn-view-certificate`)?.addEventListener(`click`,()=>this.openCertificatePreview(e)),this.certificatesTableBody?.appendChild(n)}))}openCertificatePreview(t){let n=document.getElementById(`cert-view-number`),r=document.getElementById(`cert-view-student`),i=document.getElementById(`cert-view-email`),a=document.getElementById(`cert-view-course`),o=document.getElementById(`cert-view-attendance`),s=document.getElementById(`cert-view-issue-date`),c=document.getElementById(`cert-view-footer-date`),l=document.getElementById(`cert-view-waiver-status`);n&&(n.textContent=t.certificateNumber),r&&(r.textContent=t.studentName),i&&(i.textContent=t.studentEmail),a&&(a.textContent=t.courseTitle),o&&(o.textContent=`${t.attendanceRate} % docházky`),s&&(s.textContent=t.issueDate),c&&(c.textContent=t.issueDate),l&&(t.hasWaiver?(l.textContent=`Výjimka lektora dle ADR-01 (${t.waiverReason||`Uděleno`})`,l.className=`font-semibold text-amber-700 dark:text-amber-400 ml-1`):(l.textContent=`Standardní absolvování (splněno ≥ 70 % docházky)`,l.className=`font-semibold text-emerald-700 dark:text-emerald-400 ml-1`)),e.open(`modal-certificate-preview`)}async handleCompleteTerm(){let e=this.completeTermSelect?.value;if(!e){o.warning(`Nejprve vyberte termín ze seznamu vedle tlačítka.`);return}let t=this.terms.find(t=>t.id===e);if(window.confirm(`Opravdu chcete uzavřít termín "${t?.courseTitle||``}"?\n\nSystém automaticky vyhodnotí prezenční listiny a vystaví osvědčení všem studentům, kteří dosáhli alespoň 70% docházky (ADR-01).`))try{let t=await f.completeTerm(e);o.success(t.message),await this.load()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se uzavřít termín kurzu.`;o.error(t)}}async openWaiverModal(){if(this.formWaiver&&this.formWaiver.reset(),this.formWaiverError&&(this.formWaiverError.style.display=`none`),this.waiverEnrollmentSelect){this.waiverEnrollmentSelect.innerHTML=`<option value="">Načítám přihlášky studentů...</option>`,e.open(`modal-waiver`);try{let e=``;for(let t of this.terms){let n=await c.getEnrollments(t.id);for(let r of n)r.status!==`CONFIRMED`&&r.status!==`COMPLETED`||this.certificates.some(e=>e.enrollmentId===r.id)||(e+=`<option value="${r.id}">${r.studentName} – ${t.courseTitle} (${r.studentEmail})</option>`)}this.waiverEnrollmentSelect.innerHTML=e||`<option value="">Žádní studenti bez dosud vystaveného osvědčení</option>`}catch{o.error(`Chyba při načítání přihlášek pro udělení výjimky.`)}}}async handleWaiverSubmit(){if(!this.formWaiver||!this.waiverEnrollmentSelect)return;this.formWaiverError&&(this.formWaiverError.style.display=`none`);let t=this.waiverEnrollmentSelect.value,n=document.getElementById(`waiver-reason`).value.trim();if(!t)this.formWaiverError&&(this.formWaiverError.textContent=`Vyberte prosím studenta ze seznamu.`,this.formWaiverError.style.display=`block`);else if(n.length<5)this.formWaiverError&&(this.formWaiverError.textContent=`Uveďte prosím podrobnější písemné odůvodnění výjimky (min. 5 znaků).`,this.formWaiverError.style.display=`block`);else try{let r=await f.issueWithWaiver(t,n);o.success(`Osvědčení č. ${r.certificateNumber} bylo úspěšně vystaveno na základě výjimky lektora!`),e.close(`modal-waiver`),await this.load(),this.openCertificatePreview(r)}catch(e){if(this.formWaiverError){let t=e instanceof Error?e.message:`Chyba při vystavování osvědčení s výjimkou.`;this.formWaiverError.textContent=t,this.formWaiverError.style.display=`block`}}}},h=class{lecturers=[];classrooms=[];lecturersTableBody=null;classroomsTableBody=null;init(){this.lecturersTableBody=document.getElementById(`lecturers-table-body`),this.classroomsTableBody=document.getElementById(`classrooms-table-body`),this.load()}async load(){try{let[e,t]=await Promise.all([l.getLecturers(),l.getClassrooms()]);this.lecturers=e,this.classrooms=t,this.renderLecturers(),this.renderClassrooms()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst lektory a učebny.`;o.error(t)}}renderLecturers(){this.lecturersTableBody&&(this.lecturersTableBody.innerHTML=``,this.lecturers.length===0?this.lecturersTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádní lektoři.
          </td>
        </tr>
      `:this.lecturers.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
              ${e.name.split(` `).map(e=>e[0]).join(``).toUpperCase()}
            </div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">${e.name}</div>
            </div>
          </div>
        </td>
        <td class="text-xs">
          <div class="font-mono text-slate-800 dark:text-slate-200 font-medium">${e.email}</div>
          <div class="font-mono text-slate-400 text-[11px]">${e.phone||`-`}</div>
        </td>
        <td class="text-xs">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
            ${e.specialization||`Lektor`}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <strong class="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs">${e.taughtHours} hod.</strong>
            <span class="font-mono text-[11px] text-slate-400">(${e.termCount} termínů)</span>
          </div>
        </td>
      `,this.lecturersTableBody?.appendChild(t)}))}renderClassrooms(){this.classroomsTableBody&&(this.classroomsTableBody.innerHTML=``,this.classrooms.length===0?this.classroomsTableBody.innerHTML=`
        <tr>
          <td colspan="3" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádné učebny.
          </td>
        </tr>
      `:this.classrooms.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.name}</div>
        </td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${e.address}</td>
        <td>
          <span class="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ${e.capacity} studentů
          </span>
        </td>
      `,this.classroomsTableBody?.appendChild(t)}))}},g=class{data=null;termsListContainer=null;lecturersListContainer=null;studentsListContainer=null;btnRefresh=null;init(){this.termsListContainer=document.getElementById(`analytics-terms-list`),this.lecturersListContainer=document.getElementById(`analytics-lecturers-list`),this.studentsListContainer=document.getElementById(`analytics-students-list`),this.btnRefresh=document.getElementById(`btn-refresh-analytics`),this.bindEvents(),this.load()}bindEvents(){this.btnRefresh?.addEventListener(`click`,async()=>{await this.load(!0)})}async load(e=!1){try{this.data=await l.getAnalytics(),this.render(),e&&o.success(`Manažerské statistiky byly aktualizovány.`)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst manažerské výkazy.`;o.error(t)}}render(){this.data&&(this.renderTermStats(),this.renderLecturerStats(),this.renderMultiCourseStudents())}renderTermStats(){this.termsListContainer&&(this.termsListContainer.innerHTML=``,this.data.termStats.length===0?this.termsListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádné termíny pro analýzu vytížení.
        </div>
      `:this.data.termStats.forEach(e=>{let t=document.createElement(`div`);t.className=`p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 transition-all`;let n=e.waitlist>0,r=Math.min(100,e.fillRate);t.innerHTML=`
        <div class="flex justify-between items-center text-xs mb-1.5">
          <span class="font-bold text-slate-900 dark:text-white truncate pr-2">
            ${e.courseTitle}
            <span class="font-mono text-[10px] text-slate-400 font-normal">(${e.period})</span>
          </span>
          <div class="shrink-0 text-right font-mono text-[11px]">
            <span class="font-bold text-slate-800 dark:text-slate-200">${e.confirmed} / ${e.capacity}</span>
            <span class="${e.fillRate>=100?`text-amber-600 dark:text-amber-400`:`text-emerald-600 dark:text-emerald-400`} font-bold ml-1">
              (${e.fillRate} %)
            </span>
          </div>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
          <div
            class="h-full rounded-full transition-all duration-300 ${e.fillRate>=100?`bg-amber-500`:`bg-emerald-600`}"
            style="width: ${r}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between text-[10px]">
          ${n?`<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  ADR-02: ${e.waitlist} ${e.waitlist===1?`náhradník čeká`:`náhradníci čekají`} v pořadníku
                 </span>`:`<span class="text-slate-400 font-mono">Volná místa: ${Math.max(0,e.capacity-e.confirmed)}</span>`}
          <span class="text-slate-400 font-mono text-[10px]">Kapacita: ${e.capacity}</span>
        </div>
      `,this.termsListContainer?.appendChild(t)}))}renderLecturerStats(){if(!this.lecturersListContainer)return;if(this.lecturersListContainer.innerHTML=``,this.data.lecturerStats.length===0){this.lecturersListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádná data o lektorech.
        </div>
      `;return}let e=Math.max(...this.data.lecturerStats.map(e=>e.taughtHours),1);this.data.lecturerStats.forEach(t=>{let n=document.createElement(`div`);n.className=`p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs`;let r=Math.round(t.taughtHours/e*100);n.innerHTML=`
        <div class="flex justify-between items-center mb-1">
          <span class="font-bold text-slate-900 dark:text-white">${t.name}</span>
          <div class="flex items-center gap-1.5 font-mono text-[11px]">
            <strong class="text-emerald-700 dark:text-emerald-400 font-bold">${t.taughtHours} hod.</strong>
            <span class="text-slate-400">(${t.termCount} termínů)</span>
          </div>
        </div>
        <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style="width: ${r}%;"
          ></div>
        </div>
      `,this.lecturersListContainer?.appendChild(n)})}renderMultiCourseStudents(){if(!this.studentsListContainer)return;if(this.studentsListContainer.innerHTML=``,this.data.multiCourseStudents.length===0){this.studentsListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-slate-400">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `;return}let e=document.createElement(`div`);e.className=`overflow-x-auto`,e.innerHTML=`
      <table class="table-tw">
        <thead>
          <tr>
            <th>Student</th>
            <th>Kontakt (E-mail)</th>
            <th>Organizace</th>
            <th>Počet kurzů</th>
            <th>Navštěvované programy</th>
          </tr>
        </thead>
        <tbody id="multi-students-table-body"></tbody>
      </table>
    `;let t=e.querySelector(`#multi-students-table-body`);this.data.multiCourseStudents.forEach(e=>{let n=document.createElement(`tr`),r=e.courses.map(e=>`<span class="inline-block px-2 py-0.5 rounded text-[10.5px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mr-1 mb-1 font-medium">${e}</span>`).join(``);n.innerHTML=`
        <td>
          <div class="font-bold text-slate-900 dark:text-white">${e.student}</div>
        </td>
        <td class="font-mono text-xs text-slate-600 dark:text-slate-400">${e.email}</td>
        <td class="text-xs text-slate-500">${e.organization||`-`}</td>
        <td>
          <span class="badge-chip badge-chip-green font-mono">
            ${e.courseCount} kurzy
          </span>
        </td>
        <td class="py-2">${r}</td>
      `,t?.appendChild(n)}),this.studentsListContainer.appendChild(e)}},_=class{header;coursesView;termsView;attendanceView;certificatesView;lecturersView;analyticsView;constructor(){e.init(),this.coursesView=new s({onScheduleTerm:e=>this.handleScheduleCourse(e)}),this.termsView=new u({onSwitchToAttendance:e=>this.handleSwitchToAttendance(e)}),this.attendanceView=new p,this.certificatesView=new m,this.lecturersView=new h,this.analyticsView=new g,this.header=new t({activeTab:`courses`,onTabChange:e=>this.handleTabChange(e)})}init(){this.header.bindEvents(),this.coursesView.init(),this.termsView.init(),this.attendanceView.init(),this.certificatesView.init(),this.lecturersView.init(),this.analyticsView.init(),this.bindGlobalShortcuts(),this.bindCustomEvents(),this.checkHealth()}bindGlobalShortcuts(){document.getElementById(`btn-open-shortcuts`)?.addEventListener(`click`,()=>{e.open(`modal-shortcuts`)}),document.addEventListener(`keydown`,t=>{let n=document.activeElement,r=n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement||n instanceof HTMLSelectElement||n?.getAttribute(`contenteditable`)===`true`;t.key===`?`&&!r&&(t.preventDefault(),e.open(`modal-shortcuts`))})}bindCustomEvents(){document.addEventListener(`akademie:schedule-course`,(e=>{e.detail?.courseId&&this.handleScheduleCourse(e.detail.courseId)})),document.addEventListener(`akademie:switch-tab`,(e=>{let{tab:t,termId:n,openWaiver:r}=e.detail||{};t&&(this.header.setActiveTab(t),this.handleTabChange(t),t===`attendance`&&n?setTimeout(()=>this.attendanceView.selectTermById(n),100):t===`certificates`&&r&&setTimeout(()=>this.certificatesView.openWaiverModal(),100))}))}handleScheduleCourse(e){this.header.setActiveTab(`terms`),this.termsView.load().then(()=>{this.termsView.openCreateTermModal(e)})}handleSwitchToAttendance(e){this.header.setActiveTab(`attendance`),this.attendanceView.load(e)}handleTabChange(e){switch(e){case`courses`:this.coursesView.load();break;case`terms`:this.termsView.load();break;case`attendance`:this.attendanceView.load();break;case`certificates`:this.certificatesView.load();break;case`lecturers`:this.lecturersView.load();break;case`analytics`:this.analyticsView.load()}}async checkHealth(){let e=document.getElementById(`system-status-indicator`);if(e)try{if((await fetch(`/health`)).ok)e.innerHTML=`
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Systém aktivní
        `,e.className=`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80`;else throw Error(`Chyba spojení`)}catch{e.innerHTML=`
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Offline
      `,e.className=`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80`}}};document.addEventListener(`DOMContentLoaded`,()=>{new _().init()});