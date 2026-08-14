export interface EmployeeCard {
  id: number;
  cardHeader: string;
  photoUrl: string | null;
  name: string;
  nationality: string;
  workPermitNo: string;
  instructions: string;
  employerName: string;
  address: string;
  issueDate: string;
  expiryDate: string;
  signerName: string;
  signerPosition: string;
  telephone: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCardInput {
  cardHeader: string;
  photoUrl?: string | null;
  name: string;
  nationality: string;
  workPermitNo: string;
  instructions: string;
  employerName: string;
  address: string;
  issueDate: string;
  expiryDate: string;
  signerName: string;
  signerPosition: string;
  telephone: string;
}

export interface EmployeeCardsResponse {
  items: EmployeeCard[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
