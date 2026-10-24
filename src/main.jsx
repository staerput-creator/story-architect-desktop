import '@fontsource-variable/inter';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ReactFlowProvider } from '@xyflow/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactFlowProvider><App /></ReactFlowProvider>
    </ErrorBoundary>
  </StrictMode>,
)
