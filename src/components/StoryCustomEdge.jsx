import React, { memo, useState, useRef, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { useStoryStore } from '../store';
import { edgeGeometry, getConditions } from '../graph/conditions';

function getEdgePortSourceY(edge, nodes, edges) {
  if (Number.isFinite(edge?.sourceY)) return Number(edge.sourceY);
  if (Number.isFinite(edge?.data?.sourceY)) return Number(edge.data.sourceY);

  const srcNode = (nodes || []).find((n) => n.id === edge.source);
  const baseY = Number.isFinite(srcNode?.position?.y) ? srcNode.position.y : 0;

  const existingChoices = Array.isArray(srcNode?.data?.choices) ? srcNode.data.choices : [];
  const connectedChoices = (edges || [])
    .filter((ed) => ed.source === edge.source)
    .map((ed) => ({ id: ed.sourceHandle || ed.data?.choiceId }));

  const orderedChoiceIds = [];
  [...existingChoices, ...connectedChoices].forEach((ch) => {
    if (ch?.id && !orderedChoiceIds.includes(ch.id)) {
      orderedChoiceIds.push(ch.id);
    }
  });

  const handleId = edge.sourceHandle || edge.data?.choiceId;
  const choiceIndex = orderedChoiceIds.indexOf(handleId);
  if (choiceIndex >= 0) {
    return baseY + 54 + choiceIndex * 28;
  }

  const outgoingFromSource = (edges || []).filter((ed) => ed.source === edge.source);
  const fallbackIndex = outgoingFromSource.findIndex((ed) => ed.id === edge.id);
  return baseY + 54 + Math.max(0, fallbackIndex) * 28;
}

export default memo(function StoryCustomEdge(props) {
  const edges = useStoryStore((s) => s.edges);
  const nodes = useStoryStore((s) => s.nodes);
  const variables = useStoryStore((s) => s.variables);
  const updateEdgeOffset = useStoryStore((s) => s.updateEdgeOffset);
  const { getZoom } = useReactFlow();

  const [dragOffset, setDragOffset] = useState(null);
  const didDragRef = useRef(false);

  // Сортируем параллельные ребра строго по вертикальному положению исходящего порта (sourceY)
  const siblings = edges
    .filter(
      (e) =>
        (e.source === props.source && e.target === props.target) ||
        (e.source === props.target && e.target === props.source)
    )
    .sort((a, b) => {
      const syA = getEdgePortSourceY(a, nodes, edges);
      const syB = getEdgePortSourceY(b, nodes, edges);
      if (syA !== syB) return syA - syB;
      return edges.indexOf(a) - edges.indexOf(b);
    });

  const lane =
    siblings.length > 1
      ? siblings.findIndex((e) => e.id === props.id) - (siblings.length - 1) / 2
      : 0;

  const spacing =
    140 +
    Math.ceil(Math.max(0, ...siblings.map((e) => getConditions(e.data).length)) / 2) * 34;

  const storedOffset = props.data?.customOffset || null;
  const activeOffset = dragOffset !== null ? dragOffset : storedOffset;

  const geometry = edgeGeometry(
    { ...props, customOffset: activeOffset },
    lane,
    spacing
  );

  const conditions = getConditions(props.data);
  const text = String(props.label || '').replace(/\s*\[🔒[^\]]*\]/g, '').trim();
  const legacyBadges = conditions.length
    ? []
    : [...String(props.label || '').matchAll(/\[🔒([^\]]*)\]/g)].map((m) => m[1]);

  const handleLabelMouseDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.stopPropagation();

      const zoom = typeof getZoom === 'function' ? getZoom() || 1 : 1;
      const startX = event.clientX;
      const startY = event.clientY;
      const baseOffsetX = Number(activeOffset?.x) || 0;
      const baseOffsetY = Number(activeOffset?.y) || 0;

      didDragRef.current = false;
      let latestOffset = activeOffset;

      const onMouseMove = (moveEvent) => {
        const rawDx = moveEvent.clientX - startX;
        const rawDy = moveEvent.clientY - startY;
        if (!didDragRef.current && Math.hypot(rawDx, rawDy) < 4) return;
        didDragRef.current = true;
        latestOffset = {
          x: Math.round(baseOffsetX + rawDx / zoom),
          y: Math.round(baseOffsetY + rawDy / zoom)
        };
        setDragOffset(latestOffset);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (didDragRef.current && latestOffset) {
          updateEdgeOffset?.(props.id, latestOffset);
        }
        setDragOffset(null);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [activeOffset, getZoom, props.id, updateEdgeOffset]
  );

  const handleLabelDoubleClick = useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      setDragOffset(null);
      updateEdgeOffset?.(props.id, null);
    },
    [props.id, updateEdgeOffset]
  );

  return (
    <>
      <BaseEdge
        id={props.id}
        path={geometry.path}
        markerEnd={props.markerEnd}
        interactionWidth={24}
        style={{
          ...props.style,
          stroke: props.selected
            ? '#2563eb'
            : conditions.length
            ? '#f59e0b'
            : 'var(--dots-color)',
          strokeWidth: props.selected ? 2.8 : 2.2
        }}
      />
      {(text || conditions.length > 0 || legacyBadges.length > 0) && (
        <EdgeLabelRenderer>
          <div
            className="edge-label-pill nodrag nopan"
            onMouseDown={handleLabelMouseDown}
            onDoubleClick={handleLabelDoubleClick}
            onClick={(e) => {
              if (didDragRef.current) {
                e.stopPropagation();
                didDragRef.current = false;
              }
            }}
            title="Зажмите ЛКМ и потяните для изгиба дуги • Двойной клик — сброс изгиба"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${geometry.x}px, ${geometry.y}px)`,
              cursor: dragOffset ? 'grabbing' : 'grab',
              userSelect: 'none',
              borderColor: activeOffset ? '#3b82f6' : undefined
            }}
          >
            {text && <span>{text}</span>}
            {(conditions.length > 0 || legacyBadges.length > 0) && (
              <div className="condition-chips">
                {conditions.map((c, i) => (
                  <span className="condition-chip" key={`${c.varId}-${i}`}>
                    {i > 0 && <b>{c.logicalOp} </b>}🔒{' '}
                    {variables.find((v) => v.id === c.varId)?.name || c.varId} {c.operator}{' '}
                    {String(c.value)}
                  </span>
                ))}
                {legacyBadges.map((badge, i) => (
                  <span className="condition-chip" key={i}>
                    🔒 {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
