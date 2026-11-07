import { clone, validateTemplate } from './report.js';
import { builtInTemplates, templateCategories } from './templates.js';
export const LIBRARY_KEY = 'zvitnia.templates.v2';
export const THEME_KEY = 'zvitnia.theme.v2';
function validStoredTemplate(t) {
  return t && t.isCustom === true && typeof t.id === 'string' && /^custom-[a-zA-Z0-9-]+$/.test(t.id) && builtInTemplates.some(b => b.id === t.baseId) && templateCategories.includes(t.category) && typeof t.description === 'string' && t.description.length <= 500 && !Object.keys(validateTemplate(t)).length;
}
export function readLibrary(storage) {
  try {
    const raw = storage.getItem(LIBRARY_KEY);
    if (!raw) return { templates: [], error: '' };
    const data = JSON.parse(raw);
    if (data.version !== 2 || !Array.isArray(data.templates) || data.templates.length > 100 || data.templates.some(t => !validStoredTemplate(t)) || new Set(data.templates.map(t => t.id)).size !== data.templates.length) throw new Error('schema');
    return { templates: data.templates.map(clone), error: '' };
  } catch {
    return { templates: [], error: 'Не вдалося прочитати збережені шаблони. Базові шаблони доступні, але збереження вимкнено, щоб не перезаписати дані.' };
  }
}
export function saveTemplate(storage, draft, { asNew = false, makeId = () => `custom-${crypto.randomUUID()}` } = {}) {
  if (Object.keys(validateTemplate(draft)).length) throw new Error('Виправте помилки у формі перед збереженням.');
  const library = readLibrary(storage);
  if (library.error) throw new Error(library.error);
  const isNew = asNew || !draft.isCustom;
  if (isNew && library.templates.length >= 100) throw new Error('Досягнуто ліміту: 100 власних шаблонів.');
  if (!isNew && !library.templates.some(t => t.id === draft.id)) throw new Error('Цей шаблон більше не знайдено у сховищі. Збережіть як новий.');
  const saved = { ...clone(draft), id: isNew ? makeId() : draft.id, name: draft.name.trim(), title: draft.title.trim(), isCustom: true, updatedAt: new Date().toISOString() };
  if (!validStoredTemplate(saved) || (isNew && library.templates.some(t => t.id === saved.id))) throw new Error('Не вдалося створити унікальний шаблон. Повторіть спробу.');
  const templates = isNew ? [...library.templates, saved] : library.templates.map(t => t.id === saved.id ? saved : t);
  try { storage.setItem(LIBRARY_KEY, JSON.stringify({ version: 2, templates })); }
  catch { throw new Error('Браузер не дозволив зберегти шаблон. Перевірте доступне місце та налаштування сховища. Зміни залишилися у формі.'); }
  return { saved, templates };
}
export function readTheme(storage, prefersDark = false) {
  try { const value = storage.getItem(THEME_KEY); if (['light', 'dark'].includes(value)) return value; } catch { /* use preference */ }
  return prefersDark ? 'dark' : 'light';
}
