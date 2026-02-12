import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';


export const useMultiplayer = () => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'PLAYING' | 'ERROR'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]); // Temporary type until we define PlayerRow
    const [lastBroadcastedAction, setLastBroadcastedAction] = useState<any>(null); // For Action Sync

    // Create a new game session
    const createGame = useCallback(async (hostName: string) => {
        setConnectionStatus('CONNECTING');
        try {
            // Generate Proxy War Country
            const { REGIONS } = await import('../data/mapRegions');
            const excludedIds = new Set([
                'california', 'texas', 'nueva_york', 'flordia', 'alaska', // USA
                'siberia', 'kamchakta', 'rusia', 'kazajistan', // Russia (Broadly)
                'china', 'australia', 'canada'
            ]);
            const candidates = REGIONS.filter(r => !excludedIds.has(r.id) && r.continent !== 'st5');
            const randomCountry = candidates[Math.floor(Math.random() * candidates.length)];
            const proxyWarCountry = randomCountry ? randomCountry.title : 'País Desconocido';

            // 1. Create Game
            const { data: gameData, error: gameError } = await supabase
                .from('games')
                .insert([{
                    status: 'LOBBY',
                    settings: {
                        proxyWarCountry: proxyWarCountry
                    }
                }])
                .select()
                .single();

            if (gameError) throw gameError;

            const newGameId = gameData.id;

            // 2. Add Host Player
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .insert([{
                    game_id: newGameId,
                    name: hostName,
                    is_ready: true, // Host is always ready?
                    ip_address: 'host' // simplified
                }])
                .select()
                .single();

            if (playerError) throw playerError;

            // 3. Initialize detailed Game State
            const { error: stateError } = await supabase
                .from('game_states')
                .insert([{
                    game_id: newGameId,
                    phase: 'LOBBY',
                    turn_index: 0
                }]);

            if (stateError) throw stateError;

            setGameId(newGameId);
            setPlayerId(playerData.id);
            setIsHost(true);
            setConnectionStatus('CONNECTED');
            return newGameId;

        } catch (error: any) {
            console.error('Error creating game:', error);
            setConnectionStatus('ERROR');
            setError(error.message || 'Error desconocido al crear partida');
            return null;
        }
    }, []);

    // Join an existing game
    const joinGame = useCallback(async (targetGameId: string, playerName: string) => {
        setConnectionStatus('CONNECTING');
        try {
            // 1. Check if game exists and is in LOBBY
            const { data: gameData, error: gameCheckError } = await supabase
                .from('games')
                .select('status')
                .eq('id', targetGameId)
                .single();

            if (gameCheckError || !gameData) throw new Error('Partida no encontrada');
            if (gameData.status !== 'LOBBY') throw new Error('La partida ya ha comenzado o finalizado');

            // 2. Add Player
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .insert([{
                    game_id: targetGameId,
                    name: playerName,
                    is_ready: false
                }])
                .select()
                .single();

            if (playerError) throw playerError;

            setGameId(targetGameId);
            setPlayerId(playerData.id);
            setIsHost(false);
            setConnectionStatus('CONNECTED');
            return true;

        } catch (error: any) {
            console.error('Error joining game:', error);
            setConnectionStatus('ERROR');
            setError(error.message || 'Error desconocido al unirse a partida');
            return false;
        }
    }, []);

    // Subscribe to Lobby Updates (Players list)
    useEffect(() => {
        if (!gameId) return;

        // Fetch initial players
        const fetchPlayers = async () => {
            const { data } = await supabase
                .from('players')
                .select('*')
                .eq('game_id', gameId);
            if (data) setLobbyPlayers(data);
        };
        fetchPlayers();

        // Subscribe to changes
        const subscription = supabase
            .channel(`lobby:${gameId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLobbyPlayers(prev => [...prev, payload.new]);
                    } else if (payload.eventType === 'DELETE') {
                        setLobbyPlayers(prev => prev.filter(p => p.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setLobbyPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [gameId]);

    const [gameSettings, setGameSettings] = useState<any>({});

    // Fetch and Subscribe to Game Settings (Proxy War Country)
    useEffect(() => {
        if (!gameId) return;

        const fetchSettings = async () => {
            const { data } = await supabase
                .from('games')
                .select('settings')
                .eq('id', gameId)
                .single();
            if (data) setGameSettings(data.settings);
        };
        fetchSettings();

        const subscription = supabase
            .channel(`game_settings:${gameId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
                (payload) => {
                    if (payload.new.settings) {
                        setGameSettings(payload.new.settings);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };

    }, [gameId]);

    // Subscribe to Game Status Updates (Start Game) AND Ephemeral Actions
    useEffect(() => {
        if (!gameId) return;

        // Channel 1: Game Status updates (Postgres)
        const gameStatusSub = supabase
            .channel(`game:${gameId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
                (payload) => {
                    if (payload.new.status === 'PLAYING') {
                        setConnectionStatus('PLAYING');
                    }
                }
            )
            .subscribe();

        // Channel 2: Broadcast Actions (Ephemeral)
        // MUST MATCH the channel name in broadcastAction
        const actionSub = supabase
            .channel(`game_actions_sub:${gameId}`)
            .on(
                'broadcast',
                { event: 'GAME_ACTION' },
                (payload) => {
                    // console.log('[useMultiplayer] 📥 Received Broadcast:', payload);
                    // Payload is nested: { type: 'broadcast', event: 'GAME_ACTION', payload: { action_object } }
                    // Usually payload.payload is the data we sent.
                    if (payload.payload) {
                        setLastBroadcastedAction(payload.payload);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[useMultiplayer] ✅ Subscribed to action channel: game_actions_sub:${gameId}`);
                }
            });

        return () => {
            gameStatusSub.unsubscribe();
            actionSub.unsubscribe();
        };
    }, [gameId]);

    // Start Game (Host only)
    const startGame = useCallback(async () => {
        if (!gameId || !isHost) return;

        try {
            // 1. Update Game Status
            await supabase
                .from('games')
                .update({ status: 'PLAYING' })
                .eq('id', gameId);

            // 2. Update Game State Phase (triggering logic in clients)
            await supabase
                .from('game_states')
                .update({ phase: 'DEPLOYMENT' }) // Start phase
                .eq('game_id', gameId);

            // Host also needs to transition
            setConnectionStatus('PLAYING');

        } catch (error) {
            console.error('Error starting game:', error);
        }
    }, [gameId, isHost]);


    return {
        gameId,
        playerId,
        isHost,
        connectionStatus,
        error,
        lobbyPlayers,
        gameSettings,
        createGame,
        joinGame,
        startGame,
        // Helper to update full state
        updateInitialState: async (initialState: any) => {
            if (!gameId) return;
            await supabase
                .from('game_states')
                .update({
                    full_state: initialState,
                    map_ownership: initialState.owners
                })
                .eq('game_id', gameId);
        },
        // Real-time sync function
        syncGameState: async (newState: any) => {
            if (!gameId) return;
            // Use update instead of upsert to avoid conflicts
            const { error } = await supabase
                .from('game_states')
                .update({
                    full_state: newState,
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameId);

            if (error) console.error("[useMultiplayer] Error syncing state:", error);
        },
        // Broadcast Action (Ephemeral)
        broadcastAction: async (action: any) => {
            if (!gameId) {
                console.warn('[useMultiplayer] ⚠️ Cannot broadcast: No Game ID');
                return;
            }
            console.log(`[useMultiplayer] 📤 Sending Broadcast: ${action.type}`, action);
            const response = await supabase
                .channel(`game_actions_sub:${gameId}`) // MUST MATCH SUBSCRIPTION CHANNEL NAME
                .send({
                    type: 'broadcast',
                    event: 'GAME_ACTION',
                    payload: action
                });

            if (response !== 'ok') {
                console.error('[useMultiplayer] ❌ Broadcast failed:', response);
            } else {
                console.log('[useMultiplayer] ✅ Broadcast sent successfully');
            }
        },
        lastBroadcastedAction,
    };
};
