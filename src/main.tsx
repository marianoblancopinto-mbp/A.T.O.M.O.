import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// El GameProvider lo monta App (una sola vez). Antes estaba también acá, lo que
// creaba DOS providers anidados (y dos conexiones). Se dejó sólo el de App.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
