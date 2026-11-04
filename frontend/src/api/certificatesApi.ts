import { request, requestRaw } from "./apiClient";
import { Certificate } from "../types";

export interface IssueWaiverPayload {
  enrollmentId: string;
  hasWaiver: boolean;
  waiverReason: string;
}

export const certificatesApi = {
  async getAll(): Promise<Certificate[]> {
    return request<Certificate[]>("/api/certificates");
  },

  async getById(id: string): Promise<Certificate> {
    return request<Certificate>(`/api/certificates/${id}`);
  },

  async completeTerm(termId: string): Promise<{ message: string; issuedCount: number }> {
    const raw = await requestRaw<{ issuedCertificatesCount?: number }>(
      `/api/terms/${termId}/complete`,
      {
        method: "POST",
      }
    );
    return {
      message: raw.message || "Termín byl uzavřen.",
      issuedCount: raw.data?.issuedCertificatesCount ?? 0,
    };
  },

  async issueWithWaiver(enrollmentId: string, waiverReason: string): Promise<Certificate> {
    const payload: IssueWaiverPayload = {
      enrollmentId,
      hasWaiver: true,
      waiverReason,
    };
    return request<Certificate>("/api/certificates/issue", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
