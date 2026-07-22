// BUILD: 2026-05-15T13:28
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// REBUILD CACHE BUSTER: 2026-05-15T13:42:30Z
import { OfflineManager } from './lib/OfflineManager'
import { AICache } from './lib/AICache.js'

// Initialize offline support
OfflineManager.registerServiceWorker();
// Purge expired AI cache on startup (no AI cost)
try { AICache.purgeExpired(); } catch {}
ReactDOM.createRoot(document.getElementById('root')).render(<App />)