(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class e{static activeModals=[];static init(){document.addEventListener(`click`,t=>{let n=t.target,r=n.closest(`[data-close]`);if(r){let t=r.getAttribute(`data-close`);t&&e.close(t)}n.classList.contains(`modal-overlay`)&&e.closeElement(n)}),document.addEventListener(`keydown`,t=>{if(t.key===`Escape`&&this.activeModals.length>0){let t=this.activeModals[this.activeModals.length-1];e.closeElement(t)}})}static open(e){let t=document.getElementById(e);return t?this.openElement(t):null}static openElement(e){e.classList.remove(`hidden`),e.style.display=`flex`,this.activeModals.includes(e)||this.activeModals.push(e),document.body.style.overflow=`hidden`;let t=e.querySelector(`input:not([type=hidden]), select, textarea, button:not([data-close])`);return t&&setTimeout(()=>t.focus(),50),e}static close(e){let t=document.getElementById(e);t&&this.closeElement(t)}static closeElement(e){e.classList.add(`hidden`),e.style.display=`none`,this.activeModals=this.activeModals.filter(t=>t!==e),this.activeModals.length===0&&(document.body.style.overflow=``)}static closeAll(){for(;this.activeModals.length>0;){let e=this.activeModals.pop();e&&(e.classList.add(`hidden`),e.style.display=`none`)}document.body.style.overflow=``}},t=class extends Error{statusCode;details;constructor(e,t,n){super(e),this.name=`ApiError`,this.statusCode=t,this.details=n}};function n(){let e=localStorage.getItem(`akademie_admin_token`);return e?{Authorization:`Bearer ${e}`,"x-admin-token":e}:{}}async function r(e,r={}){let i={"Content-Type":`application/json`,Accept:`application/json`,...n(),...r.headers},a=await fetch(e,{...r,headers:i}),o;try{o=await a.json()}catch{throw new t(`Neplatná odpověď serveru (${a.status} ${a.statusText})`,a.status)}if(!a.ok||!o.success)throw new t(o.error||o.message||`Chyba požadavku: ${a.status} ${a.statusText}`,a.status,o);return o.data}async function i(e,r={}){let i={"Content-Type":`application/json`,Accept:`application/json`,...n(),...r.headers},a=await fetch(e,{...r,headers:i}),o;try{o=await a.json()}catch{throw new t(`Neplatná odpověď serveru (${a.status} ${a.statusText})`,a.status)}if(!a.ok||!o.success)throw new t(o.error||o.message||`Chyba požadavku: ${a.status} ${a.statusText}`,a.status,o);return o}var a=`akademie_admin_token`,o=`akademie_auth_user`,s=new class{currentUser=null;currentToken=null;constructor(){this.restoreSession()}restoreSession(){this.currentToken=localStorage.getItem(a);let e=localStorage.getItem(o);if(e)try{this.currentUser=JSON.parse(e)}catch{this.currentUser=null}}async login(e,t){let n=await i(`/api/auth/login`,{method:`POST`,body:JSON.stringify({username:e,password:t})}),r=n.token,s=n.user;if(!r||!s)throw Error(n.error||`Server nevrátil platný autentizační token.`);return this.currentToken=r,this.currentUser=s,localStorage.setItem(a,r),localStorage.setItem(o,JSON.stringify(s)),document.dispatchEvent(new CustomEvent(`akademie:auth-changed`,{detail:{user:s,token:r}})),{token:r,user:s}}async logout(){try{this.currentToken&&await fetch(`/api/auth/logout`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${this.currentToken}`}})}catch{}finally{this.currentToken=null,this.currentUser=null,localStorage.removeItem(a),localStorage.removeItem(o),document.dispatchEvent(new CustomEvent(`akademie:auth-changed`,{detail:{user:null,token:null}}))}}async fetchCurrentStatus(){if(!this.currentToken)return this.currentUser=null,null;try{let e=await i(`/api/auth/me`,{headers:{Authorization:`Bearer ${this.currentToken}`}});if(e.success&&e.user)return this.currentUser=e.user,localStorage.setItem(o,JSON.stringify(this.currentUser)),this.currentUser}catch{this.logout()}return null}async getStudentDashboard(){return await r(`/api/student/dashboard`)}getUser(){return this.currentUser}getToken(){return this.currentToken}isAuthenticated(){return!!(this.currentToken&&this.currentUser)}isAdmin(){return this.currentUser?.role===`admin`}isStudent(){return this.currentUser?.role===`student`}},c=class{static container=null;static ensureContainer(){if(!this.container){let e=document.getElementById(`toast-container`);e||(e=document.createElement(`div`),e.id=`toast-container`,e.className=`toast-stack`,document.body.appendChild(e)),this.container=e}return this.container}static show(e,t=`success`,n,r=4500){let i=this.ensureContainer(),a=document.createElement(`div`),o={success:{bg:`bg-[#fdfaf2] dark:bg-[#161220]`,border:`border-emerald-500/50 dark:border-emerald-500/50 shadow-lg shadow-black/40`,text:`text-[#4a3512] dark:text-[#faeed4] font-display`,iconColor:`text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60`,defaultTitle:`Úspěšně provedeno`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`},error:{bg:`bg-[#fdfaf2] dark:bg-[#161220]`,border:`border-rose-500/50 dark:border-rose-500/50 shadow-lg shadow-black/40`,text:`text-[#4a3512] dark:text-[#faeed4] font-display`,iconColor:`text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/60`,defaultTitle:`Došlo k chybě`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`},warning:{bg:`bg-[#fdfaf2] dark:bg-[#161220]`,border:`border-amber-500/50 dark:border-amber-500/50 shadow-lg shadow-black/40`,text:`text-[#4a3512] dark:text-[#faeed4] font-display`,iconColor:`text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60`,defaultTitle:`Upozornění`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`},info:{bg:`bg-[#fdfaf2] dark:bg-[#161220]`,border:`border-[#caa049]/60 shadow-lg shadow-black/40`,text:`text-[#4a3512] dark:text-[#faeed4] font-display`,iconColor:`text-[#7c5e2d] dark:text-[#f8df95] bg-[#f5ebd6] dark:bg-[#251e30] border border-[#caa049]`,defaultTitle:`Systémová informace`,iconSvg:`<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`}}[t],s=n||o.defaultTitle;a.className=`p-3 rounded-lg border flex items-start gap-2.5 animate-fadeIn transition-all duration-200 min-w-[280px] max-w-sm ${o.bg} ${o.border}`,a.setAttribute(`role`,`alert`),a.innerHTML=`
      <div class="p-1.5 rounded-lg shrink-0 ${o.iconColor}">
        ${o.iconSvg}
      </div>
      <div class="flex-1 min-w-0 pr-2">
        <div class="text-xs font-bold leading-tight ${o.text}">${s}</div>
        <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-0.5 leading-relaxed break-words">${e}</div>
      </div>
      <button class="toast-close-btn p-1 text-[#8c6d3b] hover:text-[#5a4115] dark:text-[#c4a974] dark:hover:text-[#fce8bd] rounded transition-colors shrink-0">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `,a.querySelector(`.toast-close-btn`)?.addEventListener(`click`,()=>c());let c=()=>{a.style.opacity=`0`,a.style.transform=`translateX(24px) scale(0.95)`,setTimeout(()=>a.remove(),250)};i.appendChild(a),r>0&&setTimeout(c,r)}static success(e,t){this.show(e,`success`,t)}static error(e,t){this.show(e,`error`,t)}static warning(e,t){this.show(e,`warning`,t)}static info(e,t){this.show(e,`info`,t)}},l={certificates:`Osvědčení`,lecturers:`Lektoři`,analytics:`Výkazy`},u=class{activeTab;onTabChange;isDropdownOpen=!1;isMobileDropdownOpen=!1;constructor(e){this.activeTab=e.activeTab,this.onTabChange=e.onTabChange}initTheme(){let e=localStorage.getItem(`akademie_theme`)||(window.matchMedia(`(prefers-color-scheme: dark)`).matches?`dark`:`light`);this.applyTheme(e);let t=document.getElementById(`theme-toggle`);t&&t.addEventListener(`click`,()=>{let e=(document.documentElement.getAttribute(`data-theme`)||`light`)===`dark`?`light`:`dark`;this.applyTheme(e)})}applyTheme(e){document.documentElement.setAttribute(`data-theme`,e);let t=document.querySelector(`.icon-moon`),n=document.querySelector(`.icon-sun`);e===`dark`?(document.documentElement.classList.add(`dark`),t?.classList.add(`hidden`),n?.classList.remove(`hidden`)):(document.documentElement.classList.remove(`dark`),t?.classList.remove(`hidden`),n?.classList.add(`hidden`)),localStorage.setItem(`akademie_theme`,e)}bindEvents(){document.querySelectorAll(`[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);t&&t!==this.activeTab&&(this.setActiveTab(t),this.onTabChange(t)),this.closeAllDropdowns()})});let e=document.getElementById(`btn-nav-dropdown`);e&&e.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleDesktopDropdown()});let t=document.getElementById(`mobile-btn-nav-dropdown`);t&&t.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleMobileDropdown()}),document.addEventListener(`click`,e=>{let t=e.target,n=document.getElementById(`nav-dropdown-container`),r=document.getElementById(`mobile-nav-dropdown-container`);n&&!n.contains(t)&&this.closeDesktopDropdown(),r&&!r.contains(t)&&this.closeMobileDropdown()}),this.bindAuthEvents(),document.addEventListener(`keydown`,e=>{let t=document.activeElement,n=t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement||t?.getAttribute(`contenteditable`)===`true`;if(e.key===`Escape`){(this.isDropdownOpen||this.isMobileDropdownOpen)&&this.closeAllDropdowns();return}if(e.key===`/`&&!n){e.preventDefault();let t=document.getElementById(`filter-search-course`);this.activeTab!==`courses`&&(this.setActiveTab(`courses`),this.onTabChange(`courses`)),setTimeout(()=>{t?.focus(),t?.select()},50);return}if(n)return;let r={1:`courses`,2:`terms`,3:`attendance`,4:`certificates`,5:`lecturers`,6:`analytics`};if(r[e.key]){e.preventDefault();let t=r[e.key];t!==this.activeTab&&(this.setActiveTab(t),this.onTabChange(t)),this.closeAllDropdowns()}}),this.initTheme(),this.setActiveTab(this.activeTab)}bindAuthEvents(){document.getElementById(`btn-open-login`)?.addEventListener(`click`,()=>{e.open(`modal-login`)}),document.getElementById(`btn-logout`)?.addEventListener(`click`,async()=>{await s.logout(),c.info(`Byli jste úspěšně odhlášeni.`),this.renderAuthState(null)}),document.addEventListener(`akademie:auth-changed`,(e=>{this.renderAuthState(e.detail?.user||null)})),s.fetchCurrentStatus().then(e=>{this.renderAuthState(e)})}renderAuthState(e){let t=document.getElementById(`auth-unauthenticated`),n=document.getElementById(`auth-authenticated`),r=document.getElementById(`auth-user-name`),i=document.getElementById(`auth-user-badge`),a=document.querySelectorAll(`.admin-only`),o=document.getElementById(`nav-tab-student`),s=document.getElementById(`mobile-nav-tab-student`);e?(t&&t.classList.add(`hidden`),n&&(n.classList.remove(`hidden`),n.classList.add(`flex`)),r&&(r.textContent=e.name),i&&(e.role===`admin`?(i.textContent=`Admin`,i.className=`badge-chip badge-chip-green font-mono uppercase text-xs`):(i.textContent=`Student`,i.className=`badge-chip badge-chip-blue font-mono uppercase text-xs`)),e.role===`admin`?(a.forEach(e=>{e.classList.remove(`hidden`),e.style.display=``}),o&&o.classList.remove(`hidden`),s&&s.classList.remove(`hidden`)):(a.forEach(e=>{e.classList.add(`hidden`),e.style.display=`none`}),o&&o.classList.remove(`hidden`),s&&s.classList.remove(`hidden`),[`attendance`,`certificates`,`lecturers`,`analytics`].includes(this.activeTab)&&(this.setActiveTab(`student`),this.onTabChange(`student`)))):(n&&(n.classList.add(`hidden`),n.classList.remove(`flex`)),t&&t.classList.remove(`hidden`),a.forEach(e=>{e.classList.add(`hidden`),e.style.display=`none`}),o&&o.classList.add(`hidden`),s&&s.classList.add(`hidden`),[`attendance`,`certificates`,`lecturers`,`analytics`,`student`].includes(this.activeTab)&&(this.setActiveTab(`courses`),this.onTabChange(`courses`)))}toggleDesktopDropdown(){this.isDropdownOpen?this.closeDesktopDropdown():this.openDesktopDropdown()}openDesktopDropdown(){let e=document.getElementById(`nav-dropdown-menu`),t=document.getElementById(`nav-dropdown-chevron`),n=document.getElementById(`btn-nav-dropdown`);e&&e.classList.remove(`hidden`),t&&t.classList.add(`rotate-180`),n&&n.setAttribute(`aria-expanded`,`true`),this.isDropdownOpen=!0}closeDesktopDropdown(){let e=document.getElementById(`nav-dropdown-menu`),t=document.getElementById(`nav-dropdown-chevron`),n=document.getElementById(`btn-nav-dropdown`);e&&e.classList.add(`hidden`),t&&t.classList.remove(`rotate-180`),n&&n.setAttribute(`aria-expanded`,`false`),this.isDropdownOpen=!1}toggleMobileDropdown(){this.isMobileDropdownOpen?this.closeMobileDropdown():this.openMobileDropdown()}openMobileDropdown(){let e=document.getElementById(`mobile-nav-dropdown-menu`),t=document.getElementById(`mobile-nav-dropdown-chevron`),n=document.getElementById(`mobile-btn-nav-dropdown`);e&&e.classList.remove(`hidden`),t&&t.classList.add(`rotate-180`),n&&n.setAttribute(`aria-expanded`,`true`),this.isMobileDropdownOpen=!0}closeMobileDropdown(){let e=document.getElementById(`mobile-nav-dropdown-menu`),t=document.getElementById(`mobile-nav-dropdown-chevron`),n=document.getElementById(`mobile-btn-nav-dropdown`);e&&e.classList.add(`hidden`),t&&t.classList.remove(`rotate-180`),n&&n.setAttribute(`aria-expanded`,`false`),this.isMobileDropdownOpen=!1}closeAllDropdowns(){this.closeDesktopDropdown(),this.closeMobileDropdown()}setActiveTab(t){let n=[`attendance`,`certificates`,`lecturers`,`analytics`],r=[`student`];if(n.includes(t)&&!s.isAdmin()){c.warning(`Tato sekce je určena výhradně pro administrátory vzdělávacího centra.`),e.open(`modal-login`);return}if(r.includes(t)&&!s.isAuthenticated()){c.info(`Pro zobrazení klientského portálu se prosím nejprve přihlaste.`),e.open(`modal-login`);return}this.activeTab=t,document.querySelectorAll(`[data-tab]`).forEach(e=>{e.getAttribute(`data-tab`)===t?e.classList.add(`active`):e.classList.remove(`active`)});let i=Object.prototype.hasOwnProperty.call(l,t),a=l[t],o=document.getElementById(`btn-nav-dropdown`),u=document.getElementById(`nav-dropdown-label`),d=document.getElementById(`mobile-btn-nav-dropdown`),f=document.getElementById(`mobile-nav-dropdown-label`);i?(o?.classList.add(`active`),u&&(u.textContent=`Správa: ${a}`),d?.classList.add(`active`),f&&(f.textContent=`Správa: ${a}`)):(o?.classList.remove(`active`),u&&(u.textContent=`Správa & Výkazy`),d?.classList.remove(`active`),f&&(f.textContent=`Správa`)),document.querySelectorAll(`.tab-pane`).forEach(e=>{e.id===`tab-${t}`?(e.classList.remove(`hidden`),e.classList.add(`active`)):(e.classList.remove(`active`),e.classList.add(`hidden`))})}},d={async getAll(){return r(`/api/courses`)},async getById(e){return r(`/api/courses/${e}`)},async create(e){return r(`/api/courses`,{method:`POST`,body:JSON.stringify(e)})},async update(e,t){return r(`/api/courses/${e}`,{method:`PUT`,body:JSON.stringify(t)})},async delete(e){return(await i(`/api/courses/${e}`,{method:`DELETE`})).message||`Kurz byl úspěšně smazán.`}},f=class{courses=[];filterType=`all`;searchQuery=``;isEditing=!1;editingCourseId=null;container=null;searchInput=null;filterChips=null;countPill=null;kpiCoursesCount=null;btnOpenCreate=null;form=null;formError=null;modalTitle=null;onScheduleTermCallback;constructor(e){this.onScheduleTermCallback=e?.onScheduleTerm}init(){this.container=document.getElementById(`courses-list`),this.searchInput=document.getElementById(`filter-search-course`),this.filterChips=document.querySelectorAll(`.filter-chip`),this.countPill=document.getElementById(`courses-count-pill`),this.kpiCoursesCount=document.getElementById(`kpi-courses-count`),this.btnOpenCreate=document.getElementById(`btn-open-create-course`),this.form=document.getElementById(`form-course`),this.formError=document.getElementById(`form-course-error`),this.modalTitle=document.getElementById(`modal-course-title`),this.bindEvents(),this.load()}bindEvents(){this.searchInput?.addEventListener(`input`,e=>{this.searchQuery=e.target.value.toLowerCase().trim(),this.render()}),this.filterChips?.forEach(e=>{e.addEventListener(`click`,()=>{this.filterChips?.forEach(e=>{e.classList.remove(`filter-chip-active`),e.classList.add(`filter-chip-inactive`)}),e.classList.remove(`filter-chip-inactive`),e.classList.add(`filter-chip-active`),this.filterType=e.getAttribute(`data-filter`)||`all`,this.render()})}),this.btnOpenCreate?.addEventListener(`click`,()=>{s.isAdmin()?this.openCreateModal():(c.info(`Pro vytvoření nového kurzu se přihlaste jako administrátor.`),e.open(`modal-login`))}),this.form?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleSubmit()}),document.addEventListener(`akademie:auth-changed`,()=>{this.render()})}async load(){try{this.courses=await d.getAll(),this.kpiCoursesCount&&(this.kpiCoursesCount.textContent=this.courses.length.toString()),this.render()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst seznam kurzů.`;c.error(t)}}getCourses(){return this.courses}render(){let e=s.isAdmin();if(this.btnOpenCreate&&(e?(this.btnOpenCreate.style.display=`inline-flex`,this.btnOpenCreate.title=`Vytvořit nový vzdělávací program`):this.btnOpenCreate.style.display=`none`),!this.container)return;this.container.innerHTML=``;let t=this.courses.filter(e=>{if(this.filterType===`accredited`&&!e.isAccredited||this.filterType===`standard`&&e.isAccredited)return!1;if(this.searchQuery){let t=e.title.toLowerCase().includes(this.searchQuery),n=e.annotation.toLowerCase().includes(this.searchQuery);if(!t&&!n)return!1}return!0});this.countPill&&(this.countPill.textContent=`${t.length} z ${this.courses.length} programů`),t.length===0?this.container.innerHTML=`
        <div class="col-span-full py-12 text-center card-box border-dashed border-[#caa049]/60">
          <div class="w-10 h-10 rounded-full bg-[#f4ebce] dark:bg-[#251e30] flex items-center justify-center mx-auto text-[#8c6d3b] dark:text-[#f8df95] mb-2.5 border border-[#caa049]">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <p class="text-xs font-bold font-display text-[#4a3512] dark:text-[#faeed4]">Žádné kurzy neodpovídají zadanému filtru.</p>
          <p class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-1">Zkuste změnit hledaný výraz nebo zvolit kategorii "Všechny programy".</p>
        </div>
      `:t.forEach((t,n)=>{let r=document.createElement(`div`);r.className=`card-box flex flex-col justify-between transition-all duration-150 cursor-pointer hover:border-[#caa049] hover:shadow-md`,r.title=`Kliknutím zobrazíte vypsané termíny kurzu`;let i=Number(t.price).toLocaleString(`cs-CZ`);r.innerHTML=`
        <div>
          <div class="flex items-center justify-between gap-1.5 mb-3 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="badge-pill-code">
                ${`AT-K${String(n+1).padStart(2,`0`)}`}
              </span>
              ${t.isAccredited?`<span class="badge-pill-accredited">MŠMT Akreditace</span>`:`<span class="badge-pill-standard">Firemní program</span>`}
            </div>
            <span class="badge-pill-price">
              ${i} Kč
            </span>
          </div>

          <h3 class="text-[15px] font-extrabold uppercase font-display text-[#28190c] dark:text-[#f8edd9] mb-2 leading-snug tracking-tight">
            ${t.title}
          </h3>

          <p class="text-xs text-[#5c452b] dark:text-[#c4b39b] mb-4 line-clamp-3 leading-relaxed">
            ${t.annotation}
          </p>
        </div>

        <div class="pt-3 border-t border-amber-900/15 dark:border-amber-500/20 flex items-center justify-between mt-auto gap-2">
          <span class="text-xs font-mono font-bold text-[#634a2c] dark:text-[#dfcaa5] flex items-center gap-1.5 tabular-nums">
            <svg class="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${t.hours} hod.
          </span>
          <div class="flex items-center gap-1.5">
            <button
              class="btn-primary-tw btn-sm-tw btn-schedule-course"
              data-id="${t.id}"
              title="Zobrazit vypsané termíny a přihlášky"
            >
              ${e?`Vypsat termín`:`Zobrazit termíny`}
            </button>
            ${e?`
              <button
                class="btn-secondary-tw p-1.5 rounded btn-edit-course"
                data-id="${t.id}"
                title="Upravit parametry kurzu"
                aria-label="Upravit kurz"
              >
                <svg class="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                class="btn-secondary-tw p-1.5 rounded btn-delete-course hover:border-rose-500/60"
                data-id="${t.id}"
                title="Smazat kurz z katalogu"
                aria-label="Smazat kurz"
              >
                <svg class="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            `:``}
          </div>
        </div>
      `,r.addEventListener(`click`,e=>{e.target.closest(`button`)||document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`terms`,courseId:t.id}}))}),r.querySelector(`.btn-schedule-course`)?.addEventListener(`click`,n=>{n.stopPropagation(),e&&this.onScheduleTermCallback?this.onScheduleTermCallback(t.id):document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`terms`,courseId:t.id}}))}),r.querySelector(`.btn-edit-course`)?.addEventListener(`click`,e=>{e.stopPropagation(),this.openEditModal(t)}),r.querySelector(`.btn-delete-course`)?.addEventListener(`click`,e=>{e.stopPropagation(),this.handleDelete(t)}),this.container?.appendChild(r)})}openCreateModal(){if(!s.isAdmin()){c.info(`Pro vytváření kurzů se přihlaste jako administrátor.`),e.open(`modal-login`);return}this.isEditing=!1,this.editingCourseId=null,this.modalTitle&&(this.modalTitle.textContent=`Nový vzdělávací program`),this.form&&this.form.reset(),this.formError&&(this.formError.style.display=`none`);let t=document.getElementById(`course-id`);t&&(t.value=``);let n=document.getElementById(`course-accredited`)||document.getElementById(`course-is-accredited`);n&&(n.checked=!1),e.open(`modal-course`)}openEditModal(t){if(!s.isAdmin()){c.info(`Pro úpravu kurzu se přihlaste jako administrátor.`),e.open(`modal-login`);return}this.isEditing=!0,this.editingCourseId=t.id,this.modalTitle&&(this.modalTitle.textContent=`Upravit vzdělávací program`),this.formError&&(this.formError.style.display=`none`);let n=document.getElementById(`course-id`),r=document.getElementById(`course-title`),i=document.getElementById(`course-annotation`),a=document.getElementById(`course-hours`),o=document.getElementById(`course-price`),l=document.getElementById(`course-accredited`)||document.getElementById(`course-is-accredited`);n&&(n.value=t.id),r&&(r.value=t.title),i&&(i.value=t.annotation),a&&(a.value=t.hours.toString()),o&&(o.value=t.price.toString()),l&&(l.checked=!!t.isAccredited),e.open(`modal-course`)}async handleSubmit(){if(!s.isAdmin())c.error(`Chyba: Pro uložení změn v katalogu se musíte přihlásit jako administrátor.`),e.open(`modal-login`);else try{let t=document.getElementById(`course-title`),n=document.getElementById(`course-annotation`),r=document.getElementById(`course-hours`),i=document.getElementById(`course-price`),a=document.getElementById(`course-accredited`)||document.getElementById(`course-is-accredited`);if(!t||!n||!r||!i)throw Error(`Formulářové prvky se nepodařilo načíst.`);let o={title:t.value.trim(),annotation:n.value.trim(),hours:parseInt(r.value,10),price:parseFloat(i.value),isAccredited:!!a?.checked};this.isEditing&&this.editingCourseId?(await d.update(this.editingCourseId,o),c.success(`Vzdělávací program byl úspěšně aktualizován.`)):(await d.create(o),c.success(`Nový vzdělávací program byl úspěšně vytvořen.`)),this.isEditing=!1,this.editingCourseId=null,e.close(`modal-course`),await this.load()}catch(e){let t=e instanceof Error?e.message:`Chyba při ukládání kurzu.`;this.formError?(this.formError.textContent=t,this.formError.style.display=`block`):c.error(t)}}async handleDelete(t){if(!s.isAdmin())c.info(`Pro smazání kurzu se přihlaste jako administrátor.`),e.open(`modal-login`);else if(confirm(`Opravdu si přejete smazat kurz "${t.title}"? Dojde ke smazání i všech souvisejících termínů!`))try{await d.delete(t.id),c.success(`Kurz "${t.title}" byl úspěšně odstraněn.`),await this.load()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se smazat kurz.`;c.error(t)}}},p={async getAll(){return r(`/api/terms`)},async getById(e){return r(`/api/terms/${e}`)},async create(e){return r(`/api/terms`,{method:`POST`,body:JSON.stringify(e)})},async getEnrollments(e){return r(`/api/terms/${e}/enrollments`)},async createEnrollment(e,t){let n=await i(`/api/terms/${e}/enrollments`,{method:`POST`,body:JSON.stringify(t)});return{enrollment:n.data,message:n.message||`Student byl úspěšně zaregistrován.`}},async cancelEnrollment(e){let t=await i(`/api/enrollments/${e}/cancel`,{method:`POST`});return{message:t.message||`Přihláška byla zrušena.`,promotedEnrollmentId:t.data?.promotedEnrollmentId}}},m={async getLecturers(){return r(`/api/lecturers`)},async getClassrooms(){return r(`/api/classrooms`)},async getStudents(){return r(`/api/students`)},async getAnalytics(){return r(`/api/analytics`)}},h=class{terms=[];selectedTermId=null;filteredCourseId=null;enrollments=[];cachedStudents=[];termsTableBody=null;termDetailBox=null;detailTermTitle=null;detailTermInfo=null;enrollmentsTableBody=null;kpiTermsCount=null;kpiWaitlistStatus=null;formTerm=null;formTermError=null;formEnrollment=null;formEnrollmentError=null;enrollmentTermNotice=null;onSwitchToAttendance;constructor(e){this.onSwitchToAttendance=e?.onSwitchToAttendance}init(){this.termsTableBody=document.getElementById(`terms-table-body`),this.termDetailBox=document.getElementById(`term-detail-box`),this.detailTermTitle=document.getElementById(`detail-term-title`),this.detailTermInfo=document.getElementById(`detail-term-info`),this.enrollmentsTableBody=document.getElementById(`enrollments-table-body`),this.kpiTermsCount=document.getElementById(`kpi-terms-count`),this.kpiWaitlistStatus=document.getElementById(`kpi-waitlist-status`),this.formTerm=document.getElementById(`form-term`),this.formTermError=document.getElementById(`form-term-error`),this.formEnrollment=document.getElementById(`form-enrollment`),this.formEnrollmentError=document.getElementById(`form-enrollment-error`),this.enrollmentTermNotice=document.getElementById(`enrollment-term-notice`),this.bindEvents(),this.load()}bindEvents(){document.getElementById(`btn-open-create-term`)?.addEventListener(`click`,async()=>{await this.openCreateTermModal()}),this.formTerm?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateTermSubmit()}),document.getElementById(`btn-open-enroll`)?.addEventListener(`click`,()=>{this.openEnrollmentModal()}),this.formEnrollment?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleEnrollmentSubmit()});let e=document.getElementById(`select-existing-student`);e?.addEventListener(`change`,()=>{let t=e.value,n=document.getElementById(`student-first-name`),r=document.getElementById(`student-last-name`),i=document.getElementById(`student-email`),a=document.getElementById(`student-phone`),o=document.getElementById(`student-organization`);if(!t){n&&(n.value=``),r&&(r.value=``),i&&(i.value=``),a&&(a.value=``),o&&(o.value=``);return}let s=this.cachedStudents.find(e=>e.id===t);s&&(n&&(n.value=s.firstName),r&&(r.value=s.lastName),i&&(i.value=s.email),a&&(a.value=s.phone||``),o&&(o.value=s.organization||``))}),document.getElementById(`btn-clear-terms-filter`)?.addEventListener(`click`,()=>{this.filterByCourse(null)}),document.addEventListener(`akademie:auth-changed`,()=>{this.renderTerms(),this.selectedTermId&&this.selectTerm(this.selectedTermId)})}async filterByCourse(e){this.filteredCourseId=e,await this.renderFilterBanner(),this.renderTerms()}async renderFilterBanner(){let e=document.getElementById(`terms-filter-banner`),t=document.getElementById(`terms-filter-course-title`);if(!e||!t)return;if(!this.filteredCourseId){e.classList.add(`hidden`);return}let n=``,r=this.terms.find(e=>e.courseId===this.filteredCourseId);if(r)n=r.courseTitle;else try{let e=(await d.getAll()).find(e=>e.id===this.filteredCourseId);e&&(n=e.title)}catch{}t.textContent=n||`Vybraný vzdělávací program`,e.classList.remove(`hidden`)}async load(){try{this.terms=await p.getAll(),this.kpiTermsCount&&(this.kpiTermsCount.textContent=this.terms.length.toString());let e=this.terms.reduce((e,t)=>e+(t.waitlistCount||0),0);this.kpiWaitlistStatus&&(this.kpiWaitlistStatus.textContent=e>0?`${e} náhradníků v pořadníku`:`Pořadník náhradníků prázdný`),await this.renderFilterBanner(),this.renderTerms(),this.selectedTermId&&await this.selectTerm(this.selectedTermId)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst termíny kurzů.`;c.error(t)}}getTerms(){return this.terms}getSelectedTermId(){return this.selectedTermId}renderTerms(){let e=document.getElementById(`btn-open-create-term`);if(e&&(e.style.display=s.isAdmin()?`inline-flex`:`none`),!this.termsTableBody)return;this.termsTableBody.innerHTML=``;let t=this.filteredCourseId?this.terms.filter(e=>e.courseId===this.filteredCourseId):this.terms;t.length===0?this.termsTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-10 text-amber-800/60 dark:text-amber-200/50 italic">
            ${this.filteredCourseId?`Pro vybraný kurz nebyly nalezeny žádné vypsané termíny.`:`Dosud nebyly vypsány žádné termíny kurzů.`}
          </td>
        </tr>
      `:t.forEach(e=>{let t=e.confirmedCount>=e.capacity,n=e.status===`COMPLETED`,r=``;r=n?`<span class="badge-chip badge-chip-blue">Ukončen</span>`:t?`<span class="badge-chip badge-chip-yellow">Kapacita plná</span>`:`<span class="badge-chip badge-chip-green">Volná místa</span>`;let i=e.lecturers&&e.lecturers.length>0?e.lecturers.map(e=>e.name).join(`, `):`Nepřiřazen`,a=document.createElement(`tr`);e.id===this.selectedTermId&&a.classList.add(`row-selected`);let o=Math.min(100,Math.round(e.confirmedCount/e.capacity*100));a.innerHTML=`
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-snug">${e.courseTitle}</div>
          <div class="font-mono text-[11px] text-[#8c6d3b] dark:text-[#c4a974] mt-0.5">ID: ${e.id.slice(0,8)}...</div>
        </td>
        <td class="font-mono text-xs tabular-nums text-[#5c4318] dark:text-[#e2d5b8] whitespace-nowrap">
          <div>${e.startDate}</div>
          <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974]">až ${e.endDate}</div>
        </td>
        <td class="text-xs text-[#5c4318] dark:text-[#e2d5b8]">
          <div class="font-medium leading-tight">${e.classroomName||`Neuvedena`}</div>
        </td>
        <td>
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="font-mono text-xs font-bold tabular-nums ${t?`text-amber-600 dark:text-amber-400`:`text-emerald-700 dark:text-emerald-400`}">
              ${e.confirmedCount} / ${e.capacity}
            </span>
            <div class="w-14 sm:w-16 forged-meter-track">
              <div
                class="h-full rounded-xs transition-all duration-300 ${t?`bg-amber-500`:`bg-emerald-600`}"
                style="width: ${o}%;"
              ></div>
            </div>
          </div>
          ${e.waitlistCount>0?`<div class="mt-0.5">
                  <span class="badge-chip badge-chip-yellow text-[11px] py-0">
                    ${e.waitlistCount} ${e.waitlistCount===1?`náhradník`:`náhradníci`}
                  </span>
                 </div>`:`<div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] mt-0.5 font-mono tabular-nums">Volno: ${Math.max(0,e.capacity-e.confirmedCount)}</div>`}
        </td>
        <td class="text-xs text-[#6e5223] dark:text-[#d1b88e] leading-tight">${i}</td>
        <td>${r}</td>
        <td class="text-right">
          <div class="inline-flex flex-wrap sm:flex-nowrap items-center justify-end gap-1">
            <button
              class="btn-secondary-tw btn-sm-tw btn-view-term whitespace-nowrap py-1 px-2 text-xs"
              data-id="${e.id}"
              title="Zobrazit detail termínu"
            >
              ${s.isAdmin()?`Přihlášky (${e.confirmedCount+e.waitlistCount})`:`Detail & Zápis`}
            </button>
            ${s.isAdmin()?`<button
                    class="btn-ghost-tw btn-sm-tw btn-jump-attendance text-emerald-700 dark:text-emerald-400 whitespace-nowrap py-1 px-2 text-xs"
                    data-id="${e.id}"
                    title="Přejít do evidence docházky pro tento termín"
                  >
                    Docházka
                  </button>`:``}
          </div>
        </td>
      `,a.querySelector(`.btn-view-term`)?.addEventListener(`click`,()=>this.selectTerm(e.id)),a.querySelector(`.btn-jump-attendance`)?.addEventListener(`click`,()=>{this.onSwitchToAttendance?this.onSwitchToAttendance(e.id):document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`attendance`,termId:e.id}}))}),this.termsTableBody?.appendChild(a)})}async selectTerm(e){this.selectedTermId=e,this.renderTerms();let t=this.terms.find(t=>t.id===e);if(!t)return;this.termDetailBox&&(this.termDetailBox.style.display=`block`);let n=document.getElementById(`btn-open-enroll`);n&&(n.innerHTML=s.isAdmin()?`
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Zapsat studenta (Admin)
        `:`
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Přihlásit se na termín
        `),this.detailTermTitle&&(s.isAdmin()?this.detailTermTitle.textContent=`Evidence přihlášek a pořadník: ${t.courseTitle}`:s.isStudent()?this.detailTermTitle.textContent=`Detail termínu a má účast: ${t.courseTitle}`:this.detailTermTitle.textContent=`Veřejný přehled termínu: ${t.courseTitle}`),this.detailTermInfo&&(this.detailTermInfo.innerHTML=`
        Termín: <strong class="font-mono text-[#4a3512] dark:text-[#faeed4]">${t.startDate} až ${t.endDate}</strong> •
        Učebna: <strong class="text-[#4a3512] dark:text-[#faeed4]">${t.classroomName}</strong> •
        Obsazenost: <strong class="font-mono text-[#4a3512] dark:text-[#faeed4]">${t.confirmedCount} / ${t.capacity} míst</strong>
        ${t.waitlistCount>0?` • (<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono">${t.waitlistCount} v pořadníku</span>)`:``}
      `);try{this.enrollments=await p.getEnrollments(e),this.renderEnrollments()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst přihlášky k termínu.`;c.error(t)}}renderEnrollments(){let e=document.getElementById(`term-detail-admin-hint`),t=document.getElementById(`term-enrollments-table-wrap`),n=document.getElementById(`term-public-view-wrap`),r=this.terms.find(e=>e.id===this.selectedTermId);if(!r)return;let i=s.isAdmin(),a=s.isStudent(),o=s.getUser();if(i){if(e&&e.classList.remove(`hidden`),t&&t.classList.remove(`hidden`),n&&n.classList.add(`hidden`),!this.enrollmentsTableBody)return;if(this.enrollmentsTableBody.innerHTML=``,this.enrollments.length===0){this.enrollmentsTableBody.innerHTML=`
          <tr>
            <td colspan="6" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
              Na tento termín se zatím nikdo nepřihlásil. Použijte tlačítko "Zapsat studenta (Admin)" výše.
            </td>
          </tr>
        `;return}this.enrollments.forEach(e=>{let t=``;e.status===`CONFIRMED`?t=`<span class="badge-chip badge-chip-green">Potvrzeno</span>`:e.status===`WAITLIST`?t=`<span class="badge-chip badge-chip-yellow">Náhradník #${e.waitlistPosition||1}</span>`:e.status===`CANCELLED`?t=`<span class="badge-chip badge-chip-red">Zrušeno</span>`:e.status===`COMPLETED`&&(t=`<span class="badge-chip badge-chip-blue">Absolvováno</span>`);let n=new Date(e.submittedAt).toLocaleString(`cs-CZ`,{dateStyle:`short`,timeStyle:`short`}),r=e.status===`CONFIRMED`||e.status===`WAITLIST`,i=document.createElement(`tr`);i.innerHTML=`
          <td>
            <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.studentName}</div>
            ${e.note?`<div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] mt-0.5 font-mono leading-tight">Pozn.: ${e.note}</div>`:``}
          </td>
          <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e] break-all sm:break-normal">${e.studentEmail||`-`}</td>
          <td class="text-xs">
            <div class="font-mono text-[#5c4318] dark:text-[#e2d5b8] tabular-nums whitespace-nowrap">${e.studentPhone||`-`}</div>
            ${e.studentOrganization?`<div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] leading-tight mt-0.5">${e.studentOrganization}</div>`:``}
          </td>
          <td class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] tabular-nums whitespace-nowrap">${n}</td>
          <td>${t}</td>
          <td class="text-right">
            ${r?`<button class="btn-ghost-tw btn-sm-tw btn-cancel-enroll text-rose-700 dark:text-rose-400 hover:bg-rose-900/15 whitespace-nowrap py-1 px-2 text-xs" data-id="${e.id}">
                    Zrušit účast
                   </button>`:`<span class="text-amber-600/50 text-xs font-mono">-</span>`}
          </td>
        `,i.querySelector(`.btn-cancel-enroll`)?.addEventListener(`click`,()=>this.handleCancelEnrollment(e)),this.enrollmentsTableBody?.appendChild(i)});return}if(e&&e.classList.add(`hidden`),t&&t.classList.add(`hidden`),n&&n.classList.remove(`hidden`),a&&o){let e=(o.email||``).toLowerCase(),t=o.studentId,i=this.enrollments.find(n=>t&&n.studentId===t||e&&n.studentEmail&&n.studentEmail.toLowerCase()===e);if(i){let e=i.status===`CONFIRMED`,t=i.status===`WAITLIST`,a=i.status===`CANCELLED`,o=i.status===`COMPLETED`,s=``;e?s=`<span class="badge-chip badge-chip-green text-sm px-2.5 py-1">Potvrzená registrace (Místo zajištěno)</span>`:t?s=`<span class="badge-chip badge-chip-yellow text-sm px-2.5 py-1">V pořadníku náhradníků (Pozice #${i.waitlistPosition||1})</span>`:a?s=`<span class="badge-chip badge-chip-red text-sm px-2.5 py-1">Vaše účast byla zrušena</span>`:o&&(s=`<span class="badge-chip badge-chip-blue text-sm px-2.5 py-1">Kurz byl úspěšně absolvován</span>`);let c=new Date(i.submittedAt).toLocaleDateString(`cs-CZ`),l=e||t;n&&(n.innerHTML=`
            <div class="card-box border border-[#caa049]/40 p-5 rounded-xl bg-[#fdfaf2] dark:bg-[#1a130d] shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#caa049]/20">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wider text-[#8c6d3b] dark:text-[#caa049]">Vaše přihláška na termín</div>
                  <h4 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mt-0.5">${r.courseTitle}</h4>
                </div>
                <div>${s}</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Harmonogram výuky</div>
                  <div class="font-mono font-bold text-[#4a3512] dark:text-[#faeed4] mt-0.5">${r.startDate} až ${r.endDate}</div>
                </div>
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Učebna Trutnov</div>
                  <div class="font-bold text-[#4a3512] dark:text-[#faeed4] mt-0.5">${r.classroomName}</div>
                </div>
                <div class="p-3 rounded-lg bg-amber-500/10">
                  <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Datum přihlášení</div>
                  <div class="font-mono text-[#4a3512] dark:text-[#faeed4] mt-0.5">${c}</div>
                </div>
              </div>
              ${l?`<div class="flex items-center justify-between pt-3 border-t border-[#caa049]/20">
                      <span class="text-xs text-[#7c5e2d] dark:text-[#c4a974]">V případě změny plánů můžete svou účast odvolat.</span>
                      <button id="btn-cancel-my-enrollment" class="btn-ghost-tw btn-sm-tw text-rose-700 dark:text-rose-400 hover:bg-rose-900/15">
                        Zrušit mou účast na termínu
                      </button>
                    </div>`:``}
            </div>
          `,n.querySelector(`#btn-cancel-my-enrollment`)?.addEventListener(`click`,()=>this.handleCancelEnrollment(i)));return}}let c=r.confirmedCount>=r.capacity,l=Math.max(0,r.capacity-r.confirmedCount);n&&(n.innerHTML=`
        <div class="card-box border border-[#caa049]/40 p-6 rounded-xl bg-[#fdfaf2] dark:bg-[#1a130d] text-center max-w-2xl mx-auto shadow-sm">
          <h4 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mb-1">
            Obsazenost kurzu: ${r.courseTitle}
          </h4>
          <p class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mb-4">
            Termín: <strong>${r.startDate} až ${r.endDate}</strong> • Místo: <strong>${r.classroomName}</strong>
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 max-w-md mx-auto text-left">
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Kapacita</div>
              <div class="text-lg font-bold font-mono text-[#4a3512] dark:text-[#faeed4]">${r.capacity} míst</div>
            </div>
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Potvrzeno</div>
              <div class="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">${r.confirmedCount} studentů</div>
            </div>
            <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/30 col-span-2 sm:col-span-1">
              <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974] font-semibold">Stav míst</div>
              <div class="text-sm font-bold ${c?`text-amber-600 dark:text-amber-400`:`text-emerald-700 dark:text-emerald-400`} mt-1">
                ${c?`Plno (${r.waitlistCount} náhradníků)`:`Volno (${l} míst)`}
              </div>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-amber-500/10 border border-[#caa049]/20 text-xs text-[#6e4e1b] dark:text-[#faeed4] mb-5">
            Z důvodu ochrany osobních údajů (GDPR) je kompletní jmenný seznam přihlášených účastníků a docházka přístupná pouze administrátorům centra.
          </div>

          <button id="btn-public-enroll-cta" class="btn-primary-tw inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Přihlásit se na tento termín
          </button>
        </div>
      `,n.querySelector(`#btn-public-enroll-cta`)?.addEventListener(`click`,()=>this.openEnrollmentModal()))}async handleCancelEnrollment(e){let t=s.getUser(),n=s.isAdmin(),r=t&&(t.studentId&&e.studentId===t.studentId||t.email&&e.studentEmail&&t.email.toLowerCase()===e.studentEmail.toLowerCase());if(!n&&!r){c.error(`Nemáte oprávnění zrušit tuto přihlášku. Můžete zrušit pouze svou vlastní účast.`);return}let i=e.status===`CONFIRMED`?`Opravdu chcete zrušit účast studenta ${e.studentName}?\n\nZrušením se uvolní místo a první náhradník z pořadníku bude automaticky povýšen na potvrzeného!`:`Opravdu chcete odebrat studenta ${e.studentName} z pořadníku náhradníků?`;if(window.confirm(i))try{let t=await p.cancelEnrollment(e.id);c.success(t.message),await this.load(),this.selectedTermId&&await this.selectTerm(this.selectedTermId)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se zrušit přihlášku.`;c.error(t)}}async openCreateTermModal(t){if(!s.isAdmin())c.info(`Pro vypsání nového termínu se přihlaste jako administrátor.`),e.open(`modal-login`);else{this.formTerm&&this.formTerm.reset(),this.formTermError&&(this.formTermError.style.display=`none`);try{let[n,r,i]=await Promise.all([d.getAll(),m.getClassrooms(),m.getLecturers()]),a=document.getElementById(`term-course-select`);a&&(a.innerHTML=`<option value="">-- Zvolte vzdělávací program --</option>`+n.map(e=>`<option value="${e.id}" ${e.id===t?`selected`:``}>${e.title} (${e.hours} hod. – ${e.isAccredited?`MŠMT`:`Firemní`})</option>`).join(``));let o=document.getElementById(`term-classroom-select`);o&&(o.innerHTML=`<option value="">-- Vyberte učebnu v Trutnově --</option>`+r.map(e=>`<option value="${e.id}">${e.name} (kapacita ${e.capacity} míst)</option>`).join(``));let s=document.getElementById(`term-lecturer-select`);s&&(s.innerHTML=`<option value="">-- Zvolte garanta kurzu --</option>`+i.map(e=>`<option value="${e.id}">${e.name} (${e.specialization||`Lektor`})</option>`).join(``)),e.open(`modal-term`)}catch(e){let t=e instanceof Error?e.message:`Chyba při přípravě formuláře termínu.`;c.error(t)}}}async handleCreateTermSubmit(){if(!this.formTerm)return;this.formTermError&&(this.formTermError.style.display=`none`);let t=document.getElementById(`term-course-select`).value,n=document.getElementById(`term-classroom-select`).value||void 0,r=document.getElementById(`term-start-date`).value,i=document.getElementById(`term-end-date`).value,a=parseInt(document.getElementById(`term-capacity`).value,10),o=document.getElementById(`term-lecturer-select`).value||void 0,s={courseId:t,classroomId:n,startDate:r,endDate:i,capacity:a,lecturerIds:o?[o]:[]};try{await p.create(s),c.success(`Nový termín kurzu byl úspěšně vypsán.`),e.close(`modal-term`),await this.load()}catch(e){if(this.formTermError){let t=e instanceof Error?e.message:`Chyba při vytváření termínu.`;this.formTermError.textContent=t,this.formTermError.style.display=`block`}}}openEnrollmentModal(){if(!this.selectedTermId){c.warning(`Nejprve vyberte termín ze seznamu.`);return}if(!s.isAuthenticated()){c.info(`Pro přihlášení na kurz se prosím nejprve přihlaste jako student nebo administrátor.`),e.open(`modal-login`);return}let t=this.terms.find(e=>e.id===this.selectedTermId);if(!t)return;this.formEnrollment&&this.formEnrollment.reset(),this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let n=document.getElementById(`admin-student-select-wrap`),r=document.getElementById(`select-existing-student`);s.isAdmin()?(n&&n.classList.remove(`hidden`),this.loadStudentsForAdmin(r)):n&&n.classList.add(`hidden`);let i=document.getElementById(`enrollment-term-id`);i&&(i.value=this.selectedTermId);let a=document.getElementById(`student-first-name`),o=document.getElementById(`student-last-name`),l=document.getElementById(`student-email`),u=s.getUser();if(s.isStudent()&&u){let e=(u.name||``).trim().split(/\s+/),t=e[0]||``,n=e.slice(1).join(` `)||``;a&&(a.value=t,a.readOnly=!0,a.classList.add(`bg-amber-100/30`,`cursor-not-allowed`)),o&&(o.value=n,o.readOnly=!0,o.classList.add(`bg-amber-100/30`,`cursor-not-allowed`)),l&&(l.value=u.email||``,l.readOnly=!0,l.classList.add(`bg-amber-100/30`,`cursor-not-allowed`))}else a&&(a.readOnly=!1,a.classList.remove(`bg-amber-100/30`,`cursor-not-allowed`)),o&&(o.readOnly=!1,o.classList.remove(`bg-amber-100/30`,`cursor-not-allowed`)),l&&(l.readOnly=!1,l.classList.remove(`bg-amber-100/30`,`cursor-not-allowed`));if(this.enrollmentTermNotice){let e=t.confirmedCount>=t.capacity,n=s.isStudent()&&u?`<div class="mt-2 pt-2 border-t border-amber-300/40 text-xs font-semibold text-[#5c4318] dark:text-[#fce8bd]">
              Přihlašujete se pod ověřeným profilem: <strong>${u.name}</strong> (${u.email})
             </div>`:``;this.enrollmentTermNotice.innerHTML=`
        <div class="p-2.5 rounded-lg ${e?`bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300`:`bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300`} text-xs mb-3">
          <strong>${t.courseTitle}</strong> (${t.startDate} až ${t.endDate})<br/>
          Obsazeno: ${t.confirmedCount} z ${t.capacity} míst.
          ${e?`<span class="block mt-1 font-semibold text-amber-900 dark:text-amber-200">Kapacita termínu je naplněna! Budete zařazen(a) do pořadníku na pozici Náhradník #${t.waitlistCount+1}.</span>`:`<span class="block mt-1 text-emerald-900 dark:text-emerald-200">Na termínu jsou volná místa – registrace bude POTVRZENA.</span>`}
          ${n}
        </div>
      `}e.open(`modal-enrollment`)}async loadStudentsForAdmin(e){if(e)try{this.cachedStudents.length===0&&(this.cachedStudents=await m.getStudents()),e.innerHTML=`
        <option value="">-- Nový student (vyplnit ručně) --</option>
        ${this.cachedStudents.map(e=>`<option value="${e.id}">${e.firstName} ${e.lastName} (${e.email}${e.organization?` – ${e.organization}`:``})</option>`).join(``)}
      `,e.value=``}catch{}}async handleEnrollmentSubmit(){if(!this.selectedTermId||!this.formEnrollment)return;this.formEnrollmentError&&(this.formEnrollmentError.style.display=`none`);let t=document.getElementById(`student-first-name`).value.trim(),n=document.getElementById(`student-last-name`).value.trim(),r=document.getElementById(`student-email`).value.trim(),i=document.getElementById(`student-phone`).value.trim(),a=document.getElementById(`student-organization`).value.trim(),o=document.getElementById(`student-note`).value.trim(),s={firstName:t,lastName:n,email:r,phone:i||void 0,organization:a||void 0,note:o||void 0};try{let r=await p.createEnrollment(this.selectedTermId,s);r.status===`CONFIRMED`?c.success(`Student ${t} ${n} byl úspěšně zaregistrován na termín.`):c.warning(`Kapacita termínu byla plná. Student ${t} ${n} byl zařazen do pořadníku na pozici Náhradník #${r.waitlistPosition}.`),e.close(`modal-enrollment`),await this.load()}catch(e){if(this.formEnrollmentError){let t=e instanceof Error?e.message:`Chyba při podávání přihlášky.`;this.formEnrollmentError.textContent=t,this.formEnrollmentError.style.display=`block`}}}},g={async getDays(e){return r(`/api/attendance/terms/${e}/days`)},async createDay(e,t){return r(`/api/attendance/terms/${e}/days`,{method:`POST`,body:JSON.stringify(t)})},async getDayAttendance(e){return r(`/api/attendance/days/${e}`)},async markAttendance(e,t){return(await i(`/api/attendance/days/${e}/mark`,{method:`POST`,body:JSON.stringify(t)})).message||`Docházka byla uložena.`},async getSummary(e){return r(`/api/attendance/terms/${e}/summary`)}},_={async getAll(){return r(`/api/certificates`)},async getById(e){return r(`/api/certificates/${e}`)},async completeTerm(e){let t=await i(`/api/terms/${e}/complete`,{method:`POST`});return{message:t.message||`Termín byl uzavřen.`,issuedCount:t.data?.issuedCertificatesCount??0}},async issueWithWaiver(e,t){return r(`/api/certificates/issue`,{method:`POST`,body:JSON.stringify({enrollmentId:e,hasWaiver:!0,waiverReason:t})})}},v=class{terms=[];selectedTermId=null;teachingDays=[];selectedDayId=null;roster=[];summary=[];termSelect=null;daysTableBody=null;daysCountBadge=null;rosterTableBody=null;summaryTableBody=null;rosterDayTitle=null;rosterDaySubtitle=null;btnSaveAttendance=null;btnMarkAll=null;formTeachingDay=null;formTeachingDayError=null;init(){this.termSelect=document.getElementById(`attendance-term-select`),this.daysTableBody=document.getElementById(`teaching-days-table-body`),this.daysCountBadge=document.getElementById(`attendance-days-count`),this.rosterTableBody=document.getElementById(`attendance-roster-body`),this.summaryTableBody=document.getElementById(`attendance-summary-table-body`),this.rosterDayTitle=document.getElementById(`attendance-day-title`),this.rosterDaySubtitle=document.getElementById(`attendance-day-subtitle`),this.btnSaveAttendance=document.getElementById(`btn-save-attendance`),this.btnMarkAll=document.getElementById(`btn-attendance-mark-all`),this.formTeachingDay=document.getElementById(`form-teaching-day`),this.formTeachingDayError=document.getElementById(`form-teaching-day-error`),this.bindEvents(),this.load()}bindEvents(){this.termSelect?.addEventListener(`change`,async()=>{this.selectedTermId=this.termSelect?.value||null,this.selectedDayId=null,await this.loadTermDetails()}),document.getElementById(`btn-open-create-day`)?.addEventListener(`click`,async()=>{await this.openCreateDayModal()}),this.formTeachingDay?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleCreateDaySubmit()}),this.btnSaveAttendance?.addEventListener(`click`,async()=>{await this.handleSaveAttendance()}),this.btnMarkAll?.addEventListener(`click`,()=>{let e=document.querySelectorAll(`.att-checkbox`),t=Array.from(e).every(e=>e.checked);e.forEach(e=>{e.checked=!t;let n=e.getAttribute(`data-student`),r=document.querySelector(`.label-status[data-student="${n}"]`);r&&(t?(r.textContent=`Nepřítomen`,r.className=`text-xs font-semibold text-amber-700/60 dark:text-amber-200/50 label-status`):(r.textContent=`Přítomen`,r.className=`text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status`))}),c.info(t?`Všichni studenti označeni jako nepřítomní.`:`Všichni studenti označeni jako přítomní.`)}),document.addEventListener(`akademie:auth-changed`,()=>{this.renderAuthControls()})}renderAuthControls(){let e=s.isAdmin(),t=document.getElementById(`btn-open-create-day`);t&&(t.style.display=e?`inline-flex`:`none`),this.btnMarkAll&&(this.btnMarkAll.style.display=e?`inline-flex`:`none`),this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=e?`inline-flex`:`none`)}async load(e){this.renderAuthControls();try{this.terms=await p.getAll(),this.renderTermSelect(),this.terms.length>0&&(e&&this.terms.some(t=>t.id===e)?this.selectedTermId=e:this.selectedTermId&&this.terms.some(e=>e.id===this.selectedTermId)||(this.selectedTermId=this.terms[0].id),this.termSelect&&(this.termSelect.value=this.selectedTermId),await this.loadTermDetails())}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst termíny pro docházku.`;c.error(t)}}selectTermById(e){this.terms.some(t=>t.id===e)&&(this.selectedTermId=e,this.termSelect&&(this.termSelect.value=e),this.loadTermDetails())}renderTermSelect(){this.termSelect&&(this.termSelect.innerHTML=this.terms.map(e=>`<option value="${e.id}" ${e.id===this.selectedTermId?`selected`:``}>${e.courseTitle} (${e.startDate} až ${e.endDate})</option>`).join(``))}async loadTermDetails(){if(this.selectedTermId)try{let[e,t]=await Promise.all([g.getDays(this.selectedTermId),g.getSummary(this.selectedTermId)]);if(this.teachingDays=e,this.summary=t,this.renderTeachingDays(),this.renderSummary(),this.teachingDays.length>0){let e=this.teachingDays[0];await this.selectTeachingDay(e)}else this.clearRoster(`Tento termín zatím nemá vypsané žádné výukové dny.`)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst data docházky.`;c.error(t)}}renderTeachingDays(){this.daysTableBody&&(this.daysTableBody.innerHTML=``,this.daysCountBadge&&(this.daysCountBadge.textContent=`${this.teachingDays.length} dnů`),this.teachingDays.length===0?this.daysTableBody.innerHTML=`
        <tr>
          <td colspan="5" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            Tento termín zatím nemá vypsané žádné výukové dny.
          </td>
        </tr>
      `:this.teachingDays.forEach(e=>{let t=document.createElement(`tr`);e.id===this.selectedDayId&&t.classList.add(`row-selected`),t.innerHTML=`
        <td class="font-mono text-xs font-bold text-[#4a3512] dark:text-[#faeed4] whitespace-nowrap">${e.dayDate}</td>
        <td class="text-xs font-medium font-display text-[#4a3512] dark:text-[#eeddbb] leading-tight min-w-[120px]">${e.topic}</td>
        <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e] whitespace-nowrap">${e.hours} hod.</td>
        <td class="text-xs text-[#7c5e2d] dark:text-[#c4a974] leading-tight">${e.lecturerName||`Neurčen`}</td>
        <td class="text-right">
          <button class="btn-secondary-tw btn-sm-tw btn-select-day whitespace-nowrap py-1 px-2 text-xs" data-id="${e.id}">
            Zapsat (${e.presentCount}/${e.attendanceCount})
          </button>
        </td>
      `,t.querySelector(`.btn-select-day`)?.addEventListener(`click`,()=>this.selectTeachingDay(e)),this.daysTableBody?.appendChild(t)}))}async selectTeachingDay(e){this.selectedDayId=e.id,this.renderTeachingDays(),this.rosterDayTitle&&(this.rosterDayTitle.textContent=`Prezenční listina: ${e.dayDate}`),this.rosterDaySubtitle&&(this.rosterDaySubtitle.innerHTML=`Téma: <strong class="text-[#4a3512] dark:text-[#faeed4] font-display">${e.topic}</strong> • Lektor: ${e.lecturerName||`Neurčen`} • Rozsah: <strong class="font-mono">${e.hours} hod.</strong>`);try{this.roster=await g.getDayAttendance(e.id),this.renderRoster()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst prezenční listinu dne.`;c.error(t)}}clearRoster(e){this.rosterTableBody&&(this.rosterTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">${e}</td>
        </tr>
      `),this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`none`)}renderRoster(){this.rosterTableBody&&(this.rosterTableBody.innerHTML=``,this.roster.length===0?this.clearRoster(`Na tomto termínu nejsou žádní potvrzení studenti.`):(this.btnSaveAttendance&&(this.btnSaveAttendance.style.display=`inline-flex`),this.roster.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.studentName}</div>
        </td>
        <td class="font-mono text-xs text-[#7c5e2d] dark:text-[#c4a974] break-all sm:break-normal">${e.studentEmail}</td>
        <td class="whitespace-nowrap">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              class="att-checkbox w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-[#caa049] accent-[#caa049] cursor-pointer shrink-0"
              data-student="${e.studentId}"
              ${e.isPresent?`checked`:``}
            />
            <span
              class="text-xs font-semibold label-status ${e.isPresent?`text-emerald-600 dark:text-emerald-400`:`text-amber-700/60 dark:text-amber-200/50`}"
              data-student="${e.studentId}"
            >
              ${e.isPresent?`Přítomen`:`Nepřítomen`}
            </span>
          </label>
        </td>
        <td>
          <input
            type="text"
            class="att-note input-tw py-1 px-2 text-xs w-full min-w-[100px] max-w-xs"
            data-student="${e.studentId}"
            value="${e.note||``}"
            placeholder="Poznámka / omluva..."
          />
        </td>
      `;let n=t.querySelector(`.att-checkbox`),r=t.querySelector(`.label-status`);n?.addEventListener(`change`,()=>{n.checked?(r.textContent=`Přítomen`,r.className=`text-xs font-semibold text-emerald-600 dark:text-emerald-400 label-status`):(r.textContent=`Nepřítomen`,r.className=`text-xs font-semibold text-amber-700/60 dark:text-amber-200/50 label-status`)}),this.rosterTableBody?.appendChild(t)})))}async handleSaveAttendance(){if(!s.isAdmin()){c.info(`Pro uložení docházky se přihlaste jako administrátor.`),e.open(`modal-login`);return}if(!this.selectedDayId||!this.selectedTermId)return;let t=document.querySelectorAll(`.att-checkbox`),n=0;try{for(let e of t){let t=e.getAttribute(`data-student`);if(!t)continue;let r=e.checked,i=document.querySelector(`.att-note[data-student="${t}"]`),a=i?i.value.trim():void 0;await g.markAttendance(this.selectedDayId,{studentId:t,isPresent:r,note:a}),n++}c.success(`Prezenční listina byla uložena (${n} studentů).`),await this.loadTermDetails()}catch(e){let t=e instanceof Error?e.message:`Chyba při ukládání docházky.`;c.error(t)}}renderSummary(){this.summaryTableBody&&(this.summaryTableBody.innerHTML=``,this.summary.length===0?this.summaryTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            Dosud nejsou k dispozici žádná data pro souhrn docházky.
          </td>
        </tr>
      `:this.summary.forEach(e=>{let t=e.qualifiesForCertificate?`<span class="badge-chip badge-chip-green">Splněno (≥ 70 %)</span>`:`<span class="badge-chip badge-chip-red">Nesplněno (< 70 %)</span>`,n=``;n=e.certificateIssued?`
          <button class="btn-cert-preview badge-chip badge-chip-blue font-mono text-xs cursor-pointer hover:border-amber-400 transition-colors" data-cert="${e.certificateNumber||``}">
            ${e.certificateNumber} ↗
          </button>
        `:e.qualifiesForCertificate?`<span class="badge-chip badge-chip-yellow">Čeká na uzavření</span>`:`<span class="badge-chip badge-chip-slate">Nutná výjimka</span>`;let r=document.createElement(`tr`);r.innerHTML=`
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.studentName}</div>
        </td>
        <td class="font-mono text-xs text-[#7c5e2d] dark:text-[#c4a974] break-all sm:break-normal">${e.studentEmail}</td>
        <td class="font-mono text-xs text-[#5c4318] dark:text-[#e2d5b8] whitespace-nowrap">${e.attendedDays} z ${e.totalDays} dnů</td>
        <td>
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="font-mono text-xs font-bold tabular-nums ${e.qualifiesForCertificate?`text-emerald-700 dark:text-emerald-400`:`text-rose-600 dark:text-rose-400`}">
              ${e.attendancePercentage} %
            </span>
            <div class="w-14 sm:w-16 forged-meter-track">
              <div
                class="h-full rounded-xs transition-all duration-300 ${e.qualifiesForCertificate?`bg-emerald-600`:`bg-rose-500`}"
                style="width: ${Math.min(100,e.attendancePercentage)}%;"
              ></div>
            </div>
          </div>
        </td>
        <td>${t}</td>
        <td>${n}</td>
        <td class="text-right">
          ${!e.qualifiesForCertificate&&!e.certificateIssued?`<button class="btn-secondary-tw btn-sm-tw btn-waiver-shortcut text-amber-700 dark:text-amber-400 whitespace-nowrap py-1 px-2 text-xs" data-student="${e.studentId}">
                  Udělit výjimku
                 </button>`:`<span class="text-amber-600/50 text-xs font-mono">-</span>`}
        </td>
      `;let i=r.querySelector(`.btn-cert-preview`);i?.addEventListener(`click`,async()=>{let e=i.getAttribute(`data-cert`);if(e){let t=(await _.getAll()).find(t=>t.certificateNumber===e);t&&document.dispatchEvent(new CustomEvent(`akademie:preview-certificate`,{detail:{certificate:t}}))}}),r.querySelector(`.btn-waiver-shortcut`)?.addEventListener(`click`,()=>{document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`certificates`,openWaiver:!0}}))}),this.summaryTableBody?.appendChild(r)}))}async openCreateDayModal(){if(!s.isAdmin()){c.info(`Pro přidání výukového dne se přihlaste jako administrátor.`),e.open(`modal-login`);return}if(!this.selectedTermId){c.warning(`Nejprve vyberte termín kurzu.`);return}this.formTeachingDay&&this.formTeachingDay.reset(),this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t=document.getElementById(`day-term-id`);t&&(t.value=this.selectedTermId);try{let t=await m.getLecturers(),n=document.getElementById(`day-lecturer-select`);n&&(n.innerHTML=`<option value="">-- Zvolte lektora pro tento den --</option>`+t.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)),e.open(`modal-teaching-day`)}catch{c.error(`Chyba při načítání seznamu lektorů.`)}}async handleCreateDaySubmit(){if(!this.selectedTermId||!this.formTeachingDay)return;this.formTeachingDayError&&(this.formTeachingDayError.style.display=`none`);let t={dayDate:document.getElementById(`day-date`).value,hours:parseInt(document.getElementById(`day-hours`).value,10),topic:document.getElementById(`day-topic`).value.trim(),lecturerId:document.getElementById(`day-lecturer-select`).value||void 0};try{await g.createDay(this.selectedTermId,t),c.success(`Výukový den byl úspěšně přidán.`),e.close(`modal-teaching-day`),await this.loadTermDetails()}catch(e){if(this.formTeachingDayError){let t=e instanceof Error?e.message:`Chyba při vytváření výukového dne.`;this.formTeachingDayError.textContent=t,this.formTeachingDayError.style.display=`block`}}}},y=class{certificates=[];terms=[];certificatesTableBody=null;completeTermSelect=null;btnCompleteTerm=null;btnOpenIssueWaiver=null;kpiCertsCount=null;formWaiver=null;formWaiverError=null;waiverEnrollmentSelect=null;init(){this.certificatesTableBody=document.getElementById(`certificates-table-body`),this.completeTermSelect=document.getElementById(`complete-term-select`),this.btnCompleteTerm=document.getElementById(`btn-complete-term`),this.btnOpenIssueWaiver=document.getElementById(`btn-open-issue-waiver`),this.kpiCertsCount=document.getElementById(`kpi-certs-count`),this.formWaiver=document.getElementById(`form-waiver`),this.formWaiverError=document.getElementById(`form-waiver-error`),this.waiverEnrollmentSelect=document.getElementById(`waiver-enrollment-select`),this.bindEvents(),this.load()}bindEvents(){this.btnCompleteTerm?.addEventListener(`click`,async()=>{await this.handleCompleteTerm()}),this.btnOpenIssueWaiver?.addEventListener(`click`,async()=>{await this.openWaiverModal()}),this.formWaiver?.addEventListener(`submit`,async e=>{e.preventDefault(),await this.handleWaiverSubmit()}),document.getElementById(`btn-print-certificate`)?.addEventListener(`click`,()=>{window.print()}),document.addEventListener(`akademie:preview-certificate`,(e=>{e.detail?.certificate&&this.openCertificatePreview(e.detail.certificate)})),document.addEventListener(`akademie:auth-changed`,()=>{this.renderAuthControls()})}renderAuthControls(){let e=s.isAdmin();this.btnCompleteTerm&&(this.btnCompleteTerm.style.display=e?`inline-flex`:`none`),this.btnOpenIssueWaiver&&(this.btnOpenIssueWaiver.style.display=e?`inline-flex`:`none`)}async load(){this.renderAuthControls();try{let[e,t]=await Promise.all([_.getAll(),p.getAll()]);this.certificates=e,this.terms=t,this.kpiCertsCount&&(this.kpiCertsCount.textContent=this.certificates.length.toString()),this.renderCertificates(),this.renderTermSelect()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst osvědčení o absolvování.`;c.error(t)}}getCertificates(){return this.certificates}renderTermSelect(){this.completeTermSelect&&(this.completeTermSelect.innerHTML=`<option value="">-- Zvolte termín kurzu k uzavření --</option>`+this.terms.map(e=>`<option value="${e.id}">${e.courseTitle} (${e.startDate} až ${e.endDate}) [${e.status===`COMPLETED`?`Už uzavřen`:`Aktivní`}]</option>`).join(``))}renderCertificates(){this.certificatesTableBody&&(this.certificatesTableBody.innerHTML=``,this.certificates.length===0?this.certificatesTableBody.innerHTML=`
        <tr>
          <td colspan="7" class="text-center py-10 text-amber-800/60 dark:text-amber-200/50 italic">
            Zatím nebyla vystavena žádná osvědčení. Uzavřete termín kurzu nebo udělte lektorskou výjimku.
          </td>
        </tr>
      `:this.certificates.forEach(e=>{let t=e.hasWaiver?`<span class="badge-chip badge-chip-yellow cursor-help" title="Důvod výjimky lektora: ${e.waiverReason||`Schváleno lektorem`}">
            Výjimka lektora
           </span>`:`<span class="badge-chip badge-chip-green">Standardní (≥ 70 %)</span>`,n=document.createElement(`tr`);n.innerHTML=`
        <td>
          <span class="font-mono font-bold text-xs text-amber-900 dark:text-amber-200 bg-[#fbf5e6] dark:bg-[#1a1424] px-2 py-0.5 rounded border border-[#caa049] whitespace-nowrap">
            ${e.certificateNumber}
          </span>
        </td>
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.studentName}</div>
          <div class="font-mono text-[11px] text-[#7c5e2d] dark:text-[#c4a974] break-all sm:break-normal mt-0.5">${e.studentEmail}</div>
        </td>
        <td class="text-xs font-medium font-display text-[#4a3512] dark:text-[#eeddbb] leading-tight">${e.courseTitle}</td>
        <td class="font-mono text-xs text-[#7c5e2d] dark:text-[#c4a974] tabular-nums whitespace-nowrap">${e.issueDate}</td>
        <td>
          <span class="font-mono font-bold text-xs tabular-nums whitespace-nowrap ${e.attendanceRate>=70?`text-emerald-700 dark:text-emerald-400`:`text-amber-600 dark:text-amber-400`}">
            ${e.attendanceRate} %
          </span>
        </td>
        <td>${t}</td>
        <td class="text-right">
          <button
            class="btn-secondary-tw btn-sm-tw btn-view-certificate whitespace-nowrap py-1 px-2 text-xs"
            data-id="${e.id}"
            title="Otevřít reprezentativní náhled osvědčení pro tisk"
          >
            Náhled diplomu
          </button>
        </td>
      `,n.querySelector(`.btn-view-certificate`)?.addEventListener(`click`,()=>this.openCertificatePreview(e)),this.certificatesTableBody?.appendChild(n)}))}openCertificatePreview(t){let n=document.getElementById(`cert-view-number`),r=document.getElementById(`cert-view-student`),i=document.getElementById(`cert-view-email`),a=document.getElementById(`cert-view-course`),o=document.getElementById(`cert-view-attendance`),s=document.getElementById(`cert-view-issue-date`),c=document.getElementById(`cert-view-footer-date`),l=document.getElementById(`cert-view-waiver-status`);n&&(n.textContent=t.certificateNumber),r&&(r.textContent=t.studentName),i&&(i.textContent=t.studentEmail),a&&(a.textContent=t.courseTitle),o&&(o.textContent=`${t.attendanceRate} % docházky`),s&&(s.textContent=t.issueDate),c&&(c.textContent=t.issueDate),l&&(t.hasWaiver?(l.textContent=`Výjimka lektora (${t.waiverReason||`Uděleno`})`,l.className=`font-semibold text-amber-700 dark:text-amber-400 ml-1`):(l.textContent=`Standardní absolvování (splněno ≥ 70 % docházky)`,l.className=`font-semibold text-emerald-700 dark:text-emerald-400 ml-1`)),e.open(`modal-certificate-preview`)}async handleCompleteTerm(){if(!s.isAdmin()){c.info(`Pro uzavření termínu se přihlaste jako administrátor.`),e.open(`modal-login`);return}let t=this.completeTermSelect?.value;if(!t){c.warning(`Nejprve vyberte termín ze seznamu vedle tlačítka.`);return}let n=this.terms.find(e=>e.id===t);if(window.confirm(`Opravdu chcete uzavřít termín "${n?.courseTitle||``}"?\n\nSystém automaticky vyhodnotí prezenční listiny a vystaví osvědčení všem studentům, kteří dosáhli alespoň 70% docházky.`))try{let e=await _.completeTerm(t);c.success(e.message),await this.load()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se uzavřít termín kurzu.`;c.error(t)}}async openWaiverModal(){if(!s.isAdmin())c.info(`Pro udělení výjimky se přihlaste jako administrátor.`),e.open(`modal-login`);else if(this.formWaiver&&this.formWaiver.reset(),this.formWaiverError&&(this.formWaiverError.style.display=`none`),this.waiverEnrollmentSelect){this.waiverEnrollmentSelect.innerHTML=`<option value="">Načítám přihlášky studentů...</option>`,e.open(`modal-waiver`);try{let e=``;for(let t of this.terms){let n=await p.getEnrollments(t.id);for(let r of n)r.status!==`CONFIRMED`&&r.status!==`COMPLETED`||this.certificates.some(e=>e.enrollmentId===r.id)||(e+=`<option value="${r.id}">${r.studentName} – ${t.courseTitle} (${r.studentEmail})</option>`)}this.waiverEnrollmentSelect.innerHTML=e||`<option value="">Žádní studenti bez dosud vystaveného osvědčení</option>`}catch{c.error(`Chyba při načítání přihlášek pro udělení výjimky.`)}}}async handleWaiverSubmit(){if(!this.formWaiver||!this.waiverEnrollmentSelect)return;this.formWaiverError&&(this.formWaiverError.style.display=`none`);let t=this.waiverEnrollmentSelect.value,n=document.getElementById(`waiver-reason`).value.trim();if(!t)this.formWaiverError&&(this.formWaiverError.textContent=`Vyberte prosím studenta ze seznamu.`,this.formWaiverError.style.display=`block`);else if(n.length<5)this.formWaiverError&&(this.formWaiverError.textContent=`Uveďte prosím podrobnější písemné odůvodnění výjimky (min. 5 znaků).`,this.formWaiverError.style.display=`block`);else try{let r=await _.issueWithWaiver(t,n);c.success(`Osvědčení č. ${r.certificateNumber} bylo úspěšně vystaveno na základě výjimky lektora!`),e.close(`modal-waiver`),await this.load(),this.openCertificatePreview(r)}catch(e){if(this.formWaiverError){let t=e instanceof Error?e.message:`Chyba při vystavování osvědčení s výjimkou.`;this.formWaiverError.textContent=t,this.formWaiverError.style.display=`block`}}}},b=class{lecturers=[];classrooms=[];lecturersTableBody=null;classroomsTableBody=null;init(){this.lecturersTableBody=document.getElementById(`lecturers-table-body`),this.classroomsTableBody=document.getElementById(`classrooms-table-body`),this.load()}async load(){try{let[e,t]=await Promise.all([m.getLecturers(),m.getClassrooms()]);this.lecturers=e,this.classrooms=t,this.renderLecturers(),this.renderClassrooms()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst lektory a učebny.`;c.error(t)}}renderLecturers(){this.lecturersTableBody&&(this.lecturersTableBody.innerHTML=``,this.lecturers.length===0?this.lecturersTableBody.innerHTML=`
        <tr>
          <td colspan="4" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            V databázi zatím nejsou žádní lektoři.
          </td>
        </tr>
      `:this.lecturers.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-md bg-[#f0e3c8] dark:bg-[#251e30] text-[#6e4e1b] dark:text-[#f8df95] border border-[#caa049] font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              ${e.name.split(` `).map(e=>e[0]).join(``).toUpperCase()}
            </div>
            <div>
              <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.name}</div>
            </div>
          </div>
        </td>
        <td class="text-xs">
          <div class="font-mono text-[#5c4318] dark:text-[#eeddbb] font-medium break-all sm:break-normal">${e.email}</div>
          <div class="font-mono text-[#8c6d3b] dark:text-[#c4a974] text-[11px] tabular-nums whitespace-nowrap mt-0.5">${e.phone||`-`}</div>
        </td>
        <td class="text-xs">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] bg-[#f5ebd6] dark:bg-[#1a1424] text-[#5c4318] dark:text-[#fce8bd] font-medium border border-[#caa049]/50 whitespace-nowrap">
            ${e.specialization||`Lektor`}
          </span>
        </td>
        <td>
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <strong class="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs tabular-nums">${e.taughtHours} hod.</strong>
            <span class="font-mono text-[11px] text-[#8c6d3b] dark:text-[#c4a974] tabular-nums">(${e.termCount} termínů)</span>
          </div>
        </td>
      `,this.lecturersTableBody?.appendChild(t)}))}renderClassrooms(){this.classroomsTableBody&&(this.classroomsTableBody.innerHTML=``,this.classrooms.length===0?this.classroomsTableBody.innerHTML=`
        <tr>
          <td colspan="3" class="text-center py-8 text-amber-800/60 dark:text-amber-200/50 italic">
            V databázi zatím nejsou žádné učebny.
          </td>
        </tr>
      `:this.classrooms.forEach(e=>{let t=document.createElement(`tr`);t.innerHTML=`
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.name}</div>
        </td>
        <td class="text-xs text-[#6e5223] dark:text-[#d1b88e] leading-tight">${e.address}</td>
        <td>
          <span class="font-mono font-bold text-xs text-[#5c4318] dark:text-[#fce28b] bg-[#f5ebd6] dark:bg-[#1a1424] px-2 py-0.5 rounded border border-[#caa049] whitespace-nowrap">
            ${e.capacity} studentů
          </span>
        </td>
      `,this.classroomsTableBody?.appendChild(t)}))}},x=class{data=null;termsListContainer=null;lecturersListContainer=null;studentsListContainer=null;btnRefresh=null;init(){this.termsListContainer=document.getElementById(`analytics-terms-list`),this.lecturersListContainer=document.getElementById(`analytics-lecturers-list`),this.studentsListContainer=document.getElementById(`analytics-students-list`),this.btnRefresh=document.getElementById(`btn-refresh-analytics`),this.bindEvents(),this.load()}bindEvents(){this.btnRefresh?.addEventListener(`click`,async()=>{await this.load(!0)})}async load(e=!1){try{this.data=await m.getAnalytics(),this.render(),e&&c.success(`Manažerské statistiky byly aktualizovány.`)}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst manažerské výkazy.`;c.error(t)}}render(){this.data&&(this.renderTermStats(),this.renderLecturerStats(),this.renderMultiCourseStudents())}renderTermStats(){this.termsListContainer&&(this.termsListContainer.innerHTML=``,this.data.termStats.length===0?this.termsListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
          Zatím nejsou k dispozici žádné termíny pro analýzu vytížení.
        </div>
      `:this.data.termStats.forEach(e=>{let t=document.createElement(`div`);t.className=`p-3 rounded-lg bg-[#fcf8ee]/80 dark:bg-[#161220] border border-[#caa049]/40 transition-all shadow-xs`;let n=e.waitlist>0,r=Math.min(100,e.fillRate);t.innerHTML=`
        <div class="flex justify-between items-center text-xs mb-1.5">
          <span class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] truncate pr-2">
            ${e.courseTitle}
            <span class="font-mono text-xs text-[#8c6d3b] dark:text-[#c4a974] font-normal">(${e.period})</span>
          </span>
          <div class="shrink-0 text-right font-mono text-xs tabular-nums">
            <span class="font-bold text-[#4a3512] dark:text-[#faeed4]">${e.confirmed} / ${e.capacity}</span>
            <span class="${e.fillRate>=100?`text-amber-600 dark:text-amber-400`:`text-emerald-600 dark:text-emerald-400`} font-bold ml-1">
              (${e.fillRate} %)
            </span>
          </div>
        </div>
        <div class="w-full forged-meter-track mb-1.5">
          <div
            class="h-full rounded-xs transition-all duration-300 ${e.fillRate>=100?`bg-amber-500`:`bg-emerald-600`}"
            style="width: ${r}%;"
          ></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          ${n?`<span class="text-amber-600 dark:text-amber-400 font-semibold font-mono flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
                  ${e.waitlist} ${e.waitlist===1?`náhradník čeká`:`náhradníci čekají`} v pořadníku
                 </span>`:`<span class="text-[#8c6d3b] dark:text-[#c4a974] font-mono tabular-nums">Volná místa: ${Math.max(0,e.capacity-e.confirmed)}</span>`}
          <span class="text-[#8c6d3b] dark:text-[#c4a974] font-mono text-xs tabular-nums">Kapacita: ${e.capacity}</span>
        </div>
      `,this.termsListContainer?.appendChild(t)}))}renderLecturerStats(){if(!this.lecturersListContainer)return;if(this.lecturersListContainer.innerHTML=``,this.data.lecturerStats.length===0){this.lecturersListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
          Zatím nejsou k dispozici žádná data o lektorech.
        </div>
      `;return}let e=Math.max(...this.data.lecturerStats.map(e=>e.taughtHours),1);this.data.lecturerStats.forEach(t=>{let n=document.createElement(`div`);n.className=`p-3 rounded-lg bg-[#fcf8ee]/80 dark:bg-[#161220] border border-[#caa049]/40 text-xs shadow-xs`;let r=Math.round(t.taughtHours/e*100);n.innerHTML=`
        <div class="flex justify-between items-center mb-1.5">
          <span class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${t.name}</span>
          <div class="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <strong class="text-emerald-700 dark:text-emerald-400 font-bold">${t.taughtHours} hod.</strong>
            <span class="text-[#8c6d3b] dark:text-[#c4a974]">(${t.termCount} termínů)</span>
          </div>
        </div>
        <div class="w-full forged-meter-track">
          <div
            class="h-full bg-emerald-600 rounded-xs transition-all duration-300"
            style="width: ${r}%;"
          ></div>
        </div>
      `,this.lecturersListContainer?.appendChild(n)})}renderMultiCourseStudents(){if(!this.studentsListContainer)return;if(this.studentsListContainer.innerHTML=``,this.data.multiCourseStudents.length===0){this.studentsListContainer.innerHTML=`
        <div class="py-6 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">
          V tomto roce zatím žádný student neabsolvoval více než 1 kurz.
        </div>
      `;return}let e=document.createElement(`div`);e.className=`table-box-wrap mt-2 overflow-x-auto`,e.innerHTML=`
      <table class="table-tw">
        <thead>
          <tr>
            <th>Student</th>
            <th>Kontakt</th>
            <th>Organizace</th>
            <th>Počet kurzů</th>
            <th>Navštěvované programy</th>
          </tr>
        </thead>
        <tbody id="multi-students-table-body"></tbody>
      </table>
    `;let t=e.querySelector(`#multi-students-table-body`);this.data.multiCourseStudents.forEach(e=>{let n=document.createElement(`tr`),r=e.courses.map(e=>`<span class="inline-block px-2.5 py-0.5 rounded text-xs bg-[#f5ebd6] dark:bg-[#1a1424] text-[#5c4318] dark:text-[#fce8bd] border border-[#caa049]/50 mr-1 mb-1 font-medium">${e}</span>`).join(``);n.innerHTML=`
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">${e.student}</div>
        </td>
        <td class="font-mono text-xs text-[#6e5223] dark:text-[#d1b88e] break-all sm:break-normal">${e.email}</td>
        <td class="text-xs text-[#7c5e2d] dark:text-[#c4a974] leading-tight">${e.organization||`-`}</td>
        <td>
          <span class="badge-chip badge-chip-green font-mono whitespace-nowrap">
            ${e.courseCount} kurzy
          </span>
        </td>
        <td class="py-2">
          <div class="flex flex-wrap gap-1">${r}</div>
        </td>
      `,t?.appendChild(n)}),this.studentsListContainer.appendChild(e)}},S=class{container=null;dashboardData=null;init(){this.container=document.getElementById(`tab-student`),this.bindEvents(),document.addEventListener(`akademie:auth-changed`,()=>{s.isStudent()?this.load():this.render()})}bindEvents(){this.container?.addEventListener(`click`,async t=>{let n=t.target,r=n.closest(`.btn-course-filter`);if(r){let e=r.getAttribute(`data-course-id`);if(e){document.dispatchEvent(new CustomEvent(`akademie:switch-tab`,{detail:{tab:`terms`,courseId:e}}));return}}let i=n.closest(`.btn-student-cert-preview`);if(i){let e=i.getAttribute(`data-cert`);e&&await this.previewCertificate(e)}n.closest(`#btn-student-portal-login`)&&e.open(`modal-login`)})}async load(){if(!s.isAuthenticated())this.render();else try{this.dashboardData=await s.getStudentDashboard(),this.render()}catch(e){let t=e instanceof Error?e.message:`Nepodařilo se načíst data klientského portálu.`;c.error(t),this.render()}}render(){if(!this.container)return;let e=s.getUser();if(!e){this.container.innerHTML=`
        <div class="card-box text-center py-12 max-w-xl mx-auto">
          <div class="w-12 h-12 rounded-full bg-[#f4ebce] dark:bg-[#251e30] text-[#8c6d3b] dark:text-[#f8df95] flex items-center justify-center mx-auto mb-3 border border-[#caa049]">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4] mb-1">
            Klientský portál studenta Akademie Trutnov
          </h3>
          <p class="text-xs text-[#7c5e2d] dark:text-[#c4a974] max-w-sm mx-auto mb-4 leading-relaxed">
            Pro zobrazení Vašich podaných přihlášek, pozice v pořadníku náhradníků, evidence docházky a vydaných osvědčení se prosím přihlaste.
          </p>
          <button id="btn-student-portal-login" class="btn-primary-tw mx-auto flex items-center gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Přihlásit se jako student</span>
          </button>
        </div>
      `;return}let t=this.dashboardData,n=t?.student||{id:e.studentId||e.id,name:e.name,email:e.email||e.username,organization:`Akademie Trutnov`},r=t?.enrollments||[],i=t?.certificates||[],a=t?.attendance||[],o=r.filter(e=>e.status===`CONFIRMED`).length,c=r.filter(e=>e.status===`WAITLIST`).length,l=a.length>0?Math.round(a.reduce((e,t)=>e+t.percentage,0)/a.length):100;this.container.innerHTML=`
      <div class="space-y-6">
        <!-- Student Info Header -->
        <div class="card-box">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold font-display text-[#4a3512] dark:text-[#faeed4]">
                    ${n.name}
                  </h2>
                  <span class="badge-chip badge-chip-blue font-mono text-xs">Student</span>
                </div>
                <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-0.5 flex flex-wrap items-center gap-3">
                  <span>${n.email}</span>
                  ${n.organization?`<span class="opacity-80">• ${n.organization}</span>`:``}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn-secondary-tw btn-sm-tw"
                onclick="document.dispatchEvent(new CustomEvent('akademie:switch-tab', { detail: { tab: 'courses' } }))"
              >
                Katalog kurzů
              </button>
            </div>
          </div>
        </div>

        <!-- KPI Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Aktivní přihlášky</div>
              <div class="text-xl font-bold font-mono tabular-nums text-[#4a3512] dark:text-[#faeed4] mt-0.5">${o}</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Pořadník náhradníků</div>
              <div class="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">${c}</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Průměrná docházka</div>
              <div class="text-xl font-bold font-mono tabular-nums ${l>=70?`text-emerald-600 dark:text-emerald-400`:`text-amber-600`} mt-0.5">${l} %</div>
            </div>
          </div>
          <div class="metric-kpi-card">
            <div>
              <div class="text-xs font-semibold text-[#7c5e2d] dark:text-[#c4a974] uppercase tracking-wider font-display">Získaná osvědčení</div>
              <div class="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">${i.length}</div>
            </div>
          </div>
        </div>

        <!-- Enrollments Table -->
        <div class="table-box-wrap">
          <div class="table-box-header px-5 py-3.5 flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider font-display text-[#4a3512] dark:text-[#fce8bd]">
              Moje zapsané kurzy & termíny
            </h3>
            <span class="badge-chip badge-chip-slate font-mono text-xs">${r.length} zápisů</span>
          </div>

          <div class="overflow-x-auto">
            <table class="table-tw">
              <thead>
                <tr>
                  <th>Vzdělávací program</th>
                  <th>Termín konání</th>
                  <th>Učebna</th>
                  <th>Stav přihlášky</th>
                  <th>Docházka</th>
                  <th class="text-right">Osvědčení</th>
                </tr>
              </thead>
              <tbody>
                ${r.length===0?`<tr><td colspan="6" class="py-8 text-center text-xs text-amber-800/60 dark:text-amber-200/50 italic">Zatím nemáte žádné aktivní přihlášky. Vyberte si kurz v katalogu!</td></tr>`:r.map(e=>{let t=a.find(t=>t.termId===e.termId),n=i.find(t=>t.courseTitle===e.courseTitle),r=``;r=e.status===`CONFIRMED`?`<span class="badge-chip badge-chip-green">Potvrzena</span>`:e.status===`WAITLIST`?`<span class="badge-chip badge-chip-amber">Náhradník #${e.waitlistPosition||1}</span>`:e.status===`COMPLETED`?`<span class="badge-chip badge-chip-blue">Absolvováno</span>`:`<span class="badge-chip badge-chip-slate">${e.status}</span>`;let o=t?t.percentage:100,s=o>=70;return`
                            <tr>
                              <td class="font-bold font-display text-[#4a3512] dark:text-[#faeed4] leading-tight">
                                <button
                                  type="button"
                                  class="btn-course-filter text-left font-bold font-display text-[#4a3512] dark:text-[#faeed4] hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer inline-flex items-center gap-1.5 transition-colors group"
                                  data-course-id="${e.courseId||``}"
                                  title="Zobrazit vypsané termíny tohoto kurzu"
                                >
                                  <span>${e.courseTitle}</span>
                                  <svg class="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </button>
                              </td>
                              <td class="font-mono text-xs text-[#5c4318] dark:text-[#e2d5b8] whitespace-nowrap">
                                <div>${e.startDate}</div>
                                <div class="text-[11px] text-[#8c6d3b] dark:text-[#c4a974]">až ${e.endDate}</div>
                              </td>
                              <td class="text-xs text-[#6e5223] dark:text-[#d1b88e] leading-tight">
                                ${e.classroomName||`Centrum Trutnov`}
                              </td>
                              <td>${r}</td>
                              <td>
                                <div class="flex items-center gap-1.5 whitespace-nowrap">
                                  <span class="font-mono font-bold text-xs tabular-nums ${s?`text-emerald-700 dark:text-emerald-400`:`text-amber-700`}">
                                    ${o}%
                                  </span>
                                  ${s?`<span class="text-xs text-emerald-600 font-medium">✓ Splněno</span>`:`<span class="text-xs text-amber-600 font-medium">&lt; 70%</span>`}
                                </div>
                              </td>
                              <td class="text-right">
                                ${n?`<button class="btn-student-cert-preview badge-chip badge-chip-blue font-mono text-xs cursor-pointer hover:border-amber-400 transition-colors whitespace-nowrap" data-cert="${n.certificateNumber}">
                                        ${n.certificateNumber}
                                      </button>`:s?`<span class="text-xs text-[#8c6d3b] dark:text-[#c4a974] whitespace-nowrap">K vydání</span>`:`<span class="text-amber-600/50 text-xs font-mono">–</span>`}
                              </td>
                            </tr>
                          `}).join(``)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Issued Certificates Gallery -->
        ${i.length>0?`
          <div class="card-box">
            <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#caa049]/40">
              <h3 class="text-xs font-bold uppercase tracking-wider font-display text-[#4a3512] dark:text-[#fce8bd]">
                Vydaná osvědčení o absolvování
              </h3>
              <span class="badge-chip badge-chip-green">MŠMT Akreditace</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${i.map(e=>`
                <div class="p-3.5 rounded-xl border border-[#caa049]/40 bg-[#fbf5e6]/80 dark:bg-[#1a1424] flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div class="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                      ${e.certificateNumber}
                    </div>
                    <div class="text-xs font-bold font-display text-[#4a3512] dark:text-[#faeed4] mt-0.5">
                      ${e.courseTitle}
                    </div>
                    <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-1 tabular-nums font-mono">
                      Vydáno: ${e.issueDate} • Docházka: ${e.attendanceRate}%
                    </div>
                  </div>
                  <button
                    class="btn-student-cert-preview btn-secondary-tw btn-sm-tw shrink-0"
                    data-cert="${e.certificateNumber}"
                  >
                    Náhled osvědčení
                  </button>
                </div>
              `).join(``)}
            </div>
          </div>
        `:``}
      </div>
    `}async previewCertificate(t){try{let n=(await _.getAll()).find(e=>e.certificateNumber===t);if(!n){c.error(`Osvědčení s kódem ${t} nebylo nalezeno.`);return}let r=document.getElementById(`preview-cert-number`),i=document.getElementById(`preview-cert-student-name`),a=document.getElementById(`preview-cert-course-title`),o=document.getElementById(`preview-cert-date`),s=document.getElementById(`preview-cert-attendance-rate`),l=document.getElementById(`preview-cert-hours`);r&&(r.textContent=n.certificateNumber),i&&(i.textContent=n.studentName),a&&(a.textContent=n.courseTitle),o&&(o.textContent=n.issueDate),s&&(s.textContent=`${n.attendanceRate}%`),l&&(l.textContent=`40`),e.open(`modal-certificate-preview`)}catch{c.error(`Chyba při otevírání náhledu osvědčení.`)}}},C=class{header;coursesView;termsView;attendanceView;certificatesView;lecturersView;analyticsView;studentPortalView;constructor(){e.init(),this.coursesView=new f({onScheduleTerm:e=>this.handleScheduleCourse(e)}),this.termsView=new h({onSwitchToAttendance:e=>this.handleSwitchToAttendance(e)}),this.attendanceView=new v,this.certificatesView=new y,this.lecturersView=new b,this.analyticsView=new x,this.studentPortalView=new S,this.header=new u({activeTab:`courses`,onTabChange:e=>this.handleTabChange(e)})}init(){s.restoreSession(),this.header.bindEvents(),this.coursesView.init(),this.termsView.init(),this.attendanceView.init(),this.certificatesView.init(),this.lecturersView.init(),this.analyticsView.init(),this.studentPortalView.init(),this.bindGlobalShortcuts(),this.bindLoginEvents(),this.bindCustomEvents(),this.checkHealth()}bindLoginEvents(){let t=document.getElementById(`form-login`),n=document.getElementById(`form-login-error`),r=document.getElementById(`login-username`),i=document.getElementById(`login-password`),a=document.getElementById(`btn-prefill-admin`),o=document.getElementById(`btn-prefill-student`);a?.addEventListener(`click`,()=>{r&&(r.value=`admin`),i&&(i.value=`admin123`),n&&n.classList.add(`hidden`)}),o?.addEventListener(`click`,()=>{r&&(r.value=`jan.novak@firma.cz`),i&&(i.value=`student123`),n&&n.classList.add(`hidden`)}),t?.addEventListener(`submit`,async t=>{t.preventDefault(),n&&n.classList.add(`hidden`);let a=r?.value||``,o=i?.value||``;try{let{user:t}=await s.login(a,o);e.close(`modal-login`),c.success(`Vítejte, ${t.name}! Byli jste úspěšně přihlášeni.`),t.role===`student`?(this.header.setActiveTab(`student`),this.handleTabChange(`student`)):this.handleTabChange(`courses`)}catch(e){let t=e instanceof Error?e.message:`Neplatné přihlašovací jméno nebo heslo.`;n?(n.textContent=t,n.classList.remove(`hidden`)):c.error(t)}})}bindGlobalShortcuts(){document.getElementById(`btn-open-shortcuts`)?.addEventListener(`click`,()=>{e.open(`modal-shortcuts`)}),document.addEventListener(`keydown`,t=>{let n=document.activeElement,r=n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement||n instanceof HTMLSelectElement||n?.getAttribute(`contenteditable`)===`true`;t.key===`?`&&!r&&(t.preventDefault(),e.open(`modal-shortcuts`))})}bindCustomEvents(){document.addEventListener(`akademie:schedule-course`,(e=>{e.detail?.courseId&&this.handleScheduleCourse(e.detail.courseId)})),document.addEventListener(`akademie:switch-tab`,(e=>{let{tab:t,termId:n,courseId:r,openWaiver:i}=e.detail||{};t&&(t===`terms`&&this.termsView.filterByCourse(r??null),this.header.setActiveTab(t),this.handleTabChange(t),t===`attendance`&&n?setTimeout(()=>this.attendanceView.selectTermById(n),100):t===`certificates`&&i&&setTimeout(()=>this.certificatesView.openWaiverModal(),100))}))}handleScheduleCourse(e){this.header.setActiveTab(`terms`),this.termsView.load().then(()=>{this.termsView.openCreateTermModal(e)})}handleSwitchToAttendance(e){this.header.setActiveTab(`attendance`),this.attendanceView.load(e)}handleTabChange(e){switch(e){case`courses`:this.coursesView.load();break;case`terms`:this.termsView.load();break;case`attendance`:this.attendanceView.load();break;case`certificates`:this.certificatesView.load();break;case`lecturers`:this.lecturersView.load();break;case`analytics`:this.analyticsView.load();break;case`student`:this.studentPortalView.load()}}async checkHealth(){let e=document.getElementById(`system-status-indicator`);if(e)try{if((await fetch(`/health`)).ok)e.innerHTML=`
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Systém aktivní
        `,e.className=`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80`;else throw Error(`Chyba spojení`)}catch{e.innerHTML=`
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Offline
      `,e.className=`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80`}}};document.addEventListener(`DOMContentLoaded`,()=>{new C().init()});