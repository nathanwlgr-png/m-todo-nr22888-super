// BUILD: 2026-05-15T13:28
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// REBUILD CACHE BUSTER: 2026-05-15T13:37:15Z
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />)