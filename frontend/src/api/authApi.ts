/**
 * Auth API Client and Session State Manager
 * Handles login, logout, token persistence, and role detection
 */
import { request, requestRaw } from "./apiClient";
import { AuthUser, StudentDashboardData } from "../types";

export interface LoginResult {
  token: string;
  user: AuthUser;
}

interface LoginRawResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

interface MeRawResponse {
  success: boolean;
  authenticated?: boolean;
  user?: AuthUser;
  error?: string;
}

const TOKEN_KEY = "akademie_admin_token";
const USER_KEY = "akademie_auth_user";

class AuthApi {
  private currentUser: AuthUser | null = null;
  private currentToken: string | null = null;

  constructor() {
    this.restoreSession();
  }

  public restoreSession(): void {
    this.currentToken = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
      } catch {
        this.currentUser = null;
      }
    }
  }

  public async login(username: string, password: string): Promise<LoginResult> {
    const res = (await requestRaw("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })) as LoginRawResponse;

    const token = res.token;
    const user = res.user;

    if (!token || !user) {
      throw new Error(res.error || "Server nevrátil platný autentizační token.");
    }

    this.currentToken = token;
    this.currentUser = user;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Dispatch global custom event
    document.dispatchEvent(new CustomEvent("akademie:auth-changed", { detail: { user, token } }));

    return { token, user };
  }

  public async logout(): Promise<void> {
    try {
      if (this.currentToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.currentToken}`,
          },
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.currentToken = null;
      this.currentUser = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      document.dispatchEvent(
        new CustomEvent("akademie:auth-changed", { detail: { user: null, token: null } })
      );
    }
  }

  public async fetchCurrentStatus(): Promise<AuthUser | null> {
    if (!this.currentToken) {
      this.currentUser = null;
      return null;
    }

    try {
      const res = (await requestRaw("/api/auth/me", {
        headers: { Authorization: `Bearer ${this.currentToken}` },
      })) as MeRawResponse;

      if (res.success && res.user) {
        this.currentUser = res.user;
        localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
        return this.currentUser;
      }
    } catch {
      // Invalid/expired token
      this.logout();
    }
    return null;
  }

  public async getStudentDashboard(): Promise<StudentDashboardData> {
    return await request<StudentDashboardData>("/api/student/dashboard");
  }

  public getUser(): AuthUser | null {
    return this.currentUser;
  }

  public getToken(): string | null {
    return this.currentToken;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentToken && this.currentUser);
  }

  public isAdmin(): boolean {
    return this.currentUser?.role === "admin";
  }

  public isStudent(): boolean {
    return this.currentUser?.role === "student";
  }
}

export const authApi = new AuthApi();
