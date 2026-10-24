import { v4 as uuid } from 'uuid';

const fail = (message) => { throw new Error(message); };
function text(value, field, max = 200, empty = false) {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) fail(`Invalid ${field}`);
  return value.trim();
}
function named(items, name) {
  const found = items.filter(item => item.name === name);
  if (found.length > 1) fail(`Ambiguous name: ${name}`);
  return found[0];
}

// Deterministic, cycle-safe layout. Row height includes every choice port.
export function layoutNodes(nodes, edges) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const visited = new Set();
  const levels = new Map();
  for (const root of [...nodes.filter(node => node.data?.type === 'start'), ...nodes]) {
    if (visited.has(root.id)) continue;
    const queue = [{ id: root.id, level: 0 }];
    visited.add(root.id);
    for (let index = 0; index < queue.length; index++) {
      const { id, level } = queue[index];
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level).push(id);
      for (const edge of edges.filter(edge => edge.source === id)) {
        if (byId.has(edge.target) && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push({ id: edge.target, level: level + 1 });
        }
      }
    }
  }
  const positions = new Map();
  for (const [level, ids] of levels) {
    let y = 80;
    for (const id of ids) {
      const node = byId.get(id);
      const choices = new Set([...(node.data?.choices || []).map(choice => choice.id), ...edges.filter(edge => edge.source === id).map(edge => edge.sourceHandle || edge.id)]);
      positions.set(id, { x: 80 + level * 380, y });
      y += Math.max(230, choices.size * 28 + 170);
    }
  }
  return nodes.map(node => ({ ...node, position: positions.get(node.id) }));
}

export function executeStoryCommand(store, tool, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Arguments must be an object');
  const state = store.getState();
  const { nodes, edges, characters, variables, groups } = state;
  if (tool === 'get_story_overview') return {
    project: state.projectMeta,
    scenes: nodes.map(node => ({ id: node.id, title: node.data?.label || '', nodeType: node.data?.type || 'scene', notes: node.data?.notes || '', position: node.position,
      dialogue: (node.data?.dialogue || []).map(line => ({ characterName: characters.find(character => character.id === line.charId)?.name || '', text: line.text })),
      choices: node.data?.choices || [], effects: node.data?.effects || [] })),
    branches: edges.map(edge => ({ id: edge.id, fromSceneId: edge.source, toSceneId: edge.target, choiceText: edge.label, conditions: edge.data?.conditions || [], effects: edge.data?.effects || [] })),
    characters: characters.map(character => ({ ...character, faction: groups.find(group => group.id === character.groupId)?.name || '' })),
    variables, factions: groups
  };
  let patch;
  let result;
  if (tool === 'create_scene_node') {
    const title = text(input.title, 'title');
    const notes = text(input.notes ?? '', 'notes', 20000, true);
    if (!['start', 'scene', 'decision', 'ending'].includes(input.nodeType)) fail('Invalid nodeType');
    const dialogue = input.dialogue ?? [];
    if (!Array.isArray(dialogue) || dialogue.length > 500) fail('Invalid dialogue');
    let parent = nodes.at(-1);
    if (input.parentSceneId !== undefined) {
      parent = nodes.find(node => node.id === text(input.parentSceneId, 'parentSceneId'));
      if (!parent) fail('Parent scene not found');
    }
    const nextCharacters = [...characters];
    const lines = dialogue.map(line => {
      if (!line || typeof line !== 'object') fail('Invalid dialogue line');
      const characterName = text(line.characterName, 'characterName', 200, true);
      const lineText = text(line.text, 'text', 20000, true);
      let character = characterName ? named(nextCharacters, characterName) : null;
      if (characterName && !character) {
        character = { id: uuid(), name: characterName, color: '#2563eb', groupId: 'default' };
        nextCharacters.push(character);
      }
      return { charId: character?.id || '', text: lineText };
    });
    const id = uuid();
    const position = { x: (parent?.position.x ?? -300) + 380, y: parent?.position.y ?? 80 };
    while (nodes.some(node => Math.abs(node.position.x - position.x) < 260 && Math.abs(node.position.y - position.y) < Math.max(230, (node.data?.choices?.length || 0) * 28 + 170))) position.y += 260;
    const node = { id, type: 'storyNode', position, data: { label: title, notes, type: input.nodeType, dialogue: lines, effects: [], choices: [], imageId: null }, className: input.nodeType === 'decision' ? 'decision-node' : '' };
    patch = { nodes: [...nodes, node], characters: nextCharacters };
    result = { sceneId: id, position };
  } else if (tool === 'create_choice_branch') {
    const source = nodes.find(node => node.id === text(input.fromSceneId, 'fromSceneId'));
    const target = nodes.find(node => node.id === text(input.toSceneId, 'toSceneId'));
    if (!source || !target) fail('Source or target scene not found');
    if (source.data?.type === 'ending') fail('An ending cannot have outgoing choices');
    const label = text(input.choiceText, 'choiceText', 2000);
    const requested = input.conditions ?? [];
    if (!Array.isArray(requested) || requested.length > 100) fail('Invalid conditions');
    const conditions = requested.map(condition => {
      if (!condition || typeof condition !== 'object') fail('Invalid condition');
      const variable = named(variables, text(condition.varName, 'varName'));
      if (!variable) fail(`Unknown variable: ${condition.varName}`);
      if (!['==', '!=', '>', '<', '>=', '<='].includes(condition.operator)) fail('Invalid operator');
      if (typeof condition.value !== variable.type || (variable.type === 'number' && !Number.isFinite(condition.value))) fail('Condition value must match variable type');
      if (variable.type === 'boolean' && !['==', '!='].includes(condition.operator)) fail('Boolean conditions support == and != only');
      return { varId: variable.id, operator: condition.operator, value: condition.value, logicalOp: 'AND' };
    });
    const choiceId = `choice-${uuid()}`;
    const edge = { id: uuid(), type: 'storyEdge', source: source.id, sourceHandle: choiceId, target: target.id, label, data: { choiceId, conditions, effects: [] } };
    const nextEdges = [...edges, edge];
    const nextNodes = nodes.map(node => node.id === source.id ? { ...node, data: { ...node.data, choices: [...(node.data?.choices || []), { id: choiceId, label }] } } : node);
    patch = { nodes: layoutNodes(nextNodes, nextEdges), edges: nextEdges };
    result = { edgeId: edge.id, choiceId };
  } else if (tool === 'manage_character') {
    const name = text(input.name, 'name');
    const faction = text(input.faction, 'faction');
    if (typeof input.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(input.color)) fail('Invalid color');
    const existing = named(characters, name);
    const group = named(groups, faction) || { id: uuid(), name: faction };
    const character = { ...existing, id: existing?.id || uuid(), name, groupId: group.id, color: input.color };
    patch = { groups: groups.some(item => item.id === group.id) ? groups : [...groups, group], characters: existing ? characters.map(item => item.id === existing.id ? character : item) : [...characters, character] };
    result = { characterId: character.id, factionId: group.id };
  } else if (tool === 'manage_variable') {
    const name = text(input.name, 'name');
    if (!['boolean', 'number'].includes(input.type) || typeof input.initialValue !== input.type || (input.type === 'number' && !Number.isFinite(input.initialValue))) fail('initialValue must match variable type');
    const existing = named(variables, name);
    if (existing && existing.type !== input.type) fail('Cannot change type of an existing variable');
    const variable = { id: existing?.id || uuid(), name, type: input.type, initialValue: input.initialValue };
    patch = { variables: existing ? variables.map(item => item.id === existing.id ? variable : item) : [...variables, variable] };
    result = { variableId: variable.id };
  } else if (tool === 'autolayout_canvas') {
    patch = { nodes: layoutNodes(nodes, edges) };
    result = { scenesCount: nodes.length };
  } else fail(`Unknown tool: ${tool}`);
  // One atomic update per command, tracked by the existing Zundo history.
  store.setState({ ...patch, projectMeta: { ...state.projectMeta, updatedAt: new Date().toISOString() } });
  return { ...result, saved: false, message: 'Applied to live editor. Use Save to persist the project.' };
}