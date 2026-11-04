/**
 * Header & Navbar Component
 * Navigation tabs, Dark/Light mode theme switch with persistence, and system live status
 */

export interface HeaderOptions {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export class Header {
  private activeTab: string;
  private onTabChange: (tabId: string) => void;

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
    const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-tab-btn");
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        if (tab && tab !== this.activeTab) {
          this.setActiveTab(tab);
          this.onTabChange(tab);
        }
      });
    });

    // Keyboard shortcuts: 1-6 for tabs, '/' for search, '?' for shortcuts dialog
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

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
      }
    });

    this.initTheme();
  }

  public setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-tab-btn");
    navButtons.forEach((btn) => {
      const tab = btn.getAttribute("data-tab");
      if (tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

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
