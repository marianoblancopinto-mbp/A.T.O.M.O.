import React, { useState, useEffect } from 'react';
import type { PlayerSupplies } from '../../../types/productionTypes';
import { useSupplyRoute } from '../../../hooks/useSupplyRoute';

interface BattleSupplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplies: PlayerSupplies;
    playerName: string;
    playerColor: string;
    playerIndex: number | string;
    targetRegionId: string;
    onConfirm: (selectedIds: Set<string>) => void;
    onOpenInventory: () => void;
}

export const BattleSupplyModal: React.FC<BattleSupplyModalProps> = ({
    isOpen,
    onClose,
    supplies,
    playerName,
    playerColor,
    playerIndex,
    targetRegionId,
    onConfirm,
    onOpenInventory
}) => {
    const { checkRoute } = useSupplyRoute();
    const [selectedSupplyIds, setSelectedSupplyIds] = useState<Set<string>>(new Set());

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSupplyIds(new Set());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const SUPPLY_COLORS = {
        food: '#d500f9',       // Purple
        manufacture: '#2979ff',// Blue
        energy: '#ff9100',     // Orange
    };

    const SUPPLY_LABELS = {
        food: 'ALIMENTOS',
        manufacture: 'MANUFACTURA',
        energy: 'ENERGÍA',
    };

    const toggleSupplySelection = (supplyId: string) => {
        setSelectedSupplyIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(supplyId)) {
                newSet.delete(supplyId);
            } else {
                newSet.add(supplyId);
            }
            return newSet;
        });
    };

    const calculateDrawCount = (selectedIds: Set<string>) => {
        // Count selected by type
        const selectedManufacture = supplies.manufacture.filter(s => selectedIds.has(s.id));
        const selectedFood = supplies.food.filter(s => selectedIds.has(s.id));
        const selectedEnergy = supplies.energy.filter(s => selectedIds.has(s.id));

        let m = selectedManufacture.length;
        let f = selectedFood.length;
        let e = selectedEnergy.length;
        let sets = 0;

        // Calculate complete sets (1 of each type = 4 cards instead of 3)
        while (m > 0 && f > 0 && e > 0) {
            sets++;
            m--; f--; e--;
        }

        return (sets * 4) + m + f + e;
    };

    const totalCards = calculateDrawCount(selectedSupplyIds);

    const renderSelectableSupplyCard = (
        supply: { id: string, originCountry: string },
        type: 'food' | 'manufacture' | 'energy'
    ) => {
        const cardColor = SUPPLY_COLORS[type];
        const label = SUPPLY_LABELS[type];
        const isSelected = selectedSupplyIds.has(supply.id);

        const hasRoute = checkRoute(supply.originCountry, targetRegionId, playerIndex);
        const isDisabled = !hasRoute;

        return (
            <div
                key={supply.id}
                onClick={() => {
                    if (!isDisabled) toggleSupplySelection(supply.id);
                }}
                style={{
                    width: '110px',
                    height: '145px',
                    backgroundColor: isSelected ? '#1a2e2e' : (isDisabled ? 'rgba(30,0,0,0.8)' : '#000'),
                    border: isSelected ? '2px solid #00ffff' : (isDisabled ? '1px solid #600' : `1px solid ${cardColor}`),
                    opacity: isDisabled ? 0.7 : 1,
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '5px',
                    boxShadow: isSelected ? `0 0 15px ${cardColor}` : 'none',
                    transition: 'all 0.2s',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    overflow: 'hidden',
                    fontFamily: 'monospace',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    position: 'relative'
                }}
            >
                {/* Header Strip */}
                <div style={{
                    height: '3px',
                    width: '100%',
                    backgroundColor: isDisabled ? '#600' : cardColor,
                }} />

                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
                    {/* Supply Type */}
                    <div style={{
                        fontSize: '0.6rem',
                        color: isDisabled ? '#ff4444' : cardColor,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '5px',
                        fontWeight: 'bold'
                    }}>
                        {label}
                    </div>

                    {/* Selection Indicator */}
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: isSelected ? '#00ff00' : (isDisabled ? '#300' : '#222'),
                        margin: '5px 0'
                    }}>
                        {isSelected ? '✓' : (isDisabled ? '✗' : '○')}
                    </div>

                    {/* Route Status */}
                    {!hasRoute && (
                        <div style={{
                            color: '#ff4444',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'rgba(255,0,0,0.1)',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            border: '1px solid #600',
                            marginTop: '5px'
                        }}>
                            SIN RUTA
                        </div>
                    )}

                    {/* Origin Country */}
                    <div style={{
                        marginTop: 'auto',
                        padding: '3px',
                        fontSize: '0.5rem',
                        color: isDisabled ? '#633' : '#666',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {supply.originCountry.split('_')[0]}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: '#888', textAlign: 'center' }}>
                        {supply.originCountry} -&gt; {targetRegionId}
                    </div>
                </div>
                {isDisabled && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255,0,0,0.05)',
                        pointerEvents: 'none'
                    }} />
                )}
            </div>
        );
    };

    const allSuppliesEmpty = supplies.manufacture.length === 0 &&
        supplies.food.length === 0 &&
        supplies.energy.length === 0;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '800px', backgroundColor: '#111', border: `2px solid ${playerColor}`,
                padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <h2 style={{ color: playerColor, textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
                    SOLICITAR REFUERZOS - {playerName}
                </h2>

                <p style={{ color: '#888', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>
                    Selecciona los suministros a intercambiar. 1 Set Completo (Man + Ali + Ene) = 4 Cartas
                </p>

                {allSuppliesEmpty ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#666',
                        border: '1px dashed #333',
                        borderRadius: '5px'
                    }}>
                        NO HAY SUMINISTROS DISPONIBLES
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '5px',
                        backgroundColor: '#0a0a0a',
                        padding: '10px',
                        borderRadius: '5px',
                        minHeight: '200px'
                    }}>
                        {supplies.manufacture.map(s => renderSelectableSupplyCard(s, 'manufacture'))}
                        {supplies.food.map(s => renderSelectableSupplyCard(s, 'food'))}
                        {supplies.energy.map(s => renderSelectableSupplyCard(s, 'energy'))}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    borderRadius: '5px'
                }}>
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        <div>Cartas seleccionadas: <span style={{ color: '#fff' }}>{selectedSupplyIds.size}</span></div>
                        <div style={{ marginTop: '5px' }}>
                            Cartas a recibir: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{totalCards}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={() => {
                                onClose();
                                onOpenInventory();
                            }}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#222',
                                border: '1px solid #00ff00',
                                color: '#00ff00',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                marginRight: 'auto'
                            }}
                        >
                            FABRICAR
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: 'transparent',
                                border: '1px solid #444',
                                color: '#aaa',
                                cursor: 'pointer',
                                borderRadius: '4px'
                            }}
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={() => onConfirm(selectedSupplyIds)}
                            disabled={selectedSupplyIds.size === 0}
                            style={{
                                padding: '10px 30px',
                                backgroundColor: selectedSupplyIds.size > 0 ? playerColor : '#222',
                                color: selectedSupplyIds.size > 0 ? '#000' : '#444',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: selectedSupplyIds.size > 0 ? 'pointer' : 'not-allowed',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            CONFIRMAR CAMBIO
                        </button>
                    </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.7rem', color: '#444', textAlign: 'center' }}>
                    * Solo puedes seleccionar suministros con una ruta segura (conectada) hasta el teatro de operaciones.
                </p>
            </div>
        </div>
    );
};
