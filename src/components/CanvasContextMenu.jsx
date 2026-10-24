import React, { useEffect, useMemo, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

export default function CanvasContextMenu({
  menu,
  onClose,
  onSpawnNode,
  onSpawnRegion,
  onAutoLayout,
  onSaveProject,
  onOpenVariables
}) {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const menuRef = useRef(null);

  // Автоматическая коррекция выхода за границы экрана (без синхронного setState в эффекте)
  const coords = useMemo(() => {
    if (!menu) return { x: 0, y: 0 };
    const menuWidth = 272;
    const menuHeight = 336;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    return {
      x: Math.max(8, Math.min(menu.clientX, vw - menuWidth - 12)),
      y: Math.max(8, Math.min(menu.clientY, vh - menuHeight - 12))
    };
  }, [menu]);

  // Закрытие по клику в любое другое место, скроллу или клавише Escape
  useEffect(() => {
    if (!menu) return;
    const handlePointerDown = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onClose();
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScrollOrWheel = () => onClose();

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleScrollOrWheel, { passive: true });
    window.addEventListener('resize', handleScrollOrWheel);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleScrollOrWheel);
      window.removeEventListener('resize', handleScrollOrWheel);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const getFlowPosition = () =>
    screenToFlowPosition({
      x: menu.clientX,
      y: menu.clientY
    });

  const handleAction = (fn) => {
    fn();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Контекстное меню холста"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        ...styles.menu,
        left: coords.x,
        top: coords.y
      }}
    >
      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onSpawnNode('scene', getFlowPosition()))}
      >
        <span>➕ Создать сцену здесь</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onSpawnNode('decision', getFlowPosition()))}
      >
        <span>🔀 Создать развилку здесь</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onSpawnNode('ending', getFlowPosition()))}
      >
        <span>🏁 Создать финал здесь</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onSpawnRegion(getFlowPosition()))}
      >
        <span>🗺️ Создать сюжетную область (Главу)</span>
      </button>

      <div style={styles.divider} />

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onAutoLayout())}
      >
        <span>📐 Авто-выравнивание графа</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => fitView({ duration: 600, padding: 0.2 }))}
      >
        <span>🎯 Центрировать полотно (Fit View)</span>
      </button>

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onSaveProject())}
      >
        <span>💽 Сохранить проект (Ctrl+S)</span>
      </button>

      <div style={styles.divider} />

      <button
        type="button"
        role="menuitem"
        style={styles.item}
        onClick={() => handleAction(() => onOpenVariables())}
      >
        <span>⚙️ Свойства полотна / Переменные</span>
      </button>
    </div>
  );
}

const styles = {
  menu: {
    position: 'fixed',
    zIndex: 3200,
    minWidth: 262,
    padding: 6,
    borderRadius: 14,
    background: 'var(--panel-bg, rgba(15, 23, 42, 0.94))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid var(--node-border, #334155)',
    boxShadow: '0 18px 42px rgba(0, 0, 0, 0.45)',
    color: 'var(--text-color, #f8fafc)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  },
  item: {
    width: '100%',
    padding: '8px 11px',
    borderRadius: 9,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-color, #f8fafc)',
    fontSize: '0.82rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  divider: {
    height: 1,
    background: 'var(--node-border, #334155)',
    margin: '4px 6px'
  }
};
