import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import EmbedWidget from './components/EmbedWidget.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

// /embed/... -> chi dung widget nhung gon nhe, khong phai ca app
const isEmbed = window.location.pathname.startsWith('/embed')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isEmbed ? <EmbedWidget /> : <App />}
  </React.StrictMode>
)

// Dang ky Service Worker cho PWA - khong can trong trang embed
if (!isEmbed && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}