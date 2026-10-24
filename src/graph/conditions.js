export function getConditions(data = {}) {
  data = data || {};
  return (Array.isArray(data.conditions) ? data.conditions : data.condition ? [data.condition] : [])
    .filter((c) => c && c.varId)
    .map((c) => ({ ...c, logicalOp: c.logicalOp === 'OR' ? 'OR' : 'AND' }));
}

// AND has precedence over OR. The connector belongs to the condition following it.
export function evaluateConditions(conditions, predicate) {
  if (!conditions.length) return true;
  let group = predicate(conditions[0]);
  let result = false;
  for (let i = 1; i < conditions.length; i++) {
    const value = predicate(conditions[i]);
    if (conditions[i].logicalOp === 'OR') {
      result = result || group;
      group = value;
    } else group = group && value;
  }
  return result || group;
}

export function normalizeEdges(edges = []) {
  return edges.map((edge) => {
    const { condition: _legacy, ...data } = edge.data || {};
    const choiceId = data.choiceId || edge.sourceHandle || `choice-${edge.id}`;
    const rawOffset = data.customOffset;
    const customOffset =
      rawOffset && Number.isFinite(rawOffset.x) && Number.isFinite(rawOffset.y)
        ? { x: Number(rawOffset.x), y: Number(rawOffset.y) }
        : null;
    return {
      ...edge,
      sourceHandle: choiceId,
      type: 'storyEdge',
      data: { ...data, choiceId, customOffset, conditions: getConditions(edge.data) }
    };
  });
}

export function edgeGeometry(
  { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty, customOffset = null, data = null },
  lane = 0,
  spacing = 140
) {
  const offset = lane * spacing;
  const reach = Math.max(70, Math.abs(tx - sx) * 0.45);
  const activeOffset = customOffset || data?.customOffset || null;
  const dx = Number.isFinite(activeOffset?.x) ? activeOffset.x : 0;
  const dy = Number.isFinite(activeOffset?.y) ? activeOffset.y : 0;
  const cx1 = sx + reach + (dx * 4) / 3;
  const cx2 = tx - reach + (dx * 4) / 3;
  const cy1 = sy + (offset * 4) / 3 + (dy * 4) / 3;
  const cy2 = ty + (offset * 4) / 3 + (dy * 4) / 3;
  return {
    path: `M ${sx},${sy} C ${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`,
    x: (sx + 3 * cx1 + 3 * cx2 + tx) / 8,
    y: (sy + 3 * cy1 + 3 * cy2 + ty) / 8
  };
}
