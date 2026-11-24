// Règles du test Testnet des pionniers (logique pure, testée sans base de données).
export const PIONEER_CAP = 5;

export const isValidated = (row) => !!(row && row.login_ok && row.u2a_done && row.a2u_done);
export const stepOf = (row) => (!row ? 0 : 1 * !!row.login_ok + 1 * !!row.u2a_done + 1 * !!row.a2u_done);

// Une étape faite le reste : on ne revient jamais en arrière (idempotent, rejouable sans effet).
export function mergeFlags(row, patch) {
  return {
    login_ok: !!(row?.login_ok || patch.login_ok),
    u2a_done: !!(row?.u2a_done || patch.u2a_done),
    a2u_done: !!(row?.a2u_done || patch.a2u_done),
  };
}

// L'envoi A2U exige : connexion + paiement de test, un seul envoi par compte, et moins de `cap` comptes validés.
export function canPayout({ row, validatedCount, cap = PIONEER_CAP }) {
  if (row?.a2u_done) return { ok: false, status: 409, reason: 'Un envoi de test a déjà été effectué pour ce compte.' };
  if (!row?.login_ok || !row?.u2a_done) return { ok: false, status: 403, reason: 'Effectuez d\'abord une commande de test payée en Pi (étape 2), puis revenez ici.' };
  if (validatedCount >= cap) return { ok: false, status: 403, reason: `Test Testnet terminé : ${cap} pionniers sur ${cap} sont déjà validés.` };
  return { ok: true };
}
