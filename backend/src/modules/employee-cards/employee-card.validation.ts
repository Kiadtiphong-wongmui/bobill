import type { EmployeeCardInput } from "./employee-card.types.js";

const isRequiredString = (value: unknown, fieldName: string): string => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
  const str = String(value).trim();
  if (str.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return str;
};

const isOptionalString = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return String(value).trim();
};

const isValidDate = (value: unknown, fieldName: string): string => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
  const dateStr = String(value).trim();
  const timestamp = Date.parse(dateStr);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${fieldName} must be a valid date string`);
  }
  return dateStr;
};

export const parseEmployeeCardInput = (body: unknown): EmployeeCardInput => {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object");
  }

  const raw = body as Record<string, unknown>;

  return {
    cardHeader: isRequiredString(raw.cardHeader, "cardHeader"),
    photoUrl: isOptionalString(raw.photoUrl),
    name: isRequiredString(raw.name, "name"),
    nationality: isRequiredString(raw.nationality, "nationality"),
    workPermitNo: isRequiredString(raw.workPermitNo, "workPermitNo"),
    instructions: isRequiredString(raw.instructions, "instructions"),
    employerName: isRequiredString(raw.employerName, "employerName"),
    address: isRequiredString(raw.address, "address"),
    issueDate: isValidDate(raw.issueDate, "issueDate"),
    expiryDate: isValidDate(raw.expiryDate, "expiryDate"),
    signerName: isRequiredString(raw.signerName, "signerName"),
    signerPosition: isRequiredString(raw.signerPosition, "signerPosition"),
    telephone: isRequiredString(raw.telephone, "telephone"),
  };
};

export const parseEmployeeCardQuery = (query: Record<string, unknown>) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 10);
  const q = query.q ? String(query.q).trim() : undefined;

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10,
    q,
  };
};
