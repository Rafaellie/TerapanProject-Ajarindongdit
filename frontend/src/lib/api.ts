const API_URL = "http://localhost:5000/api";

function getAuthHeaders(isFormData: boolean = false) {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: getAuthHeaders(isFormData),
    body: isFormData ? body : JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const isFormData = body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(isFormData),
    // PENTING: Jangan stringify jika body adalah FormData
    body: isFormData ? body : JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, { 
    method: "DELETE",
    headers: getAuthHeaders() 
  });
  return res.json();
}