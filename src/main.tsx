import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SessionProvider } from './context/SessionContext.tsx';
import { GameProvider } from './context/GameContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SessionProvider>
  </StrictMode>,
)
