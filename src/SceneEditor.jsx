import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStoryStore, assetStorage } from './store';
import {
  X, Trash2, Plus, Image as ImageIcon, Loader2, Zap, GitBranch, ArrowUp, ArrowDown, Archive
} from 'lucide-react';

export default function SceneEditor({ nodeId, onClose, onSelectNode }) {
  const {
    nodes, edges, updateNodeData, deleteNode, stashNode, addConnectedScene,
    updateEdgeData, deleteEdge, onConnect,
    characters, groups, variables, showToast
  } = useStoryStore();

  const node = nodes.find((n) => n.id === nodeId);
  const fileInputRef = useRef(null);

  const [isCompressing, setIsCompressing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newBranchLabel, setNewBranchLabel] = useState('');
  const [newBranchTargetId, setNewBranchTargetId] = useState('__new__');

  if (!node) return null;

  const label = node.data?.label || '';
  const nodeType = node.data?.type || 'scene';
  const notes = node.data?.notes || '';
  const image = node.data?.imageId
    ? assetStorage.getAsset(node.data.imageId)
    : node.data?.image || null;
  const dialogue = node.data?.dialogue || [];
  const effects = node.data?.effects || [];
  const outgoingEdges = edges.filter((e) => e.source === nodeId);

  const compressImage = (file, maxWidth = 800, quality = 0.72) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Пожалуйста, выберите файл изображения', 'error');
      return;
    }
    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      const imageId = assetStorage.registerAsset(compressed);
      updateNodeData(nodeId, { imageId });
      showToast('Фон сцены оптимизирован и сохранён в пул ассетов', 'success');
    } catch {
      showToast('Ошибка при обработке изображения', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const addLine = () => {
    const defaultCharId = characters[0]?.id || '';
    updateNodeData(nodeId, {
      dialogue: [...dialogue, { charId: defaultCharId, text: '' }]
    });
  };

  const updateLine = (idx, key, val) => {
    updateNodeData(nodeId, {
      dialogue: dialogue.map((line, i) => (i === idx ? { ...line, [key]: val } : line))
    });
  };

  const moveLine = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= dialogue.length) return;
    const copy = [...dialogue];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    updateNodeData(nodeId, { dialogue: copy });
  };

  const deleteLine = (idx) => {
    updateNodeData(nodeId, {
      dialogue: dialogue.filter((_, i) => i !== idx)
    });
  };

  const addEffect = () => {
    if (variables.length === 0) {
      showToast('Сначала создайте переменную в разделе «Переменные»', 'info');
      return;
    }
    const firstVar = variables[0];
    const newEf = {
      id: `ef-${uuidv4()}`,
      varId: firstVar.id,
      action: firstVar.type === 'boolean' ? 'set' : 'add',
      value: firstVar.type === 'boolean' ? true : 1
    };
    updateNodeData(nodeId, { effects: [...effects, newEf] });
  };

  const updateEffect = (efId, patch) => {
    updateNodeData(nodeId, {
      effects: effects.map((ef) => {
        if (ef.id !== efId) return ef;
        const merged = { ...ef, ...patch };
        if (patch.varId) {
          const v = variables.find((x) => x.id === patch.varId);
          if (v?.type === 'boolean') {
            merged.action = 'set';
            merged.value = true;
          } else {
            merged.action = 'add';
            merged.value = 1;
          }
        }
        return merged;
      })
    });
  };

  const removeEffect = (efId) => {
    updateNodeData(nodeId, {
      effects: effects.filter((ef) => ef.id !== efId)
    });
  };

  const handleCreateBranch = () => {
    const choiceText = newBranchLabel.trim() || 'Далее →';
    if (newBranchTargetId === '__new__') {
      addConnectedScene(nodeId, choiceText, 'scene');
      showToast('Создана новая связанная сцена', 'success');
    } else {
      onConnect({ source: nodeId, target: newBranchTargetId });
      setTimeout(() => {
        const latestEdges = useStoryStore.getState().edges;
        const created = latestEdges[latestEdges.length - 1];
        if (created) updateEdgeData(created.id, choiceText, null);
      }, 10);
      showToast('Переход добавлен', 'success');
    }
    setNewBranchLabel('');
  };

  return (
    <div style={styles.drawer}>
      <div style={styles.header}>
        <div style={{ flex: 1, marginRight: 8 }}>
          <input
            value={label}
            onChange={(e) => updateNodeData(nodeId, { label: e.target.value })}
            style={styles.titleInput}
            placeholder="Название сцены..."
          />
          <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: 2 }}>
            Все изменения сохраняются автоматически
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn} title="Закрыть панель">
          <X size={20} />
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <label style={styles.label}>Тип узла в игре:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { id: 'start', title: '🚀 Старт' },
              { id: 'scene', title: '🎬 Сцена' },
              { id: 'decision', title: '🔀 Развилка' },
              { id: 'ending', title: '🏁 Финал' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => updateNodeData(nodeId, { type: t.id })}
                style={{
                  ...styles.typeBtn,
                  ...(nodeType === t.id ? styles.typeBtnActive : {})
                }}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          {image ? (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img
                src={image}
                alt="Scene background"
                style={{ width: '100%', borderRadius: 10, maxHeight: 190, objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={() => updateNodeData(nodeId, { imageId: null })}
                style={styles.removeImgBtn}
                title="Удалить иллюстрацию"
              >
                <Trash2 size={15} color="white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => !isCompressing && fileInputRef.current?.click()}
              style={{
                ...styles.uploadPlaceholder,
                opacity: isCompressing ? 0.6 : 1,
                cursor: isCompressing ? 'wait' : 'pointer'
              }}
            >
              {isCompressing ? (
                <>
                  <Loader2 size={24} className="spin" style={{ marginBottom: 4 }} />
                  <span style={{ fontSize: '0.82rem' }}>Сжатие иллюстрации...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={24} style={{ opacity: 0.55, marginBottom: 4 }} />
                  <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>Загрузить фон сцены (авто-сжатие)</span>
                </>
              )}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Описание локации / Текст от автора:</label>
          <textarea
            value={notes}
            onChange={(e) => updateNodeData(nodeId, { notes: e.target.value })}
            style={styles.notesArea}
            placeholder="Опишите атмосферу, окружение или события в начале сцены..."
          />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={15} color="#eab308" /> Эффекты при входе в сцену ({effects.length})
            </span>
            <button onClick={addEffect} style={styles.smallBtn}>
              + Эффект
            </button>
          </div>
          {effects.map((ef) => {
            const v = variables.find((x) => x.id === ef.varId);
            return (
              <div key={ef.id} style={styles.effectRow}>
                <select
                  value={ef.varId}
                  onChange={(e) => updateEffect(ef.id, { varId: e.target.value })}
                  style={{ ...styles.select, flex: 1 }}
                >
                  {variables.map((variable) => (
                    <option key={variable.id} value={variable.id}>
                      {variable.name}
                    </option>
                  ))}
                </select>
                {v?.type === 'boolean' ? (
                  <select
                    value={String(ef.value)}
                    onChange={(e) => updateEffect(ef.id, { action: 'set', value: e.target.value === 'true' })}
                    style={styles.select}
                  >
                    <option value="true">= Получить (Да)</option>
                    <option value="false">= Убрать (Нет)</option>
                  </select>
                ) : (
                  <>
                    <select
                      value={ef.action || 'add'}
                      onChange={(e) => updateEffect(ef.id, { action: e.target.value })}
                      style={styles.select}
                    >
                      <option value="add">+ Прибавить</option>
                      <option value="sub">- Отнять</option>
                      <option value="set">= Установить</option>
                    </select>
                    <input
                      type="number"
                      value={ef.value}
                      onChange={(e) => updateEffect(ef.id, { value: Number(e.target.value) })}
                      style={{ ...styles.select, width: 64 }}
                    />
                  </>
                )}
                <button onClick={() => removeEffect(ef.id)} style={styles.delBtn}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              💬 Реплики и диалоги ({dialogue.length})
            </span>
          </div>

          {dialogue.map((line, idx) => {
            const char = characters.find((c) => c.id === line.charId) || {};
            return (
              <div
                key={idx}
                style={{
                  ...styles.lineRow,
                  borderLeft: `4px solid ${char.color || '#64748b'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                  <select
                    value={line.charId}
                    onChange={(e) => updateLine(idx, 'charId', e.target.value)}
                    style={styles.charSelect}
                  >
                    <option value="">Без персонажа (Автор)</option>
                    {groups.map((g) => {
                      const groupChars = characters.filter((c) => c.groupId === g.id);
                      if (groupChars.length === 0) return null;
                      return (
                        <optgroup key={g.id} label={g.name}>
                          {groupChars.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => moveLine(idx, -1)} style={styles.miniIconBtn} title="Выше">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => moveLine(idx, 1)} style={styles.miniIconBtn} title="Ниже">
                      <ArrowDown size={13} />
                    </button>
                    <button onClick={() => deleteLine(idx)} style={styles.delBtn} title="Удалить реплику">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={line.text}
                  onChange={(e) => updateLine(idx, 'text', e.target.value)}
                  style={styles.lineText}
                  placeholder="Введите реплику персонажа..."
                />
              </div>
            );
          })}

          <button onClick={addLine} style={styles.addBtn}>
            <Plus size={16} style={{ marginRight: 6 }} /> Добавить реплику
          </button>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GitBranch size={15} color="#2563eb" /> Выходы и варианты выбора ({outgoingEdges.length})
            </span>
          </div>

          {outgoingEdges.map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            return (
              <div key={edge.id} style={styles.branchItem}>
                <div style={{ flex: 1 }}>
                  <input
                    value={edge.label || ''}
                    onChange={(e) => updateEdgeData(edge.id, e.target.value, edge.data?.conditions || edge.data?.condition)}
                    placeholder="Текст выбора..."
                    style={styles.branchInput}
                  />
                  <div style={{ fontSize: '0.74rem', opacity: 0.7, marginTop: 4 }}>
                    Ведёт в:{' '}
                    <b
                      style={{ color: '#2563eb', cursor: 'pointer' }}
                      onClick={() => targetNode && onSelectNode && onSelectNode(targetNode.id)}
                    >
                      {targetNode?.data?.label || 'Удалённая сцена'}
                    </b>
                  </div>
                </div>
                <button onClick={() => deleteEdge(edge.id)} style={styles.delBtn} title="Удалить переход">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}

          <div style={styles.newBranchBox}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>
              Быстро добавить вариант ответа / переход:
            </div>
            <input
              value={newBranchLabel}
              onChange={(e) => setNewBranchLabel(e.target.value)}
              placeholder="Текст ответа игрока (напр. Открыть сундук)"
              style={{ ...styles.branchInput, marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={newBranchTargetId}
                onChange={(e) => setNewBranchTargetId(e.target.value)}
                style={{ ...styles.select, flex: 1 }}
              >
                <option value="__new__">✨ Создать новую сцену автоматически</option>
                {nodes
                  .filter((n) => n.id !== nodeId)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      Вести в: {n.data?.label}
                    </option>
                  ))}
              </select>
              <button onClick={handleCreateBranch} style={styles.smallPrimaryBtn}>
                + Создать
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--node-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stashNode && (
            <button
              type="button"
              onClick={() => {
                stashNode(nodeId);
                onClose();
              }}
              style={styles.stashBtn}
            >
              <Archive size={16} style={{ marginRight: 6 }} /> Убрать сцену в карман (отложить)
            </button>
          )}

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={styles.dangerBtn}>
              <Trash2 size={16} style={{ marginRight: 6 }} /> Удалить эту сцену
            </button>
          ) : (
            <div style={styles.confirmRow}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Точно удалить сцену?</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    deleteNode(nodeId);
                    showToast('Сцена удалена', 'info');
                    onClose();
                  }}
                  style={styles.confirmDangerBtn}
                >
                  Да, удалить
                </button>
                <button onClick={() => setConfirmDelete(false)} style={styles.smallBtn}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  drawer: {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: 'min(460px, 100vw)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    boxShadow: '-8px 0 30px rgba(0,0,0,0.35)',
    borderLeft: '1px solid var(--node-border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 2200
  },
  header: {
    padding: '14px 18px',
    borderBottom: '1px solid var(--node-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-color)'
  },
  titleInput: {
    fontSize: '1.1rem',
    fontWeight: 700,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-color)',
    width: '100%',
    outline: 'none',
    padding: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-color)',
    padding: 6,
    borderRadius: 6
  },
  content: {
    padding: '16px 18px 80px 18px',
    overflowY: 'auto',
    flex: 1
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontSize: '0.8rem',
    fontWeight: 600,
    opacity: 0.8
  },
  typeBtn: {
    padding: '7px 4px',
    borderRadius: 8,
    border: '1px solid var(--node-border)',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  typeBtnActive: {
    borderColor: '#2563eb',
    background: 'rgba(37, 99, 235, 0.16)',
    color: '#2563eb'
  },
  notesArea: {
    width: '100%',
    height: 76,
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    border: '1px solid var(--node-border)',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontSize: '0.88rem'
  },
  effectRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginBottom: 6,
    background: 'var(--bg-color)',
    padding: 8,
    borderRadius: 8,
    border: '1px solid var(--node-border)'
  },
  select: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--node-border)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    fontSize: '0.8rem'
  },
  lineRow: {
    marginBottom: 10,
    background: 'var(--bg-color)',
    padding: 10,
    borderRadius: 8,
    border: '1px solid var(--node-border)'
  },
  charSelect: {
    flex: 1,
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid var(--node-border)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    fontSize: '0.82rem',
    fontWeight: 600
  },
  lineText: {
    width: '100%',
    minHeight: 54,
    resize: 'vertical',
    padding: 8,
    borderRadius: 6,
    border: '1px solid var(--node-border)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    fontFamily: 'inherit',
    fontSize: '0.88rem',
    boxSizing: 'border-box'
  },
  miniIconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-color)',
    opacity: 0.65,
    cursor: 'pointer',
    padding: 4
  },
  delBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: 4
  },
  addBtn: {
    width: '100%',
    padding: 10,
    background: 'var(--bg-color)',
    border: '1px dashed var(--node-border)',
    color: 'var(--text-color)',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 600,
    fontSize: '0.86rem'
  },
  branchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    background: 'var(--bg-color)',
    border: '1px solid var(--node-border)',
    marginBottom: 8
  },
  branchInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--node-border)',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    fontSize: '0.84rem',
    boxSizing: 'border-box'
  },
  newBranchBox: {
    padding: 10,
    borderRadius: 8,
    background: 'var(--bg-color)',
    border: '1px dashed var(--node-border)'
  },
  smallBtn: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid var(--node-border)',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 600
  },
  smallPrimaryBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  uploadPlaceholder: {
    border: '2px dashed var(--node-border)',
    borderRadius: 10,
    padding: '20px 12px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-color)'
  },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(220, 38, 38, 0.85)',
    border: 'none',
    borderRadius: 6,
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stashBtn: {
    width: '100%',
    padding: 11,
    background: 'rgba(37, 99, 235, 0.14)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.45)',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 700
  },
  dangerBtn: {
    width: '100%',
    padding: 11,
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 700
  },
  confirmRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444'
  },
  confirmDangerBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#ef4444',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer'
  }
};
