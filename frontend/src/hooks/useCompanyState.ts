import { useEffect, useState } from 'react';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  'http://localhost:7000';

export function useCompanyState(): string {
  const [stateCode, setStateCode] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';

    fetch(`${BASE_URL}/api/v1/company/get`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (r.status === 404) {
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data) {
          setStateCode('');
          return;
        }

        // Handle every possible shape your backend might return
        const company =
          data?.data ?? // { success: true, data: { state_code } }
          data?.company ?? // { company: { state_code } }
          data; // { state_code } directly

        const code =
          company?.state_code ?? // snake_case (what your backend uses)
          company?.stateCode ?? // camelCase fallback
          '';
        setStateCode(String(code).trim());
      })
      .catch((err) => {
        console.error('❌ useCompanyState failed:', err);
        setStateCode('');
      });
  }, []);

  return stateCode;
}
