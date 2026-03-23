import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppProvider } from './providers/AppProvider'
import { Toaster } from 'sonner'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <Toaster />
      <App />
    </AppProvider>
  </React.StrictMode>,
)