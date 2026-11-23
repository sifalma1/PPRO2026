/**
 * Toast Notification System
 * High polish micro-interactions with Dark/Light styling and automatic dismissal
 */

export type ToastType = "success" | "error" | "warning" | "info";

export class Toast {
  private static container: HTMLElement | null = null;

  private static ensureContainer(): HTMLElement {
    if (!this.container) {
      let el = document.getElementById("toast-container");
      if (!el) {
        el = document.createElement("div");
        el.id = "toast-container";
        el.className = "toast-stack";
        document.body.appendChild(el);
      }
      this.container = el;
    }
    return this.container;
  }

  public static show(
    message: string,
    type: ToastType = "success",
    title?: string,
    duration = 4500
  ): void {
    const container = this.ensureContainer();

    const toast = document.createElement("div");

    const typeConfigs: Record<
      ToastType,
      {
        bg: string;
        border: string;
        text: string;
        iconColor: string;
        defaultTitle: string;
        iconSvg: string;
      }
    > = {
      success: {
        bg: "bg-[#fdfaf2] dark:bg-[#161220]",
        border: "border-emerald-500/50 dark:border-emerald-500/50 shadow-lg shadow-black/40",
        text: "text-[#4a3512] dark:text-[#faeed4] font-display",
        iconColor:
          "text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60",
        defaultTitle: "Úspěšně provedeno",
        iconSvg: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      },
      error: {
        bg: "bg-[#fdfaf2] dark:bg-[#161220]",
        border: "border-rose-500/50 dark:border-rose-500/50 shadow-lg shadow-black/40",
        text: "text-[#4a3512] dark:text-[#faeed4] font-display",
        iconColor:
          "text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/60",
        defaultTitle: "Došlo k chybě",
        iconSvg: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
      },
      warning: {
        bg: "bg-[#fdfaf2] dark:bg-[#161220]",
        border: "border-amber-500/50 dark:border-amber-500/50 shadow-lg shadow-black/40",
        text: "text-[#4a3512] dark:text-[#faeed4] font-display",
        iconColor:
          "text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800/60",
        defaultTitle: "Upozornění",
        iconSvg: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      },
      info: {
        bg: "bg-[#fdfaf2] dark:bg-[#161220]",
        border: "border-[#caa049]/60 shadow-lg shadow-black/40",
        text: "text-[#4a3512] dark:text-[#faeed4] font-display",
        iconColor:
          "text-[#7c5e2d] dark:text-[#f8df95] bg-[#f5ebd6] dark:bg-[#251e30] border border-[#caa049]",
        defaultTitle: "Systémová informace",
        iconSvg: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
      },
    };

    const cfg = typeConfigs[type];
    const headerTitle = title || cfg.defaultTitle;

    toast.className = `p-3 rounded-lg border flex items-start gap-2.5 animate-fadeIn transition-all duration-200 min-w-[280px] max-w-sm ${cfg.bg} ${cfg.border}`;
    toast.setAttribute("role", "alert");

    toast.innerHTML = `
      <div class="p-1.5 rounded-lg shrink-0 ${cfg.iconColor}">
        ${cfg.iconSvg}
      </div>
      <div class="flex-1 min-w-0 pr-2">
        <div class="text-xs font-bold leading-tight ${cfg.text}">${headerTitle}</div>
        <div class="text-xs text-[#7c5e2d] dark:text-[#c4a974] mt-0.5 leading-relaxed break-words">${message}</div>
      </div>
      <button class="toast-close-btn p-1 text-[#8c6d3b] hover:text-[#5a4115] dark:text-[#c4a974] dark:hover:text-[#fce8bd] rounded transition-colors shrink-0">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    const closeBtn = toast.querySelector(".toast-close-btn");
    closeBtn?.addEventListener("click", () => dismiss());

    const dismiss = () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(24px) scale(0.95)";
      setTimeout(() => toast.remove(), 250);
    };

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  public static success(msg: string, title?: string): void {
    this.show(msg, "success", title);
  }

  public static error(msg: string, title?: string): void {
    this.show(msg, "error", title);
  }

  public static warning(msg: string, title?: string): void {
    this.show(msg, "warning", title);
  }

  public static info(msg: string, title?: string): void {
    this.show(msg, "info", title);
  }
}
