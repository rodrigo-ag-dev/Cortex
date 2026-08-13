import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import "leaflet/dist/leaflet.css"
import Mapa from './components/Mapa/Index.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Mapa id="Eleições2014" />
  </React.StrictMode>
)
