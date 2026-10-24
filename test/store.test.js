import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import vm from 'node:vm';

test('real store: parallel edges, regions, stash, customOffset, import, undo/redo, and image isolation', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] }
  });
  try {
    const { useStoryStore: store, assetStorage } = await vite.ssrLoadModule('/src/store.js');
    globalThis.document = { body: { className: '' } };
    const node = (id) => ({
      id,
      type: 'storyNode',
      position: { x: 0, y: 0 },
      data: { label: id, type: 'scene', choices: [] }
    });
    store.setState({ nodes: [node('a'), node('b')], edges: [], regions: [], stashedNodes: [] });
    store.temporal.getState().clear();
    const connect = () =>
      store.getState().onConnect({ source: 'a', target: 'b', sourceHandle: 'choice-add' });
    connect();
    connect();
    connect();
    let state = store.getState();
    assert.equal(state.edges.length, 3);
    assert.equal(new Set(state.edges.map((e) => e.id)).size, 3);
    assert.equal(state.nodes[0].data.choices.length, 3);
    assert.ok(state.edges.every((e) => e.sourceHandle === e.data.choiceId));
    const sharedHandle = state.edges[0].sourceHandle;
    state.onConnect({ source: 'a', target: 'b', sourceHandle: sharedHandle });
    assert.equal(store.getState().edges.length, 4, 'same ports must also allow parallel edges');
    store.temporal.getState().undo();
    assert.equal(store.getState().edges.length, 3);
    assert.equal(store.getState().nodes[0].data.choices.length, 3);
    store.temporal.getState().undo();
    assert.equal(store.getState().nodes[0].data.choices.length, 2);
    store.temporal.getState().redo();
    assert.equal(store.getState().nodes[0].data.choices.length, 3);

    // Custom edge offset and reset
    const firstEdgeId = store.getState().edges[0].id;
    store.getState().updateEdgeOffset(firstEdgeId, { x: 45, y: -80 });
    assert.deepEqual(store.getState().edges[0].data.customOffset, { x: 45, y: -80 });
    store.getState().updateEdgeOffset(firstEdgeId, null);
    assert.equal(store.getState().edges[0].data.customOffset, null);

    // Regions creation, update, reorder, and persistence
    const reg1 = store.getState().addRegion({ x: 100, y: 120 }, { title: 'Замок', color: '#10b981' });
    const reg2 = store.getState().addRegion({ x: 700, y: 120 }, { title: 'Катакомбы', color: '#8b5cf6' });
    assert.equal(store.getState().regions.length, 2);
    store.getState().reorderRegions(0, 1);
    assert.equal(store.getState().regions[0].id, reg2);
    assert.equal(store.getState().regions[1].id, reg1);

    // Scene Stash (pocket)
    store.getState().stashNode('b');
    assert.equal(store.getState().nodes.length, 1);
    assert.equal(store.getState().stashedNodes.length, 1);
    store.getState().unstashNode('b', { x: 520, y: 310 });
    assert.equal(store.getState().nodes.length, 2);
    assert.equal(store.getState().stashedNodes.length, 0);
    assert.deepEqual(store.getState().nodes.find((n) => n.id === 'b').position, { x: 520, y: 310 });

    state = store.getState();
    const project = state.getSerializableData();
    assert.equal(project.regions.length, 2);
    assert.equal(await state.importProject(project, false), true);
    assert.equal(store.getState().nodes[0].data.choices.length, 3, 'import must retain choices');
    assert.equal(store.getState().regions.length, 2, 'import must retain regions');

    store.getState().updateNodeData('a', { image: 'data:image/png;base64,first' });
    store.getState().updateNodeData('a', { image: 'data:image/png;base64,second' });
    assert.ok(store.getState().nodes[0].data.imageId);
    assert.equal(store.getState().nodes[0].data.image, undefined);
    assert.ok(!JSON.stringify(store.temporal.getState().pastStates).includes('data:image/'));
    store.temporal.getState().undo();
    assert.equal(assetStorage.getAsset(store.getState().nodes[0].data.imageId), 'data:image/png;base64,first');

    assetStorage.registerAsset('data:image/png;base64,original', 'img_collision');
    const imported = {
      nodes: [{ data: { imageId: 'img_collision' } }],
      assetsMap: { img_collision: 'data:image/png;base64,imported' }
    };
    assetStorage.hydrateFromProject(imported);
    assert.notEqual(imported.nodes[0].data.imageId, 'img_collision');
    assert.equal(assetStorage.getAsset(imported.nodes[0].data.imageId), 'data:image/png;base64,imported');
    assert.equal(assetStorage.getAsset('img_collision'), 'data:image/png;base64,original');
    const { buildStandaloneGameHtml } = await vite.ssrLoadModule('/src/services/storage/BrowserStorageService.js');
    const html = buildStandaloneGameHtml({
      projectMeta: { title: '</title><script>bad()</script>' },
      variables: [],
      nodes: [
        { id: 'start', data: { type: 'start', label: 'Start', dialogue: [{ text: '<img onerror=bad()>' }, { text: 'second' }] } },
        { id: 'end', data: { type: 'ending', label: 'End' } }
      ],
      edges: [{ id: 'e', source: 'start', target: 'end', label: 'Go' }]
    });
    assert.ok(!html.includes('</title><script>bad()'));
    const element = () => ({
      children: [],
      style: {},
      textContent: '',
      append(...items) {
        this.children.push(...items);
      },
      replaceChildren(...items) {
        this.children = items;
      }
    });
    const elements = Object.fromEntries(
      ['hud', 'scene-media', 'scene-title', 'scene-notes', 'dialogue', 'choices'].map((id) => [id, element()])
    );
    const context = vm.createContext({
      document: { getElementById: (id) => elements[id], createElement: element, addEventListener() {} }
    });
    vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    assert.equal(elements.choices.children.length, 0);
    assert.equal(elements.dialogue.children[0].children[1].textContent, '<img onerror=bad()>');
    vm.runInContext('advanceDialogue()', context);
    assert.equal(elements.dialogue.children[0].children[1].textContent, 'second');
    vm.runInContext('advanceDialogue()', context);
    assert.equal(elements.dialogue.children.length, 0);
    assert.equal(elements.choices.children[0].textContent, 'Go');
    elements.choices.children[0].onclick();
    assert.equal(elements.choices.children[0].textContent, '🏁 Финал истории');
    elements.choices.children[1].onclick();
    assert.equal(elements.choices.children.length, 0);
    store.getState().clearToast();
  } finally {
    await vite.close();
    delete globalThis.document;
  }
});
