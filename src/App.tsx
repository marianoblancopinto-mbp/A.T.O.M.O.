import { useState } from 'react'
import { TegMap } from './components/TegMap'
import { Lobby } from './components/Lobby'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GameProvider } from './context/GameContext'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const isSpectator = window.location.pathname === '/map';

  // For development/spectator mode bypass
  if (isSpectator) {
    return (
      <GameProvider initialPhase={'playing'}>
        <div className="App">
          <ErrorBoundary>
            <TegMap spectator={true} />
          </ErrorBoundary>
        </div>
      </GameProvider>
    );
  }

  // Main Flow: Lobby -> Game
  return (
    <GameProvider>
      <div className="App">
        <ErrorBoundary>
          {isPlaying ? (
            <TegMap />
          ) : (
            <Lobby onGameStart={() => setIsPlaying(true)} />
          )}
        </ErrorBoundary>
      </div>
    </GameProvider>
  )
}

export default App
