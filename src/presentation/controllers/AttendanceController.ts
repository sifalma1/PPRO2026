import { Request, Response } from "express";
import { AttendanceService } from "../../application/services/AttendanceService.js";

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  public getTeachingDays = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId);
      const days = await this.attendanceService.getTeachingDays(termId);
      res.status(200).json({ success: true, count: days.length, data: days });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createTeachingDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId);
      const body = req.body;
      const dayId = await this.attendanceService.createTeachingDay({
        termId,
        lecturerId: body.lecturerId ? String(body.lecturerId) : undefined,
        dayDate: String(body.dayDate || body.datum),
        hours: parseInt(body.hours || body.pocetHodin, 10),
        topic: String(body.topic || body.tema)
      });
      res.status(201).json({ success: true, message: "Teaching day created successfully.", data: { id: dayId } });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getAttendanceForDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayId = String(req.params.dayId);
      const records = await this.attendanceService.getAttendanceForDay(dayId);
      res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public markAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayId = String(req.params.dayId);
      const { studentId, isPresent, note } = req.body;
      await this.attendanceService.markAttendance({
        teachingDayId: dayId,
        studentId: String(studentId),
        isPresent: Boolean(isPresent),
        note: note ? String(note) : undefined
      });
      res.status(200).json({ success: true, message: "Attendance recorded successfully." });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId);
      const summary = await this.attendanceService.getAttendanceSummary(termId);
      res.status(200).json({ success: true, count: summary.length, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
