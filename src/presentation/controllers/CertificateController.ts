import { Request, Response } from "express";
import { CertificateService } from "../../application/services/CertificateService.js";

export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.certificateService.getAllCertificates();
      res.status(200).json({ success: true, count: list.length, data: list });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const cert = await this.certificateService.getCertificateById(String(req.params.id));

      if (req.user && req.user.role === "student") {
        const studentMatches =
          (req.user.studentId && req.user.studentId === cert.studentId) ||
          (req.user.email &&
            cert.studentEmail &&
            req.user.email.toLowerCase() === cert.studentEmail.toLowerCase());

        if (!studentMatches) {
          res.status(403).json({
            success: false,
            error: "Nedostatečná oprávnění. Student může zobrazit pouze své vlastní osvědčení.",
          });
          return;
        }
      }

      res.status(200).json({ success: true, data: cert });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(404).json({ success: false, error });
    }
  };

  public issue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { enrollmentId, prihlaskaId, hasWaiver, waiverReason } = req.body;
      const targetId = enrollmentId || prihlaskaId;
      const cert = await this.certificateService.issueCertificate({
        enrollmentId: targetId ? String(targetId) : "",
        hasWaiver: Boolean(hasWaiver),
        waiverReason: waiverReason ? String(waiverReason) : undefined,
      });
      res
        .status(201)
        .json({ success: true, message: "Certificate issued successfully.", data: cert });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error });
    }
  };

  public completeTerm = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId || req.params.id);
      const result = await this.certificateService.completeTerm(termId);
      res.status(200).json({
        success: true,
        message: `Course term completed. Issued ${result.issuedCount} certificate(s) for qualifying students.`,
        data: result,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error });
    }
  };
}
