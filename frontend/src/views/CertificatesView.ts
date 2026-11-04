/**
 * Certificates & Graduates View
 * Manages certificate registry with format AT-YYYY-XXXX, term closure, and lecturer waiver workflow (ADR-01)
 */
import { Certificate, CourseTerm } from "../types";
import { certificatesApi } from "../api/certificatesApi";
import { termsApi } from "../api/termsApi";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";

export class CertificatesView {
  private certificates: Certificate[] = [];
  private terms: CourseTerm[] = [];

  private certificatesTableBody: HTMLElement | null = null;
  private completeTermSelect: HTMLSelectElement | null = null;
  private btnCompleteTerm: HTMLElement | null = null;
  private btnOpenIssueWaiver: HTMLElement | null = null;

  private formWaiver: HTMLFormElement | null = null;
  private formWaiverError: HTMLElement | null = null;
  private waiverEnrollmentSelect: HTMLSelectElement | null = null;

  public init(): void {
    this.certificatesTableBody = document.getElementById("certificates-table-body");
    this.completeTermSelect = document.getElementById("complete-term-select") as HTMLSelectElement;
    this.btnCompleteTerm = document.getElementById("btn-complete-term");
    this.btnOpenIssueWaiver = document.getElementById("btn-open-issue-waiver");

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
  }

  public async load(): Promise<void> {
    try {
      const [certificates, terms] = await Promise.all([
        certificatesApi.getAll(),
        termsApi.getAll(),
      ]);

      this.certificates = certificates;
      this.terms = terms;

      this.renderCertificates();
      this.renderTermSelect();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se načíst osvědčení o absolvování.");
    }
  }

  private renderTermSelect(): void {
    if (!this.completeTermSelect) return;
    this.completeTermSelect.innerHTML =
      `<option value="">-- Zvolte termín kurzu k uzavření --</option>` +
      this.terms
        .map(
          (t) =>
            `<option value="${t.id}">${t.courseTitle} (${t.startDate} až ${t.endDate}) [${t.status}]</option>`
        )
        .join("");
  }

  private renderCertificates(): void {
    if (!this.certificatesTableBody) return;
    this.certificatesTableBody.innerHTML = "";

    if (this.certificates.length === 0) {
      this.certificatesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-10 text-slate-400">
            Zatím nebyla vystavena žádná osvědčení. Uzavřete termín nebo udělte výjimku lektora.
          </td>
        </tr>
      `;
      return;
    }

    this.certificates.forEach((c) => {
      const waiverHtml = c.hasWaiver
        ? `<span class="badge-chip badge-chip-yellow font-medium cursor-help" title="Důvod výjimky: ${c.waiverReason || "Uděleno lektorem"}">
            Výjimka lektora (ADR-01)
           </span>`
        : `<span class="badge-chip badge-chip-green font-medium">Standardní (≥ 70 %)</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <span class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            ${c.certificateNumber}
          </span>
        </td>
        <td>
          <strong class="text-slate-900 dark:text-white">${c.studentName}</strong>
          <div class="text-xs text-slate-400">${c.studentEmail}</div>
        </td>
        <td class="text-xs font-medium">${c.courseTitle}</td>
        <td class="text-xs text-slate-500">${c.issueDate}</td>
        <td>
          <span class="font-bold text-xs ${c.attendanceRate >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}">
            ${c.attendanceRate} %
          </span>
        </td>
        <td>${waiverHtml}</td>
      `;

      this.certificatesTableBody?.appendChild(tr);
    });
  }

  private async handleCompleteTerm(): Promise<void> {
    const termId = this.completeTermSelect?.value;
    if (!termId) {
      Toast.warning("Nejprve vyberte termín ze seznamu vedle tlačítka.");
      return;
    }

    const term = this.terms.find((t) => t.id === termId);
    const confirmed = window.confirm(
      `Opravdu chcete uzavřít termín "${term?.courseTitle || ""}"? Systém automaticky vystaví osvědčení všem studentům, kteří dosáhli alespoň 70% docházky (ADR-01).`
    );
    if (!confirmed) return;

    try {
      const res = await certificatesApi.completeTerm(termId);
      Toast.success(res.message);
      await this.load();
    } catch (err: any) {
      Toast.error(err.message || "Nepodařilo se uzavřít termín kurzu.");
    }
  }

  private async openWaiverModal(): Promise<void> {
    if (this.formWaiver) this.formWaiver.reset();
    if (this.formWaiverError) this.formWaiverError.style.display = "none";

    if (!this.waiverEnrollmentSelect) return;
    this.waiverEnrollmentSelect.innerHTML = `<option value="">Načítám způsobilé přihlášky studentů...</option>`;
    Modal.open("modal-waiver");

    try {
      let options = "";
      for (const term of this.terms) {
        const enrollments = await termsApi.getEnrollments(term.id);
        for (const enr of enrollments) {
          if (enr.status === "CONFIRMED" || enr.status === "COMPLETED") {
            // Check if certificate is not already issued
            const alreadyHasCert = this.certificates.some((c) => c.enrollmentId === enr.id);
            if (!alreadyHasCert) {
              options += `<option value="${enr.id}">${enr.studentName} – ${term.courseTitle} (${enr.studentEmail})</option>`;
            }
          }
        }
      }

      this.waiverEnrollmentSelect.innerHTML =
        options || `<option value="">Žádní studenti bez dosud vystaveného osvědčení</option>`;
    } catch (err: any) {
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
        `Osvědčení č. ${cert.certificateNumber} bylo úspěšně vystaveno na základě výjimky!`
      );
      Modal.close("modal-waiver");
      await this.load();
    } catch (err: any) {
      if (this.formWaiverError) {
        this.formWaiverError.textContent =
          err.message || "Chyba při vystavování osvědčení s výjimkou.";
        this.formWaiverError.style.display = "block";
      }
    }
  }
}
