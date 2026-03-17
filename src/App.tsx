import { useState } from 'react'
import { TegMap } from './components/TegMap'
import { Lobby } from './components/Lobby'
import { AudioManager } from './components/AudioManager'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GameProvider } from './context/GameContext'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('teg_muted') === 'true');
  const isSpectator = window.location.pathname === '/map';

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem('teg_muted', String(newVal));
  };

  // For development/spectator mode bypass
  if (isSpectator) {
    return (
      <GameProvider initialPhase={'playing'}>
        <div className="App">
          <AudioManager muted={isMuted} />
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
        <AudioManager muted={isMuted} />
        <ErrorBoundary>
          {isPlaying ? (
            <TegMap />
          ) : (
            <Lobby 
                onGameStart={() => setIsPlaying(true)} 
                muted={isMuted} 
                onMuteToggle={toggleMute} 
            />
          )}
        </ErrorBoundary>
      </div>
    </GameProvider>
  )
}

export default App
