import { Request, Response } from "express";
import { AuthService } from "../../application/services/AuthService.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body || {};
      const result = await this.authService.login(username, password);
      res.status(200).json({
        success: true,
        message: `Uživatel ${result.user.name} byl úspěšně přihlášen.`,
        token: result.token,
        user: result.user,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || "Neplatné přihlašovací jméno nebo heslo.",
      });
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (token) {
        this.authService.logout(token);
      }
      res.status(200).json({
        success: true,
        message: "Odhlášení proběhlo úspěšně.",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);
      const user = this.authService.validateToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          authenticated: false,
          error: "Neautorizovaný přístup. Chybějící nebo neplatný token.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        authenticated: true,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);
      const user = this.authService.validateToken(token);

      res.status(200).json({
        success: true,
        authenticated: Boolean(user),
        user: user || null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  public getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = this.extractToken(req);
      const user = this.authService.validateToken(token);

      if (!user) {
        res.status(401).json({
          success: false,
          error: "Pro zobrazení klientského portálu se musíte přihlásit.",
        });
        return;
      }

      let studentId = user.studentId || user.id;
      let email = user.email;

      // Allow admin to preview a student portal via ?studentId=...
      if (user.role === "admin" && req.query.studentId) {
        studentId = String(req.query.studentId);
        email = undefined;
      }

      const dashboardData = await this.authService.getStudentDashboard(studentId, email);
      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
    const adminToken = req.headers["x-admin-token"] || req.headers["x-auth-token"];
    if (adminToken && typeof adminToken === "string") {
      return adminToken.trim();
    }
    if (req.body && req.body.token) {
      return String(req.body.token).trim();
    }
    if (req.query && req.query.token) {
      return String(req.query.token).trim();
    }
    return null;
  }
}
