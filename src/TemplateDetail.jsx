import React, { useEffect, useRef, useState } from 'react';
import { clone, generateReport, validateParameters, reportCsv } from './report.js';
import ReportPreview from './ReportPreview.jsx';
import { Icon, Parameters } from './ui.jsx';

export default function TemplateDetail({ template, data, onEdit, onBack }) {
  const [params, setParams] = useState(() => clone(template.defaults));
  const [stage, setStage] = useState('idle');
  const [report, setReport] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const timer = useRef(null);
  const locked = useRef(false);
  const heading = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const stale = report && JSON.stringify(params) !== JSON.stringify(report.template.defaults);
  function submit(e) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true; setStage('loading'); setErrors({}); setNotice('');
    const snapshot = { ...clone(template), defaults: clone(params) };
    timer.current = setTimeout(() => {
      const nextErrors = validateParameters(snapshot.defaults);
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors); setStage('error'); setNotice('Виправте параметри й повторіть формування.');
        requestAnimationFrame(() => document.getElementById(`param-${Object.keys(nextErrors)[0]}`)?.focus());
      } else {
        try { setReport(generateReport(snapshot, data)); setStage('success'); setNotice('Звіт сформовано.'); requestAnimationFrame(() => heading.current?.focus()); }
        catch { setStage('error'); setNotice('Не вдалося сформувати звіт. Повторіть спробу.'); }
      }
      locked.current = false;
    }, 450);
  }
  function exportReport() {
    if (!report || stale || stage !== 'success' || !report.rows.length) return;
    if (template.format === 'pdf') { window.print(); return; }
    try {
      const url = URL.createObjectURL(new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `report-${params.from}-${params.to}.csv`;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('CSV-файл передано браузеру для завантаження.');
    } catch { setNotice('Не вдалося завантажити файл. Спробуйте ще раз.'); }
  }
  const labels = { idle: 'Сформувати звіт', loading: 'Формування…', success: 'Звіт сформовано', error: 'Спробувати ще раз' };
  return <>
    <button className="back-link no-print" onClick={onBack}>← До шаблонів</button>
    <div className="page-heading no-print"><div><p className="eyebrow">{template.isCustom ? 'МІЙ ШАБЛОН' : 'БАЗОВИЙ ШАБЛОН'} · {template.category.toUpperCase()}</p><h1>{template.name}</h1><p>{template.description}</p></div><button className="secondary" onClick={onEdit}><Icon name="edit"/> Редагувати</button></div>
    <div className="workflow no-print"><span className="done">1 Вибір шаблону</span><span className="active">2 Параметри</span><span className={report ? 'active' : ''}>3 Перегляд та експорт</span></div>
    <section className="panel parameters-panel no-print" aria-labelledby="parameters-heading"><div className="section-title"><h2 id="parameters-heading">Параметри звіту</h2><span className="pill">{template.format.toUpperCase()} · {template.view === 'table' ? 'Таблиця' : 'Графік'}</span></div><form onSubmit={submit} noValidate><fieldset disabled={stage === 'loading'}><legend className="sr-only">Параметри формування</legend><Parameters value={params} onChange={value => { setParams(value); setErrors({}); setNotice(''); setStage('idle'); }} errors={errors}/><div className="form-bottom"><p className="muted small">Навчальні дані · жовтень — листопад 2026</p><button className={`primary generate-button state-${stage}`} data-state={stage} type="submit" disabled={stage === 'loading'}><Icon name="chart"/>{labels[stage]}</button></div></fieldset></form></section>
    <section className="panel preview-panel" aria-labelledby="preview-title" aria-busy={stage === 'loading'}><div className="section-title no-print"><h2 id="preview-title" tabIndex="-1" ref={heading}>Попередній перегляд</h2><button className="primary" disabled={!report?.rows.length || stale || stage !== 'success'} onClick={exportReport}><Icon name="download"/> Експорт {template.format.toUpperCase()}</button></div><div className="announcements no-print" aria-live="polite">{stage === 'loading' ? 'Формуємо звіт…' : notice}</div>{stale && <p className="message warning no-print">Параметри змінено. Сформуйте звіт повторно перед експортом.</p>}
      {report ? <ReportPreview key={JSON.stringify(report.template)} report={report}/> : <div className="empty-state"><div className="empty-icon"><Icon name="file" size={42}/></div><h3>Звіт починається з параметрів</h3><p>Уточніть період і відділ, потім натисніть «Сформувати звіт».</p><span className="small muted">Тут з’являться ваші дані та підсумки</span></div>}
      {template.format === 'pdf' && <p className="print-hint no-print">Експорт PDF відкриває діалог друку. Оберіть «Зберегти як PDF».</p>}
    </section>
  </>;
}
