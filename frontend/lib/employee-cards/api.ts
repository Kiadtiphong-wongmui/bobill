import type { EmployeeCard, EmployeeCardInput, EmployeeCardsResponse } from "./types";

export async function listEmployeeCards(params: {
  page: number;
  pageSize: number;
  q?: string;
}): Promise<EmployeeCardsResponse> {
  const query = new URLSearchParams();
  query.set("page", params.page.toString());
  query.set("pageSize", params.pageSize.toString());
  if (params.q) {
    query.set("q", params.q);
  }

  const response = await fetch(`/api/employee-cards?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch employee cards");
  }

  return response.json();
}

export async function getEmployeeCard(id: number): Promise<EmployeeCard> {
  const response = await fetch(`/api/employee-cards/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch employee card");
  }

  return response.json();
}

export async function createEmployeeCard(data: EmployeeCardInput): Promise<EmployeeCard> {
  const response = await fetch("/api/employee-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create employee card");
  }

  return response.json();
}

export async function updateEmployeeCard(id: number, data: EmployeeCardInput): Promise<EmployeeCard> {
  const response = await fetch(`/api/employee-cards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update employee card");
  }

  return response.json();
}

export async function deleteEmployeeCard(id: number): Promise<void> {
  const response = await fetch(`/api/employee-cards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete employee card");
  }
}

export function getDisplayPhotoUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("/uploads/")) {
    const filename = url.replace("/uploads/", "");
    return `/api/uploads/files/${filename}`;
  }
  return url;
}
