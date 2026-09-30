import { Request, Response } from "express";
import { KurzService } from "../../application/services/KurzService.js";
import { CreateKurzDto, UpdateKurzDto } from "../../application/dto/KurzDto.js";

/**
 * REST API kontroler pro správu kurzů
 */
export class KurzController {
  constructor(private readonly kurzService: KurzService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { akreditovany, search } = req.query;
      const filter: { jeAkreditovany?: boolean; query?: string } = {};

      if (akreditovany !== undefined) {
        filter.jeAkreditovany = akreditovany === "true";
      }

      if (typeof search === "string" && search.trim().length > 0) {
        filter.query = search.trim();
      }

      const kurzy = await this.kurzService.getAllKurzy(filter);
      res.status(200).json({
        success: true,
        count: kurzy.length,
        data: kurzy
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const kurz = await this.kurzService.getKurzById(id);
      res.status(200).json({ success: true, data: kurz });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateKurzDto;

      if (!body.nazev || !body.anotace || body.rozsahHodin === undefined || body.cena === undefined) {
        res.status(400).json({
          success: false,
          error: "Všechna pole (nazev, anotace, rozsahHodin, cena) jsou povinná."
        });
        return;
      }

      const created = await this.kurzService.createKurz({
        nazev: String(body.nazev),
        anotace: String(body.anotace),
        rozsahHodin: Number(body.rozsahHodin),
        cena: Number(body.cena),
        jeAkreditovany: Boolean(body.jeAkreditovany)
      });

      res.status(201).json({
        success: true,
        message: "Kurz byl úspěšně vytvořen.",
        data: created
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const body = req.body as UpdateKurzDto;

      const updated = await this.kurzService.updateKurz(id, {
        nazev: body.nazev !== undefined ? String(body.nazev) : undefined,
        anotace: body.anotace !== undefined ? String(body.anotace) : undefined,
        rozsahHodin: body.rozsahHodin !== undefined ? Number(body.rozsahHodin) : undefined,
        cena: body.cena !== undefined ? Number(body.cena) : undefined,
        jeAkreditovany: body.jeAkreditovany !== undefined ? Boolean(body.jeAkreditovany) : undefined
      });

      res.status(200).json({
        success: true,
        message: "Kurz byl úspěšně aktualizován.",
        data: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.kurzService.deleteKurz(id);
      res.status(200).json({
        success: true,
        message: "Kurz byl úspěšně smazán."
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
