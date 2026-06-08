const API = 'https://asvapi.digiindiasolutions.com/api/v1';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');

  return data;
}
