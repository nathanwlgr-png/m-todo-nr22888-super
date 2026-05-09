import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AIGlobalProvider } from './lib/AIGlobalContext.jsx'
import { OfflineManager } from './lib/OfflineManager'

// Initialize offline support
OfflineManager.registerServiceWorker();
OfflineManager.clearExpiredCache();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AIGlobalProvider>
      <App />
    </AIGlobalProvider>
  </React.StrictMode>,
)