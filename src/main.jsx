import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AIGlobalProvider } from './lib/AIGlobalContext.jsx'
import { OfflineManager } from './lib/OfflineManager'
import { AICache } from './lib/AICache.js'

// Initialize offline support
OfflineManager.registerServiceWorker();
// Purge expired AI cache on startup (no AI cost)
try { AICache.purgeExpired(); } catch {}
// Auto-sync pending operations when online
if (navigator.onLine) {
  OfflineManager.getPendingOperations().then(ops => {
    if (ops.length > 0) {
      console.log(`[OfflineManager] ${ops.length} operações pendentes de sync`);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AIGlobalProvider>
      <App />
    </AIGlobalProvider>
  </React.StrictMode>,
)