import { Request, Response } from "express";
import { CertificateService } from "../../application/services/CertificateService.js";

export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.certificateService.getAllCertificates();
      res.status(200).json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const cert = await this.certificateService.getCertificateById(String(req.params.id));
      res.status(200).json({ success: true, data: cert });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
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
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
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
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
