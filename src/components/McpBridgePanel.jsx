import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStoryStore } from '../store';
import { connectEditorBridge } from '../services/editorBridge';

export default function McpBridgePanel() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState('');
  const [activeToken, setActiveToken] = useState('');
  const [status, setStatus] = useState('Отключено');

  useEffect(() => {
    if (!activeToken) return;
    return connectEditorBridge(useStoryStore, activeToken, setStatus);
  }, [activeToken]);

  const modalContent = open ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3100,
        background: 'rgba(2, 6, 23, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 76
      }}
      onClick={() => setOpen(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Подключение MCP"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, calc(100vw - 32px))',
          padding: 22,
          borderRadius: 16,
          background: 'var(--panel-bg, #1e293b)',
          color: 'var(--text-color, #f8fafc)',
          border: '1px solid var(--node-border, #334155)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          whiteSpace: 'normal',
          lineHeight: 1.5
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Story Architect MCP</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: 'transparent',
              border: '1px solid var(--node-border, #334155)',
              color: 'var(--text-color, #f8fafc)',
              borderRadius: 8,
              width: 28,
              height: 28,
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', opacity: 0.9 }}>
          Запустите MCP в Claude/Cline. Введите токен из файла{' '}
          <code style={{ padding: '2px 6px', borderRadius: 6, background: 'var(--bg-color, #0f172a)' }}>
            ~/.story-architect/bridge-token
          </code>
          .
        </p>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', opacity: 0.75 }}>
          Подключение разрешает ИИ читать и изменять текущий проект. Изменения доступны через Undo; для записи на диск нажмите «Сохранить».
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setActiveToken(token.trim());
            setToken('');
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
            <span>Токен моста</span>
            <input
              aria-label="Токен моста"
              type="password"
              minLength={32}
              required
              value={token}
              disabled={Boolean(activeToken)}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              placeholder="Вставьте токен MCP-моста..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {!activeToken && (
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Подключить
              </button>
            )}
            {activeToken && (
              <button
                type="button"
                onClick={() => {
                  setActiveToken('');
                  setStatus('Отключено');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #ef4444',
                  background: 'rgba(239, 68, 68, 0.14)',
                  color: '#ef4444',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Отключить
              </button>
            )}
          </div>
        </form>

        <p role="status" style={{ margin: '12px 0 6px 0', fontSize: '0.84rem', fontWeight: 700, color: activeToken ? '#10b981' : 'var(--text-color)' }}>
          {status}
        </p>
        <small style={{ display: 'block', fontSize: '0.74rem', opacity: 0.65 }}>
          Только 127.0.0.1:39123. Токен хранится в памяти до отключения/перезагрузки.
        </small>
      </section>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Подключить ИИ через MCP"
        style={{
          background: 'var(--node-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--node-border)',
          borderRadius: 999,
          padding: '6px 11px',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        ИИ / MCP{activeToken ? ' ●' : ''}
      </button>
      {open && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent}
    </>
  );
}
