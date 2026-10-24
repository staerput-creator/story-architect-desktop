import { listen } from '@tauri-apps/api/event';
import { storageService } from './services/storage';
import { isTauri } from './services/runtime';
import McpBridgePanel from './components/McpBridgePanel';
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useUpdateNodeInternals,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomEdge from './components/StoryCustomEdge';
import ConditionsEditor from './components/ConditionsEditor';
import StoryPlayer from './components/StoryPlayer';
import LeftNodePalette from './components/LeftNodePalette';
import CanvasContextMenu from './components/CanvasContextMenu';
import StoryRegionNode from './components/StoryRegionNode';
import ChapterNavigator from './components/ChapterNavigator';
import { getConditions } from './graph/conditions';
import { useStore } from 'zustand';
import { useStoryStore, assetStorage } from './store';

import CharacterManager from './CharacterManager';
import SceneEditor from './SceneEditor';
import StorageManager from './StorageManager';
import VariablesManager from './VariablesManager';
import {
  Sun, Moon, Coffee, GitFork, PlusSquare, Save, Users,
  Cloud, Trash2, X, Undo2, Redo2, Database, AlertCircle, CheckCircle, Info,
  Play, LayoutGrid, Search, ShieldAlert, Flag, UserCheck, LogIn, Layers, Map as MapIcon,
  Film, MessageSquare, Zap, UserPlus, CheckCircle2, LogOut, KeyRound, Mail, User,
  ShieldCheck, HardDrive, RotateCcw, ArrowLeft, Lock, Unlock, Sparkles, Edit3
} from 'lucide-react';

// --- 1. КАСТОМНАЯ КАРТОЧКА УЗЛА НА ПОЛОТНЕ (ВСТРОЕНА В APP.JSX) ---
const TYPE_META = {
  start: { label: 'Старт', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.14)', Icon: Play },
  scene: { label: 'Сцена', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.14)', Icon: Film },
  decision: { label: 'Развилка', color: '#d97706', bg: 'rgba(217, 119, 6, 0.16)', Icon: GitFork },
  ending: { label: 'Финал', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.15)', Icon: Flag }
};

const CustomNode = memo(function CustomNode({ id, data: rawData, selected }) {
  const data = useMemo(() => rawData || {}, [rawData]);
  const characters = useStoryStore((s) => s.characters);
  const edges = useStoryStore((state) => state.edges);
  const updateNodeInternals = useUpdateNodeInternals();
  const outputChoices = useMemo(() => {
    const existing = Array.isArray(data?.choices) ? data.choices : [];
    const connected = edges.filter((edge) => edge.source === id).map((edge) => ({
      id: edge.sourceHandle || edge.data?.choiceId,
      label: edge.label || 'Выбор'
    }));
    const byId = new Map();
    [...existing, ...connected].forEach((choice) => { if (choice?.id) byId.set(choice.id, choice); });
    return [...byId.values()];
  }, [data, edges, id]);
  useEffect(() => { updateNodeInternals(id); }, [id, outputChoices, updateNodeInternals]);
  const nodeType = data?.type || 'scene';
  const meta = TYPE_META[nodeType] || TYPE_META.scene;
  const Icon = meta.Icon;

  const dialogue = Array.isArray(data.dialogue) ? data.dialogue.filter(Boolean) : [];
  const effects = Array.isArray(data.effects) ? data.effects.filter(Boolean) : [];
  const imageSrc = data?.imageId ? assetStorage.getAsset(data.imageId) : data?.image || null;
  const choiceHandleStyle = { width: 12, height: 12, right: -7, background: meta.color, border: '2px solid var(--node-bg)' };

  const uniqueChars = Array.from(new Set(dialogue.map((d) => d.charId).filter(Boolean)))
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div
      style={{
        width: 240,
        minHeight: Math.max(150, outputChoices.length * 28 + 80),
        borderRadius: nodeType === 'decision' ? 18 : 12,
        background: 'var(--node-bg)',
        color: 'var(--text-color)',
        border: selected ? `2px solid ${meta.color}` : '1px solid var(--node-border)',
        boxShadow: selected
          ? `0 0 0 3px ${meta.bg}, 0 10px 25px rgba(0,0,0,0.25)`
          : '0 6px 16px rgba(0,0,0,0.12)',
        overflow: 'visible',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        fontFamily: 'inherit',
        textAlign: 'left'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 11, height: 11, background: meta.color, border: '2px solid var(--node-bg)' }}
      />

      {imageSrc && (
        <div style={{ width: '100%', height: 84, overflow: 'hidden', position: 'relative' }}>
          <img
            src={imageSrc}
            alt={data.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: 999,
              background: meta.bg,
              color: meta.color
            }}
          >
            <Icon size={11} /> {meta.label}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', opacity: 0.75 }}>
            {effects.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#eab308', fontWeight: 600 }}>
                <Zap size={12} /> {effects.length}
              </span>
            )}
            {dialogue.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <MessageSquare size={11} /> {dialogue.length}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: '0.92rem',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {data?.label || 'Без названия'}
        </div>

        {(data?.notes || dialogue[0]?.text) && (
          <div
            style={{
              fontSize: '0.76rem',
              opacity: 0.68,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
              marginBottom: uniqueChars.length > 0 ? 8 : 2
            }}
          >
            {data?.notes || `«${dialogue[0]?.text}»`}
          </div>
        )}

        {uniqueChars.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {uniqueChars.slice(0, 3).map((c) => (
              <span
                key={c.id}
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'var(--panel-bg)',
                  borderLeft: `3px solid ${c.color}`,
                  maxWidth: 95,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {c.name}
              </span>
            ))}
            {uniqueChars.length > 3 && (
              <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>+{uniqueChars.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {outputChoices.map((choice, index) => <Handle
        key={choice.id}
        id={choice.id}
        type="source"
        position={Position.Right}
        title={choice.label || 'Выбор'}
        style={{ ...choiceHandleStyle, top: 54 + index * 28 }}
      />)}
      <Handle
        id="choice-add"
        type="source"
        position={Position.Right}
        title="+ Добавить выбор: проведите связь к сцене"
        style={{ ...choiceHandleStyle, width: 19, height: 19, right: -11, top: 'calc(100% - 20px)', background: '#16a34a', borderRadius: 6, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}
      >+</Handle>
    </div>
  );
});

// --- 1.1. КАСТОМНОЕ РЕБРО С ТЕМНОЙ/СВЕТЛОЙ ПОДЛОЖКОЙ И ЯНТАРНЫМ БЕЙДЖЕМ ЗАМКА [🔒 ...] ---
// --- 2. ОКНО АВТОРИЗАЦИИ И ПРИВЯЗКИ GOOGLE ДИСКА ---
// --- 3. ИГРОВОЙ СИМУЛЯТОР / ПЛЕЕР СЮЖЕТА ---
// --- 4. ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
export default function App() {
  const {
    projectMeta, nodes, edges, regions = [], currentTheme, variables, toast,
    onNodesChange, onEdgesChange, onConnect,
    addNode, addRegion, unstashNode, saveProject, setTheme, updateEdgeData, deleteEdge,
    loadProject, importProject, updateProjectMeta, autoLayout, validateStory, showToast
  } = useStoryStore();

  const { undo, redo } = useStoryStore.temporal.getState();
  const hasPast = useStore(useStoryStore.temporal, (state) => state.pastStates.length > 0);
  const hasFuture = useStore(useStoryStore.temporal, (state) => state.futureStates.length > 0);

  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({ storyNode: CustomNode, regionNode: StoryRegionNode }),
    []
  );
  const edgeTypes = useMemo(() => ({ default: CustomEdge, storyEdge: CustomEdge }), []);

  const canvasNodes = useMemo(() => {
    const sortedRegions = [...(regions || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const regionFlowNodes = sortedRegions.map((reg, idx) => ({
      id: reg.id,
      type: 'regionNode',
      position: { x: Number(reg.x) || 0, y: Number(reg.y) || 0 },
      style: {
        width: Math.max(300, Number(reg.width) || 560),
        height: Math.max(200, Number(reg.height) || 380),
        zIndex: -1
      },
      zIndex: -1,
      selected: Boolean(reg.selected),
      dragging: Boolean(reg.dragging),
      resizing: Boolean(reg.resizing),
      data: {
        title: reg.title || `Глава ${idx + 1}`,
        order: idx + 1,
        color: reg.color || '#3b82f6',
        width: Math.max(300, Number(reg.width) || 560),
        height: Math.max(200, Number(reg.height) || 380),
        notes: reg.notes || ''
      }
    }));
    const storyFlowNodes = (nodes || []).map((n) => ({
      ...n,
      zIndex: 10
    }));
    return [...regionFlowNodes, ...storyFlowNodes];
  }, [regions, nodes]);

  const [isCharManagerOpen, setCharManagerOpen] = useState(false);
  const [isVarManagerOpen, setVarManagerOpen] = useState(false);
  const [isStorageOpen, setStorageOpen] = useState(false);
  const [isPlayerOpen, setPlayerOpen] = useState(false);
  const [isValidatorOpen, setValidatorOpen] = useState(false);
  const [isChapterNavOpen, setChapterNavOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState('canvas');
  const [isCanvasDragOver, setIsCanvasDragOver] = useState(false);
  const [activeFileHandle, setActiveFileHandle] = useState(null);

  const [editingEdge, setEditingEdge] = useState(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  useEffect(() => {
    let disposed = false, unlisten;
    if (!isTauri()) return;
    listen('desktop-menu', async ({payload}) => {
      const state = useStoryStore.getState();
      try {
        if (payload === 'open') {
          const data = await storageService.open();
          if (data) await state.importProject(data, false);
        } else if (payload === 'new') {
          storageService.startNewProject();
          await state.resetProject('blank', false);
        } else if (payload === 'save') {
          await state.saveProject();
        } else if (payload === 'save-as') {
          const result = await storageService.saveAs(state.getSerializableData());
          if (result.success) state.showToast('Полотно сохранено в файл', 'success');
          else if (!result.cancelled) state.showToast(result.error || 'Ошибка сохранения файла', 'error');
        }
        else if(payload==='export') await storageService.exportStandaloneHtml(state.getSerializableData());
        else if(payload==='undo'||payload==='redo') useStoryStore.temporal.getState()[payload]();
        else if(['dark','light','soft'].includes(payload)) state.setTheme(payload);
        else if(payload==='zoom-in'||payload==='zoom-out') document.querySelector(payload==='zoom-in'?'.react-flow__controls-zoomin':'.react-flow__controls-zoomout')?.click();
      } catch(error) {state.showToast(String(error),'error');}
    }).then(fn=>{if(disposed)fn();else unlisten=fn;}).catch(error => useStoryStore.getState().showToast(String(error), 'error'));
    return()=>{disposed=true;unlisten?.();};
  }, []);
  const [edgeConditions, setEdgeConditions] = useState([]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const handleQuickSave = useCallback(async () => {
    if (isTauri()) { await saveProject(); return; }
    if (activeFileHandle) {
      try {
        const data = useStoryStore.getState().getSerializableData();
        const writable = await activeFileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        await saveProject(true);
        showToast(`Сохранено в локальный файл «${activeFileHandle.name}»`, 'success');
        return;
      } catch (err) {
        console.warn('File handle write error:', err);
        showToast('Нет доступа к локальному файлу, сохранено в браузер', 'info');
      }
    }

    await saveProject(false);
  }, [activeFileHandle, saveProject, showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's')) return;
      const modifier = e.metaKey || e.ctrlKey;
      if (isTauri() && modifier) return; // Native menu owns these accelerators.

      if (modifier && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'я')) {
        e.preventDefault();
        if (e.shiftKey) {
          if (hasFuture) redo();
        } else if (hasPast) {
          undo();
        }
      } else if (modifier && (e.key.toLowerCase() === 'y' || e.key.toLowerCase() === 'н')) {
        e.preventDefault();
        if (hasFuture) redo();
      } else if (modifier && (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы')) {
        e.preventDefault();
        handleQuickSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPast, hasFuture, handleQuickSave, redo, undo]);


  const handleCanvasDrop = (e) => {
    const types = Array.from(e.dataTransfer?.types || []);
    if (
      types.includes('application/reactflow-type') ||
      types.includes('application/reactflow-stash-id')
    ) {
      return;
    }
    e.preventDefault();
    setIsCanvasDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showToast('Перетащите файл проекта в формате .json', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        await importProject(parsed);
      } catch {
        showToast('Ошибка чтения JSON файла', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleReactFlowDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleReactFlowDrop = (event) => {
    event.preventDefault();
    const rfType = event.dataTransfer.getData('application/reactflow-type');
    const stashId = event.dataTransfer.getData('application/reactflow-stash-id');
    if (!rfType && !stashId) return;

    event.stopPropagation();
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });

    if (stashId) {
      const restoredId = unstashNode(stashId, position);
      if (restoredId) setSelectedNodeId(restoredId);
      return;
    }

    if (rfType === 'region') {
      addRegion(position);
    } else if (rfType) {
      const newId = addNode(rfType, position);
      if (newId) setSelectedNodeId(newId);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({
      clientX: event.clientX,
      clientY: event.clientY
    });
  };

  const onEdgeClick = (evt, edge) => {
    evt.stopPropagation();
    setEditingEdge(edge);
    const rawLabel = (edge.label || '').replace(/\s*\[🔒[^\]]*\]/g, '').trim();
    setEdgeLabelInput(rawLabel);

    setEdgeConditions(getConditions(edge.data));
  };

  const handleEdgeSave = () => {
    if (!editingEdge) return;
    updateEdgeData(editingEdge.id, edgeLabelInput.trim() || 'Далее →', edgeConditions);
    setEditingEdge(null);
  };

  const handleEdgeDelete = () => {
    if (editingEdge) {
      deleteEdge(editingEdge.id);
      setEditingEdge(null);
    }
  };

  const validationIssues = useMemo(() => validateStory(nodes, edges), [nodes, edges, validateStory]);
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        (n.data?.label || '').toLowerCase().includes(q) ||
        (n.data?.notes || '').toLowerCase().includes(q) ||
        (n.data?.dialogue || []).some((d) => (d.text || '').toLowerCase().includes(q))
    );
  }, [nodes, searchQuery]);

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer?.types?.includes('Files')) {
          setIsCanvasDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsCanvasDragOver(false);
      }}
      onDrop={handleCanvasDrop}
    >
      {/* ВЕРХНИЙ ТУЛБАР */}
      <header className="sa-top-toolbar" style={styles.toolbar}>
        <McpBridgePanel />
        <div style={styles.group}>
          <input
            value={projectMeta?.title || ''}
            onChange={(e) => updateProjectMeta({ title: e.target.value })}
            placeholder="Название полотна..."
            style={styles.projectTitleInput}
            title="Название сюжетного полотна"
          />
        </div>

        <div className="hide-mobile" style={styles.sep}></div>

        <div style={styles.group}>
          <button
            onClick={() => undo()}
            disabled={!hasPast}
            style={{ ...styles.iconBtn, opacity: hasPast ? 1 : 0.3 }}
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 size={17} />
          </button>
          <button
            onClick={() => redo()}
            disabled={!hasFuture}
            style={{ ...styles.iconBtn, opacity: hasFuture ? 1 : 0.3 }}
            title="Повторить (Ctrl+Y)"
          >
            <Redo2 size={17} />
          </button>
          <button
            onClick={() => autoLayout('LR')}
            style={styles.iconBtn}
            title="Автоматически выровнять граф"
          >
            <LayoutGrid size={17} />
          </button>
        </div>

        <div className="hide-mobile" style={styles.sep}></div>

        <div className="hide-mobile" style={styles.group}>
          <button onClick={() => addNode('scene')} title="Создать сцену" style={styles.btn}>
            <PlusSquare size={16} color="#2563eb" />
            <span>Сцена</span>
          </button>
          <button
            onClick={() => addNode('decision')}
            title="Создать развилку сюжета"
            style={{ ...styles.btn, borderColor: 'var(--decision-border)' }}
          >
            <GitFork size={16} color="#d97706" />
            <span>Развилка</span>
          </button>
          <button onClick={() => addNode('ending')} title="Создать концовку" style={styles.btn}>
            <Flag size={16} color="#9333ea" />
            <span>Финал</span>
          </button>
        </div>

        <div className="hide-mobile" style={styles.sep}></div>

        <div className="hide-mobile" style={styles.group}>
          <button onClick={() => setVarManagerOpen(true)} style={styles.btn} title="Переменные и предметы">
            <Database size={16} color="#d97706" />
            <span>Переменные ({variables.length})</span>
          </button>
          <button onClick={() => setCharManagerOpen(true)} style={styles.btn} title="Персонажи и фракции">
            <Users size={16} color="#2563eb" />
            <span>Персонажи</span>
          </button>
          <button
            onClick={() => setValidatorOpen(true)}
            style={styles.btn}
            title="Поиск по сценам и проверка ошибок сюжета"
          >
            <Search size={16} />
            {validationIssues.length > 0 && (
              <span style={styles.issueCounter}>{validationIssues.length}</span>
            )}
          </button>
          <button
            onClick={() => setChapterNavOpen((v) => !v)}
            style={{
              ...styles.btn,
              borderColor: isChapterNavOpen ? '#10b981' : 'var(--node-border)',
              background: isChapterNavOpen ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-color)'
            }}
            title="Навигатор глав и хроника сюжета (Ctrl+1..9)"
          >
            <MapIcon size={16} color="#10b981" />
            <span>Главы ({regions.length})</span>
          </button>
        </div>

        <div style={styles.sep}></div>

        <div style={styles.group}>
          <button
            onClick={() => setPlayerOpen(true)}
            style={styles.playBtn}
            title="Запустить тестирование игры"
          >
            <Play size={15} fill="white" />
            <span>Играть</span>
          </button>

          <button
            onClick={() => setStorageOpen(true)}
            style={styles.driveBtn}
            title="Локальные проекты и экспорт"
          >
            <HardDrive size={16} />
            <span className="hide-mobile">Полотно / Файлы</span>
          </button>

          <button
            onClick={handleQuickSave}
            style={{ ...styles.iconBtn, color: '#16a34a' }}
            title="Быстрое сохранение (Ctrl+S)"
          >
            <Save size={18} />
          </button>


        </div>

        <div className="hide-mobile" style={styles.sep}></div>

        <div style={styles.group}>
          <button
            onClick={() => setTheme('light')}
            style={{ ...styles.iconBtn, opacity: currentTheme === 'light' ? 1 : 0.35 }}
            title="Светлая тема"
          >
            <Sun size={16} />
          </button>
          <button
            onClick={() => setTheme('soft')}
            style={{ ...styles.iconBtn, opacity: currentTheme === 'soft' ? 1 : 0.35 }}
            title="Мягкая тема (Сепия)"
          >
            <Coffee size={16} />
          </button>
          <button
            onClick={() => setTheme('dark')}
            style={{ ...styles.iconBtn, opacity: currentTheme === 'dark' ? 1 : 0.35 }}
            title="Тёмная тема"
          >
            <Moon size={16} />
          </button>
        </div>
      </header>

      {/* ЛЕВАЯ ПАЛИТРА НОД И КАРМАН СЮЖЕТА */}
      {mobileViewMode === 'canvas' && (
        <LeftNodePalette
          selectedNodeId={selectedNodeId || editingNodeId}
          onClearSelection={() => {
            setSelectedNodeId(null);
            setEditingNodeId(null);
          }}
          onQuickSpawn={(type) => {
            const centerPos = screenToFlowPosition({
              x: Math.round(window.innerWidth * 0.52),
              y: Math.round(window.innerHeight * 0.48)
            });
            if (type === 'region') {
              addRegion(centerPos);
            } else {
              const createdId = addNode(type, centerPos);
              if (createdId) setSelectedNodeId(createdId);
            }
          }}
        />
      )}

      {/* НАВИГАТОР ГЛАВ И ХРОНИКА СЮЖЕТА */}
      <ChapterNavigator
        isOpen={isChapterNavOpen}
        onClose={() => setChapterNavOpen(false)}
      />

      {/* КОНТЕКСТНОЕ МЕНЮ ПО ПРАВОЙ КНОПКЕ МЫШИ */}
      <CanvasContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onSpawnNode={(type, pos) => {
          const newId = addNode(type, pos);
          if (newId) setSelectedNodeId(newId);
        }}
        onSpawnRegion={(pos) => addRegion(pos)}
        onAutoLayout={() => autoLayout('LR')}
        onSaveProject={handleQuickSave}
        onOpenVariables={() => setVarManagerOpen(true)}
      />

      {/* ОСНОВНОЕ ПОЛОТНО */}
      {mobileViewMode === 'canvas' ? (
        <ReactFlow
          nodes={canvasNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'default' }}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => {
            if (node.type === 'regionNode') return;
            setSelectedNodeId(node.id);
            setEditingNodeId(node.id);
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
            setContextMenu(null);
          }}
          onPaneContextMenu={handleContextMenu}
          onDragOver={handleReactFlowDragOver}
          onDrop={handleReactFlowDrop}
          onEdgeClick={onEdgeClick}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Background gap={20} color="var(--dots-color)" />
        </ReactFlow>
      ) : (
        <div style={styles.mobileListContainer}>
          <div style={styles.mobileListInner}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Все сцены полотна ({nodes.length})</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => addNode('scene')} style={styles.smallAddBtn}>
                  + Сцена
                </button>
                <button onClick={() => addNode('decision')} style={styles.smallAddBtn}>
                  + Развилка
                </button>
              </div>
            </div>

            {nodes.map((n) => {
              const out = edges.filter((e) => e.source === n.id);
              return (
                <div key={n.id} onClick={() => setEditingNodeId(n.id)} style={styles.mobileSceneCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>{n.data?.label}</span>
                    <span style={styles.mobileTypeBadge}>{n.data?.type || 'scene'}</span>
                  </div>
                  {n.data?.notes && (
                    <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: 4 }}>{n.data.notes}</div>
                  )}
                  <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: 8 }}>
                    Реплик: {n.data?.dialogue?.length || 0} • Переходов из сцены: {out.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* МОБИЛЬНАЯ НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ */}
      <nav className="sa-mobile-bottom-nav" style={styles.mobileBottomBar}>
        <button
          onClick={() => setMobileViewMode(mobileViewMode === 'canvas' ? 'list' : 'canvas')}
          style={styles.mobileNavBtn}
        >
          {mobileViewMode === 'canvas' ? <Layers size={19} /> : <MapIcon size={19} />}
          <span>{mobileViewMode === 'canvas' ? 'Список' : 'Полотно'}</span>
        </button>
        <button
          onClick={() => {
            const newId = addNode('scene');
            setEditingNodeId(newId);
          }}
          style={styles.mobileNavBtn}
        >
          <PlusSquare size={19} color="#2563eb" />
          <span>+ Сцена</span>
        </button>
        <button onClick={() => setCharManagerOpen(true)} style={styles.mobileNavBtn}>
          <Users size={19} />
          <span>Герои</span>
        </button>
        <button onClick={() => setVarManagerOpen(true)} style={styles.mobileNavBtn}>
          <Database size={19} color="#d97706" />
          <span>Статы</span>
        </button>
        <button onClick={() => setStorageOpen(true)} style={styles.mobileNavBtn}>
          <Cloud size={19} color="#16a34a" />
          <span>Диск</span>
        </button>
      </nav>

      {/* ОВЕРЛЕЙ DRAG & DROP НА ХОЛСТ */}
      {isCanvasDragOver && (
        <div style={styles.dragOverlay}>
          <div style={styles.dragBox}>
            <Cloud size={48} color="#2563eb" />
            <div style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: 10 }}>
              Отпустите .json файл, чтобы загрузить полотно
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЫЕ ОКНА И ПАНЕЛИ */}
      {isCharManagerOpen && <CharacterManager onClose={() => setCharManagerOpen(false)} />}
      {isVarManagerOpen && <VariablesManager onClose={() => setVarManagerOpen(false)} />}
      {isStorageOpen && (
        <StorageManager
          onClose={() => setStorageOpen(false)}
          fileHandle={activeFileHandle}
          onFileHandleChange={setActiveFileHandle}
        />
      )}
      {isPlayerOpen && (
        <StoryPlayer onClose={() => setPlayerOpen(false)} />
      )}
      {editingNodeId && (
        <SceneEditor
          nodeId={editingNodeId}
          onClose={() => setEditingNodeId(null)}
          onSelectNode={(id) => setEditingNodeId(id)}
        />
      )}

      {/* ОКНО ПОИСКА И ПРОВЕРКИ СЮЖЕТА */}
      {isValidatorOpen && (
        <div style={styles.overlay} onClick={() => setValidatorOpen(false)}>
          <div style={{ ...styles.modal, width: 'min(520px, 94vw)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={18} color="#2563eb" /> Поиск и диагностика сюжета
              </h3>
              <button onClick={() => setValidatorOpen(false)} style={styles.iconBtn}>
                <X size={20} />
              </button>
            </div>

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию сцены, описанию или тексту реплики..."
              style={{ ...styles.input, width: '100%', marginBottom: 14, boxSizing: 'border-box' }}
              autoFocus
            />

            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {filteredNodes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    setEditingNodeId(n.id);
                    setValidatorOpen(false);
                  }}
                  style={styles.searchResultRow}
                >
                  <span style={{ fontWeight: 600 }}>{n.data?.label}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                    Реплик: {n.data?.dialogue?.length || 0}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--node-border)', paddingTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={16} color="#d97706" /> Проверка целостности графа ({validationIssues.length})
              </div>
              {validationIssues.length === 0 ? (
                <div style={{ fontSize: '0.84rem', color: '#16a34a', fontWeight: 600 }}>
                  ✅ Ошибок не найдено! Все сцены достижимы и корректны.
                </div>
              ) : (
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {validationIssues.map((iss, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (iss.nodeId) {
                          setEditingNodeId(iss.nodeId);
                          setValidatorOpen(false);
                        }
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'var(--bg-color)',
                        borderLeft: `3px solid ${iss.type === 'error' ? '#ef4444' : '#d97706'}`,
                        fontSize: '0.8rem',
                        cursor: iss.nodeId ? 'pointer' : 'default'
                      }}
                    >
                      {iss.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ОКНО НАСТРОЙКИ СВЯЗИ (ПЕРЕХОДА) */}
      {editingEdge && (
        <div style={styles.overlay} onClick={() => setEditingEdge(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ margin: 0 }}>Настройка варианта выбора</h3>
              <button onClick={() => setEditingEdge(null)} style={styles.iconBtn}>
                <X size={20} />
              </button>
            </div>

            <label style={{ display: 'block', marginBottom: 5, fontSize: '0.84rem', fontWeight: 600 }}>
              Текст выбора на кнопке / линии:
            </label>
            <input
              value={edgeLabelInput}
              onChange={(e) => setEdgeLabelInput(e.target.value)}
              style={{ ...styles.input, width: '100%', marginBottom: 15, boxSizing: 'border-box' }}
              placeholder="Например: Открыть дверь ключом"
            />

            <div style={styles.condBox}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.84rem', fontWeight: 700, color: '#f59e0b' }}>
                🔒 Условие доступности выбора:
              </label>
              <ConditionsEditor conditions={edgeConditions} onChange={setEdgeConditions} variables={variables} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={handleEdgeDelete} style={styles.dangerBtn}>
                <Trash2 size={16} /> Удалить связь
              </button>
              <button onClick={handleEdgeSave} style={styles.primaryBtn}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            ...styles.toast,
            background:
              toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb'
          }}
        >
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  toolbar: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    gap: 6,
    background: 'var(--panel-bg)',
    padding: '7px 14px',
    borderRadius: 999,
    boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
    border: '1px solid var(--node-border)',
    alignItems: 'center',
    maxWidth: '96vw',
    overflowX: 'auto',
    whiteSpace: 'nowrap'
  },
  projectTitleInput: {
    width: 155,
    border: '1px solid transparent',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontWeight: 700,
    fontSize: '0.84rem',
    padding: '5px 10px',
    borderRadius: 999
  },
  group: { display: 'flex', gap: 5, alignItems: 'center' },
  sep: { width: 1, height: 20, background: 'var(--node-border)', margin: '0 2px' },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 11px',
    cursor: 'pointer',
    border: '1px solid var(--node-border)',
    borderRadius: 999,
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontWeight: 600,
    fontSize: '0.8rem'
  },
  playBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: 999,
    background: '#16a34a',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.82rem',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
  },
  driveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    border: '1px solid rgba(37, 99, 235, 0.4)',
    borderRadius: 999,
    background: 'rgba(37, 99, 235, 0.12)',
    color: '#2563eb',
    fontWeight: 700,
    fontSize: '0.8rem'
  },
  authBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 11px',
    cursor: 'pointer',
    border: '1px solid var(--node-border)',
    borderRadius: 999,
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontWeight: 600,
    fontSize: '0.8rem'
  },
  userConnectedBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 11px',
    cursor: 'pointer',
    border: '1px solid rgba(22, 163, 74, 0.4)',
    borderRadius: 999,
    background: 'rgba(22, 163, 74, 0.12)',
    color: '#16a34a',
    fontWeight: 700,
    fontSize: '0.8rem'
  },
  issueCounter: {
    background: '#d97706',
    color: '#fff',
    borderRadius: 999,
    padding: '1px 6px',
    fontSize: '0.68rem',
    fontWeight: 700
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-color)',
    padding: 6,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mobileBottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 62,
    background: 'var(--panel-bg)',
    borderTop: '1px solid var(--node-border)',
    zIndex: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 6px'
  },
  mobileNavBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 10px'
  },
  mobileListContainer: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    padding: '74px 14px 80px 14px',
    boxSizing: 'border-box',
    background: 'var(--bg-color)'
  },
  mobileListInner: {
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  mobileSceneCard: {
    padding: 14,
    borderRadius: 12,
    background: 'var(--panel-bg)',
    border: '1px solid var(--node-border)',
    cursor: 'pointer'
  },
  mobileTypeBadge: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(37, 99, 235, 0.15)',
    color: '#2563eb',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  smallAddBtn: {
    padding: '6px 10px',
    borderRadius: 8,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  dragOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(37, 99, 235, 0.18)',
    backdropFilter: 'blur(4px)',
    zIndex: 3500,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  dragBox: {
    padding: '32px 48px',
    borderRadius: 20,
    background: 'var(--panel-bg)',
    border: '3px dashed #2563eb',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.68)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2400,
    padding: 12
  },
  modal: {
    width: 'min(380px, 95vw)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    padding: 20,
    borderRadius: 14,
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    border: '1px solid var(--node-border)'
  },
  modalHeaderBar: {
    padding: '15px 20px',
    background: 'var(--bg-color)',
    borderBottom: '1px solid var(--node-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },
  googleBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabsRow: {
    display: 'flex',
    background: 'var(--bg-color)',
    borderBottom: '1px solid var(--node-border)'
  },
  tabItem: {
    flex: 1,
    padding: '11px 8px',
    border: 'none',
    borderBottom: '2px solid transparent',
    background: 'transparent',
    color: 'var(--text-color)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: 0.65,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  tabItemActive: {
    opacity: 1,
    color: '#2563eb',
    borderBottom: '2px solid #2563eb'
  },
  infoBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    background: 'rgba(37, 99, 235, 0.1)',
    border: '1px solid rgba(37, 99, 235, 0.25)',
    fontSize: '0.83rem',
    lineHeight: 1.45
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: 6,
    opacity: 0.85
  },
  inputIconWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--bg-color)',
    border: '1px solid var(--node-border)',
    borderRadius: 8,
    padding: '0 10px'
  },
  bareInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-color)',
    padding: '10px 4px',
    outline: 'none'
  },
  googleBigBtn: {
    marginTop: 4,
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #2563eb',
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  googleCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#ffffff',
    color: '#2563eb',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.86rem'
  },
  connectedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    background: 'var(--bg-color)',
    border: '1px solid var(--node-border)',
    marginBottom: 14
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  driveTag: {
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: 6,
    background: 'rgba(22, 163, 74, 0.12)',
    color: '#16a34a'
  },
  playerHudBar: {
    padding: '10px 20px',
    background: 'var(--bg-color)',
    borderBottom: '1px solid var(--node-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },
  varPill: {
    fontSize: '0.8rem',
    padding: '3px 10px',
    borderRadius: 999,
    background: 'var(--panel-bg)',
    border: '1px solid var(--node-border)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5
  },
  endingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 999,
    background: 'rgba(147, 51, 234, 0.16)',
    color: '#9333ea',
    fontSize: '0.76rem',
    fontWeight: 700
  },
  playerNotesBox: {
    padding: '12px 14px',
    borderRadius: 10,
    background: 'var(--bg-color)',
    border: '1px solid var(--node-border)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    opacity: 0.88,
    marginBottom: 16,
    whiteSpace: 'pre-wrap'
  },
  playerChoiceBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #2563eb',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    textAlign: 'left',
    fontSize: '0.92rem'
  },
  playerEndCard: {
    padding: 16,
    borderRadius: 12,
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap'
  },
  searchResultRow: {
    padding: '8px 10px',
    borderRadius: 8,
    background: 'var(--bg-color)',
    border: '1px solid var(--node-border)',
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '0.86rem'
  },
  condBox: {
    background: 'var(--bg-color)',
    padding: 12,
    borderRadius: 10,
    border: '1px solid var(--node-border)',
    marginBottom: 18
  },
  input: {
    padding: 8,
    borderRadius: 8,
    border: '1px solid var(--node-border)',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontFamily: 'inherit'
  },
  primaryBtn: {
    padding: '8px 16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600
  },
  dangerBtn: {
    padding: '8px 14px',
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600
  },
  toast: {
    position: 'fixed',
    bottom: 74,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    padding: '10px 18px',
    borderRadius: 30,
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 3000,
    fontSize: '0.88rem',
    fontWeight: 600,
    pointerEvents: 'none',
    animation: 'fadeIn 0.2s ease-out'
  }
};
