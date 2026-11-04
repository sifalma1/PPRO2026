(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class e{static activeModals=[];static init(){document.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-close]`);if(r){let t=r.getAttribute(`data-close`);t&&e.close(t)}n.classList.contains(`modal-overlay`)&&e.closeElement(n)}),document.addEventListener(`keydown`,t=>{if(t.key===`Escape`&&this.activeModals.length>0){let t=this.activeModals[this.activeModals.length-1];e.closeElement(t)}})}static open(e){let t=document.getElementById(e);return t?this.openElement(t):null}static openElement(e){e.classList.remove(`hidden`),e.style.display=`flex`,this.activeModals.includes(e)||this.activeModals.push(e),document.body.style.overflow=`hidden`;let t=e.querySelector(`input:not([type=hidden]), select, textarea, button:not([data-close])`);return t&&setTimeout(()=>t.focus(),50),e}static close(e){let t=document.getElementById(e);t&&this.closeElement(t)}static closeElement(e){e.classList.add(`hidden`),e.style.display=`none`,this.activeModals=this.activeModals.filter(t=>t!==e),this.activeModals.length===0&&(document.body.style.overflow=``)}static closeAll(){for(;this.activeModals.length>0;){let e=this.activeModals.pop();e&&(e.classList.add(`hidden`),e.style.display=`none`)}document.body.style.overflow=``}},t=class{activeTab;onTabChange;constructor(e){this.activeTab=e.activeTab,this.onTabChange=e.onTabChange}initTheme(){let e=localStorage.getItem(`akademie_theme`)||(window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`);this.applyTheme(e);let t=document.getElementById(`theme-toggle`);t&&t.addEventListener(`click`,()=>{let e=(document.documentElement.getAttribute(`data-theme`)||`light`)===`dark`?`light`:`dark`;this.applyTheme(e)})}applyTheme(e){document.documentElement.setAttribute(`data-theme`,e);let t=document.querySelector(`.icon-moon`),n=document.querySelector(`.icon-sun`);e===`dark`?(document.documentElement.classList.add(`dark`),t?.classList.add(`hidden`),n?.classList.remove(`hidden`)):(document.documentElement.classList.remove(`dark`),t?.classList.remove(`hidden`),n?.classList.add(`hidden`)),localStorage.setItem(`akademie_theme`,e)}bindEvents(){document.querySelectorAll(`.nav-tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);t&&t!==this.activeTab&&(this.setActiveTab(t),this.onTabChange(t))})}),this.initTheme()}setActiveTab(e){this.activeTab=e,document.querySelectorAll(`.nav-tab-btn`).forEach(t=>{t.getAttribute(`data-tab`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),document.querySelectorAll(`.tab-pane`).forEach(t=>{t.id===`tab-${e}`?(t.classList.remove(`hidden`),t.classList.add(`active`)):(t.classList.remove(`active`),t.classList.add(`hidden`))})}},n=class extends Error{statusCode;details;constructor(e,t,n){super(e),this.name=`ApiError`,this.statusCode=t,this.details=n}};async function r(e,t={}){let r={"Content-Type":`application/json`,Accept:`application/json`,...t.headers},i=await fetch(e,{...t,headers:r}),a;try{a=await i.json()}catch{throw new n(`Neplatná odpověď serveru (${i.status} ${i.statusText})`,i.status)}if(!i.ok||!a.success)throw new n(a.error||a.message||`Chyba požadavku: ${i.status} ${i.statusText}`,i.status,a);return a.data}async function i(e,t={}){let r={"Content-Type":`application/json`,Accept:`application/json`,...t.headers},i=await fetch(e,{...t,headers:r}),a;try{a=await i.json()}catch{throw new n(`Neplatná odpověď serveru (${i.status} ${i.statusText})`,i.status)}if(!i.ok||!a.success)throw new n(a.error||a.message||`Chyba požadavku: ${i.status} ${i.statusText}`,i.status,a);return a}var a={async getAll(){return r(`/api/courses`)},async getById(e){return r(`/api/courses/${e}`)},async create(e){return r(`/api/courses`,{method:`POST`,body:JSON.stringify(e)})},async update(e,t){return r(`/api/courses/${e}`,{method:`PUT`,body:JSON.stringify(t)})},async delete(e){return(await i(`/api/courses/${e}`,{method:`DELETE`})).message||`Kurz byl úspěšně smazán.`}},o=class{static container=null;static ensureContainer(){if(!this.container){let e=document.getElementById(`toast-container`);e||(e=document.createElement(`div`),e.id=`toast-container`,e.className=`toast-stack`,document.body.appendChild(e)),this.container=e}return this.container}static show(e,t=`success`,n,r=4500){let i=this.ensureContainer(),a=document.createElement(`div`),o={success:{bg:`bg-white dark:bg-slate-800`,border:`border-emerald-500/40 shadow-emerald-500/10`,text:`text-slate-800 dark:text-slate-100`,iconColor:`text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60`,defaultTitle:`Úspěšně provedeno`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`},error:{bg:`bg-white dark:bg-slate-800`,border:`border-rose-500/40 shadow-rose-500/10`,text:`text-slate-800 dark:text-slate-100`,iconColor:`text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60`,defaultTitle:`Došlo k chybě`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`},warning:{bg:`bg-white dark:bg-slate-800`,border:`border-amber-500/40 shadow-amber-500/10`,text:`text-slate-800 dark:text-slate-100`,iconColor:`text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60`,defaultTitle:`Upozornění`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`},info:{bg:`bg-white dark:bg-slate-800`,border:`border-blue-500/40 shadow-blue-500/10`,text:`text-slate-800 dark:text-slate-100`,iconColor:`text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60`,defaultTitle:`Informace`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`}}[t],s=n||o.defaultTitle;a.className=`p-3.5 rounded-xl shadow-xl border flex items-start gap-3 animate-fadeIn transition-all duration-300 min-w-[300px] max-w-md ${o.bg} ${o.border}`,a.setAttribute(`role`,`alert`),a.innerHTML=`
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
    `,a.querySelector(`.toast-close-btn`)?.addEventListener(`click`,()=>c());let c=()=>{a.style.opacity=`0`,a.style.transform=`translateX(24px) scale(0.95)`,setTimeout(()=>a.remove(),250)};i.appendChild(a),r>0&&setTimeout(c,r)}static success(e,t){this.show(e,`success`,t)}static error(e,t){this.show(e,`error`,t)}static warning(e,t){this.show(e,`warning`,t)}static info(e,t){this.show(e,`info`,t)}},s=class{courses=[];filterType=`all`;searchQuery=``;isEditing=!1;editingCourseId=null;container=null;searchInput=null;filterChips=null;form=null;formError=null;modalTitle=null;init(){this.container=document.getElementById(`courses-list`),this.searchInput=document.getElementById(`filter-search-course`),this.filterChips=document.querySelectorAll(`.filter-chip`),this.form=document.getElementById(`form-course`),this.formError=document.getElementById(`form-course-error`),this.modalTitle=document.getElementById(`modal-course-title`),this.bindEvents(),this.load()}bindEvents(){this.searchInput?.addEventListener(`input`,e=>{this.searchQuery=e.target.value.toLowerCase().trim(),this.render()}),this.filterChips?.forEach(e=>{e.addEventListener(`click`,()=>{this.filterChips?.forEach(e=>{e.className=`filter-chip px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}),e.className=`filter-chip px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800`,this.filterType=e.getAttribute(`data-filter`)||`all`,this.render()})}),document.getElementById(`btn-open-create-course`)?.addEventListener(`click`,()=>{this.openCreateModal()}),this.form?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleSubmit()})}async load(){try{this.courses=await a.getAll(),this.render()}catch(e){o.error(e.message||`Nepodařilo se načíst seznam kurzů.`)}}render(){if(!this.container)return;this.container.innerHTML=``;let e=this.courses.filter(e=>{if(this.filterType===`accredited`&&!e.isAccredited||this.filterType===`standard`&&e.isAccredited)return!1;if(this.searchQuery){let t=e.title.toLowerCase().includes(this.searchQuery),n=e.annotation.toLowerCase().includes(this.searchQuery);if(!t&&!n)return!1}return!0});e.length===0?this.container.innerHTML=`
        <div class="col-span-full py-16 text-center bg-white dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Žádné kurzy neodpovídají zadanému filtru.</p>
          <p class="text-xs text-slate-400 mt-1">Zkuste změnit vyhledávací dotaz nebo vybrat jinou kategorii.</p>
        </div>
      `:e.forEach(e=>{let t=document.createElement(`div`);t.className=`card-box flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200`;let n=Number(e.price).toLocaleString(`cs-CZ`);t.innerHTML=`
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            ${e.isAccredited?`<span class="badge-chip badge-chip-green font-medium">Akreditováno MŠMT</span>`:`<span class="badge-chip badge-chip-blue font-medium">Firemní kurz</span>`}
            <span class="text-base font-bold text-slate-900 dark:text-white">${n} Kč</span>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">${e.title}</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">${e.annotation}</p>
        </div>
        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between mt-auto">
          <span class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${e.hours} hodin výuky
          </span>
          <div class="flex items-center gap-2">
            <button class="btn-secondary-tw btn-sm-tw btn-edit-course" data-id="${e.id}">Upravit</button>
            <button class="btn-danger-tw btn-sm-tw btn-delete-course" data-id="${e.id}">Smazat</button>
          </div>
        </div>
      `,t.querySelector(`.btn-edit-course`)?.addEventListener(`click`,()=>this.openEditModal(e)),t.querySelector(`.btn-delete-course`)?.addEventListener(`click`,()=>this.handleDelete(e)),this.container?.appendChild(t)})}openCreateModal(){this.isEditing=!1,this.editingCourseId=null,this.modalTitle&&(this.modalTitle.textContent=`Nový kurz`),this.form&&this.form.reset(),this.formError&&(this.formError.style.display=`none`),e.open(`modal-course`)}openEditModal(t){this.isEditing=!0,this.editingCourseId=t.id,this.modalTitle&&(this.modalTitle.textContent=`Upravit kurz`),this.formError&&(this.formError.style.display=`none`);let n=document.getElementById(`course-title`),r=document.getElementById(`course-annotation`),i=document.getElementById(`course-hours`),a=document.getElementById(`course-price`),o=document.getElementById(`course-accredited`),s=document.getElementById(`course-id`);n&&(n.value=t.title),r&&(r.value=t.annotation),i&&(i.value=t.hours.toString()),a&&(a.value=t.price.toString()),o&&(o.checked=t.isAccredited),s&&(s.value=t.id),e.open(`modal-course`)}async handleSubmit(){if(!this.form)return;this.formError&&(this.formError.style.display=`none`);let t={title:document.getElementById(`course-title`).value.trim(),annotation:document.getElementById(`course-annotation`).value.trim(),hours:parseInt(document.getElementById(`course-hours`).value,10),price:parseFloat(document.getElementById(`course-price`).value),isAccredited:document.getElementById(`course-accredited`).checked};try{this.isEditing&&this.editingCourseId?(await a.update(this.editingCourseId,t),o.success(`Kurz byl úspěšně aktualizován.`)):(await a.create(t),o.success(`Nový kurz byl úspěšně vytvořen.`)),e.close(`modal-course`),await this.load()}catch(e){this.formError&&(this.formError.textContent=e.message||`Chyba při ukládání kurzu.`,this.formError.style.display=`block`)}}async handleDelete(e){if(window.confirm(`Opravdu chcete smazat kurz "${e.title}"? Smažou se i všechny navázané termíny a přihlášky.`))try{let t=await a.delete(e.id);o.success(t),await this.load()}catch(e){o.error(e.message||`Nepodařilo se smazat kurz.`)}}},c={async getAll(){return r(`/api/terms`)},async getById(e){return r(`/api/terms/${e}`)},async create(e){return r(`/api/terms`,{method:`POST`,body:JSON.stringify(e)})},async getEnrollments(e){return r(`/api/terms/${e}/enrollments`)},async createEnrollment(e,t){let n=await i(`/api/terms/${e}/enrollments`,{method:`POST`,body:JSON.stringify(t)});return{enrollment:n.data,message:n.message||`Student byl úspěšně zaregistrován.`}},async cancelEnrollment(e){let t=await i(`/api/enrollments/${e}/cancel`,{method:`POST`});return{message:t.message||`Přihláška byla zrušena.`,promotedEnrollmentId:t.data?.promotedEnrollmentId}}},l={async getLecturers(){return r(`/api/lecturers`)},async getClassrooms(){return r(`/api/classrooms`)},async getAnalytics(){return r(`/api/analytics`)}},u=class{terms=[];selectedTermId=null;enrollments=[];termsTableBody=null;termDetailBox=null;detailTermTitle=null;detailTermInfo=null;enrollmentsTableBody=null;formTerm=null;formTermError=null;formEnrollment=null;formEnrollmentError=null;enrollmentTermNotice=null;init(){this.termsTableBody=document.getElementById(`terms-table-body`),this.termDetailBox=document.getElementById(`term-detail-box`),this.detailTermTitle=document.getElementById(`detail-term-title`),this.detailTermInfo=document.getElementById(`detail-term-info`),this.enrollmentsTableBody=document.getElementById(`enrollments-table-body`),this.formTerm=document.getElementById(`form-term`),this.formTermError=document.getElementById(`form-term-error`),this.formEnrollment=document.getElementById(`form-enrollment`),this.formEnrollmentError=document.getElementById(`form-enrollment-error`),this.enrollmentTermNotice=document.getElementById(`enrollment-term-notice`),this.bindEvents(),this.load()}bindEvents(){document.getElementById(`btn-open-create-term`)?.addEventListener(`click`,async()=>{await this.openCreateTermModal()}),this.formTerm?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateTermSubmit()}),document.getElementById(`btn-open-enroll`)?.addEventListener(`click`,()=>{this.openEnrollmentModal()}),this.formEnrollment?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleEnrollmentSubmit()})}async load(){try{this.terms=await c.getAll(),this.renderTerms(),this.selectedTermId&&await this.selectTerm(this.selectedTermId)}catch(e){o.error(e.message||`Nepodařilo se načíst termíny kurzů.`)}}getTerms(){return this.terms}getSelectedTermId(){return this.selectedTermId}renderTerms(){this.termsTableBody&&(this.termsTableBody.innerHTML=``,this.terms.length===0?this.termsTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-10 text-slate-400">
            Dosud nebyly vypsány žádné termíny kurzů.
          </td>
        </tr>
      `:this.terms.forEach(e=>{let t=e.confirmedCount>=e.capacity,n=e.status===`COMPLETED`,r=``;r=n?`<span class="badge-chip badge-chip-blue">Ukončen</span>`:t?`<span class="badge-chip badge-chip-yellow">Kapacita naplněna</span>`:`<span class="badge-chip badge-chip-green">Volná místa</span>`;let i=e.lecturers&&e.lecturers.length>0?e.lecturers.map(e=>e.name).join(`, `):`Nepřiřazen`,a=document.createElement(`tr`);e.id===this.selectedTermId&&a.classList.add(`row-selected`),a.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.courseTitle}</td>
        <td class="text-xs">${e.startDate} až ${e.endDate}</td>
        <td class="text-xs text-slate-600 dark:text-slate-300">${e.classroomName||`Neuvedena`}</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900 dark:text-white">${e.confirmedCount} / ${e.capacity}</span>
            <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div class="h-full ${t?`bg-amber-500`:`bg-blue-600`} rounded-full" style="width: ${Math.min(100,Math.round(e.confirmedCount/e.capacity*100))}%;"></div>
            </div>
          </div>
          ${e.waitlistCount>0?`<div class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">${e.waitlistCount} v pořadníku</div>`:``}
        </td>
        <td class="text-xs text-slate-500 dark:text-slate-400">${i}</td>
        <td>${r}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-view-term" data-id="${e.id}">
            Detail & Přihlášky
          </button>
        </td>
      `,a.querySelector(`.btn-view-term`)?.addEventListener(`click`,()=>this.selectTerm(e.id)),this.termsTableBody?.appendChild(a)}))}async selectTerm(e){this.selectedTermId=e,this.renderTerms();let t=this.terms.find(t=>t.id===e);if(t){this.termDetailBox&&(this.termDetailBox.style.display=`block`),this.detailTermTitle&&(this.detailTermTitle.textContent=`Přihlášky a pořadník: ${t.courseTitle}`),this.detailTermInfo&&(this.detailTermInfo.textContent=`Termín: ${t.startDate} až ${t.endDate} • Učebna: ${t.classroomName} • Obsazenost: ${t.confirmedCount} / ${t.capacity} míst (V pořadníku: ${t.waitlistCount})`);try{this.enrollments=await c.getEnrollments(e),this.renderEnrollments()}catch(e){o.error(e.message||`Nepodařilo se načíst přihlášky k termínu.`)}}}renderEnrollments(){this.enrollmentsTableBody&&(this.enrollmentsTableBody.innerHTML=``,this.enrollments.length===0?this.enrollmentsTableBody.innerHTML=`
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            Na tento termín se zatím nikdo nepřihlásil.
          </td>
        </tr>
      `:this.enrollments.forEach(e=>{let t=``;e.status===`CONFIRMED`?t=`<span class="badge-chip badge-chip-green font-medium">Potvrzeno</span>`:e.status===`WAITLIST`?t=`<span class="badge-chip badge-chip-yellow font-medium">Náhradník #${e.waitlistPosition||1}</span>`:e.status===`CANCELLED`?t=`<span class="badge-chip badge-chip-red font-medium">Zrušeno</span>`:e.status===`COMPLETED`&&(t=`<span class="badge-chip badge-chip-blue font-medium">Absolvováno</span>`);let n=new Date(e.submittedAt).toLocaleString(`cs-CZ`,{dateStyle:`short`,timeStyle:`short`}),r=e.status===`CONFIRMED`||e.status===`WAITLIST`,i=document.createElement(`tr`);i.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.studentName}</td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${e.studentEmail}</td>
        <td class="text-xs">${e.studentPhone||`-`} ${e.studentOrganization?`<span class="text-slate-400">(${e.studentOrganization})</span>`:``}</td>
        <td class="text-xs text-slate-500">${n}</td>
        <td>${t}</td>
        <td class="text-right">
          ${r?`<button class="btn-danger-tw btn-sm-tw btn-cancel-enroll" data-id="${e.id}">Zrušit účast</button>`:`<span class="text-slate-400 text-xs">-</span>`}
        </td>
      `,i.querySelector(`.btn-cancel-enroll`)?.addEventListener(`click`,()=>this.handleCancelEnrollment(e)),this.enrollmentsTableBody?.appendChild(i)}))}async handleCancelEnrollment(e){let t=e.status===`CONFIRMED`?`Opravdu chcete zrušit účast studenta ${e.studentName}? Zrušením se uvolní místo a první náhradník z pořadníku bude automaticky povýšen na potvrzeného!`:`Opravdu chcete odebrat studenta ${e.studentName} z pořadníku náhradníků?`;if(window.confirm(t))try{let t=await c.cancelEnrollment(e.id);o.success(t.message),await this.load()}catch(e){o.error(e.message||`Nepodařilo se zrušit přihlášku.`)}}async openCreateTermModal(){this.formTerm&&this.formTerm.reset(),this.formTermError&&(this.formTermError.style.display=`none`);try{let[t,n,r]=await Promise.all([a.getAll(),l.getClassrooms(),l.getLecturers()]),i=document.getElementById(`term-course-select`),o=document.getElementById(`term-classroom-select`),s=document.getElementById(`term-lecturer-select`);i&&(i.innerHTML=t.map(e=>`<option value="${e.id}">${e.title} (${e.hours}h • ${Number(e.price).toLocaleString(`cs-CZ`)} Kč)</option>`).join(``)),o&&(o.innerHTML=`<option value="">-- Bez učebny (bude upřesněno) --</option>`+n.map(e=>`<option value="${e.id}">${e.name} (kapacita ${e.capacity})</option>`).join(``)),s&&(s.innerHTML=`<option value="">-- Zvolte lektora --</option>`+r.map(e=>`<option value="${e.id}">${e.name} (${e.specialization||`Lektor`})</option>`).join(``)),e.open(`modal-term`)}catch{o.error(`Nepodařilo se načíst číselníky pro vypsání termínu.`)}}async handleCreateTermSubmit(){if(!this.formTerm)return;this.formTermError&&(this.formTermError.style.display=`none`);let t=document.getElementById(`term-course-select`).value,n=document.getElementById(`term-classroom-select`).value||void 0,r=document.getElementById(`term-start-date`).value,i=document.getElementById(`term-end-date`).value,a=parseInt(document.getElementById(`term-capacity`).value,10),s=document.getElementById(`term-lecturer-select`).value,l={courseId:t,classroomId:n,startDate:r,endDate:i,capacity:a,lecturerIds:s?[s]:void 0};try{await c.create(l),o.success(`Nový termín kurzu byl úspěšně vypsán.`),e.close(`modal-term`),await this.load()}catch(e){this.formTermError&&(this.formTermError.textContent=e.message||`Chyba při vypisování termínu.`,this.formTermError.style.display=`block`)}}openEnrollmentModal(){if(!this.selectedTermId){o.warning(`Nejprve vyberte termín ze seznamu výše.`);return}let t=this.terms.find(e=>e.id===this.selectedTermId);if(!t)return;this.formEnrollment&&this.formEnrollment.reset(),this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let n=document.getElementById(`enrollment-term-id`);n&&(n.value=t.id);let r=t.confirmedCount>=t.capacity;this.enrollmentTermNotice&&(this.enrollmentTermNotice.innerHTML=`
        <div class="font-bold text-slate-900 dark:text-white mb-0.5">Termín: ${t.courseTitle}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400 mb-2">Období: ${t.startDate} až ${t.endDate} • Obsazeno ${t.confirmedCount} z ${t.capacity} míst</div>
        ${r?`<div class="p-2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                ⚠️ Kapacita kurzu je plně obsazena! Student bude zařazen jako náhradník #${t.waitlistCount+1} do pořadníku (ADR-02).
               </div>`:`<div class="p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                ✓ Volná místa k dispozici – student získá ihned potvrzené místo v kurzu.
               </div>`}
      `),e.open(`modal-enrollment`)}async handleEnrollmentSubmit(){if(!this.selectedTermId||!this.formEnrollment)return;this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let t={firstName:document.getElementById(`student-first-name`).value.trim(),lastName:document.getElementById(`student-last-name`).value.trim(),email:document.getElementById(`student-email`).value.trim(),phone:document.getElementById(`student-phone`).value.trim()||void 0,organization:document.getElementById(`student-organization`).value.trim()||void 0,note:document.getElementById(`student-note`).value.trim()||void 0};try{let n=await c.createEnrollment(this.selectedTermId,t);o.success(n.message),e.close(`modal-enrollment`),await this.load()}catch(e){this.formEnrollmentError&&(this.formEnrollmentError.textContent=e.message||`Chyba při odesílání přihlášky.`,this.formEnrollmentError.style.display=`block`)}}},d={async getDays(e){return r(`/api/attendance/terms/${e}/days`)},async createDay(e,t){return r(`/api/attendance/terms/${e}/days`,{method:`POST`,body:JSON.stringify(t)})},async getDayAttendance(e){return r(`/api/attendance/days/${e}`)},async markAttendance(e,t){return(await i(`/api/attendance/days/${e}/mark`,{method:`POST`,body:JSON.stringify(t)})).message||`Docházka byla uložena.`},async getSummary(e){return r(`/api/attendance/terms/${e}/summary`)}},f=class{terms=[];selectedTermId=null;teachingDays=[];selectedDayId=null;roster=[];summary=[];termSelect=null;daysTableBody=null;daysCountBadge=null;rosterTableBody=null;summaryTableBody=null;rosterDayTitle=null;rosterDaySubtitle=null;btnSaveAttendance=null;formTeachingDay=null;formTeachingDayError=null;init(){this.termSelect=document.getElementById(`attendance-term-select`),this.daysTableBody=document.getElementById(`teaching-days-table-body`),this.daysCountBadge=document.getElementById(`attendance-days-count`),this.rosterTableBody=document.getElementById(`attendance-roster-body`),this.summaryTableBody=document.getElementById(`attendance-summary-table-body`),this.rosterDayTitle=document.getElementById(`attendance-day-title`),this.rosterDaySubtitle=document.getElementById(`attendance-day-subtitle`),this.btnSaveAttendance=document.getElementById(`btn-save-attendance`),this.formTeachingDay=document.getElementById(`form-teaching-day`),this.formTeachingDayError=document.getElementById(`form-teaching-day-error`),this.bindEvents(),this.load()}bindEvents(){this.termSelect?.addEventListener(`change`,async()=>{this.selectedTermId=this.termSelect?.value||null,this.selectedDayId=null,await this.loadTermDetails()}),document.getElementById(`btn-open-create-day`)?.addEventListener(`click`,async()=>{await this.openCreateDayModal()}),this.formTeachingDay?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateDaySubmit()}),this.btnSaveAttendance?.addEventListener(`click`,async()=>{await this.handleSaveAttendance()})}async load(){try{this.terms=await c.getAll(),this.renderTermSelect(),this.terms.length>0&&(this.selectedTermId&&this.terms.some(e=>e.id===this.selectedTermId)||(this.selectedTermId=this.terms[0].id),this.termSelect&&(this.termSelect.value=this.selectedTermId),await this.loadTermDetails())}catch(e){o.error(e.message||`Nepodařilo se načíst termíny pro docházku.`)}}renderTermSelect(){this.termSelect&&(this.termSelect.innerHTML=this.terms.map(e=>`<option value="${e.id}">${e.courseTitle} (${e.startDate} až ${e.endDate})</option>`).join(``))}async loadTermDetails(){if(this.selectedTermId)try{let[e,t]=await Promise.all([d.getDays(this.selectedTermId),d.getSummary(this.selectedTermId)]);if(this.teachingDays=e,this.summary=t,this.renderTeachingDays(),this.renderSummary(),this.teachingDays.length>0){let e=this.teachingDays[0];await this.selectTeachingDay(e)}else this.clearRoster(`Tento termín zatím nemá vypsané žádné výukové dny.`)}catch(e){o.error(e.message||`Nepodařilo se načíst data docházky.`)}}renderTeachingDays(){this.daysTableBody&&(this.daysTableBody.innerHTML=``,this.daysCountBadge&&(this.daysCountBadge.textContent=`${this.teachingDays.length} dnů`),this.teachingDays.length===0?this.daysTableBody.innerHTML=`
        <tr>
          <td colspan="5" class="text-center py-8 text-slate-400">
            Tento termín zatím nemá vypsané žádné výukové dny.
          </td>
        </tr>
      `:this.teachingDays.forEach(e=>{let t=document.createElement(`tr`);e.id===this.selectedDayId&&t.classList.add(`row-selected`),t.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.dayDate}</td>
        <td class="text-xs">${e.topic}</td>
        <td class="text-xs font-semibold">${e.hours} hod.</td>
        <td class="text-xs text-slate-500">${e.lecturerName||`Neuveden`}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-select-day" data-id="${e.id}">
            Zapsat (${e.presentCount}/${e.attendanceCount})
          </button>
        </td>
      `,t.querySelector(`.btn-select-day`)?.addEventListener(`click`,()=>this.selectTeachingDay(e)),this.daysTableBody?.appendChild(t)}))}async selectTeachingDay(e){this.selectedDayId=e.id,this.renderTeachingDays(),this.rosterDayTitle&&(this.rosterDayTitle.textContent=`Prezenční listina: ${e.dayDate}`),this.rosterDaySubtitle&&(this.rosterDaySubtitle.textContent=`Téma: ${e.topic} • Lektor: ${e.lecturerName||`Neurčen`} • Rozsah: ${e.hours} hod.`);try{this.roster=await d.getDayAttendance(e.id),this.renderRoster()}catch(e){o.error(e.message||`Nepodařilo se načíst prezenční listinu dne.`)}}clearRoster(e){this.rosterTableBody&&(this.rosterTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">${e}</td>
        </tr>
      `),this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`none`)}renderRoster(){this.rosterTableBody&&(this.rosterTableBody.innerHTML=``,this.roster.length===0?this.clearRoster(`Na tomto termínu nejsou žádní potvrzení studenti.`):(this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`inline-flex`),this.roster.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.studentName}</td>
        <td class="text-xs text-slate-500">${e.studentEmail}</td>
        <td>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" class="att-checkbox w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700" data-student="${e.studentId}" ${e.isPresent?`checked`:``}>
            <span class="text-xs font-semibold ${e.isPresent?`text-emerald-600 dark:text-emerald-400`:`text-slate-400`} label-status">
              ${e.isPresent?`Přítomen`:`Nepřítomen`}
            </span>
          </label>
        </td>
        <td>
          <input type="text" class="att-note input-tw py-1 text-xs" data-student="${e.studentId}" value="${e.note||``}" placeholder="Poznámka / omluva...">
        </td>
      `;let n=t.querySelector(`.att-checkbox`),r=t.querySelector(`.label-status`);n?.addEventListener(`change`,()=>{n.checked?(r.textContent=`Přítomen`,r.className=`text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status`):(r.textContent=`Nepřítomen`,r.className=`text-xs font-semibold text-slate-400 label-status`)}),this.rosterTableBody?.appendChild(t)})))}async handleSaveAttendance(){if(!this.selectedDayId||!this.selectedTermId)return;let e=document.querySelectorAll(`.att-checkbox`),t=0;try{for(let n of e){let e=n.getAttribute(`data-student`);if(!e)continue;let r=n.checked,i=document.querySelector(`.att-note[data-student="${e}"]`),a=i?i.value.trim():void 0;await d.markAttendance(this.selectedDayId,{studentId:e,isPresent:r,note:a}),t++}o.success(`Prezenční listina byla uložena (${t} studentů).`),await this.loadTermDetails()}catch(e){o.error(e.message||`Chyba při ukládání docházky.`)}}renderSummary(){this.summaryTableBody&&(this.summaryTableBody.innerHTML=``,this.summary.length===0?this.summaryTableBody.innerHTML=`
        <tr>
          <td colspan="6" class="text-center py-8 text-slate-400">
            Dosud nejsou k dispozici žádná data pro souhrn docházky.
          </td>
        </tr>
      `:this.summary.forEach(e=>{let t=e.qualifiesForCertificate?`<span class="badge-chip badge-chip-green font-medium">Splněno (${e.attendancePercentage} %)</span>`:`<span class="badge-chip badge-chip-red font-medium">Nesplněno (${e.attendancePercentage} %)</span>`,n=``;n=e.certificateIssued?`<span class="badge-chip badge-chip-blue font-mono">Vystaveno (${e.certificateNumber})</span>`:e.qualifiesForCertificate?`<span class="badge-chip badge-chip-yellow">Čeká na uzavření</span>`:`<span class="badge-chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Vyžaduje výjimku</span>`;let r=document.createElement(`tr`);r.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.studentName}</td>
        <td class="text-xs text-slate-500">${e.studentEmail}</td>
        <td class="text-xs font-medium">${e.attendedDays} z ${e.totalDays} dnů</td>
        <td>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-900 dark:text-white">${e.attendancePercentage} %</span>
            <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div class="h-full ${e.qualifiesForCertificate?`bg-emerald-500`:`bg-rose-500`} rounded-full" style="width: ${Math.min(100,e.attendancePercentage)}%;"></div>
            </div>
          </div>
        </td>
        <td>${t}</td>
        <td>${n}</td>
      `,this.summaryTableBody?.appendChild(r)}))}async openCreateDayModal(){if(!this.selectedTermId){o.warning(`Nejprve vyberte termín kurzu.`);return}this.formTeachingDay&&this.formTeachingDay.reset(),this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t=document.getElementById(`day-term-id`);t&&(t.value=this.selectedTermId);try{let t=await l.getLecturers(),n=document.getElementById(`day-lecturer-select`);n&&(n.innerHTML=`<option value="">-- Zvolte lektora pro tento den --</option>`+t.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)),e.open(`modal-teaching-day`)}catch{o.error(`Chyba při načítání seznamu lektorů.`)}}async handleCreateDaySubmit(){if(!this.selectedTermId||!this.formTeachingDay)return;this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t={dayDate:document.getElementById(`day-date`).value,hours:parseInt(document.getElementById(`day-hours`).value,10),topic:document.getElementById(`day-topic`).value.trim(),lecturerId:document.getElementById(`day-lecturer-select`).value||void 0};try{await d.createDay(this.selectedTermId,t),o.success(`Výukový den byl úspěšně přidán.`),e.close(`modal-teaching-day`),await this.loadTermDetails()}catch(e){this.formTeachingDayError&&(this.formTeachingDayError.textContent=e.message||`Chyba při vytváření výukového dne.`,this.formTeachingDayError.style.display=`block`)}}},p={async getAll(){return r(`/api/certificates`)},async getById(e){return r(`/api/certificates/${e}`)},async completeTerm(e){let t=await i(`/api/terms/${e}/complete`,{method:`POST`});return{message:t.message||`Termín byl uzavřen.`,issuedCount:t.data?.issuedCertificatesCount??0}},async issueWithWaiver(e,t){return r(`/api/certificates/issue`,{method:`POST`,body:JSON.stringify({enrollmentId:e,hasWaiver:!0,waiverReason:t})})}},m=class{certificates=[];terms=[];certificatesTableBody=null;completeTermSelect=null;btnCompleteTerm=null;btnOpenIssueWaiver=null;formWaiver=null;formWaiverError=null;waiverEnrollmentSelect=null;init(){this.certificatesTableBody=document.getElementById(`certificates-table-body`),this.completeTermSelect=document.getElementById(`complete-term-select`),this.btnCompleteTerm=document.getElementById(`btn-complete-term`),this.btnOpenIssueWaiver=document.getElementById(`btn-open-issue-waiver`),this.formWaiver=document.getElementById(`form-waiver`),this.formWaiverError=document.getElementById(`form-waiver-error`),this.waiverEnrollmentSelect=document.getElementById(`waiver-enrollment-select`),this.bindEvents(),this.load()}bindEvents(){this.btnCompleteTerm?.addEventListener(`click`,async()=>{await this.handleCompleteTerm()}),this.btnOpenIssueWaiver?.addEventListener(`click`,async()=>{await this.openWaiverModal()}),this.formWaiver?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleWaiverSubmit()})}async load(){try{let[e,t]=await Promise.all([p.getAll(),c.getAll()]);this.certificates=e,this.terms=t,this.renderCertificates(),this.renderTermSelect()}catch(e){o.error(e.message||`Nepodařilo se načíst osvědčení o absolvování.`)}}renderTermSelect(){this.completeTermSelect&&(this.completeTermSelect.innerHTML=`<option value="">-- Zvolte termín kurzu k uzavření --</option>`+this.terms.map(e=>`<option value="${e.id}">${e.courseTitle} (${e.startDate} až ${e.endDate}) [${e.status}]</option>`).join(``))}renderCertificates(){this.certificatesTableBody&&(this.certificatesTableBody.innerHTML=``,this.certificates.length===0?this.certificatesTableBody.innerHTML=`
        <tr>
          <td colspan="6" class="text-center py-10 text-slate-400">
            Zatím nebyla vystavena žádná osvědčení. Uzavřete termín nebo udělte výjimku lektora.
          </td>
        </tr>
      `:this.certificates.forEach(e=>{let t=e.hasWaiver?`<span class="badge-chip badge-chip-yellow font-medium cursor-help" title="Důvod výjimky: ${e.waiverReason||`Uděleno lektorem`}">
            Výjimka lektora (ADR-01)
           </span>`:`<span class="badge-chip badge-chip-green font-medium">Standardní (≥ 70 %)</span>`,n=document.createElement(`tr`);n.innerHTML=`
        <td>
          <span class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            ${e.certificateNumber}
          </span>
        </td>
        <td>
          <strong class="text-slate-900 dark:text-white">${e.studentName}</strong>
          <div class="text-xs text-slate-400">${e.studentEmail}</div>
        </td>
        <td class="text-xs font-medium">${e.courseTitle}</td>
        <td class="text-xs text-slate-500">${e.issueDate}</td>
        <td>
          <span class="font-bold text-xs ${e.attendanceRate>=70?`text-emerald-600 dark:text-emerald-400`:`text-amber-600 dark:text-amber-400`}">
            ${e.attendanceRate} %
          </span>
        </td>
        <td>${t}</td>
      `,this.certificatesTableBody?.appendChild(n)}))}async handleCompleteTerm(){let e=this.completeTermSelect?.value;if(!e){o.warning(`Nejprve vyberte termín ze seznamu vedle tlačítka.`);return}let t=this.terms.find(t=>t.id===e);if(window.confirm(`Opravdu chcete uzavřít termín "${t?.courseTitle||``}"? Systém automaticky vystaví osvědčení všem studentům, kteří dosáhli alespoň 70% docházky (ADR-01).`))try{let t=await p.completeTerm(e);o.success(t.message),await this.load()}catch(e){o.error(e.message||`Nepodařilo se uzavřít termín kurzu.`)}}async openWaiverModal(){if(this.formWaiver&&this.formWaiver.reset(),this.formWaiverError&&(this.formWaiverError.style.display=`none`),this.waiverEnrollmentSelect){this.waiverEnrollmentSelect.innerHTML=`<option value="">Načítám způsobilé přihlášky studentů...</option>`,e.open(`modal-waiver`);try{let e=``;for(let t of this.terms){let n=await c.getEnrollments(t.id);for(let r of n)r.status!==`CONFIRMED`&&r.status!==`COMPLETED`||this.certificates.some(e=>e.enrollmentId===r.id)||(e+=`<option value="${r.id}">${r.studentName} – ${t.courseTitle} (${r.studentEmail})</option>`)}this.waiverEnrollmentSelect.innerHTML=e||`<option value="">Žádní studenti bez dosud vystaveného osvědčení</option>`}catch{o.error(`Chyba při načítání přihlášek pro udělení výjimky.`)}}}async handleWaiverSubmit(){if(!this.formWaiver||!this.waiverEnrollmentSelect)return;this.formWaiverError&&(this.formWaiverError.style.display=`none`);let t=this.waiverEnrollmentSelect.value,n=document.getElementById(`waiver-reason`).value.trim();if(!t)this.formWaiverError&&(this.formWaiverError.textContent=`Vyberte prosím studenta ze seznamu.`,this.formWaiverError.style.display=`block`);else if(n.length<5)this.formWaiverError&&(this.formWaiverError.textContent=`Uveďte prosím podrobnější písemné odůvodnění výjimky (min. 5 znaků).`,this.formWaiverError.style.display=`block`);else try{let r=await p.issueWithWaiver(t,n);o.success(`Osvědčení č. ${r.certificateNumber} bylo úspěšně vystaveno na základě výjimky!`),e.close(`modal-waiver`),await this.load()}catch(e){this.formWaiverError&&(this.formWaiverError.textContent=e.message||`Chyba při vystavování osvědčení s výjimkou.`,this.formWaiverError.style.display=`block`)}}},h=class{lecturers=[];classrooms=[];lecturersTableBody=null;classroomsTableBody=null;init(){this.lecturersTableBody=document.getElementById(`lecturers-table-body`),this.classroomsTableBody=document.getElementById(`classrooms-table-body`),this.load()}async load(){try{let[e,t]=await Promise.all([l.getLecturers(),l.getClassrooms()]);this.lecturers=e,this.classrooms=t,this.renderLecturers(),this.renderClassrooms()}catch(e){o.error(e.message||`Nepodařilo se načíst lektory a učebny.`)}}renderLecturers(){this.lecturersTableBody&&(this.lecturersTableBody.innerHTML=``,this.lecturers.length===0?this.lecturersTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádní lektoři.
          </td>
        </tr>
      `:this.lecturers.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
              ${e.name.split(` `).map(e=>e[0]).join(``)}
            </div>
            <div>
              <div class="font-bold text-slate-900 dark:text-white">${e.name}</div>
            </div>
          </div>
        </td>
        <td class="text-xs">
          <div class="text-slate-800 dark:text-slate-200 font-medium">${e.email}</div>
          <div class="text-slate-400">${e.phone||`-`}</div>
        </td>
        <td class="text-xs">
          <span class="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            ${e.specialization||`Lektor`}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <strong class="text-blue-600 dark:text-blue-400 font-bold text-sm">${e.taughtHours} hod.</strong>
            <span class="text-xs text-slate-400">(${e.termCount} termínů)</span>
          </div>
        </td>
      `,this.lecturersTableBody?.appendChild(t)}))}renderClassrooms(){this.classroomsTableBody&&(this.classroomsTableBody.innerHTML=``,this.classrooms.length===0?this.classroomsTableBody.innerHTML=`
        <tr>
          <td colspan="3" class="text-center py-8 text-slate-400">
            V databázi zatím nejsou žádné učebny.
          </td>
        </tr>
      `:this.classrooms.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td class="font-bold text-slate-900 dark:text-white">${e.name}</td>
        <td class="text-xs text-slate-600 dark:text-slate-400">${e.address}</td>
        <td>
          <span class="badge-chip badge-chip-blue font-bold">
            ${e.capacity} studentů
          </span>
        </td>
      `,this.classroomsTableBody?.appendChild(t)}))}},g=class{data=null;termsListContainer=null;lecturersListContainer=null;studentsListContainer=null;btnRefresh=null;init(){this.termsListContainer=document.getElementById(`analytics-terms-list`),this.lecturersListContainer=document.getElementById(`analytics-lecturers-list`),this.studentsListContainer=document.getElementById(`analytics-students-list`),this.btnRefresh=document.getElementById(`btn-refresh-analytics`),this.bindEvents(),this.load()}bindEvents(){this.btnRefresh?.addEventListener(`click`,async()=>{await this.load(!0)})}async load(e=!1){try{this.data=await l.getAnalytics(),this.render(),e&&o.success(`Manažerské statistiky byly aktualizovány.`)}catch(e){o.error(e.message||`Nepodařilo se načíst manažerské výkazy.`)}}render(){this.data&&(this.renderTermStats(),this.renderLecturerStats(),this.renderMultiCourseStudents())}renderTermStats(){this.termsListContainer&&(this.termsListContainer.innerHTML=``,this.data.termStats.length===0?this.termsListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádné termíny pro analýzu vytížení.
        </div>
      `:this.data.termStats.forEach(e=>{let t=document.createElement(`div`);t.className=`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 transition-all`;let n=e.waitlist>0;t.innerHTML=`
        <div class="flex justify-between items-center text-xs mb-2">
          <span class="font-bold text-slate-900 dark:text-white truncate pr-2">
            ${e.courseTitle}
            <span class="font-normal text-slate-400">(${e.period})</span>
          </span>
          <div class="shrink-0 text-right">
            <span class="font-bold text-slate-800 dark:text-slate-200">${e.confirmed} / ${e.capacity}</span>
            <span class="text-slate-500 font-semibold ml-1">(${e.fillRate} %)</span>
          </div>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
          <div class="h-full ${e.fillRate>=100?`bg-amber-500`:`bg-blue-600`} rounded-full transition-all duration-300" style="width: ${Math.min(100,e.fillRate)}%;"></div>
        </div>
        ${n?`<div class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                ${e.waitlist} ${e.waitlist===1?`student čeká`:`studenti čekají`} v pořadníku
               </div>`:`<div class="text-[11px] text-slate-400">Volná místa: ${Math.max(0,e.capacity-e.confirmed)}</div>`}
      `,this.termsListContainer?.appendChild(t)}))}renderLecturerStats(){this.lecturersListContainer&&(this.lecturersListContainer.innerHTML=``,this.data.lecturerStats.length===0?this.lecturersListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-slate-400">
          Zatím nejsou k dispozici žádná data o lektorech.
        </div>
      `:this.data.lecturerStats.forEach(e=>{let t=document.createElement(`div`);t.className=`p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex justify-between items-center text-xs`,t.innerHTML=`
        <span class="font-bold text-slate-900 dark:text-white">${e.name}</span>
        <div class="flex items-center gap-2">
          <span class="font-bold text-blue-600 dark:text-blue-400">${e.taughtHours} odučených hodin</span>
          <span class="text-slate-400">(${e.termCount} termínů)</span>
        </div>
      `,this.lecturersListContainer?.appendChild(t)}))}renderMultiCourseStudents(){this.studentsListContainer&&(this.studentsListContainer.innerHTML=``,this.data.multiCourseStudents.length===0?this.studentsListContainer.innerHTML=`
        <div class="py-8 text-center text-xs text-slate-400">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `:this.data.multiCourseStudents.forEach(e=>{let t=document.createElement(`div`);t.className=`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs`;let n=e.courses.map(e=>`<span class="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">${e}</span>`).join(` `);t.innerHTML=`
        <div>
          <div class="font-bold text-slate-900 dark:text-white text-sm">
            ${e.student}
            <span class="font-normal text-xs text-slate-400 ml-1">(${e.email})</span>
            ${e.organization?`<span class="font-normal text-xs text-blue-600 dark:text-blue-400 ml-1.5">• ${e.organization}</span>`:``}
          </div>
          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <span class="text-slate-400 text-[11px]">Zapsané kurzy:</span>
            ${n}
          </div>
        </div>
        <div class="shrink-0 self-start sm:self-auto">
          <span class="badge-chip badge-chip-green font-bold text-xs">
            ${e.courseCount} kurzy
          </span>
        </div>
      `,this.studentsListContainer?.appendChild(t)}))}},_=class{header;coursesView;termsView;attendanceView;certificatesView;lecturersView;analyticsView;constructor(){e.init(),this.coursesView=new s,this.termsView=new u,this.attendanceView=new f,this.certificatesView=new m,this.lecturersView=new h,this.analyticsView=new g,this.header=new t({activeTab:`courses`,onTabChange:e=>this.handleTabChange(e)})}init(){this.header.bindEvents(),this.coursesView.init(),this.termsView.init(),this.attendanceView.init(),this.certificatesView.init(),this.lecturersView.init(),this.analyticsView.init(),this.checkHealth()}handleTabChange(e){switch(e){case`courses`:this.coursesView.load();break;case`terms`:this.termsView.load();break;case`attendance`:this.attendanceView.load();break;case`certificates`:this.certificatesView.load();break;case`lecturers`:this.lecturersView.load();break;case`analytics`:this.analyticsView.load()}}async checkHealth(){let e=document.getElementById(`system-status-indicator`);if(e)try{if((await fetch(`/health`)).ok)e.innerHTML=`
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Systém aktivní
        `,e.className=`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800`;else throw Error(`Chyba spojení`)}catch{e.innerHTML=`
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Offline
      `,e.className=`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800`}}};document.addEventListener(`DOMContentLoaded`,()=>{new _().init()});