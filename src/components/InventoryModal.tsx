import React, { useState } from 'react';
import { type TerritoryCard, type SupplyType, TECHNOLOGY_PRODUCES, type SupplyItem } from '../types/productionTypes';
import { TECHNOLOGY_DATA, RAW_MATERIAL_DATA, TECHNOLOGY_REQUIREMENTS } from '../data/productionData';
import { useGameContext } from '../context/GameContext';
import { useMyPlayer } from '../hooks/useMyPlayer';
import { useGameActions } from '../hooks/useGameActions';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Context-specific transient props that are not in global state
    battleTargetId?: string | null;
}

// Visual constants
const COLORS = {
    food: '#d500f9',       // Purple
    manufacture: '#2979ff',// Blue
    energy: '#ff9100',     // Orange
    background: 'rgba(10, 10, 15, 0.95)',
    cardBg: '#151520',
    selected: '#fff',      // White highlight for selection
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
    isOpen,
    onClose,
    battleTargetId
}) => {
    const { state } = useGameContext();
    const { productionDeck } = state;
    const { myPlayer, myPlayerIndex, resources, checkRoute } = useMyPlayer();
    const actions = useGameActions();

    const [selectedTech, setSelectedTech] = useState<string | null>(null);
    const [selectedRaw, setSelectedRaw] = useState<string | null>(null);

    // Reset selection when modal opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setSelectedTech(null);
            setSelectedRaw(null);
        }
    }, [isOpen]);

    if (!isOpen || !myPlayer) return null;

    const { technologies, rawMaterials } = resources;
    const { supplies, color, name: playerName } = myPlayer;

    // Helper to render a generic card
    const renderCard = (
        title: string,
        subtitle: string,
        typeColor: string,
        details: React.ReactNode,
        key: string,
        country?: string,
        isUsed?: boolean,
        isSelected?: boolean,
        onClick?: () => void,
        hasNoRoute?: boolean
    ) => (
        <div
            key={key}
            onClick={() => !isUsed && !hasNoRoute && onClick && onClick()}
            style={{
                width: '140px',
                height: '190px',
                backgroundColor: COLORS.cardBg,
                border: isSelected
                    ? `3px solid ${COLORS.selected}`
                    : (hasNoRoute ? '1px solid #600' : `2px solid ${typeColor}`),
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                margin: '3px',
                position: 'relative',
                boxShadow: isSelected
                    ? `0 0 20px ${COLORS.selected}`
                    : (hasNoRoute ? 'none' : `0 0 10px ${typeColor}40`),
                transition: 'transform 0.2s, box-shadow 0.2s',
                overflow: 'hidden',
                flexShrink: 0,
                opacity: (isUsed || hasNoRoute) ? 0.5 : 1,
                filter: (isUsed || hasNoRoute) ? 'grayscale(50%)' : 'none',
                cursor: (isUsed || hasNoRoute) ? 'default' : 'pointer'
            }}
            onMouseEnter={(e) => {
                if (!isUsed) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    if (!isSelected) e.currentTarget.style.boxShadow = `0 0 20px ${typeColor}80`;
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (!isSelected) e.currentTarget.style.boxShadow = `0 0 10px ${typeColor}40`;
            }}
        >
            {/* Header Strip */}
            <div style={{
                height: '4px',
                width: '100%',
                backgroundColor: typeColor,
                boxShadow: `0 0 5px ${typeColor}`
            }} />

            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', height: '100%', gap: '3px' }}>
                {/* Title */}
                <div style={{
                    fontSize: '0.7rem',
                    color: typeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '2px',
                    fontWeight: 'bold'
                }}>
                    {subtitle}
                </div>

                <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    borderBottom: '1px solid #333',
                    paddingBottom: '8px',
                    marginBottom: '5px',
                    lineHeight: '1.2',
                    minHeight: '40px' // Ensure title alignment
                }}>
                    {title}
                </div>

                {/* Body/Details */}
                <div style={{
                    fontSize: '0.8rem',
                    color: '#ccc',
                    marginTop: 'auto',
                    flex: 1,
                    overflowY: 'auto' // Scroll if needed
                }}>
                    {details}
                </div>

                {/* Country Origin */}
                {country && (
                    <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#999',
                        textTransform: 'uppercase',
                        border: '1px solid #333',
                        textAlign: 'center'
                    }}>
                        {country.replace(/_/g, ' ')}
                    </div>
                )}

                {/* Used Status */}
                {isUsed && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        color: '#ff4444',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        border: '1px solid #ff4444',
                        zIndex: 10,
                        pointerEvents: 'none'
                    }}>
                        AGOTADA
                    </div>
                )}

                {hasNoRoute && !isUsed && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(50,0,0,0.9)',
                        color: '#ff4444',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        border: '1px solid #600',
                        zIndex: 10,
                        pointerEvents: 'none',
                        textAlign: 'center',
                        width: '80%'
                    }}>
                        SIN RUTA AL FRENTE
                    </div>
                )}
            </div>
        </div>
    );

    // 1. Generate Supply Cards (Unselectable for production, just display)
    const supplyCards: React.ReactNode[] = [];
    (['manufacture', 'food', 'energy'] as SupplyType[]).forEach(type => {
        const items = supplies[type];
        items.forEach((item) => {
            supplyCards.push(renderCard(
                type === 'manufacture' ? 'MANUFACTURA' : type === 'food' ? 'ALIMENTOS' : 'ENERGÍA',
                'SUMINISTRO',
                COLORS[type],
                <div>Listo para ser utilizado.</div>,
                item.id,
                item.originCountry
            ));
        });
    });

    // 2. Generate Technology Cards
    const techCards = technologies.map((tech) => {
        const techType = tech.type as import('../types/productionTypes').TechnologyType;
        const techData = TECHNOLOGY_DATA[techType];
        const supplyType = TECHNOLOGY_PRODUCES[techType];
        const color = COLORS[supplyType]; // Match supply color

        const isSelected = selectedTech === tech.id;

        const requiredRawType = TECHNOLOGY_REQUIREMENTS[techType];
        const supplyLabel = supplyType === 'food' ? 'Alimentos' : supplyType === 'manufacture' ? 'Manufactura' : 'Energía';

        return renderCard(
            techData.name,
            'TECNOLOGÍA',
            color,
            <div style={{ fontSize: '0.7rem', lineHeight: '1.3' }}>
                Requiere: {RAW_MATERIAL_DATA[requiredRawType].name}<br />
                Produce: {supplyLabel}
            </div>,
            tech.id,
            tech.country,
            tech.usedThisTurn,
            isSelected,
            () => setSelectedTech(isSelected ? null : tech.id)
        );
    });

    // 3. Generate Raw Material Cards
    const rawMaterialCards = rawMaterials.map((rm) => {
        const rmType = rm.type as import('../types/productionTypes').RawMaterialType;
        const rmData = RAW_MATERIAL_DATA[rmType];
        const color = COLORS[rmData.category]; // Match supply category color

        const isSelected = selectedRaw === rm.id;

        // Find technology that requires this raw material
        const techEntry = Object.entries(TECHNOLOGY_REQUIREMENTS).find(([_, req]) => req === rmType);
        const requiredTechType = techEntry ? (techEntry[0] as import('../types/productionTypes').TechnologyType) : null;
        const techName = requiredTechType ? TECHNOLOGY_DATA[requiredTechType].name : 'TECNOLOGÍA';
        const supplyLabel = rmData.category === 'food' ? 'Alimentos' : rmData.category === 'manufacture' ? 'Manufactura' : 'Energía';

        const hasNoRoute = battleTargetId ? !checkRoute(rm.country, battleTargetId) : false;

        return renderCard(
            rmData.name,
            'MATERIA PRIMA',
            color,
            <div style={{ fontSize: '0.7rem', lineHeight: '1.3' }}>
                Requiere: {techName}<br />
                Produce: {supplyLabel}
            </div>,
            rm.id,
            rm.country,
            rm.usedThisTurn,
            isSelected,
            () => setSelectedRaw(isSelected ? null : rm.id),
            hasNoRoute
        );
    });

    // Production Logic Handler
    const handleProduce = () => {
        if (!selectedTech || !selectedRaw) return;

        // Find the actual card objects
        const techCard = technologies.find(t => t.id === selectedTech);
        const rawCard = rawMaterials.find(r => r.id === selectedRaw);

        if (!techCard || !rawCard) return;

        const techType = techCard.type as import('../types/productionTypes').TechnologyType;
        const rawType = rawCard.type as import('../types/productionTypes').RawMaterialType;

        // Validate compatibility
        const requiredRaw = TECHNOLOGY_REQUIREMENTS[techType];

        if (requiredRaw !== rawType) {
            alert(`Incompatible: ${TECHNOLOGY_DATA[techType].name} requiere ${RAW_MATERIAL_DATA[requiredRaw].name}, pero seleccionaste ${RAW_MATERIAL_DATA[rawType].name}.`);
            return;
        }

        const supplyType = TECHNOLOGY_PRODUCES[techType];

        // --- Production Logic ---

        // 1. Mark cards as used (Global Deck update)
        // This is important because Passive Production relies on Global Deck state
        if (actions.markCardAsUsed) {
            actions.markCardAsUsed(techCard.id, 'technology');
            actions.markCardAsUsed(rawCard.id, 'rawMaterial');
        }

        // 2. Mark cards as used (Player Inventory update - for Secret cards)
        // We update the whole inventory reference to ensure reactivity
        const newInventory = {
            technologies: myPlayer.inventory.technologies.map(c => c.id === techCard.id ? { ...c, usedThisTurn: true } : c),
            rawMaterials: myPlayer.inventory.rawMaterials.map(c => c.id === rawCard.id ? { ...c, usedThisTurn: true } : c)
        };
        actions.updatePlayerField(myPlayerIndex, 'inventory', newInventory);

        // 3. Find Origin Country
        let originCountry = 'Desconocido';

        // Try Global Deck first
        if (productionDeck) {
            const globalRawCard = productionDeck.rawMaterials.find(c => c.id === rawCard.id);
            if (globalRawCard) originCountry = globalRawCard.country;
        }

        // Try Inventory if still unknown (or to confirm if it has overrides)
        if (originCountry === 'Desconocido') {
            const invRawCard = myPlayer.inventory.rawMaterials.find(c => c.id === rawCard.id);
            if (invRawCard) {
                // Use type assertion if properties are not strictly typed in all interfaces
                originCountry = (invRawCard as any).country || (invRawCard as any).originCountry || 'Desconocido';
            }
        }

        // 4. Add Supply
        const newSupply: SupplyItem = {
            id: `supply-${Date.now()}-${Math.random()}`,
            type: supplyType,
            originCountry
        };

        actions.addSupplyToPlayer(myPlayerIndex, newSupply);

        // Deselect after production
        setSelectedTech(null);
        setSelectedRaw(null);
    };

    const getCompatibilityMessage = () => {
        if (selectedTech && selectedRaw) {
            const techCard = technologies.find(t => t.id === selectedTech);
            const rawCard = rawMaterials.find(r => r.id === selectedRaw);

            if (!techCard || !rawCard) return { valid: false, text: '' };

            const techType = techCard.type as import('../types/productionTypes').TechnologyType;
            const rawType = rawCard.type as import('../types/productionTypes').RawMaterialType;

            if (TECHNOLOGY_REQUIREMENTS[techType] === rawType) {
                return { valid: true, text: '✅ COMBINACIÓN CORRECTA' };
            } else {
                return { valid: false, text: '❌ COMBINACIÓN INCORRECTA' };
            }
        }
        return { valid: false, text: '' };
    };

    const compatibility = getCompatibilityMessage();
    const canProduce = selectedTech && selectedRaw && compatibility.valid;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 10001,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}
            onClick={onClose}
        >
            <div style={{
                width: '90%',
                maxWidth: '1200px',
                height: '90vh', // Increased height
                backgroundColor: COLORS.background,
                border: `2px solid ${color}`,
                boxShadow: `0 0 30px ${color}30`,
                display: 'flex',
                flexDirection: 'column',
                padding: '30px',
                overflow: 'hidden',
                borderRadius: '10px',
                animation: 'fadeIn 0.3s ease-out',
                position: 'relative' // For absolute positioning of button
            }}
                onClick={e => e.stopPropagation()} // Prevent close when clicking inside
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${color}50`,
                    paddingBottom: '20px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <h2 style={{
                            margin: 0,
                            color: color,
                            textTransform: 'uppercase',
                            fontSize: '2rem',
                            letterSpacing: '5px',
                            textShadow: `0 0 10px ${color}`
                        }}>
                            INVENTARIO Y PRODUCCIÓN
                        </h2>
                        <span style={{
                            color: '#fff',
                            fontSize: '1.2rem',
                            opacity: 0.7,
                            fontFamily: 'monospace'
                        }}>
                            // COMANDANTE {playerName}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${color}`,
                            color: color,
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}
                    >
                        CERRAR [X]
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px',
                    paddingBottom: '80px' // Space for production button
                }}>

                    {/* SECTION 1: SUPPLIES */}
                    <section>
                        <h3 style={{
                            color: '#fff',
                            borderLeft: '4px solid #fff',
                            paddingLeft: '15px',
                            marginBottom: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '2px'
                        }}>
                            Suministros Disponibles ({supplyCards.length})
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                            padding: '20px',
                            justifyItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            minHeight: '250px'
                        }}>
                            {supplyCards.length > 0 ? supplyCards : (
                                <div style={{ color: '#666', fontStyle: 'italic', padding: '20px' }}>
                                    No hay suministros formados.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* DOUBLE SECTION FOR PRODUCTION */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* SECTION 2: TECHNOLOGIES */}
                        <section style={{ flex: 1 }}>
                            <h3 style={{
                                color: '#fff',
                                borderLeft: '4px solid #fff',
                                paddingLeft: '10px',
                                marginBottom: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontSize: '0.8rem'
                            }}>
                                Tecnologías ({techCards.length})
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '5px',
                                padding: '5px',
                                justifyItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                minHeight: '250px'
                            }}>
                                {techCards.length > 0 ? techCards : (
                                    <div style={{ color: '#666', fontStyle: 'italic', padding: '10px', fontSize: '0.8rem' }}>
                                        No hay tecnologías disponibles.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SECTION 3: RAW MATERIALS */}
                        <section style={{ flex: 1 }}>
                            <h3 style={{
                                color: '#fff',
                                borderLeft: '4px solid #fff',
                                paddingLeft: '10px',
                                marginBottom: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontSize: '0.8rem'
                            }}>
                                Materias Primas ({rawMaterialCards.length})
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '5px',
                                padding: '5px',
                                justifyItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                minHeight: '250px'
                            }}>
                                {rawMaterialCards.length > 0 ? rawMaterialCards : (
                                    <div style={{ color: '#666', fontStyle: 'italic', padding: '10px', fontSize: '0.8rem' }}>
                                        No hay materias primas disponibles.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* PRODUCTION ACTION BAR */}
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    padding: '20px',
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    borderTop: `1px solid ${color}50`,
                    display: 'flex',
                    justifyContent: 'center', // Centered
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{ color: canProduce ? '#4caf50' : compatibility.text ? '#ff5252' : '#fff', fontWeight: 'bold' }}>
                        {compatibility.text || (
                            `Seleccionado: ${selectedTech ? '✅ Tecnología' : '❌ Tecnología'} + ${selectedRaw ? '✅ Materia Prima' : '❌ Materia Prima'}`
                        )}
                    </div>
                    <button
                        disabled={!canProduce}
                        onClick={handleProduce}
                        style={{
                            padding: '15px 40px',
                            backgroundColor: canProduce ? color : '#333',
                            color: canProduce ? '#000' : '#888',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            cursor: canProduce ? 'pointer' : 'not-allowed',
                            textTransform: 'uppercase',
                            boxShadow: canProduce ? `0 0 20px ${color}` : 'none',
                            transition: 'all 0.3s'
                        }}
                    >
                        PRODUCIR SUMINISTRO
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
