export const DEMO_EMAIL = 'demo@zvitnia.test';
export const DEMO_PASSWORD = 'Demo2026!';
export const SESSION_KEY = 'zvitnia.demo-session.v2';
export const SESSION_DURATION = 8 * 60 * 60 * 1000;
export function validateLogin(email, password) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Введіть коректну електронну адресу.';
  if (password.length < 8) errors.password = 'Пароль має містити щонайменше 8 символів.';
  if (!Object.keys(errors).length && (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD)) errors.form = 'Невірна адреса або пароль. Скористайтеся демодоступом нижче.';
  return errors;
}
export function readSession(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY));
    return value?.email === DEMO_EMAIL && Number.isFinite(value.expiresAt) && value.expiresAt > now && value.expiresAt <= now + SESSION_DURATION ? value : null;
  } catch { return null; }
}
export function createSession(storage, now = Date.now()) {
  const session = { email: DEMO_EMAIL, expiresAt: now + SESSION_DURATION };
  let persisted = true;
  try { storage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { persisted = false; }
  return { session, persisted };
}
