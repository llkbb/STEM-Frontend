import { columnDefinitions, defaultParameters, clone } from './report.js';
function template(id, name, title, category, description, visible, format = 'csv', view = 'table', department = 'Усі відділи') {
  return { id, name, title, category, description, format, view, defaults: { ...defaultParameters, department }, columns: columnDefinitions.map(c => ({ key: c.key, visible: visible.includes(c.key) })), isCustom: false, baseId: id };
}
export const builtInTemplates = [
  template('sales', 'Продажі за період', 'Звіт про продажі', 'Продажі', 'Кожна операція, потрібні колонки та підсумки за обраний період.', ['date', 'department', 'product', 'quantity', 'amountCents']),
  template('departments', 'Порівняння відділів', 'Обсяг продажів за відділами', 'Аналітика', 'Порівняйте результати Києва, Львова й Одеси на одному графіку.', ['department', 'date', 'amountCents'], 'pdf', 'chart'),
  template('finance', 'Фінансова деталізація', 'Вартість проданих товарів', 'Фінанси', 'Ціни, кількість і суми операцій для перевірки та експорту.', ['id', 'date', 'department', 'product', 'quantity', 'priceCents', 'amountCents']),
  template('kyiv', 'Продажі київського відділу', 'Продажі відділу Київ', 'Продажі', 'Готовий шаблон із фільтром відділу та друкованим поданням.', ['date', 'product', 'category', 'quantity', 'amountCents'], 'pdf', 'table', 'Київ'),
];
export const templateCategories = ['Продажі', 'Аналітика', 'Фінанси'];
export function templateDraft(value) { return clone(value); }
export function filterTemplates(templates, query, category, scope) {
  const needle = query.trim().toLocaleLowerCase('uk-UA');
  return templates.filter(t => (!needle || `${t.name} ${t.title} ${t.description}`.toLocaleLowerCase('uk-UA').includes(needle)) && (category === 'Усі категорії' || t.category === category) && (scope !== 'mine' || t.isCustom));
}
