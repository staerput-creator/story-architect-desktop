import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getConditions, normalizeEdges, evaluateConditions, edgeGeometry } from '../src/graph/conditions.js';

test('legacy conditions migrate without loss and customOffset is preserved', () => {
  const old = {
    id: 'e',
    data: {
      condition: { varId: 'oxygen', operator: '>=', value: 70 },
      customOffset: { x: 25, y: -40 },
      effects: []
    }
  };
  const [edge] = normalizeEdges([old]);
  assert.equal(edge.data.conditions.length, 1);
  assert.equal(edge.data.condition, undefined);
  assert.equal(edge.data.conditions[0].value, 70);
  assert.deepEqual(edge.data.customOffset, { x: 25, y: -40 });
  assert.equal(getConditions({ conditions: [], condition: old.data.condition }).length, 0);
});

test('AND has precedence over OR', () => {
  const conditions = [
    { value: true },
    { logicalOp: 'OR', value: false },
    { logicalOp: 'AND', value: false }
  ];
  assert.equal(evaluateConditions(conditions, (c) => c.value), true);
  assert.equal(evaluateConditions([], () => false), true);
  assert.equal(
    evaluateConditions([{ value: true }, { logicalOp: 'AND', value: false }], (c) => c.value),
    false
  );
});

test('parallel cubic paths and their exact midpoint labels diverge + customOffset shifts midpoint', () => {
  const points = { sourceX: 0, sourceY: 0, targetX: 400, targetY: 0 };
  const lanes = [-1, 0, 1].map((lane) => edgeGeometry(points, lane));
  assert.equal(new Set(lanes.map((l) => l.path)).size, 3);
  assert.deepEqual(lanes.map((l) => l.y), [-140, 0, 140]);
  assert.ok(lanes.every((l) => l.x === 200));

  const bent = edgeGeometry({ ...points, customOffset: { x: 30, y: -60 } }, 0);
  assert.equal(Math.round(bent.x), 230);
  assert.equal(Math.round(bent.y), -60);
});
