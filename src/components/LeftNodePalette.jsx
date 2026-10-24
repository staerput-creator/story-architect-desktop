import React, { useState } from 'react';
import {
  Film,
  GitFork,
  Flag,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArrowUpRight,
  Trash2,
  GripVertical,
  Plus,
  Layers
} from 'lucide-react';
import { useStoryStore } from '../store';

const PALETTE_ITEMS = [
  {
    type: 'scene',
    icon: '🎬',
    title: 'Сцена',
    subtitle: 'Диалог, локация и эффекты',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.14)',
    IconComp: Film
  },
  {
    type: 'decision',
    icon: '🔀',
    title: 'Развилка',
    subtitle: 'Ключевой выбор игрока',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.15)',
    IconComp: GitFork
  },
  {
    type: 'ending',
    icon: '🏁',
    title: 'Финал',
    subtitle: 'Концовка сюжетной ветки',
    color: '#9333ea',
    bg: 'rgba(147, 51, 234, 0.15)',
    IconComp: Flag
  },
  {
    type: 'region',
    icon: '🗺️',
    title: 'Глава / Область',
    subtitle: 'Фоновый регион для сцен',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    IconComp: MapIcon
  }
];

export default function LeftNodePalette({
  selectedNodeId,
  onClearSelection,
  onQuickSpawn
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isStashDragOver, setIsStashDragOver] = useState(false);

  const nodes = useStoryStore((s) => s.nodes);
  const stashedNodes = useStoryStore((s) => s.stashedNodes || []);
  const stashNode = useStoryStore((s) => s.stashNode);
  const unstashNode = useStoryStore((s) => s.unstashNode);
  const deleteStashedNode = useStoryStore((s) => s.deleteStashedNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes.find((n) => n.selected);

  const handleDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleStashItemDragStart = (event, stashId) => {
    event.dataTransfer.setData('application/reactflow-stash-id', stashId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleStashSelected = () => {
    if (!selectedNode) return;
    const id = selectedNode.id;
    stashNode(id);
    if (onClearSelection) onClearSelection(id);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="sa-left-palette-toggle"
        style={styles.collapsedToggle}
        title="Развернуть палитру нод и карман сюжета"
      >
        <ChevronRight size={17} />
        <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
          ПАЛИТРА ({stashedNodes.length})
        </span>
      </button>
    );
  }

  return (
    <aside
      className="sa-left-palette"
      style={styles.panel}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('application/story-node-id')) {
          e.preventDefault();
          setIsStashDragOver(true);
        }
      }}
      onDragLeave={() => setIsStashDragOver(false)}
      onDrop={(e) => {
        setIsStashDragOver(false);
        const nodeId = e.dataTransfer?.getData('application/story-node-id');
        if (nodeId) {
          e.preventDefault();
          stashNode(nodeId);
          if (onClearSelection) onClearSelection(nodeId);
        }
      }}
    >
      {/* Шапка левой панели */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={16} color="#3b82f6" />
          <span style={{ fontWeight: 800, fontSize: '0.86rem', letterSpacing: '0.02em' }}>
            Палитра и Карман
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          style={styles.collapseBtn}
          title="Свернуть панель (◀)"
        >
          ◀
        </button>
      </div>

      <div style={styles.scrollBody}>
        {/* БЛОК А: ПАЛИТРА СОЗДАНИЯ ЧЕРЕЗ DRAG & DROP */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Блок А: Перетащите на холст</div>
          <div style={styles.hintText}>
            Зажмите карточку мышью и отпустите в нужной точке полотна:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {PALETTE_ITEMS.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                onClick={() => onQuickSpawn && onQuickSpawn(item.type)}
                style={{
                  ...styles.paletteCard,
                  borderLeft: `4px solid ${item.color}`
                }}
                title={`Перетащите на полотно или нажмите для создания (${item.title})`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: item.bg,
                      color: item.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {item.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-color)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.71rem', opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <GripVertical size={15} style={{ opacity: 0.45, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* БЛОК Б: КАРМАН СЮЖЕТНЫХ ЗАГОТОВОК (SCENE STASH / PARKING) */}
        <div
          style={{
            ...styles.section,
            borderTop: '1px solid var(--node-border)',
            paddingTop: 14,
            marginTop: 6,
            background: isStashDragOver ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
            borderRadius: isStashDragOver ? 12 : 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={styles.sectionTitle}>
              <Archive size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Отложенные сцены ({stashedNodes.length})
            </span>
          </div>

          <button
            type="button"
            onClick={handleStashSelected}
            disabled={!selectedNode}
            style={{
              ...styles.stashActionBtn,
              opacity: selectedNode ? 1 : 0.45,
              cursor: selectedNode ? 'pointer' : 'not-allowed'
            }}
            title={
              selectedNode
                ? `Убрать «${selectedNode.data?.label}» в карман`
                : 'Выделите узел на полотне, чтобы временно убрать его в карман'
            }
          >
            <Archive size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedNode ? `Убрать в карман: «${selectedNode.data?.label}»` : 'Убрать выбранный узел в карман'}
            </span>
          </button>

          {stashedNodes.length === 0 ? (
            <div style={styles.emptyStashBox}>
              Пока нет отложенных сцен. Выделите ненужный узел на холсте и нажмите «Убрать в карман», чтобы сохранить его реплики и текст про запас.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {stashedNodes.map((node) => {
                const dialogueCount = Array.isArray(node.data?.dialogue) ? node.data.dialogue.length : 0;
                const nodeType = node.data?.type || 'scene';
                const badgeColor =
                  nodeType === 'decision'
                    ? '#d97706'
                    : nodeType === 'ending'
                    ? '#9333ea'
                    : nodeType === 'start'
                    ? '#16a34a'
                    : '#2563eb';
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => handleStashItemDragStart(e, node.id)}
                    style={{
                      ...styles.stashCard,
                      borderLeft: `3px solid ${badgeColor}`
                    }}
                    title="Перетащите обратно на холст в нужное место"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', wordBreak: 'break-word' }}>
                        {node.data?.label || 'Сцена без названия'}
                      </div>
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => unstashNode(node.id)}
                          style={styles.miniActionBtn}
                          title="Вернуть на холст"
                        >
                          <ArrowUpRight size={14} color="#3b82f6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStashedNode(node.id)}
                          style={styles.miniActionBtn}
                          title="Удалить заготовку навсегда"
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </div>

                    {node.data?.notes && (
                      <div style={styles.stashNotes}>{node.data.notes}</div>
                    )}

                    <div style={{ fontSize: '0.7rem', opacity: 0.65, marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Реплик: {dialogueCount}</span>
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>⇄ Перетащите на холст</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

const styles = {
  panel: {
    position: 'fixed',
    left: 0,
    top: 70,
    bottom: 0,
    width: 260,
    zIndex: 18,
    background: 'var(--panel-bg, rgba(15, 23, 42, 0.86))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: '1px solid var(--node-border, #334155)',
    boxShadow: '8px 0 28px rgba(0, 0, 0, 0.24)',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-color, #f8fafc)',
    userSelect: 'none'
  },
  collapsedToggle: {
    position: 'fixed',
    left: 0,
    top: 86,
    zIndex: 18,
    background: 'var(--panel-bg, rgba(15, 23, 42, 0.9))',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    color: 'var(--text-color, #f8fafc)',
    border: '1px solid var(--node-border, #334155)',
    borderLeft: 'none',
    borderRadius: '0 12px 12px 0',
    padding: '12px 7px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    boxShadow: '4px 6px 20px rgba(0,0,0,0.25)'
  },
  header: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--node-border, #334155)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  collapseBtn: {
    background: 'var(--bg-color, #0f172a)',
    border: '1px solid var(--node-border, #334155)',
    color: 'var(--text-color, #f8fafc)',
    borderRadius: 7,
    padding: '3px 8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  scrollBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 12px 28px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  section: {
    display: 'flex',
    flexDirection: 'column'
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 0.82
  },
  hintText: {
    fontSize: '0.73rem',
    opacity: 0.65,
    marginTop: 3,
    lineHeight: 1.35
  },
  paletteCard: {
    padding: '9px 10px',
    borderRadius: 11,
    background: 'var(--bg-color, #0f172a)',
    border: '1px solid var(--node-border, #334155)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    cursor: 'grab',
    boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
    transition: 'transform 0.12s, border-color 0.15s'
  },
  stashActionBtn: {
    width: '100%',
    marginTop: 6,
    padding: '8px 10px',
    borderRadius: 9,
    border: '1px solid rgba(59, 130, 246, 0.45)',
    background: 'rgba(37, 99, 235, 0.14)',
    color: 'var(--text-color, #f8fafc)',
    fontWeight: 700,
    fontSize: '0.76rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyStashBox: {
    marginTop: 10,
    padding: '12px 10px',
    borderRadius: 10,
    border: '1px dashed var(--node-border, #334155)',
    fontSize: '0.74rem',
    opacity: 0.68,
    lineHeight: 1.4,
    textAlign: 'center'
  },
  stashCard: {
    padding: '9px 10px',
    borderRadius: 10,
    background: 'var(--bg-color, #0f172a)',
    border: '1px solid var(--node-border, #334155)',
    cursor: 'grab',
    boxShadow: '0 3px 8px rgba(0,0,0,0.14)'
  },
  stashNotes: {
    fontSize: '0.72rem',
    opacity: 0.72,
    marginTop: 4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.3
  },
  miniActionBtn: {
    background: 'transparent',
    border: '1px solid var(--node-border, #334155)',
    borderRadius: 6,
    padding: 3,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
