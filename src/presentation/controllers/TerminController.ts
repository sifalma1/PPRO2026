import { Request, Response } from "express";
import { TerminService } from "../../application/services/TerminService.js";

export class TerminController {
  constructor(private readonly terminService: TerminService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const terminy = await this.terminService.getAllTerminy();
      res.status(200).json({ success: true, count: terminy.length, data: terminy });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const termin = await this.terminService.getTerminById(String(req.params.id));
      res.status(200).json({ success: true, data: termin });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const terminId = await this.terminService.createTermin({
        kurzId: String(body.kurzId),
        ucebnaId: body.ucebnaId ? String(body.ucebnaId) : undefined,
        datumOd: String(body.datumOd),
        datumDo: String(body.datumDo),
        kapacita: parseInt(body.kapacita, 10),
        lektorIds: Array.isArray(body.lektorIds) ? body.lektorIds : undefined
      });
      res.status(201).json({ success: true, message: "Termín kurzu byl vytvořen.", data: { id: terminId } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getPrihlasky = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.terminService.getPrihlaskyForTermin(String(req.params.id));
      res.status(200).json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createPrihlaska = async (req: Request, res: Response): Promise<void> => {
    try {
      const terminId = String(req.params.id);
      const studentData = req.body;
      const created = await this.terminService.createPrihlaska(terminId, studentData);
      const msg = created.stav === "PORADNIK"
        ? `Kapacita termínu je plná. Student byl zařazen do pořadníku jako náhradník č. ${created.poradiVPoradniku}.`
        : "Přihláška studenta byla úspěšně potvrzena.";
      res.status(201).json({ success: true, message: msg, data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public cancelPrihlaska = async (req: Request, res: Response): Promise<void> => {
    try {
      const prihlaskaId = String(req.params.prihlaskaId);
      const result = await this.terminService.cancelPrihlaska(prihlaskaId);
      res.status(200).json({
        success: true,
        message: result.posunutyStudentId
          ? "Přihláška byla zrušena. Místo bylo automaticky nabídnuto prvnímu náhradníkovi z pořadníku!"
          : "Přihláška byla úspěšně zrušena.",
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getLektori = async (req: Request, res: Response): Promise<void> => {
    try {
      const lektori = await this.terminService.getLektori();
      res.status(200).json({ success: true, data: lektori });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getUcebny = async (req: Request, res: Response): Promise<void> => {
    try {
      const ucebny = await this.terminService.getUcebny();
      res.status(200).json({ success: true, data: ucebny });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getStudenti = async (req: Request, res: Response): Promise<void> => {
    try {
      const studenti = await this.terminService.getStudenti();
      res.status(200).json({ success: true, data: studenti });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await this.terminService.getAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
