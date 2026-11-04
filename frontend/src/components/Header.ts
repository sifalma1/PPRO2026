/**
 * Header & Navbar Component
 * Streamlined 4-item navigation with dropdown menu for administration & reports,
 * Dark/Light mode theme switch with persistence, and keyboard shortcuts.
 */

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

    // 5. Keyboard shortcuts: 1-6 for tabs, '/' for search, Esc to close dropdowns
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
