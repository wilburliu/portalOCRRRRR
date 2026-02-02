
export interface CaptchaResult {
  code: string;
  confidence: number;
}

export enum HospitalBranch {
  MAIN = 'T0',
  CANCER = 'C0',
  BEIHU = 'T2',
  JINSHAN = 'T3',
  HSINCHU_COMBINED = 'T7',
  HSINCHU_CITY = 'T4',
  YUNLIN = 'Y0'
}

export enum VerificationMode {
  PASSWORD = 'P',
  OTP = 'O',
  FIDO = 'F'
}
