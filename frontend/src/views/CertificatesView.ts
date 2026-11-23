/**
 * Certificates & Graduates View - Akademie Trutnov
 * Official registry of issued certificates (AT-YYYY-XXXX), term closure (ADR-01),
 * lecturer waiver workflow, and representative certificate preview/print dialog.
 */
import { Certificate, CourseTerm } from "../types";
import { certificatesApi } from "../api/certificatesApi";
import { termsApi } from "../api/termsApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { authApi } from "../api/authApi";

export class CertificatesView {
  private certificates: Certificate[] = [];
  private terms: CourseTerm[] = [];

  private certificatesTableBody: HTMLElement | null = null;
  private completeTermSelect: HTMLSelectElement | null = null;
  private btnCompleteTerm: HTMLElement | null = null;
  private btnOpenIssueWaiver: HTMLElement | null = null;
  private kpiCertsCount: HTMLElement | null = null;

  private formWaiver: HTMLFormElement | null = null;
  private formWaiverError: HTMLElement | null = null;
  private waiverEnrollmentSelect: HTMLSelectElement | null = null;

  public init(): void {
    this.certificatesTableBody = document.getElementById("certificates-table-body");
    this.completeTermSelect = document.getElementById("complete-term-select") as HTMLSelectElement;
    this.btnCompleteTerm = document.getElementById("btn-complete-term");
    this.btnOpenIssueWaiver = document.getElementById("btn-open-issue-waiver");
    this.kpiCertsCount = document.getElementById("kpi-certs-count");

    this.formWaiver = document.getElementById("form-waiver") as HTMLFormElement;
    this.formWaiverError = document.getElementById("form-waiver-error");
    this.waiverEnrollmentSelect = document.getElementById(
      "waiver-enrollment-select"
    ) as HTMLSelectElement;

    this.bindEvents();
    this.load();
  }

  private bindEvents(): void {
    // Complete term button
    this.btnCompleteTerm?.addEventListener("click", async () => {
      await this.handleCompleteTerm();
    });

    // Open waiver modal
    this.btnOpenIssueWaiver?.addEventListener("click", async () => {
      await this.openWaiverModal();
    });

    // Form submit: waiver
    this.formWaiver?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleWaiverSubmit();
    });

    // Print certificate button inside modal
    const btnPrintCert = document.getElementById("btn-print-certificate");
    btnPrintCert?.addEventListener("click", () => {
      window.print();
    });

    // Listen for custom event from other views
    document.addEventListener("akademie:preview-certificate", ((
      e: CustomEvent<{ certificate: Certificate }>
    ) => {
      if (e.detail?.certificate) {
        this.openCertificatePreview(e.detail.certificate);
      }
    }) as EventListener);

    // Listen for auth changes
    document.addEventListener("akademie:auth-changed", () => {
      this.renderAuthControls();
    });
  }

  public renderAuthControls(): void {
    const isAdmin = authApi.isAdmin();
    if (this.btnCompleteTerm) this.btnCompleteTerm.style.display = isAdmin ? "inline-flex" : "none";
    if (this.btnOpenIssueWaiver)
      this.btnOpenIssueWaiver.style.display = isAdmin ? "inline-flex" : "none";
  }

  public async load(): Promise<void> {
    this.renderAuthControls();
    try {
      const [certificates, terms] = await Promise.all([
        certificatesApi.getAll(),
        termsApi.getAll(),
      ]);

      this.certificates = certificates;
      this.terms = terms;

      if (this.kpiCertsCount) {
        this.kpiCertsCount.textContent = this.certificates.length.toString();
      }

      this.renderCertificates();
      this.renderTermSelect();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Nepodařilo se načíst osvědčení o absolvování.";
      Toast.error(msg);
    }
  }

  public getCertificates(): Certificate[] {
    return this.certificates;
  }

  private renderTermSelect(): void {
    if (!this.completeTermSelect) return;
    this.completeTermSelect.innerHTML =
      `<option value="">-- Zvolte termín kurzu k uzavření --</option>` +
      this.terms
        .map(
          (t) =>
            `<option value="${t.id}">${t.courseTitle} (${t.startDate} až ${t.endDate}) [${t.status === "COMPLETED" ? "Už uzavřen" : "Aktivní"}]</option>`
        )
        .join("");
  }

  private renderCertificates(): void {
    if (!this.certificatesTableBody) return;
    this.certificatesTableBody.innerHTML = "";

    if (this.certificates.length === 0) {
      this.certificatesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-10 text-amber-800/60 dark:text-amber-200/50 italic">
            Zatím nebyla vystavena žádná osvědčení. Uzavřete termín kurzu nebo udělte lektorskou výjimku.
          </td>
        </tr>
      `;
      return;
    }

    this.certificates.forEach((c) => {
      const waiverHtml = c.hasWaiver
        ? `<span class="badge-chip badge-chip-yellow cursor-help" title="Důvod výjimky lektora: ${c.waiverReason || "Schváleno lektorem"}">
            Výjimka lektora
           </span>`
        : `<span class="badge-chip badge-chip-green">Standardní (≥ 70 %)</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <span class="font-mono font-bold text-xs text-amber-900 dark:text-amber-200 bg-[#fbf5e6] dark:bg-[#1a1424] px-2.5 py-0.5 rounded border border-[#caa049]">
            ${c.certificateNumber}
          </span>
        </td>
        <td>
          <div class="font-bold font-display text-[#4a3512] dark:text-[#faeed4]">${c.studentName}</div>
          <div class="font-mono text-xs text-[#7c5e2d] dark:text-[#c4a974]">${c.studentEmail}</div>
        </td>
        <td class="text-xs font-medium font-display text-[#4a3512] dark:text-[#eeddbb]">${c.courseTitle}</td>
        <td class="font-mono text-xs text-[#7c5e2d] dark:text-[#c4a974] tabular-nums">${c.issueDate}</td>
        <td>
          <span class="font-mono font-bold text-xs tabular-nums ${c.attendanceRate >= 70 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}">
            ${c.attendanceRate} %
          </span>
        </td>
        <td>${waiverHtml}</td>
        <td class="text-right">
          <button
            class="btn-secondary-tw btn-sm-tw btn-view-certificate"
            data-id="${c.id}"
            title="Otevřít reprezentativní náhled osvědčení pro tisk"
          >
            Náhled diplomu
          </button>
        </td>
      `;

      const viewBtn = tr.querySelector(".btn-view-certificate");
      viewBtn?.addEventListener("click", () => this.openCertificatePreview(c));

      this.certificatesTableBody?.appendChild(tr);
    });
  }

  public openCertificatePreview(cert: Certificate): void {
    const numEl = document.getElementById("cert-view-number");
    const studentEl = document.getElementById("cert-view-student");
    const emailEl = document.getElementById("cert-view-email");
    const courseEl = document.getElementById("cert-view-course");
    const attEl = document.getElementById("cert-view-attendance");
    const dateEl = document.getElementById("cert-view-issue-date");
    const footerDateEl = document.getElementById("cert-view-footer-date");
    const waiverStatusEl = document.getElementById("cert-view-waiver-status");

    if (numEl) numEl.textContent = cert.certificateNumber;
    if (studentEl) studentEl.textContent = cert.studentName;
    if (emailEl) emailEl.textContent = cert.studentEmail;
    if (courseEl) courseEl.textContent = cert.courseTitle;
    if (attEl) attEl.textContent = `${cert.attendanceRate} % docházky`;
    if (dateEl) dateEl.textContent = cert.issueDate;
    if (footerDateEl) footerDateEl.textContent = cert.issueDate;

    if (waiverStatusEl) {
      if (cert.hasWaiver) {
        waiverStatusEl.textContent = `Výjimka lektora (${cert.waiverReason || "Uděleno"})`;
        waiverStatusEl.className = "font-semibold text-amber-700 dark:text-amber-400 ml-1";
      } else {
        waiverStatusEl.textContent = "Standardní absolvování (splněno ≥ 70 % docházky)";
        waiverStatusEl.className = "font-semibold text-emerald-700 dark:text-emerald-400 ml-1";
      }
    }

    Modal.open("modal-certificate-preview");
  }

  private async handleCompleteTerm(): Promise<void> {
    if (!authApi.isAdmin()) {
      Toast.info("Pro uzavření termínu se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    const termId = this.completeTermSelect?.value;
    if (!termId) {
      Toast.warning("Nejprve vyberte termín ze seznamu vedle tlačítka.");
      return;
    }

    const term = this.terms.find((t) => t.id === termId);
    const confirmed = window.confirm(
      `Opravdu chcete uzavřít termín "${term?.courseTitle || ""}"?\n\nSystém automaticky vyhodnotí prezenční listiny a vystaví osvědčení všem studentům, kteří dosáhli alespoň 70% docházky.`
    );
    if (!confirmed) return;

    try {
      const res = await certificatesApi.completeTerm(termId);
      Toast.success(res.message);
      await this.load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Nepodařilo se uzavřít termín kurzu.";
      Toast.error(msg);
    }
  }

  public async openWaiverModal(): Promise<void> {
    if (!authApi.isAdmin()) {
      Toast.info("Pro udělení výjimky se přihlaste jako administrátor.");
      Modal.open("modal-login");
      return;
    }

    if (this.formWaiver) this.formWaiver.reset();
    if (this.formWaiverError) this.formWaiverError.style.display = "none";

    if (!this.waiverEnrollmentSelect) return;
    this.waiverEnrollmentSelect.innerHTML = `<option value="">Načítám přihlášky studentů...</option>`;
    Modal.open("modal-waiver");

    try {
      let options = "";
      for (const term of this.terms) {
        const enrollments = await termsApi.getEnrollments(term.id);
        for (const enr of enrollments) {
          if (enr.status === "CONFIRMED" || enr.status === "COMPLETED") {
            const alreadyHasCert = this.certificates.some((c) => c.enrollmentId === enr.id);
            if (!alreadyHasCert) {
              options += `<option value="${enr.id}">${enr.studentName} – ${term.courseTitle} (${enr.studentEmail})</option>`;
            }
          }
        }
      }

      this.waiverEnrollmentSelect.innerHTML =
        options || `<option value="">Žádní studenti bez dosud vystaveného osvědčení</option>`;
    } catch {
      Toast.error("Chyba při načítání přihlášek pro udělení výjimky.");
    }
  }

  private async handleWaiverSubmit(): Promise<void> {
    if (!this.formWaiver || !this.waiverEnrollmentSelect) return;
    if (this.formWaiverError) this.formWaiverError.style.display = "none";

    const enrollmentId = this.waiverEnrollmentSelect.value;
    const waiverReason = (
      document.getElementById("waiver-reason") as HTMLTextAreaElement
    ).value.trim();

    if (!enrollmentId) {
      if (this.formWaiverError) {
        this.formWaiverError.textContent = "Vyberte prosím studenta ze seznamu.";
        this.formWaiverError.style.display = "block";
      }
      return;
    }

    if (waiverReason.length < 5) {
      if (this.formWaiverError) {
        this.formWaiverError.textContent =
          "Uveďte prosím podrobnější písemné odůvodnění výjimky (min. 5 znaků).";
        this.formWaiverError.style.display = "block";
      }
      return;
    }

    try {
      const cert = await certificatesApi.issueWithWaiver(enrollmentId, waiverReason);
      Toast.success(
        `Osvědčení č. ${cert.certificateNumber} bylo úspěšně vystaveno na základě výjimky lektora!`
      );
      Modal.close("modal-waiver");
      await this.load();

      // Show preview right after issuing
      this.openCertificatePreview(cert);
    } catch (err: unknown) {
      if (this.formWaiverError) {
        const msg =
          err instanceof Error ? err.message : "Chyba při vystavování osvědčení s výjimkou.";
        this.formWaiverError.textContent = msg;
        this.formWaiverError.style.display = "block";
      }
    }
  }
}
