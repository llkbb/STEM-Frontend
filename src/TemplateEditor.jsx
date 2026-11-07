import React, { useEffect, useMemo, useState } from 'react';
import { clone, validateTemplate, generateReport, columnLabel, moveColumn } from './report.js';
import { Field, Icon, Parameters } from './ui.jsx';
import ReportPreview from './ReportPreview.jsx';

export default function TemplateEditor({ template, data, onSave, onDirty, onBack }) {
  const [baseline, setBaseline] = useState(() => clone(template));
  const [draft, setDraft] = useState(() => clone(template));
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const [wasSaved, setWasSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const errors = validateTemplate(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  const preview = useMemo(() => Object.keys(validateTemplate(draft)).length ? null : generateReport(draft, data), [draft, data]);
  function update(value) { setDraft(value); setNotice(''); setSaveError(''); setWasSaved(false); }
  function save(asNew) {
    setAttempted(true); setNotice(''); setSaveError('');
    if (Object.keys(errors).length) {
      document.getElementById(`edit-${Object.keys(errors)[0]}`)?.focus();
      return;
    }
    try {
      const saved = onSave(draft, asNew);
      setBaseline(clone(saved)); setDraft(clone(saved)); onDirty(false); setAttempted(false); setWasSaved(true);
      setNotice(draft.isCustom && !asNew ? 'Зміни збережено у вашому шаблоні.' : 'Власну копію збережено. Вона доступна в розділі «Мої шаблони».');
    } catch (e) { setSaveError(e.message); }
  }
  const state = saveError || (attempted && Object.keys(errors).length) ? 'Помилка збереження або валідації' : dirty ? 'Є незбережені зміни' : wasSaved ? 'Збережено' : 'Редагування';
  return <>
    <button className="back-link" onClick={() => onBack(baseline.id)}>← До перегляду шаблону</button>
    <div className="page-heading"><div><p className="eyebrow">КОНСТРУКТОР ШАБЛОНУ</p><h1>Налаштуйте звіт під себе</h1><p>Змініть структуру й одразу перевірте результат на тестових даних.</p></div><span className={`pill ${dirty ? 'amber' : ''}`} role="status">{state}</span></div>
    <div className="editor-layout"><section className="panel editor-form" aria-labelledby="editor-title"><div className="section-title"><h2 id="editor-title">Налаштування шаблону</h2><Icon name="edit"/></div>
      <div className="editor-section"><p className="section-kicker">01 · НАЗВА ТА ЗАГОЛОВОК</p>{['name', 'title'].map(key => <Field key={key} label={key === 'name' ? 'Назва шаблону' : 'Заголовок звіту'} name={`edit-${key}`} error={attempted ? errors[key] : ''}><input id={`edit-${key}`} value={draft[key]} maxLength={80} onChange={e => update({ ...draft, [key]: e.target.value })} aria-invalid={!!(attempted && errors[key])} aria-describedby={attempted && errors[key] ? `edit-${key}-error` : undefined}/></Field>)}</div>
      <div className="editor-section"><p className="section-kicker">02 · КОЛОНКИ ТА ПОРЯДОК</p><p className="small muted">Покажіть потрібне. Стрілки змінюють порядок у таблиці та CSV.</p><div id="edit-columns" tabIndex="-1" className="column-list" aria-label="Порядок колонок">{draft.columns.map((c, index) => <div className={`column-row ${c.visible ? '' : 'unchecked'}`} key={c.key}><label><input type="checkbox" checked={c.visible} onChange={e => update({ ...draft, columns: draft.columns.map(x => x.key === c.key ? { ...x, visible: e.target.checked } : x) })}/><span>{columnLabel(c.key)}</span></label><div><button className="icon-button" aria-label={`Підняти ${columnLabel(c.key)}`} disabled={index === 0} onClick={() => update({ ...draft, columns: moveColumn(draft.columns, c.key, -1) })}>↑</button><button className="icon-button" aria-label={`Опустити ${columnLabel(c.key)}`} disabled={index === draft.columns.length - 1} onClick={() => update({ ...draft, columns: moveColumn(draft.columns, c.key, 1) })}>↓</button></div></div>)}</div>{errors.columns && <p className="field-error" role="alert">{errors.columns}</p>}</div>
      <div className="editor-section"><p className="section-kicker">03 · ФІЛЬТРИ ЗА ЗАМОВЧУВАННЯМ</p><Parameters prefix="edit" value={draft.defaults} onChange={defaults => update({ ...draft, defaults })} errors={attempted ? errors : {}}/></div>
      <div className="editor-section"><p className="section-kicker">04 · ПОДАННЯ ТА ЕКСПОРТ</p><div className="two-fields"><Field label="Тип відображення" name="edit-view"><select id="edit-view" value={draft.view} onChange={e => update({ ...draft, view: e.target.value })}><option value="table">Таблиця</option><option value="chart">Графік за відділами</option></select></Field><Field label="Формат експорту" name="edit-format"><select id="edit-format" value={draft.format} onChange={e => update({ ...draft, format: e.target.value })}><option value="csv">CSV</option><option value="pdf">PDF через друк</option></select></Field></div><p className="small muted">Графік завжди показує суму продажів за відділами. Обрані колонки визначають таблицю та CSV.</p></div>
    </section><section className="panel live-panel" aria-labelledby="live-heading"><div className="section-title"><h2 id="live-heading">Живий попередній перегляд</h2><span className="live-badge"><span/> Наживо</span></div>{preview ? <ReportPreview report={preview} live/> : <div className="empty-state compact" role="status"><h3>Уточніть налаштування</h3><p>{Object.values(errors).join(' ')}</p></div>}<p className="preview-footnote">Перегляд оновлюється автоматично. Зміни зберігаються лише після натискання «Зберегти».</p></section></div>
    <div className="save-bar"><div><strong>{baseline.isCustom ? 'Ваш шаблон' : 'Базовий шаблон'}</strong><p>{baseline.isCustom ? 'Зберегти — оновити копію; зберегти як новий — створити ще одну.' : 'Збереження створить вашу копію. Оригінал залишиться доступним.'}</p></div><div className="button-row"><button className="text-button" onClick={() => { setDraft(clone(baseline)); setAttempted(false); setSaveError(''); setNotice('Початкові налаштування відновлено.'); setWasSaved(false); onDirty(false); }}>Скинути</button><button className="secondary" onClick={() => save(true)}>Зберегти як новий</button><button className="primary" onClick={() => save(false)}>Зберегти</button></div></div>
    <div className="announcements" aria-live="polite">{notice}</div>{saveError && <p className="message error" role="alert">{saveError}</p>}{attempted && Object.keys(errors).length > 0 && <p className="message error" role="alert">Виправте помилки у формі. Шаблон не збережено.</p>}
  </>;
}
