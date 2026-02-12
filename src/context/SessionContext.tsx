import React, { createContext, useContext, useState, type ReactNode } from 'react';
// import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Placeholder for now, will be populated with env vars)
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// export const supabase = createClient(supabaseUrl, supabaseKey);

interface SessionState {
    sessionId: string | null;     // The Game ID (Lobby ID)
    playerId: string | null;      // My specific Player ID (UUID)
    isHost: boolean;
    playerName: string;
}

const SessionContext = createContext<{
    session: SessionState;
    setSession: React.Dispatch<React.SetStateAction<SessionState>>;
} | null>(null);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<SessionState>({
        sessionId: null,
        playerId: null, // In future: localStorage.getItem('playerId')
        isHost: false,
        playerName: 'Guest',
    });

    return (
        <SessionContext.Provider value={{ session, setSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};

// Hook to filter generic GameState for THIS player
// export const useMyPlayer = (gameState: GameState) => {
//   const { session } = useSession();
//   return gameState.players.find(p => p.id === session.playerId);
// }
