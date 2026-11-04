import { PostgresCertificateRepository } from "../../infrastructure/database/PostgresCertificateRepository.js";
import { CertificateResponseDto, IssueCertificateDto } from "../dto/CertificateDto.js";

export class CertificateService {
  constructor(private readonly repo: PostgresCertificateRepository) {}

  public async getAllCertificates(): Promise<CertificateResponseDto[]> {
    return await this.repo.findAll();
  }

  public async getCertificateById(id: string): Promise<CertificateResponseDto> {
    const cert = await this.repo.findById(id);
    if (!cert) throw new Error("Certificate was not found.");
    return cert;
  }

  public async issueCertificate(dto: IssueCertificateDto): Promise<CertificateResponseDto> {
    if (!dto.enrollmentId) throw new Error("Enrollment ID is required.");
    return await this.repo.issueCertificate(dto);
  }

  public async completeTerm(termId: string): Promise<{ issuedCount: number; certificates: CertificateResponseDto[] }> {
    if (!termId) throw new Error("Term ID is required.");
    return await this.repo.completeTerm(termId);
  }
}
