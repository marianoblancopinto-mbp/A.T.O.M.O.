
import React, { useState } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { type Treaty } from '../../../types/treatyTypes';
import { TreatyEditor } from './TreatyEditor';

interface TreatiesPanelProps {
    onClose: () => void;
}

export const TreatiesPanel: React.FC<TreatiesPanelProps> = ({ onClose }) => {
    const { state } = useGameContext();
    const { players, currentPlayerIndex, treaties } = state;
    const currentPlayer = players[currentPlayerIndex];

    const [isCreating, setIsCreating] = useState(false);
    const [viewingTreaty, setViewingTreaty] = useState<Treaty | null>(null);

    // Filter treaties involved with current player
    const myTreaties = treaties.filter(t =>
        (t.creatorId === currentPlayer.id || t.targetPlayerId === currentPlayer.id) &&
        t.status === 'ACTIVE'
    );

    const pendingTreaties = treaties.filter(t =>
        (t.creatorId === currentPlayer.id || t.targetPlayerId === currentPlayer.id) &&
        (t.status === 'PENDING_APPROVAL' || t.status === 'DRAFT')
    );

    const handleCreateNew = () => {
        setIsCreating(true);
    };

    const handleViewTreaty = (treaty: Treaty) => {
        setViewingTreaty(treaty);
    };

    const handleBack = () => {
        setIsCreating(false);
        setViewingTreaty(null);
    };

    if (isCreating) {
        return <TreatyEditor onClose={handleBack} isNew={true} />;
    }

    if (viewingTreaty) {
        return <TreatyEditor onClose={handleBack} initialTreaty={viewingTreaty} />;
    }

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '900px',
            height: '80vh',
            backgroundColor: 'rgba(10, 10, 20, 0.95)',
            border: '2px solid #ff00ff',
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            color: '#fff',
            fontFamily: 'monospace'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ff00ff', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, textTransform: 'uppercase', color: '#ff00ff', textShadow: '0 0 5px #ff00ff' }}>Tratados Internacionales</h2>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ff00ff', fontSize: '1.5rem', cursor: 'pointer' }}>X</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* Active Treaties */}
                <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '5px', color: '#00ff00' }}>TRATADOS VIGENTES</h3>
                {myTreaties.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>No hay tratados vigentes.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {myTreaties.map(t => {
                            const partnerId = t.creatorId === currentPlayer.id ? t.targetPlayerId : t.creatorId;
                            const partner = players.find(p => p.id === partnerId);
                            return (
                                <div key={t.id} style={{ border: '1px solid #00ff00', padding: '10px', backgroundColor: 'rgba(0, 255, 0, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>CON: {partner?.name || 'Desconocido'}</span>
                                    <button onClick={() => handleViewTreaty(t)} style={{ padding: '5px 10px', backgroundColor: '#003300', border: '1px solid #00ff00', color: '#00ff00', cursor: 'pointer' }}>VER DETALLES</button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pending Negotiations */}
                <h3 style={{ borderBottom: '1px solid #555', paddingBottom: '5px', marginTop: '30px', color: '#ffff00' }}>NEGOCIACIONES ACTIVAS</h3>
                {pendingTreaties.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>No hay negociaciones en curso.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pendingTreaties.map(t => {
                            const partnerId = t.creatorId === currentPlayer.id ? t.targetPlayerId : t.creatorId;
                            const partner = players.find(p => p.id === partnerId);
                            const isMyTurnToAct = (t.status === 'PENDING_APPROVAL' && t.targetPlayerId === currentPlayer.id) || (t.status === 'DRAFT' && t.creatorId === currentPlayer.id); // Validar lógica de Draft

                            return (
                                <div key={t.id} style={{ border: '1px solid #ffff00', padding: '10px', backgroundColor: 'rgba(255, 255, 0, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span>CON: {partner?.name || 'Desconocido'}</span>
                                        <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#ffff00' }}>
                                            {t.status === 'PENDING_APPROVAL'
                                                ? (t.targetPlayerId === currentPlayer.id ? '(Esperando tu respuesta)' : '(Esperando respuesta)')
                                                : '(Borrador)'}
                                        </span>
                                    </div>
                                    <button onClick={() => handleViewTreaty(t)} style={{ padding: '5px 10px', backgroundColor: '#333300', border: '1px solid #ffff00', color: '#ffff00', cursor: 'pointer' }}>
                                        {isMyTurnToAct ? 'VER OFERTA' : 'VER ESTADO'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleCreateNew}
                    style={{
                        padding: '15px 30px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        backgroundColor: '#330033',
                        color: '#ff00ff',
                        border: '2px solid #ff00ff',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        boxShadow: '0 0 15px rgba(255, 0, 255, 0.4)'
                    }}
                >
                    NUEVO TRATADO
                </button>
            </div>
        </div>
    );
};
