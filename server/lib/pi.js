// Appels à l'API officielle Pi Network. Aucune clé ni aucun jeton n'est journalisé.
const BASE = 'https://api.minepi.com/v2';

export class PiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

async function piRequest(path, { method = 'GET', auth, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* réponse non JSON */ }
  if (!res.ok) {
    const code = data.error || data.error_message || 'unknown';
    console.error(`payments: API Pi ${method} ${path} ${res.status} ${code}`);
    throw new PiError(res.status, code, `Pi API ${res.status}`);
  }
  return data;
}

export const piMe = (accessToken) => piRequest('/me', { auth: `Bearer ${accessToken}` });

export function makePiPayments(apiKey) {
  const auth = `Key ${apiKey}`;
  return {
    get: (id) => piRequest(`/payments/${encodeURIComponent(id)}`, { auth }),
    approve: (id) => piRequest(`/payments/${encodeURIComponent(id)}/approve`, { method: 'POST', auth }),
    complete: (id, txid) => piRequest(`/payments/${encodeURIComponent(id)}/complete`, { method: 'POST', auth, body: { txid } }),
    cancel: (id) => piRequest(`/payments/${encodeURIComponent(id)}/cancel`, { method: 'POST', auth }),
  };
}
