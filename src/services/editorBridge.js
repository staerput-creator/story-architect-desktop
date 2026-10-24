import { executeStoryCommand } from './storyCommands';

export function connectEditorBridge(store, token, onStatus) {
  let stopped = false;
  let socket;
  let retry;
  const connect = () => {
    if (stopped) return;
    onStatus('Подключение…');
    socket = new WebSocket('ws://127.0.0.1:39123/bridge');
    socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token }));
    socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ready') { onStatus('Подключено — ИИ может редактировать этот проект'); return; }
        if (message.type !== 'command' || typeof message.id !== 'string') return;
        let response;
        try { response = { result: executeStoryCommand(store, message.tool, message.args) }; }
        catch (error) { response = { error: error.message }; }
        socket.send(JSON.stringify({ type: 'result', id: message.id, ...response }));
      } catch { socket.close(1008, 'Invalid message'); }
    };
    socket.onerror = () => { /* onclose handles reconnect/status */ };
    socket.onclose = event => {
      if (stopped) return;
      if (event.code === 1008) { onStatus(`Отказ: ${event.reason}. Отключите мост и проверьте токен/другие вкладки.`); return; }
      onStatus('Сервер недоступен. Повторное подключение через 3 секунды…');
      retry = setTimeout(connect, 3000);
    };
  };
  connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    if (socket) {
      socket.onclose = null;
      socket.onopen = () => socket.close();
      if (socket.readyState === WebSocket.OPEN) socket.close();
    }
  };
}