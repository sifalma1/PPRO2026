import { Request, Response } from "express";
import { AttendanceService } from "../../application/services/AttendanceService.js";

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  public getTeachingDays = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId || req.params.id);
      const days = await this.attendanceService.getTeachingDays(termId);
      res.status(200).json({ success: true, count: days.length, data: days });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public createTeachingDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId || req.params.id);
      const body = req.body;
      const lecturerId = body.lecturerId || body.lektorId;
      const dayDate = body.dayDate || body.datum;
      const hoursVal = body.hours !== undefined ? body.hours : body.pocetHodin;
      const topic = body.topic || body.tema;

      const dayId = await this.attendanceService.createTeachingDay({
        termId,
        lecturerId: lecturerId ? String(lecturerId) : undefined,
        dayDate: dayDate ? String(dayDate) : "",
        hours: hoursVal !== undefined ? parseInt(hoursVal, 10) : NaN,
        topic: topic ? String(topic) : "",
      });
      res.status(201).json({
        success: true,
        message: "Teaching day created successfully.",
        data: { id: dayId },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getAttendanceForDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayId = String(req.params.dayId || req.params.id);
      const records = await this.attendanceService.getAttendanceForDay(dayId);
      res.status(200).json({ success: true, count: records.length, data: records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public markAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayId = String(req.params.dayId || req.params.id);
      const { studentId, isPresent, note } = req.body;
      await this.attendanceService.markAttendance({
        teachingDayId: dayId,
        studentId: studentId ? String(studentId) : "",
        isPresent: Boolean(isPresent),
        note: note ? String(note) : undefined,
      });
      res.status(200).json({ success: true, message: "Attendance recorded successfully." });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  public getAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const termId = String(req.params.termId || req.params.id);
      const summary = await this.attendanceService.getAttendanceSummary(termId);
      res.status(200).json({ success: true, count: summary.length, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
