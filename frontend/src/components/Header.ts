/**
 * Header & Navbar Component - Akademie Trutnov
 * Streamlined 4-item navigation with dropdown menu for administration & reports,
 * Dark/Light mode theme switch with persistence, keyboard shortcuts, and
 * administrative / student session state handling.
 */

import { authApi } from "../api/authApi";
import { Modal } from "./Modal";
import { Toast } from "./Toast";
import { AuthUser } from "../types";

export interface HeaderOptions {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const DROPDOWN_TABS: Record<string, string> = {
  certificates: "Osvědčení",
  lecturers: "Lektoři",
  analytics: "Výkazy",
};

export class Header {
  private activeTab: string;
  private onTabChange: (tabId: string) => void;
  private isDropdownOpen: boolean = false;
  private isMobileDropdownOpen: boolean = false;

  constructor(options: HeaderOptions) {
    this.activeTab = options.activeTab;
    this.onTabChange = options.onTabChange;
  }

  public initTheme(): void {
    const savedTheme =
      localStorage.getItem("akademie_theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    this.applyTheme(savedTheme as "light" | "dark");

    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        this.applyTheme(nextTheme);
      });
    }
  }

  public applyTheme(theme: "light" | "dark"): void {
    document.documentElement.setAttribute("data-theme", theme);
    const iconMoon = document.querySelector(".icon-moon");
    const iconSun = document.querySelector(".icon-sun");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      iconMoon?.classList.add("hidden");
      iconSun?.classList.remove("hidden");
    } else {
      document.documentElement.classList.remove("dark");
      iconMoon?.classList.remove("hidden");
      iconSun?.classList.add("hidden");
    }
    localStorage.setItem("akademie_theme", theme);
  }

  public bindEvents(): void {
    // 1. Navigation tab buttons (primary + dropdown items)
    const navButtons = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        if (tab && tab !== this.activeTab) {
          this.setActiveTab(tab);
          this.onTabChange(tab);
        }
        this.closeAllDropdowns();
      });
    });

    // 2. Desktop dropdown toggle
    const dropdownBtn = document.getElementById("btn-nav-dropdown");
    if (dropdownBtn) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleDesktopDropdown();
      });
    }

    // 3. Mobile dropdown toggle
    const mobileDropdownBtn = document.getElementById("mobile-btn-nav-dropdown");
    if (mobileDropdownBtn) {
      mobileDropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleMobileDropdown();
      });
    }

    // 4. Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      const target = e.target as Node;
      const desktopContainer = document.getElementById("nav-dropdown-container");
      const mobileContainer = document.getElementById("mobile-nav-dropdown-container");

      if (desktopContainer && !desktopContainer.contains(target)) {
        this.closeDesktopDropdown();
      }
      if (mobileContainer && !mobileContainer.contains(target)) {
        this.closeMobileDropdown();
      }
    });

    // 5. Auth state & Login modal binding
    this.bindAuthEvents();

    // 6. Keyboard shortcuts: 1-6 for tabs, '/' for search, Esc to close dropdowns
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        if (this.isDropdownOpen || this.isMobileDropdownOpen) {
          this.closeAllDropdowns();
        }
        return;
      }

      // Allow '/' to focus search even if nothing focused
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById("filter-search-course") as HTMLInputElement;
        if (this.activeTab !== "courses") {
          this.setActiveTab("courses");
          this.onTabChange("courses");
        }
        setTimeout(() => {
          searchInput?.focus();
          searchInput?.select();
        }, 50);
        return;
      }

      if (isInput) return;

      const tabMap: Record<string, string> = {
        "1": "courses",
        "2": "terms",
        "3": "attendance",
        "4": "certificates",
        "5": "lecturers",
        "6": "analytics",
      };

      if (tabMap[e.key]) {
        e.preventDefault();
        const targetTab = tabMap[e.key];
        if (targetTab !== this.activeTab) {
          this.setActiveTab(targetTab);
          this.onTabChange(targetTab);
        }
        this.closeAllDropdowns();
      }
    });

    this.initTheme();
    this.setActiveTab(this.activeTab);
  }

  private bindAuthEvents(): void {
    // Open login modal
    const btnOpenLogin = document.getElementById("btn-open-login");
    btnOpenLogin?.addEventListener("click", () => {
      Modal.open("modal-login");
    });

    // Logout button
    const btnLogout = document.getElementById("btn-logout");
    btnLogout?.addEventListener("click", async () => {
      await authApi.logout();
      Toast.info("Byli jste úspěšně odhlášeni.");
      this.renderAuthState(null);
    });

    // Listen for external auth changes
    document.addEventListener("akademie:auth-changed", ((
      e: CustomEvent<{ user: AuthUser | null }>
    ) => {
      this.renderAuthState(e.detail?.user || null);
    }) as EventListener);

    // Initial session verification
    authApi.fetchCurrentStatus().then((user) => {
      this.renderAuthState(user);
    });
  }

  private renderAuthState(user: AuthUser | null): void {
    const unauthContainer = document.getElementById("auth-unauthenticated");
    const authContainer = document.getElementById("auth-authenticated");
    const authUserName = document.getElementById("auth-user-name");
    const authUserBadge = document.getElementById("auth-user-badge");

    const adminElements = document.querySelectorAll<HTMLElement>(".admin-only");
    const navTabStudent = document.getElementById("nav-tab-student");
    const mobileNavTabStudent = document.getElementById("mobile-nav-tab-student");

    if (user) {
      if (unauthContainer) unauthContainer.classList.add("hidden");
      if (authContainer) {
        authContainer.classList.remove("hidden");
        authContainer.classList.add("flex");
      }
      if (authUserName) authUserName.textContent = user.name;
      if (authUserBadge) {
        if (user.role === "admin") {
          authUserBadge.textContent = "Admin";
          authUserBadge.className = "badge-chip badge-chip-green font-mono uppercase text-xs";
        } else {
          authUserBadge.textContent = "Student";
          authUserBadge.className = "badge-chip badge-chip-blue font-mono uppercase text-xs";
        }
      }

      if (user.role === "admin") {
        // Show all administrative navigation items
        adminElements.forEach((el) => {
          el.classList.remove("hidden");
          el.style.display = "";
        });
        if (navTabStudent) navTabStudent.classList.remove("hidden");
        if (mobileNavTabStudent) mobileNavTabStudent.classList.remove("hidden");
      } else {
        // Student role: Hide administrative controls, show personal portal
        adminElements.forEach((el) => {
          el.classList.add("hidden");
          el.style.display = "none";
        });
        if (navTabStudent) navTabStudent.classList.remove("hidden");
        if (mobileNavTabStudent) mobileNavTabStudent.classList.remove("hidden");

        const adminTabs = ["attendance", "certificates", "lecturers", "analytics"];
        if (adminTabs.includes(this.activeTab)) {
          this.setActiveTab("student");
          this.onTabChange("student");
        }
      }
    } else {
      // Anonymous user: Hide all administrative controls and student portal from navbar
      if (authContainer) {
        authContainer.classList.add("hidden");
        authContainer.classList.remove("flex");
      }
      if (unauthContainer) unauthContainer.classList.remove("hidden");

      adminElements.forEach((el) => {
        el.classList.add("hidden");
        el.style.display = "none";
      });
      if (navTabStudent) navTabStudent.classList.add("hidden");
      if (mobileNavTabStudent) mobileNavTabStudent.classList.add("hidden");

      const protectedTabs = ["attendance", "certificates", "lecturers", "analytics", "student"];
      if (protectedTabs.includes(this.activeTab)) {
        this.setActiveTab("courses");
        this.onTabChange("courses");
      }
    }
  }

  private toggleDesktopDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDesktopDropdown();
    } else {
      this.openDesktopDropdown();
    }
  }

  private openDesktopDropdown(): void {
    const menu = document.getElementById("nav-dropdown-menu");
    const chevron = document.getElementById("nav-dropdown-chevron");
    const btn = document.getElementById("btn-nav-dropdown");
    if (menu) menu.classList.remove("hidden");
    if (chevron) chevron.classList.add("rotate-180");
    if (btn) btn.setAttribute("aria-expanded", "true");
    this.isDropdownOpen = true;
  }

  private closeDesktopDropdown(): void {
    const menu = document.getElementById("nav-dropdown-menu");
    const chevron = document.getElementById("nav-dropdown-chevron");
    const btn = document.getElementById("btn-nav-dropdown");
    if (menu) menu.classList.add("hidden");
    if (chevron) chevron.classList.remove("rotate-180");
    if (btn) btn.setAttribute("aria-expanded", "false");
    this.isDropdownOpen = false;
  }

  private toggleMobileDropdown(): void {
    if (this.isMobileDropdownOpen) {
      this.closeMobileDropdown();
    } else {
      this.openMobileDropdown();
    }
  }

  private openMobileDropdown(): void {
    const menu = document.getElementById("mobile-nav-dropdown-menu");
    const chevron = document.getElementById("mobile-nav-dropdown-chevron");
    const btn = document.getElementById("mobile-btn-nav-dropdown");
    if (menu) menu.classList.remove("hidden");
    if (chevron) chevron.classList.add("rotate-180");
    if (btn) btn.setAttribute("aria-expanded", "true");
    this.isMobileDropdownOpen = true;
  }

  private closeMobileDropdown(): void {
    const menu = document.getElementById("mobile-nav-dropdown-menu");
    const chevron = document.getElementById("mobile-nav-dropdown-chevron");
    const btn = document.getElementById("mobile-btn-nav-dropdown");
    if (menu) menu.classList.add("hidden");
    if (chevron) chevron.classList.remove("rotate-180");
    if (btn) btn.setAttribute("aria-expanded", "false");
    this.isMobileDropdownOpen = false;
  }

  public closeAllDropdowns(): void {
    this.closeDesktopDropdown();
    this.closeMobileDropdown();
  }

  public setActiveTab(tabId: string): void {
    // Role-based Access Control Guard
    const adminTabs = ["attendance", "certificates", "lecturers", "analytics"];
    const studentTabs = ["student"];

    if (adminTabs.includes(tabId) && !authApi.isAdmin()) {
      Toast.warning("Tato sekce je určena výhradně pro administrátory vzdělávacího centra.");
      Modal.open("modal-login");
      return;
    }

    if (studentTabs.includes(tabId) && !authApi.isAuthenticated()) {
      Toast.info("Pro zobrazení klientského portálu se prosím nejprve přihlaste.");
      Modal.open("modal-login");
      return;
    }

    this.activeTab = tabId;

    // 1. Update individual buttons
    const navButtons = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
    navButtons.forEach((btn) => {
      const tab = btn.getAttribute("data-tab");
      if (tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // 2. Dropdown toggle button state
    const isSubTab = Object.prototype.hasOwnProperty.call(DROPDOWN_TABS, tabId);
    const subLabel = DROPDOWN_TABS[tabId];

    const desktopDropdownBtn = document.getElementById("btn-nav-dropdown");
    const desktopDropdownLabel = document.getElementById("nav-dropdown-label");
    const mobileDropdownBtn = document.getElementById("mobile-btn-nav-dropdown");
    const mobileDropdownLabel = document.getElementById("mobile-nav-dropdown-label");

    if (isSubTab) {
      desktopDropdownBtn?.classList.add("active");
      if (desktopDropdownLabel) {
        desktopDropdownLabel.textContent = `Správa: ${subLabel}`;
      }
      mobileDropdownBtn?.classList.add("active");
      if (mobileDropdownLabel) {
        mobileDropdownLabel.textContent = `Správa: ${subLabel}`;
      }
    } else {
      desktopDropdownBtn?.classList.remove("active");
      if (desktopDropdownLabel) {
        desktopDropdownLabel.textContent = "Správa & Výkazy";
      }
      mobileDropdownBtn?.classList.remove("active");
      if (mobileDropdownLabel) {
        mobileDropdownLabel.textContent = "Správa";
      }
    }

    // 3. Switch visible panes
    const panes = document.querySelectorAll<HTMLElement>(".tab-pane");
    panes.forEach((pane) => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.remove("hidden");
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
        pane.classList.add("hidden");
      }
    });
  }
}
