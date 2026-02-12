import React from 'react';
import type { Card } from '../../../types/gameTypes';
import { CARD_DATA } from '../../../data/cardData';

interface BattleCardProps {
    card: Card;
    role: 'attacker' | 'defender';
    onClick?: () => void;
    disabled?: boolean;
    highlight?: boolean;
}

export const BattleCard: React.FC<BattleCardProps> = ({
    card,
    role,
    onClick,
    disabled = false,
    highlight = false
}) => {
    const getCardName = (card: Card, role: 'attacker' | 'defender') => {
        const regData = CARD_DATA[card.regiment];
        if (role === 'attacker') {
            return regData.tiers[card.tier].attack[card.variant];
        } else {
            return regData.tiers[card.tier].defense[card.variant];
        }
    };

    const getRegimentName = (regiment: Card['regiment'], role: 'attacker' | 'defender') => {
        return role === 'attacker' ? CARD_DATA[regiment].nameAttack : CARD_DATA[regiment].nameDefense;
    };

    const unitName = getCardName(card, role);
    const regimentName = getRegimentName(card.regiment, role);
    const color = card.regiment === 'A' ? '#ff3d00' : card.regiment === 'B' ? '#ffd700' : '#00ff44'; // Red, Yellow, Green
    const stars = '★'.repeat(card.tier);

    return (
        <div
            onClick={!disabled && onClick ? onClick : undefined}
            style={{
                width: '180px',
                height: '240px',
                backgroundColor: '#000',
                border: `1px solid ${highlight ? '#fff' : '#222'}`, // Subtle dark grey border if not highlighted
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                margin: '10px',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                boxShadow: highlight ? `0 0 15px ${color}` : '0 2px 5px rgba(0,0,0,0.5)',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'monospace'
            }}
        >
            {/* Header Strip */}
            <div style={{
                height: '2px',
                width: '100%',
                backgroundColor: color,
                boxShadow: `0 0 5px ${color}`
            }} />

            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Top Info */}
                <div style={{
                    fontSize: '0.9rem',
                    color: color,
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    textTransform: 'uppercase',
                    alignItems: 'center'
                }}>
                    <span style={{ color: color, textShadow: `0 0 5px ${color}` }}>{stars}</span>
                    <span style={{ fontSize: '0.6rem', color: color }}>{card.regiment}</span>
                </div>

                {/* Unit Name */}
                <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    borderBottom: '1px solid #333',
                    paddingBottom: '10px',
                    marginBottom: '10px',
                    lineHeight: '1.2'
                }}>
                    {unitName}
                </div>

                {/* Regiment Name */}
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 'auto' }}>
                    {regimentName}
                </div>

                {/* Footer / Stats */}
                <div style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    borderTop: '1px solid #333',
                    paddingTop: '10px',
                    marginTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>ID: {card.id.split('-')[1].padStart(3, '0')}</span>
                </div>
            </div>
        </div>
    );
};
