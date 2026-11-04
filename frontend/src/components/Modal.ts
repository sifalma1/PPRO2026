/**
 * Accessible Modal Controller
 * Handles opening, closing, backdrop clicking, ESC key listener, and focus
 */

export class Modal {
  private static activeModals: HTMLElement[] = [];

  public static init(): void {
    // Listen for close buttons
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const closeBtn = target.closest("[data-close]");
      if (closeBtn) {
        const modalId = closeBtn.getAttribute("data-close");
        if (modalId) {
          Modal.close(modalId);
        }
      }

      // Check click on backdrop
      if (target.classList.contains("modal-overlay")) {
        Modal.closeElement(target);
      }
    });

    // ESC key closes topmost modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModals.length > 0) {
        const topModal = this.activeModals[this.activeModals.length - 1];
        Modal.closeElement(topModal);
      }
    });
  }

  public static open(modalId: string): HTMLElement | null {
    const el = document.getElementById(modalId);
    if (!el) return null;
    return this.openElement(el);
  }

  public static openElement(el: HTMLElement): HTMLElement {
    el.classList.remove("hidden");
    el.style.display = "flex";

    // Add to active stack
    if (!this.activeModals.includes(el)) {
      this.activeModals.push(el);
    }

    // Lock body scroll
    document.body.style.overflow = "hidden";

    // Focus first input
    const firstInput = el.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input:not([type=hidden]), select, textarea, button:not([data-close])"
    );
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50);
    }

    return el;
  }

  public static close(modalId: string): void {
    const el = document.getElementById(modalId);
    if (el) {
      this.closeElement(el);
    }
  }

  public static closeElement(el: HTMLElement): void {
    el.classList.add("hidden");
    el.style.display = "none";

    this.activeModals = this.activeModals.filter((m) => m !== el);

    if (this.activeModals.length === 0) {
      document.body.style.overflow = "";
    }
  }

  public static closeAll(): void {
    while (this.activeModals.length > 0) {
      const top = this.activeModals.pop();
      if (top) {
        top.classList.add("hidden");
        top.style.display = "none";
      }
    }
    document.body.style.overflow = "";
  }
}
