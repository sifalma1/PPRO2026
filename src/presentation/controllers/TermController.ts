import { Request, Response } from "express";
import { TermService } from "../../application/services/TermService.js";

export class TermController {
  constructor(private readonly termService: TermService) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const terms = await this.termService.getAllTerms();
      res.status(200).json({ success: true, count: terms.length, data: terms });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const term = await this.termService.getTermById(String(req.params.id));
      res.status(200).json({ success: true, data: term });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body;
      const termId = await this.termService.createTerm({
        courseId: String(body.courseId || body.kurzId),
        classroomId: body.classroomId || body.ucebnaId ? String(body.classroomId || body.ucebnaId) : undefined,
        startDate: String(body.startDate || body.datumOd),
        endDate: String(body.endDate || body.datumDo),
        capacity: parseInt(body.capacity || body.kapacita, 10),
        lecturerIds: Array.isArray(body.lecturerIds || body.lektorIds) ? (body.lecturerIds || body.lektorIds) : undefined
      });
      res.status(201).json({ success: true, message: "Course term created successfully.", data: { id: termId } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.termService.getEnrollmentsForTerm(String(req.params.id));
      res.status(200).json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.id);
      const b = req.body;
      const created = await this.termService.createEnrollment(termId, {
        firstName: b.firstName || b.jmeno,
        lastName: b.lastName || b.prijmeni,
        email: b.email,
        phone: b.phone || b.telefon,
        organization: b.organization || b.organizace,
        note: b.note || b.poznamka
      });
      const msg = created.status === "WAITLIST"
        ? `Course capacity is full. Student was placed on the waiting list as candidate #${created.waitlistPosition}.`
        : "Student enrollment confirmed successfully.";
      res.status(201).json({ success: true, message: msg, data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public cancelEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const enrollmentId = String(req.params.enrollmentId || req.params.id || req.params.prihlaskaId);
      const result = await this.termService.cancelEnrollment(enrollmentId);
      res.status(200).json({
        success: true,
        message: result.promotedStudentId
          ? "Enrollment was cancelled. Spot was automatically assigned to the first waitlisted candidate (ADR-02)!"
          : "Enrollment was cancelled successfully.",
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getLecturers = async (req: Request, res: Response): Promise<void> => {
    try {
      const lecturers = await this.termService.getLecturers();
      res.status(200).json({ success: true, data: lecturers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getClassrooms = async (req: Request, res: Response): Promise<void> => {
    try {
      const classrooms = await this.termService.getClassrooms();
      res.status(200).json({ success: true, data: classrooms });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const students = await this.termService.getStudents();
      res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await this.termService.getAnalytics();
      res.status(200).json({ success: true, data: analytics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
