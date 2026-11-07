import React, { useEffect, useRef } from 'react';
import { ALL_DEPARTMENTS, departments } from './report.js';
export function Icon({ name, size = 20 }) {
  const paths = { grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2', search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', file: 'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h8', sun: 'M12 3V1 M12 23v-2 M3 12H1 M23 12h-2 M4 4l2 2 M18 18l2 2 M20 4l-2 2 M6 18l-2 2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0', moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11', edit: 'M4 16l-1 5 5-1L21 7l-6-6z M12 4l6 6', arrow: 'M4 12h16 M14 6l6 6-6 6', logout: 'M9 3H3v18h6 M8 12h13 M16 7l5 5-5 5', book: 'M12 5v17 M3 3l9 2 9-2v16l-9 2-9-2z', download: 'M12 2v13 M7 10l5 5 5-5 M3 16v5h18v-5', plus: 'M12 4v16 M4 12h16' };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.file}/></svg>;
}
export function Field({ label, name, error, children }) {
  return <div className="field"><label htmlFor={name}>{label}</label>{children}{error && <p id={`${name}-error`} className="field-error">{error}</p>}</div>;
}
export function Parameters({ value, onChange, errors = {}, prefix = 'param' }) {
  const props = key => ({ id: `${prefix}-${key}`, value: value[key], onChange: e => onChange({ ...value, [key]: e.target.value }), 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `${prefix}-${key}-error` : undefined });
  return <div className="parameter-grid"><Field label="Початок періоду" name={`${prefix}-from`} error={errors.from}><input type="date" {...props('from')}/></Field><Field label="Кінець періоду" name={`${prefix}-to`} error={errors.to}><input type="date" {...props('to')}/></Field><Field label="Відділ" name={`${prefix}-department`} error={errors.department}><select {...props('department')}>{[ALL_DEPARTMENTS, ...departments].map(d => <option key={d}>{d}</option>)}</select></Field></div>;
}
export function ConfirmLeave({ onCancel, onLeave }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} aria-labelledby="leave-title" onCancel={e => { e.preventDefault(); onCancel(); }}><h2 id="leave-title">Є незбережені зміни</h2><p>Поверніться до редагування, щоб зберегти їх, або залиште сторінку без збереження.</p><div className="button-row"><button className="secondary" onClick={onCancel} autoFocus>Продовжити редагування</button><button className="primary" onClick={onLeave}>Вийти без збереження</button></div></dialog>;
}
