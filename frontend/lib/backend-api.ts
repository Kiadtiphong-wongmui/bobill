const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3001";

export const buildBackendUrl = (path: string): string => {
  return `${BACKEND_API_URL}${path}`;
};
