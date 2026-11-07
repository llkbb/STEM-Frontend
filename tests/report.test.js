import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clone, generateReport, validateTemplate, validateParameters, moveColumn, reportCsv, csvCell, visibleColumns } from '../src/report.js';
import { builtInTemplates, filterTemplates } from '../src/templates.js';
import { saveTemplate, readLibrary, LIBRARY_KEY, readTheme } from '../src/storage.js';
import { validateLogin, createSession, readSession, SESSION_KEY, DEMO_EMAIL, DEMO_PASSWORD, SESSION_DURATION } from '../src/auth.js';
const data = JSON.parse(readFileSync(new URL('../src/data/sales.json', import.meta.url), 'utf8'));
const base = () => clone(builtInTemplates[0]);
function memoryStorage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; }

test('вхід відхиляє некоректну адресу, короткий і неправильний пароль', () => {
  assert.ok(validateLogin('wrong', '1').email); assert.ok(validateLogin('wrong', '1').password);
  assert.ok(validateLogin(DEMO_EMAIL, 'incorrect-pass').form);
  assert.deepEqual(validateLogin(` ${DEMO_EMAIL.toUpperCase()} `, DEMO_PASSWORD), {});
});
test('демосеанс має строк дії та не зберігає пароль', () => {
  const storage = memoryStorage(); createSession(storage, 1000);
  assert.equal(readSession(storage, 2000).email, DEMO_EMAIL);
  assert.equal(readSession(storage, 1000 + SESSION_DURATION), null);
  assert.ok(!storage.getItem(SESSION_KEY).includes(DEMO_PASSWORD));
});
test('недоступне sessionStorage дозволяє лише сеанс у пам’яті', () => {
  const storage = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.equal(readSession(storage), null); assert.equal(createSession(storage).persisted, false);
});
test('усі базові шаблони мають коректну схему', () => {
  for (const template of builtInTemplates) assert.deepEqual(validateTemplate(template), {});
});
test('пошук і категорія застосовуються разом без урахування регістру', () => {
  assert.equal(filterTemplates(builtInTemplates, '  ПОРІВНЯННЯ ', 'Аналітика', 'all')[0].id, 'departments');
  assert.equal(filterTemplates(builtInTemplates, 'Порівняння', 'Фінанси', 'all').length, 0);
  assert.equal(filterTemplates(builtInTemplates, '', 'Усі категорії', 'mine').length, 0);
});
test('період перевіряє неможливі дати, порядок меж і відділ', () => {
  assert.ok(validateParameters({ ...base().defaults, from: '2026-02-30' }).from);
  assert.ok(validateParameters({ ...base().defaults, from: '2026-12-01' }).to);
  assert.ok(validateParameters({ ...base().defaults, department: 'Невідомий' }).department);
});
test('одноденний період включає обидві межі та враховує відділ', () => {
  const t = base(); t.defaults = { from: '2026-10-02', to: '2026-10-02', department: 'Київ' };
  const r = generateReport(t, data); assert.deepEqual(r.rows.map(x => x.id), ['S-002', 'S-030']);
  assert.equal(r.quantity, 7); assert.equal(r.totalCents, 739300);
});
test('контрольний звіт має 72 записи і точні підсумки', () => {
  const r = generateReport(base(), data); assert.equal(r.rows.length, 72);
  assert.equal(r.quantity, 213); assert.equal(r.totalCents, 58114700);
  assert.equal(r.grouped.reduce((s,g) => s + g.totalCents, 0), r.totalCents);
});
test('порожня вибірка коректна і має нульові підсумки', () => {
  const t = base(); t.defaults = { ...t.defaults, from: '2020-01-01', to: '2020-12-31' };
  const r = generateReport(t, data); assert.equal(r.totalCents, 0); assert.equal(r.quantity, 0); assert.deepEqual(r.grouped, []);
});
test('суми використовують копійки; джерело та параметри не мутують', () => {
  const t = base(); const rows = [{ ...data[0], quantity: 3, priceCents: 10 }]; const old = JSON.stringify(rows);
  const r = generateReport(t, rows); t.title = 'Нове'; assert.equal(r.totalCents, 30);
  assert.equal(JSON.stringify(rows), old); assert.notEqual(r.template.title, t.title);
});
test('колонки пересуваються без мутації та не виходять за межі', () => {
  const cols = base().columns; const old = clone(cols);
  assert.equal(moveColumn(cols, 'department', -1)[0].key, 'department'); assert.deepEqual(cols, old);
  assert.deepEqual(moveColumn(cols, 'date', -1), cols); assert.deepEqual(moveColumn(cols, 'id', 1), cols);
});
test('не можна зберегти шаблон без колонок або з повторними колонками', () => {
  const t = base(); t.columns.forEach(c => c.visible = false); assert.ok(validateTemplate(t).columns);
  t.columns = [...base().columns.slice(1), base().columns[1]]; assert.ok(validateTemplate(t).columns);
});
test('валідація назви, заголовка, виду і формату', () => {
  const t = { ...base(), name: ' ', title: 'a'.repeat(81), view: 'pie', format: 'exe' };
  assert.deepEqual(Object.keys(validateTemplate(t)).sort(), ['format', 'name', 'title', 'view']);
});
test('CSV відображає лише вибрані колонки у заданому порядку для всіх рядків', () => {
  const t = base(); t.columns = moveColumn(t.columns, 'department', -1); t.columns.forEach(c => c.visible = ['department', 'date'].includes(c.key)); t.view = 'chart';
  const r = generateReport(t, data); const csv = reportCsv(r);
  assert.ok(csv.startsWith('\uFEFF"Відділ";"Дата"')); assert.equal(csv.split('\r\n').length, 73);
  assert.equal(visibleColumns(r.template).length, 2);
});
test('CSV екранує лапки, роздільники та ризикові формули', () => {
  assert.equal(csvCell('a;"b"'), '"a;""b"""');
  for (const s of ['=1+1', '+1', '-1', '@SUM(A1)', '\t=1', '  ＝1']) assert.ok(csvCell(s).startsWith('"\''));
});
test('збереження базового шаблону створює незалежну власну копію', () => {
  const storage = memoryStorage(); const t = base(); const original = JSON.stringify(builtInTemplates);
  t.name = '  Львівський звіт  '; const { saved } = saveTemplate(storage, t, { makeId: () => 'custom-one' });
  assert.equal(saved.id, 'custom-one'); assert.equal(saved.name, 'Львівський звіт'); assert.equal(saved.isCustom, true);
  assert.equal(JSON.stringify(builtInTemplates), original); assert.equal(readLibrary(storage).templates.length, 1);
});
test('власний шаблон оновлюється, а Зберегти як новий створює ще один', () => {
  const storage = memoryStorage(); let saved = saveTemplate(storage, base(), { makeId: () => 'custom-one' }).saved;
  saved.title = 'Змінений заголовок'; saved = saveTemplate(storage, saved).saved;
  assert.equal(readLibrary(storage).templates.length, 1); assert.equal(readLibrary(storage).templates[0].title, saved.title);
  saveTemplate(storage, saved, { asNew: true, makeId: () => 'custom-two' }); assert.equal(readLibrary(storage).templates.length, 2);
});
test('збереження перечитує бібліотеку та не губить копії з іншої вкладки', () => {
  const storage = memoryStorage(); const first = saveTemplate(storage, base(), { makeId: () => 'custom-one' }).saved;
  saveTemplate(storage, base(), { makeId: () => 'custom-two' }); first.name = 'Оновлений'; saveTemplate(storage, first);
  assert.equal(readLibrary(storage).templates.length, 2);
});
test('пошкоджене сховище не перезаписується', () => {
  const storage = memoryStorage(); storage.setItem(LIBRARY_KEY, '{invalid');
  assert.ok(readLibrary(storage).error); assert.throws(() => saveTemplate(storage, base()));
  assert.equal(storage.getItem(LIBRARY_KEY), '{invalid');
});
test('сховище відхиляє дублікати ID та невалідні структури', () => {
  const storage = memoryStorage(); const saved = saveTemplate(storage, base(), { makeId: () => 'custom-one' }).saved;
  storage.setItem(LIBRARY_KEY, JSON.stringify({ version: 2, templates: [saved, saved] })); assert.ok(readLibrary(storage).error);
  storage.setItem(LIBRARY_KEY, JSON.stringify({ version: 2, templates: [{ ...saved, columns: null }] })); assert.ok(readLibrary(storage).error);
});
test('помилка квоти не змінює чернетку і не повертає успішне збереження', () => {
  const draft = base(); const before = clone(draft); const storage = { getItem: () => null, setItem() { throw Error('quota'); } };
  assert.throws(() => saveTemplate(storage, draft, { makeId: () => 'custom-one' }), /не дозволив/); assert.deepEqual(draft, before);
});
test('тема читається зі сховища або з системного значення', () => {
  assert.equal(readTheme(memoryStorage(), true), 'dark'); assert.equal(readTheme({ getItem: () => 'light' }, true), 'light');
  assert.equal(readTheme({ getItem() { throw Error(); } }, false), 'light');
});
