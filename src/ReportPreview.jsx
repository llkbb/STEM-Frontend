import React, { useState } from 'react';
import { visibleColumns, columnLabel, displayCell, money, dateLabel } from './report.js';

export default function ReportPreview({ report, live = false }) {
  const [page, setPage] = useState(1);
  const columns = visibleColumns(report.template);
  const pages = Math.max(1, Math.ceil(report.rows.length / 8));
  const current = Math.min(page, pages);
  const maximum = Math.max(1, ...report.grouped.map(g => g.totalCents));
  return <div className="report-content">
    <div className="report-title"><p className="eyebrow">{live ? 'ТЕСТОВІ ДАНІ · ЖИВИЙ ПЕРЕГЛЯД' : 'СФОРМОВАНИЙ ЗВІТ'}</p><h2>{report.template.title}</h2><p>{dateLabel(report.template.defaults.from)} — {dateLabel(report.template.defaults.to)} <span>·</span> {report.template.defaults.department}</p></div>
    <dl className="metrics"><div><dt>Сума продажів</dt><dd>{money(report.totalCents)}</dd></div><div><dt>Операцій</dt><dd>{report.rows.length}</dd></div><div><dt>Одиниць товару</dt><dd>{report.quantity}</dd></div></dl>
    {report.rows.length === 0 ? <div className="empty-state compact"><h3>За цими параметрами даних немає</h3><p>Змініть період або відділ. Тестові записи охоплюють жовтень і листопад 2026 року.</p></div> : report.template.view === 'chart' ? <figure className="report-chart"><figcaption>Сума продажів за відділами</figcaption><p className="muted small">Кожна смуга — сума операцій обраного відділу за період.</p><ul>{report.grouped.map(g => <li key={g.name}><div><span>{g.name}</span><strong>{money(g.totalCents)}</strong></div><div className="chart-track" aria-hidden="true"><div style={{ width: `${g.totalCents / maximum * 100}%` }}/></div></li>)}</ul><p className="chart-note">CSV містить детальні записи й обрані колонки. PDF містить цей графік та підсумки.</p></figure> : <>
      <div className="table-wrap" tabIndex="0" role="region" aria-label="Дані звіту, таблицю можна прокручувати"><table><caption className="sr-only">{report.template.title}</caption><thead><tr>{columns.map(c => <th key={c.key} scope="col">{columnLabel(c.key)}</th>)}</tr></thead><tbody>{report.rows.map((r, i) => <tr key={r.id} className={i < (current - 1) * 8 || i >= current * 8 ? 'print-only-row' : ''}>{columns.map(c => <td key={c.key} className={['amountCents', 'priceCents', 'quantity'].includes(c.key) ? 'numeric' : ''}>{displayCell(r, c.key)}</td>)}</tr>)}</tbody></table></div>
      <div className="pagination no-print"><span>{(current - 1) * 8 + 1}–{Math.min(current * 8, report.rows.length)} з {report.rows.length} записів</span><div><button className="icon-button" aria-label="Попередня сторінка" disabled={current === 1} onClick={() => setPage(current - 1)}>←</button><span>{current} / {pages}</span><button className="icon-button" aria-label="Наступна сторінка" disabled={current === pages} onClick={() => setPage(current + 1)}>→</button></div></div>
    </>}
  </div>;
}
