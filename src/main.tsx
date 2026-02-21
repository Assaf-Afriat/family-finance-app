import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/lib/i18n'
import { getLanguageDirection } from '@/lib/i18n'

// Set initial direction based on saved language
const savedLanguage = localStorage.getItem('language') || 'en'
document.documentElement.dir = getLanguageDirection(savedLanguage)
document.documentElement.lang = savedLanguage

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
