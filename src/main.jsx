import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDB } from './services/db'
import { registerSW } from 'virtual:pwa-register'

initDB();

registerSW({ immediate: true })

document.documentElement.lang = 'ar-EG';
document.documentElement.dir = 'rtl';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
