import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';


export const useMultiplayer = () => {
    const [gameId, setGameId] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'PLAYING' | 'ERROR' | 'TAKEOVER_PENDING'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([]); // Temporary type until we define PlayerRow
    const onBroadcastReceivedRef = useRef<((action: any) => void) | null>(null);

    // Persist Session details to localStorage whenever they change
    useEffect(() => {
        if (gameId && playerId) {
            localStorage.setItem('teg_gameId', gameId);
            localStorage.setItem('teg_playerId', playerId);
            localStorage.setItem('teg_isHost', String(isHost));
        }
    }, [gameId, playerId, isHost]);

    // Create a new game session
    const createGame = useCallback(async (hostName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
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

    const joinGame = useCallback(async (targetGameId: string, playerName: string) => {
        setConnectionStatus('CONNECTING');
        setError(null);
        try {
            // 1. Check if game exists
            const { data: gameData, error: gameCheckError } = await supabase
                .from('games')
                .select('status')
                .eq('id', targetGameId)
                .single();

            if (gameCheckError || !gameData) throw new Error('Partida no encontrada');

            // Find if player with this name already exists in this game
            const { data: playersList, error: playersError } = await supabase
                .from('players')
                .select('id, name, ip_address')
                .eq('game_id', targetGameId);

            if (playersError || !playersList) {
                throw new Error('Error al buscar jugadores en la partida.');
            }

            const existingPlayer = playersList.find(p => p.name.trim().toLowerCase() === playerName.trim().toLowerCase());

            if (gameData.status !== 'LOBBY') {
                if (!existingPlayer) {
                    throw new Error('Esa partida ya está en progreso y ningún comandante es parte de esa operación.');
                }
                
                // --- TAKEOVER LOGIC ---
                // We broadcast a request, then wait up to 5 seconds.
                setConnectionStatus('TAKEOVER_PENDING');
                return new Promise<boolean>((resolve) => {
                    const timeoutId = setTimeout(() => {
                        // Timeout reached, assume original player is offline
                        subscription.unsubscribe();
                        finishJoin();
                    }, 5500); // 5 seconds + ping allowance

                    const subscription = supabase
                        .channel(`game_actions_sub:${targetGameId}`)
                        .on('broadcast', { event: 'GAME_ACTION' }, (payload) => {
                            const action = payload.payload;
                            if (action.type === 'TAKEOVER_DENIED' && action.payload.playerId === existingPlayer.id) {
                                clearTimeout(timeoutId);
                                subscription.unsubscribe();
                                setConnectionStatus('ERROR');
                                setError('Acceso denegado: El comandante actual bloqueó tu solicitud.');
                                resolve(false);
                            } else if (action.type === 'TAKEOVER_GRANTED' && action.payload.playerId === existingPlayer.id) {
                                clearTimeout(timeoutId);
                                subscription.unsubscribe();
                                finishJoin();
                            }
                        })
                        .subscribe(async (status) => {
                            if (status === 'SUBSCRIBED') {
                                // Request takeover
                                await supabase.channel(`game_actions_sub:${targetGameId}`).send({
                                    type: 'broadcast',
                                    event: 'GAME_ACTION',
                                    payload: { type: 'TAKEOVER_REQUEST', payload: { playerId: existingPlayer.id, requesterSessionId: supabase.auth.getSession()?.toString() } }
                                });
                            }
                        });
                        
                    // Cleanup function to apply the join state
                    const finishJoin = () => {
                        setGameId(targetGameId);
                        setPlayerId(existingPlayer.id);
                        setIsHost(existingPlayer.ip_address === 'host');
                        setConnectionStatus('PLAYING');
                        resolve(true);
                    };
                });
            } else {
                // Game is in LOBBY
                if (existingPlayer) {
                    // Rejoin existing lobby player
                    setGameId(targetGameId);
                    setPlayerId(existingPlayer.id);
                    setIsHost(existingPlayer.ip_address === 'host');
                    setConnectionStatus('CONNECTED');
                    return true;
                }

                // Add New Player
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
            }

        } catch (error: any) {
            console.error('Error joining game:', error);
            setConnectionStatus('ERROR');
            setError(error.message || 'Error desconocido al unirse a partida');
            return false;
        }
    }, []);

    // Rejoin an active game (from localStorage)
    const rejoinGame = useCallback(async (targetGameId: string, savedPlayerId: string, savedIsHost: boolean) => {
        setConnectionStatus('CONNECTING');
        try {
            // Check if game exists
            const { data: gameData, error: gameCheckError } = await supabase
                .from('games')
                .select('status')
                .eq('id', targetGameId)
                .single();

            if (gameCheckError || !gameData) throw new Error('Partida no encontrada o finalizada');

            // Verify player exists in this game
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id, name')
                .eq('id', savedPlayerId)
                .eq('game_id', targetGameId)
                .single();

            if (playerError || !playerData) throw new Error('No estás registrado en esta partida o fuiste expulsado.');

            setGameId(targetGameId);
            setPlayerId(savedPlayerId);
            setIsHost(savedIsHost);

            // Inherit the game status (LOBBY or PLAYING)
            setConnectionStatus(gameData.status as 'CONNECTED' | 'PLAYING');
            if (gameData.status === 'LOBBY') {
               setConnectionStatus('CONNECTED'); 
            }
            return true;

        } catch (error: any) {
            console.error('Error rejoining game:', error);
            setConnectionStatus('ERROR');
            setError(error.message || 'Error desconocido al reconectar a la partida');
            // Clear bad local data so it doesn't get stuck loop
            localStorage.removeItem('teg_gameId');
            localStorage.removeItem('teg_playerId');
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
                        if (onBroadcastReceivedRef.current) {
                            onBroadcastReceivedRef.current(payload.payload);
                        } else {
                            console.warn('[useMultiplayer] ⚠️ broadcast received but no handler set:', payload.payload.type);
                        }
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
        rejoinGame,
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
            console.log(`[useMultiplayer] ⬆️ Syncing full state... (Active Player: ${newState.players[newState.currentPlayerIndex]?.name || '?'})`);
            
            // Use update instead of upsert to avoid conflicts
            const { error } = await supabase
                .from('game_states')
                .update({
                    full_state: newState,
                    updated_at: new Date().toISOString()
                })
                .eq('game_id', gameId);

            if (error) {
                console.error("[useMultiplayer] ❌ Sync Error:", error);
            } else {
                console.log("[useMultiplayer] ✅ Sync Complete.");
            }
        },
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
        setOnBroadcastReceived: useCallback((callback: (action: any) => void) => {
            onBroadcastReceivedRef.current = callback;
        }, []),
    };
};
