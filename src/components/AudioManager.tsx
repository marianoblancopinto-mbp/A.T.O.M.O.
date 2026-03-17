import React, { useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext';

interface AudioManagerProps {
    muted?: boolean;
}

export const AudioManager: React.FC<AudioManagerProps> = ({ muted = false }) => {
    const { state } = useGameContext();
    const { gamePhase, gameStarted } = state;
    const introAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (introAudioRef.current) {
            introAudioRef.current.muted = muted;
        }
    }, [muted]);

    useEffect(() => {
        // Initialize audio
        const audio = new Audio('/intro_soundtrack.wav');
        audio.loop = true;
        audio.muted = muted;
        introAudioRef.current = audio;

        // Cleanup on unmount
        return () => {
            if (introAudioRef.current) {
                introAudioRef.current.pause();
                introAudioRef.current.currentTime = 0;
                introAudioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const audio = introAudioRef.current;
        if (!audio) return;

        // Phases where the intro soundtrack should play
        const playingPhases = ['splash', 'menu', 'history', 'mission', 'setup'];

        // We also want it to play if the game hasn't started yet (Lobby)
        const shouldPlay = playingPhases.includes(gamePhase) || !gameStarted;

        if (shouldPlay) {
            if (audio.paused) {
                // Try to play (will fail if no interaction yet, but will catch up later)
                audio.play().catch(() => {
                    // Silently fail - browser will block if no interaction
                });
            }
        } else {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
    }, [gamePhase, gameStarted]);

    // To handle browser autoplay blocking, we can try to resume on FIRST CLICK anywhere in the document
    useEffect(() => {
        const handleInteraction = () => {
            const audio = introAudioRef.current;
            if (audio && audio.paused) {
                const playingPhases = ['splash', 'menu', 'history', 'mission', 'setup'];
                if (playingPhases.includes(state.gamePhase) || !state.gameStarted) {
                    audio.play().catch(() => {});
                }
            }
            // Remove listener after first successful play attempt on interaction
            window.removeEventListener('click', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        return () => window.removeEventListener('click', handleInteraction);
    }, [state.gamePhase, state.gameStarted]);

    return null; // This component doesn't render anything
};
