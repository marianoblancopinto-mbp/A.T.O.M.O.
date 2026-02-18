
import React, { useState } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useGameActions } from '../../../hooks/useGameActions';
import type { Treaty, TreatyClause, TreatyType } from '../../../types/treatyTypes';
import { REGIONS } from '../../../data/mapRegions';
import { RAW_MATERIAL_DATA, TECHNOLOGY_DATA } from '../../../data/productionData';
import type { PlayerData } from '../../../types/playerTypes';

interface TreatyEditorProps {
    onClose: () => void;
    initialTreaty?: Treaty;
    isNew?: boolean;
}

export const TreatyEditor: React.FC<TreatyEditorProps> = ({ onClose, initialTreaty, isNew }) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex } = state;
    const { acceptTreaty } = useGameActions();
    const currentPlayer = players[currentPlayerIndex];

    const [targetPlayerId, setTargetPlayerId] = useState<string | number>(initialTreaty?.targetPlayerId && initialTreaty.targetPlayerId !== currentPlayer.id ? initialTreaty.targetPlayerId : (initialTreaty?.creatorId && initialTreaty.creatorId !== currentPlayer.id ? initialTreaty.creatorId : ''));
    const [clauses, setClauses] = useState<TreatyClause[]>(initialTreaty?.clauses || []);

    const targetPlayer = players.find(p => p.id === targetPlayerId);

    // --- Selectors State ---
    // Instead of a generic modal, we can have inline selectors or a specific modal driven by activeCategory
    const [activeSelector, setActiveSelector] = useState<{
        type: TreatyType;
        direction: 'GIVE' | 'RECEIVE';
        subType?: string; // For two-step selection (e.g. 'IRON')
    } | null>(null);

    // Filter available items for selectors
    const getAvailableRegions = (ownerId: string | number) => {
        return Object.entries(state.owners)
            .filter(([_, owner]) => owner == ownerId) // Loose equality for consistency
            .map(([regionId]) => REGIONS.find(r => r.id === regionId))
            .filter(r => r !== undefined) as typeof REGIONS;
    };

    const getAvailableRawMaterials = (player: PlayerData) => {
        return player.inventory?.rawMaterials || [];
    };

    const getAvailableTechs = (player: PlayerData) => {
        return player.inventory?.technologies || [];
    };

    const handleAddClause = (type: TreatyType, direction: 'GIVE' | 'RECEIVE', data: any, duration: number = -1) => {
        const sourceId = direction === 'GIVE' ? currentPlayer.id : targetPlayerId;
        const targetId = direction === 'GIVE' ? targetPlayerId : currentPlayer.id;

        const newClause: TreatyClause = {
            id: `clause-${Date.now()}-${Math.random()}`,
            type,
            sourcePlayerId: sourceId,
            targetPlayerId: targetId,
            duration,
            data
        };
        setClauses([...clauses, newClause]);
        setActiveSelector(null);
    };

    const handleSubtypeSelect = (subtype: string) => {
        if (activeSelector) {
            setActiveSelector({ ...activeSelector, subType: subtype });
        }
    };

    const removeClause = (clauseId: string) => {
        setClauses(clauses.filter(c => c.id !== clauseId));
    };

    const handleSendOffer = () => {
        if (!targetPlayerId) return;

        const newTreaty: Treaty = initialTreaty ? {
            ...initialTreaty,
            clauses,
            status: 'PENDING_APPROVAL',
            history: [...initialTreaty.history, { date: new Date(), action: 'MODIFIED', actorId: currentPlayer.id }]
        } : {
            id: `treaty-${Date.now()}`,
            creatorId: currentPlayer.id,
            targetPlayerId: targetPlayerId,
            status: 'PENDING_APPROVAL',
            clauses,
            createdAtMonth: state.turnOrderIndex,
            createdAtYear: state.gameDate.getFullYear(),
            history: [{ date: new Date(), action: 'CREATED', actorId: currentPlayer.id }]
        };

        if (isNew) {
            dispatch({ type: 'CREATE_TREATY_OFFER', payload: newTreaty });
        } else {
            dispatch({ type: 'UPDATE_TREATY', payload: newTreaty });
        }
        onClose();
    };

    const handleAccept = () => {
        if (!initialTreaty) return;
        acceptTreaty(initialTreaty);
        onClose();
    };

    // To properly fix the "Accept" logic later, I'll need to use the hook. 
    // For now, let's assume the reducer handles status updates, but the *Effect* (transfer) needs the hook.
    // I'll leave the handleAccept as a TODO for the next step or integration, focusing purely on the UI REQUEST now.

    const renderSection = (title: string, type: TreatyType, direction: 'GIVE' | 'RECEIVE', availableItems: any[], onSelect: (item: any) => void) => {
        const relevantClauses = clauses.filter(c =>
            c.type === type &&
            (direction === 'GIVE' ? c.sourcePlayerId === currentPlayer.id : c.sourcePlayerId === targetPlayerId)
        );

        return (
            <div style={{ marginBottom: '15px', border: '1px solid #444', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#ccc', fontSize: '0.9rem', textTransform: 'uppercase', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                    {title}
                </h4>

                {/* List Existing */}
                <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {relevantClauses.length === 0 && <span style={{ color: '#666', fontSize: '0.8rem' }}>Ninguno</span>}
                    {relevantClauses.map(c => {
                        let label = 'Unknown';
                        if (type === 'REGION_CESSION') {
                            label = REGIONS.find(r => r.id === c.data.regionId)?.title || c.data.regionId || 'Unknown Region';
                        } else if (type === 'RAW_MATERIAL_CESSION' || type === 'TECH_LOAN' || type === 'TECH_DUPLICATE') {
                            label = c.data.cardId || 'Unknown Card'; // Ideally look up name
                            // Try to find name in inventory even if moved? No, look up in "all possible cards" or just display ID for now
                            // Better: store name in data or look up. 
                            const item = availableItems.find(i => i.id === c.data.cardId);
                            if (item) label = item.name || item.id;
                        } else if (type === 'NON_AGGRESSION') {
                            label = `Desde: ${(c.data.regionIds || []).map((rid: string) => REGIONS.find(r => r.id === rid)?.title).join(', ')}`;
                        }

                        return (
                            <div key={c.id} style={{ backgroundColor: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {label}
                                <button onClick={() => removeClause(c.id)} style={{ border: 'none', background: 'transparent', color: '#ff5555', cursor: 'pointer', fontWeight: 'bold' }}>x</button>
                            </div>
                        );
                    })}
                </div>

                {/* Add Button / Selector */}
                {/* Add Button / Selector */}
                {activeSelector?.type === type && activeSelector?.direction === direction ? (
                    <div style={{ backgroundColor: '#222', padding: '5px', borderRadius: '4px' }}>
                        {(type === 'REGION_CESSION' || type === 'NON_AGGRESSION') && availableItems.length === 0 ? (
                            <div style={{ padding: '5px', color: '#888', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>
                                No hay elementos disponibles.
                                <button onClick={() => setActiveSelector(null)} style={{ display: 'block', margin: '5px auto 0', fontSize: '0.7rem', background: 'transparent', border: 'none', color: '#00ffff', cursor: 'pointer' }}>Cerrar</button>
                            </div>
                        ) : (
                            <>
                                {type === 'REGION_CESSION' && (
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                onSelect({ regionId: e.target.value });
                                            }
                                        }}
                                        style={{ width: '100%', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #555' }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Seleccionar Territorio...</option>
                                        {availableItems.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.title}</option>
                                        ))}
                                    </select>
                                )}

                                {(type === 'RAW_MATERIAL_CESSION' || type === 'TECH_LOAN' || type === 'TECH_DUPLICATE') && (
                                    !activeSelector.subType ? (
                                        // Step 1: Select Type
                                        <select
                                            onChange={(e) => handleSubtypeSelect(e.target.value)}
                                            style={{ width: '100%', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #555' }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Seleccionar Tipo...</option>
                                            {(type === 'RAW_MATERIAL_CESSION' ? Object.keys(RAW_MATERIAL_DATA) : Object.keys(TECHNOLOGY_DATA)).map((t: string) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        // Step 2: Select Specific Card (Country/ID)
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Tipo: {activeSelector.subType}</div>
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        onSelect({ cardId: e.target.value });
                                                    }
                                                }}
                                                style={{ width: '100%', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #555' }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Seleccionar Origen...</option>
                                                {availableItems
                                                    .filter((c: any) => c.type === activeSelector.subType)
                                                    .map((c: any) => {
                                                        // Try to resolve country name if available
                                                        const regionName = REGIONS.find(r => r.id === c.country)?.title || c.country || 'Desconocido';
                                                        return (
                                                            <option key={c.id} value={c.id}>{regionName} ({c.id})</option>
                                                        );
                                                    })}
                                            </select>
                                            {availableItems.filter((c: any) => c.type === activeSelector.subType).length === 0 && (
                                                <div style={{ color: '#ff5555', fontSize: '0.7rem' }}>No posees cartas de este tipo.</div>
                                            )}
                                            <button onClick={() => setActiveSelector({ ...activeSelector, subType: undefined })} style={{ fontSize: '0.7rem', background: 'transparent', border: 'none', color: '#00ffff', cursor: 'pointer', textAlign: 'left' }}>
                                                &lt; Volver a tipos
                                            </button>
                                        </div>
                                    )
                                )}

                                {type === 'NON_AGGRESSION' && (
                                    // Multi-select for regions? Or just "Adding one by one"?
                                    // For simplicity, let's do a single add per click, or a simple multi-select mock
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                onSelect({ regionIds: [e.target.value] }); // Simple single region per clause or start list
                                            }
                                        }}
                                        style={{ width: '100%', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #555' }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Restringir ataque desde...</option>
                                        {availableItems.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.title}</option>
                                        ))}
                                    </select>
                                )}
                                <button onClick={() => setActiveSelector(null)} style={{ marginTop: '5px', fontSize: '0.7rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cancelar</button>
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setActiveSelector({ type, direction })}
                        style={{ width: '100%', padding: '5px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px dashed #666', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        + AÑADIR
                    </button>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '95%', maxWidth: '1200px', height: '90vh',
            backgroundColor: '#111', border: '2px solid #00ffff', boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
            zIndex: 1100, display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'monospace'
        }}>
            {/* Header */}
            <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: '#00ffff' }}>EDITOR DE TRATADOS</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Target Selection if New */}
            {isNew && !targetPlayerId ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <h3>SELECCIONE CONTRAPARTE</h3>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {players.filter(p => p.id !== currentPlayer.id).map(p => (
                            <button key={p.id} onClick={() => setTargetPlayerId(p.id)} style={{ padding: '20px', minWidth: '150px', backgroundColor: p.color, border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* LEFT: MY CONCESSIONS (I Give) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
                        <div style={{ padding: '10px', backgroundColor: currentPlayer.color, color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                            YO ENTREGO ({currentPlayer.name})
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            {renderSection("Cesión de Territorios", 'REGION_CESSION', 'GIVE', getAvailableRegions(currentPlayer.id), (data) => handleAddClause('REGION_CESSION', 'GIVE', data))}

                            {renderSection("Materia Prima", 'RAW_MATERIAL_CESSION', 'GIVE', getAvailableRawMaterials(currentPlayer), (data) => handleAddClause('RAW_MATERIAL_CESSION', 'GIVE', data))}

                            {renderSection("Préstamo de Tecnología", 'TECH_LOAN', 'GIVE', getAvailableTechs(currentPlayer), (data) => handleAddClause('TECH_LOAN', 'GIVE', data, 5))}

                            {renderSection("Duplicado de Tecnología", 'TECH_DUPLICATE', 'GIVE', getAvailableTechs(currentPlayer), (data) => handleAddClause('TECH_DUPLICATE', 'GIVE', data))}

                            {renderSection("Pacto de No Agresión (Desde mis tierras)", 'NON_AGGRESSION', 'GIVE', getAvailableRegions(currentPlayer.id), (data) => handleAddClause('NON_AGGRESSION', 'GIVE', data, 3))}
                        </div>
                    </div>

                    {/* RIGHT: THEIR CONCESSIONS (They Give / I Receive) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '10px', backgroundColor: targetPlayer?.color || '#555', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                            {targetPlayer?.name} ENTREGA
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            {renderSection("Cesión de Territorios", 'REGION_CESSION', 'RECEIVE', targetPlayerId ? getAvailableRegions(targetPlayerId) : [], (data) => handleAddClause('REGION_CESSION', 'RECEIVE', data))}

                            {renderSection("Materia Prima", 'RAW_MATERIAL_CESSION', 'RECEIVE', targetPlayer ? getAvailableRawMaterials(targetPlayer) : [], (data) => handleAddClause('RAW_MATERIAL_CESSION', 'RECEIVE', data))}

                            {renderSection("Préstamo de Tecnología", 'TECH_LOAN', 'RECEIVE', targetPlayer ? getAvailableTechs(targetPlayer) : [], (data) => handleAddClause('TECH_LOAN', 'RECEIVE', data, 5))}

                            {renderSection("Duplicado de Tecnología", 'TECH_DUPLICATE', 'RECEIVE', targetPlayer ? getAvailableTechs(targetPlayer) : [], (data) => handleAddClause('TECH_DUPLICATE', 'RECEIVE', data))}

                            {renderSection("Pacto de No Agresión (Desde sus tierras)", 'NON_AGGRESSION', 'RECEIVE', targetPlayerId ? getAvailableRegions(targetPlayerId) : [], (data) => handleAddClause('NON_AGGRESSION', 'RECEIVE', data, 3))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            {targetPlayerId && (
                <div style={{ padding: '20px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    {(!initialTreaty || initialTreaty.status === 'DRAFT' || initialTreaty.status === 'PENDING_APPROVAL') && (
                        <button onClick={handleSendOffer} style={{ padding: '10px 30px', backgroundColor: '#00ffff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                            {initialTreaty?.status === 'PENDING_APPROVAL' ? 'ENVIAR CONTRAOFERTA' : 'ENVIAR OFERTA'}
                        </button>
                    )}

                    {initialTreaty?.status === 'PENDING_APPROVAL' && initialTreaty.targetPlayerId === currentPlayer.id && (
                        <button onClick={handleAccept} style={{ padding: '10px 30px', backgroundColor: '#00ff00', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
                            ACEPTAR TRATADO
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
