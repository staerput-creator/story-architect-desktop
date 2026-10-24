import React, { memo, useState } from 'react';
import { NodeResizer } from '@xyflow/react';
import { Palette, Trash2, Check, Edit3 } from 'lucide-react';
import { useStoryStore } from '../store';

const REGION_COLORS = [
  { id: 'blue', label: 'Синий', hex: '#3b82f6', rgba: 'rgba(59, 130, 246, 0.06)', headerBg: 'rgba(59, 130, 246, 0.18)' },
  { id: 'emerald', label: 'Изумрудный', hex: '#10b981', rgba: 'rgba(16, 185, 129, 0.06)', headerBg: 'rgba(16, 185, 129, 0.18)' },
  { id: 'purple', label: 'Фиолетовый', hex: '#8b5cf6', rgba: 'rgba(139, 92, 246, 0.06)', headerBg: 'rgba(139, 92, 246, 0.18)' },
  { id: 'amber', label: 'Янтарный', hex: '#f59e0b', rgba: 'rgba(245, 158, 11, 0.06)', headerBg: 'rgba(245, 158, 11, 0.18)' },
  { id: 'rose', label: 'Рубиновый', hex: '#ec4899', rgba: 'rgba(236, 72, 153, 0.06)', headerBg: 'rgba(236, 72, 153, 0.18)' }
];

function getColorMeta(colorHex) {
  return (
    REGION_COLORS.find((c) => c.hex.toLowerCase() === String(colorHex || '').toLowerCase()) || {
      id: 'custom',
      label: 'Акцент',
      hex: colorHex || '#3b82f6',
      rgba: 'rgba(59, 130, 246, 0.06)',
      headerBg: 'rgba(59, 130, 246, 0.18)'
    }
  );
}

const StoryRegionNode = memo(function StoryRegionNode({ id, data, selected }) {
  const updateRegion = useStoryStore((s) => s.updateRegion);
  const deleteRegion = useStoryStore((s) => s.deleteRegion);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(data?.title || 'Новая глава');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorMeta = getColorMeta(data?.color);
  const regionTitle = data?.title || 'Сюжетная область';
  const order = data?.order || 1;

  const commitTitle = () => {
    const trimmed = titleInput.trim() || 'Сюжетная область';
    setTitleInput(trimmed);
    updateRegion(id, { title: trimmed });
    setIsEditingTitle(false);
  };

  return (
    <div
      className="sa-region-container"
      style={{
        '--region-color': colorMeta.hex,
        width: '100%',
        height: '100%',
        minWidth: 300,
        minHeight: 200,
        borderRadius: 18,
        border: selected
          ? `2px dashed ${colorMeta.hex}`
          : `1.5px dashed ${colorMeta.hex}`,
        background: colorMeta.rgba,
        boxShadow: selected
          ? `0 0 0 3px ${colorMeta.headerBg}, inset 0 0 32px ${colorMeta.rgba}`
          : `inset 0 0 24px ${colorMeta.rgba}`,
        position: 'relative',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        userSelect: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s'
      }}
    >
      <NodeResizer
        minWidth={300}
        minHeight={200}
        isVisible={selected}
        lineStyle={{
          borderColor: colorMeta.hex,
          borderWidth: 1.5,
          pointerEvents: 'all'
        }}
        handleStyle={{
          width: 11,
          height: 11,
          borderRadius: 4,
          backgroundColor: colorMeta.hex,
          border: '2px solid var(--panel-bg, #0f172a)',
          pointerEvents: 'all'
        }}
        onResizeEnd={(_, params) => {
          if (params && Number.isFinite(params.width) && Number.isFinite(params.height)) {
            updateRegion(id, {
              x: Math.round(params.x),
              y: Math.round(params.y),
              width: Math.round(params.width),
              height: Math.round(params.height)
            });
          }
        }}
      />

      {/* Заголовок области в левом верхнем углу рамки */}
      <div
        className="sa-region-header"
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 12,
          background: 'var(--panel-bg, rgba(15, 23, 42, 0.86))',
          border: `1px solid ${colorMeta.hex}`,
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.22)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--text-color, #f8fafc)',
          pointerEvents: 'all',
          cursor: 'grab',
          maxWidth: 'calc(100% - 28px)',
          zIndex: 2
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 7px',
            borderRadius: 7,
            background: colorMeta.headerBg,
            color: colorMeta.hex,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            flexShrink: 0
          }}
        >
          🏷️ Глава {order}
        </span>

        {isEditingTitle ? (
          <div className="nodrag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleInput(regionTitle);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={commitTitle}
              autoFocus
              style={{
                padding: '3px 8px',
                fontSize: '0.86rem',
                fontWeight: 700,
                borderRadius: 6,
                border: `1px solid ${colorMeta.hex}`,
                background: 'var(--bg-color, #0f172a)',
                color: 'var(--text-color, #f8fafc)',
                width: 190
              }}
            />
            <button
              type="button"
              onClick={commitTitle}
              style={{
                background: colorMeta.hex,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Сохранить название"
            >
              <Check size={13} />
            </button>
          </div>
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setTitleInput(regionTitle);
              setIsEditingTitle(true);
            }}
            style={{
              fontWeight: 800,
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 260
            }}
            title="Двойной клик для переименования главы"
          >
            {regionTitle}
          </div>
        )}

        <div className="nodrag" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
          {!isEditingTitle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTitleInput(regionTitle);
                setIsEditingTitle(true);
              }}
              style={iconBtnStyle}
              title="Переименовать область"
            >
              <Edit3 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker((v) => !v);
            }}
            style={{ ...iconBtnStyle, color: colorMeta.hex }}
            title="Изменить цвет области"
          >
            <Palette size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteRegion(id);
            }}
            style={{ ...iconBtnStyle, color: '#ef4444' }}
            title="Удалить сюжетную область"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {showColorPicker && (
          <div
            className="nodrag"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              display: 'flex',
              gap: 6,
              padding: '6px 8px',
              borderRadius: 10,
              background: 'var(--panel-bg, #1e293b)',
              border: '1px solid var(--node-border, #334155)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
              zIndex: 10
            }}
          >
            {REGION_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  updateRegion(id, { color: c.hex });
                  setShowColorPicker(false);
                }}
                title={c.label}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: c.hex,
                  border: c.hex.toLowerCase() === colorMeta.hex.toLowerCase() ? '2px solid #ffffff' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-color, #cbd5e1)',
  opacity: 0.78,
  cursor: 'pointer',
  padding: 4,
  borderRadius: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default StoryRegionNode;
