export interface EmployeeCardInput {
  cardHeader: string;
  photoUrl?: string | null;
  name: string;
  nationality: string;
  workPermitNo: string;
  instructions: string;
  employerName: string;
  address: string;
  issueDate: string | Date;
  expiryDate: string | Date;
  signerName: string;
  signerPosition: string;
  telephone: string;
}
