import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null, componentStack: '' };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('Story Architect render failed:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main role="alert" style={{ padding: 32, background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', boxSizing: 'border-box' }}>
      <h1>Не удалось открыть Story Architect</h1>
      <p>Редактор столкнулся с ошибкой. Сохранённые проекты не удалены.</p>
      <button onClick={() => window.location.reload()}>Перезагрузить редактор</button>
      <details open><summary>Техническая информация</summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{String(this.state.error?.stack || this.state.error)}{this.state.componentStack}</pre>
      </details>
    </main>;
  }
}