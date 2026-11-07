import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './data/sales.json';
import { builtInTemplates } from './templates.js';
import { readLibrary, saveTemplate, readTheme, THEME_KEY } from './storage.js';
import { readSession, createSession, SESSION_KEY } from './auth.js';
import Catalog from './Catalog.jsx';
import Login from './Login.jsx';
import TemplateDetail from './TemplateDetail.jsx';
import TemplateEditor from './TemplateEditor.jsx';
import Guide from './Guide.jsx';
import { ConfirmLeave, Icon } from './ui.jsx';
import './styles.css';

// Property access itself can throw in restricted browser contexts.
const storage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) };
const sessionStorage = { getItem: key => window.sessionStorage.getItem(key), setItem: (key, value) => window.sessionStorage.setItem(key, value) };
function App() {
  const [session, setSession] = useState(() => readSession(sessionStorage));
  const [theme, setTheme] = useState(() => readTheme(storage, window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [library, setLibrary] = useState(() => readLibrary(storage));
  const [screen, setScreen] = useState({ route: 'catalog', scope: 'all' });
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState('');
  const onDirty = useCallback(value => setDirty(value), []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => {
    if (!dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => { setSession(null); setDirty(false); setPending(null); setScreen({ route: 'catalog', scope: 'all' }); }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'; setTheme(next);
    try { storage.setItem(THEME_KEY, next); } catch { setNotice('Тему змінено на цей сеанс. Браузер не дозволив зберегти налаштування.'); }
  }
  function applyNavigation(next) {
    setDirty(false); setPending(null);
    if (next.route === 'logout') {
      try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* in-memory logout still applies */ }
      setSession(null); setScreen({ route: 'catalog', scope: 'all' }); setNotice('');
    } else { setScreen(next); window.scrollTo(0, 0); }
  }
  function navigate(next) { if (dirty) setPending(next); else applyNavigation(next); }
  function login() { const result = createSession(sessionStorage); setSession(result.session); setLibrary(readLibrary(storage)); setNotice(result.persisted ? '' : 'Вхід діє до оновлення сторінки: сховище сеансу недоступне.'); }
  function save(draft, asNew) { const result = saveTemplate(storage, draft, { asNew }); setLibrary({ templates: result.templates, error: '' }); return result.saved; }
  if (!session) return <Login onLogin={login} theme={theme} onTheme={toggleTheme}/>;
  const templates = [...builtInTemplates, ...library.templates];
  const selected = templates.find(t => t.id === screen.id);
  return <div className="app-shell"><a className="skip-link" href="#main">Перейти до вмісту</a><aside className="sidebar no-print"><button className="brand" onClick={() => navigate({ route: 'catalog', scope: 'all' })}><span>з</span> звітня.</button><p className="nav-label">РОБОЧИЙ ПРОСТІР</p><nav aria-label="Основна навігація"><button aria-current={screen.route === 'catalog' && screen.scope === 'all' ? 'page' : undefined} onClick={() => navigate({ route: 'catalog', scope: 'all' })}><Icon name="grid"/> Усі шаблони</button><button aria-current={screen.route === 'catalog' && screen.scope === 'mine' ? 'page' : undefined} onClick={() => navigate({ route: 'catalog', scope: 'mine' })}><Icon name="file"/> Мої шаблони <span className="nav-count">{library.templates.length}</span></button><button aria-current={screen.route === 'guide' ? 'page' : undefined} onClick={() => navigate({ route: 'guide' })}><Icon name="book"/> Як це працює</button></nav><div className="sidebar-bottom"><div className="sidebar-note"><span className="live-dot"/> Навчальний простір<p>72 тестові записи<br/>3 відділи · жовтень / листопад</p></div><div className="profile"><span className="avatar">ІК</span><div>Іван Клебанський<small>STEM-проєкт · ІПЗ-31</small></div></div><button className="logout" onClick={() => navigate({ route: 'logout' })}><Icon name="logout" size={17}/> Вийти</button></div></aside><main id="main"><header className="topbar no-print"><span>Робочий простір <b>/</b> {screen.route === 'catalog' ? 'Шаблони звітів' : screen.route === 'edit' ? 'Редагування' : screen.route === 'guide' ? 'Довідка' : 'Формування звіту'}</span><div><span className="pill">Демодоступ</span><button className="icon-button" aria-label={theme === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'} onClick={toggleTheme}><Icon name={theme === 'light' ? 'moon' : 'sun'}/></button></div></header><div className="workspace">{notice && <p className="message warning no-print" role="status">{notice}</p>}{library.error && <p className="message warning no-print" role="alert">{library.error}</p>}
    {screen.route === 'guide' ? <Guide/> : screen.route === 'edit' && selected ? <TemplateEditor key={selected.id} template={selected} data={data} onSave={save} onDirty={onDirty} onBack={id => navigate({ route: 'detail', id })}/> : screen.route === 'detail' && selected ? <TemplateDetail key={selected.id} template={selected} data={data} onEdit={() => navigate({ route: 'edit', id: selected.id })} onBack={() => navigate({ route: 'catalog', scope: 'all' })}/> : <Catalog templates={templates} scope={screen.scope || 'all'} onOpen={id => navigate({ route: 'detail', id })} onScope={scope => setScreen({ route: 'catalog', scope })}/>}
    <footer className="workspace-footer no-print"><span>Звітня · Фронтенд підсистеми генерації звітів</span><span>Навчальний проєкт / 2026</span></footer></div></main>{pending && <ConfirmLeave onCancel={() => setPending(null)} onLeave={() => applyNavigation(pending)}/>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);
