export const departments = ['Київ', 'Львів', 'Одеса'];
export const ALL_DEPARTMENTS = 'Усі відділи';
export const columnDefinitions = [
  { key: 'date', label: 'Дата' }, { key: 'department', label: 'Відділ' },
  { key: 'product', label: 'Товар' }, { key: 'category', label: 'Категорія' },
  { key: 'quantity', label: 'Кількість' }, { key: 'priceCents', label: 'Ціна, грн' },
  { key: 'amountCents', label: 'Сума, грн' }, { key: 'id', label: 'ID' },
];
export const defaultParameters = { from: '2026-10-01', to: '2026-11-30', department: ALL_DEPARTMENTS };
export const clone = value => JSON.parse(JSON.stringify(value));
export const money = cents => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(cents / 100);
export const dateLabel = date => date.split('-').reverse().join('.');
export const columnLabel = key => columnDefinitions.find(c => c.key === key)?.label || key;
export const visibleColumns = template => template.columns.filter(c => c.visible);
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateParameters(value) {
  const errors = {};
  if (!validDate(value?.from)) errors.from = 'Вкажіть коректну початкову дату.';
  if (!validDate(value?.to)) errors.to = 'Вкажіть коректну кінцеву дату.';
  if (!errors.from && !errors.to && value.from > value.to) errors.to = 'Кінець періоду має бути не раніше початку.';
  if (![ALL_DEPARTMENTS, ...departments].includes(value?.department)) errors.department = 'Оберіть відділ зі списку.';
  return errors;
}
export function validateTemplate(t) {
  const errors = validateParameters(t?.defaults);
  for (const [key, label] of [['name', 'Назва шаблону'], ['title', 'Заголовок звіту']]) {
    if (typeof t?.[key] !== 'string' || !t[key].trim() || t[key].trim().length > 80) errors[key] = `${label}: від 1 до 80 символів.`;
  }
  if (!['csv', 'pdf'].includes(t?.format)) errors.format = 'Оберіть CSV або PDF.';
  if (!['table', 'chart'].includes(t?.view)) errors.view = 'Оберіть таблицю або графік.';
  const keys = columnDefinitions.map(c => c.key);
  if (!Array.isArray(t?.columns) || t.columns.length !== keys.length || new Set(t.columns.map(c => c?.key)).size !== keys.length || t.columns.some(c => !keys.includes(c?.key) || typeof c.visible !== 'boolean')) {
    errors.columns = 'Структуру колонок пошкоджено.';
  } else if (!t.columns.some(c => c.visible)) errors.columns = 'Оберіть принаймні одну колонку.';
  return errors;
}
export function moveColumn(columns, key, direction) {
  const result = clone(columns); const index = result.findIndex(c => c.key === key); const target = index + direction;
  if (index >= 0 && target >= 0 && target < result.length && [-1, 1].includes(direction)) [result[index], result[target]] = [result[target], result[index]];
  return result;
}
export function generateReport(template, data) {
  if (Object.keys(validateTemplate(template)).length) throw new Error('Перевірте параметри та налаштування шаблону.');
  const { from, to, department } = template.defaults;
  const rows = data.filter(r => r.date >= from && r.date <= to && (department === ALL_DEPARTMENTS || r.department === department))
    .map(r => ({ ...r, amountCents: r.quantity * r.priceCents }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const totalCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
  const grouped = departments.map(name => ({ name, totalCents: rows.filter(r => r.department === name).reduce((sum, r) => sum + r.amountCents, 0) })).filter(r => rows.some(x => x.department === r.name));
  return { template: clone(template), rows, totalCents, quantity: rows.reduce((sum, r) => sum + r.quantity, 0), grouped };
}
export function displayCell(row, key) {
  if (key === 'date') return dateLabel(row[key]);
  if (['priceCents', 'amountCents'].includes(key)) return money(row[key]);
  return String(row[key] ?? '');
}
export function csvCell(value) {
  let text = String(value);
  if (/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function reportCsv(report) {
  const columns = visibleColumns(report.template);
  const rows = report.rows.map(r => columns.map(c => ['priceCents', 'amountCents'].includes(c.key) ? (r[c.key] / 100).toFixed(2) : r[c.key]));
  return '\uFEFF' + [columns.map(c => columnLabel(c.key)), ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
