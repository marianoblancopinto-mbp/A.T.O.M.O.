import React, { useState } from 'react';
import {
    TECHNOLOGY_DATA, RAW_MATERIAL_DATA, TECHNOLOGY_REQUIREMENTS, TECHNOLOGY_PRODUCES, regionTitle,
    type SupplyType, type TechnologyType, type RawMaterialType,
} from '@atomo/shared';
import { useGameContext } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { useMyPlayer } from '../hooks/useMyPlayer';
import { Modal, Section, Option, Empty, Button } from '../ui/components';

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** País contra el que se chequea la ruta de las materias primas (frente de batalla). */
    battleTargetId?: string | null;
    filterTargetCountry?: string | null;
}

const SUPPLY_NAME: Record<SupplyType, string> = { food: 'Alimentos', manufacture: 'Manufactura', energy: 'Energía' };

/**
 * Inventario: suministros, tecnologías y materias primas del jugador. En el
 * preturno permite producir (tecnología + materia prima compatible).
 */
export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, battleTargetId, filterTargetCountry }) => {
    const { state } = useGameContext();
    const actions = useGameActions();
    const { myPlayer, resources, checkRoute } = useMyPlayer();
    const [tech, setTech] = useState<string | null>(null);
    const [raw, setRaw] = useState<string | null>(null);

    if (!isOpen || !myPlayer) return null;
    const producing = state.roundPhase === 'PRODUCTION';
    const routeTarget = battleTargetId || filterTargetCountry;
    const techCard = resources.technologies.find(t => t.id === tech);
    const neededRaw = techCard ? TECHNOLOGY_REQUIREMENTS[techCard.type as TechnologyType] : null;
    const totalSupplies = (['food', 'manufacture', 'energy'] as SupplyType[]).reduce((n, t) => n + myPlayer.supplies[t].length, 0);

    const produce = () => {
        if (!tech || !raw) return;
        actions.produceSupply(tech, raw);
        setTech(null);
        setRaw(null);
    };

    return (
        <Modal
            kicker={`Comandante ${myPlayer.name}`}
            title="Inventario"
            size="xl"
            onClose={onClose}
            footer={producing ? <>
                <span className="ui-muted" style={{ flex: '2 1 260px', alignSelf: 'center' }}>
                    {!tech ? 'Elegí una tecnología y una materia prima compatible.'
                        : !raw ? `${TECHNOLOGY_DATA[techCard!.type as TechnologyType].name} requiere ${RAW_MATERIAL_DATA[neededRaw!].name}.`
                        : `Produce 1 suministro de ${SUPPLY_NAME[TECHNOLOGY_PRODUCES[techCard!.type as TechnologyType]]}.`}
                </span>
                <Button variant="primary" disabled={!tech || !raw} onClick={produce}>Producir</Button>
            </> : <span className="ui-muted">Los suministros sólo se producen en el preturno, al inicio de cada ronda.</span>}
        >
            <Section title={`Suministros · ${totalSupplies}`}>
                {totalSupplies === 0 ? <Empty>No tenés suministros.</Empty> : (
                    <div className="ui-grid">
                        {(['food', 'manufacture', 'energy'] as SupplyType[]).flatMap(t => myPlayer.supplies[t].map(s => (
                            <Option key={s.id} label={SUPPLY_NAME[t]} meta={`Origen: ${regionTitle(s.originCountry)}`} />
                        )))}
                    </div>
                )}
            </Section>

            <div className="ui-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Section title={`Tecnologías · ${resources.technologies.length}`}>
                    {resources.technologies.length === 0 ? <Empty>Sin tecnologías.</Empty> : (
                        <div className="ui-grid">
                            {resources.technologies.map(c => {
                                const type = c.type as TechnologyType;
                                return (
                                    <Option key={c.id}
                                        label={TECHNOLOGY_DATA[type]?.name ?? c.type}
                                        meta={c.usedThisTurn ? 'Consumida esta ronda' : `${regionTitle(c.country)} · usa ${RAW_MATERIAL_DATA[TECHNOLOGY_REQUIREMENTS[type]].name}`}
                                        selected={tech === c.id}
                                        disabled={!producing || c.usedThisTurn}
                                        onSelect={() => { setTech(tech === c.id ? null : c.id); setRaw(null); }} />
                                );
                            })}
                        </div>
                    )}
                </Section>
                <Section title={`Materias primas · ${resources.rawMaterials.length}`}>
                    {resources.rawMaterials.length === 0 ? <Empty>Sin materias primas.</Empty> : (
                        <div className="ui-grid">
                            {resources.rawMaterials.map(c => {
                                const type = c.type as RawMaterialType;
                                const noRoute = !!routeTarget && !checkRoute(c.country, routeTarget);
                                const incompatible = !!neededRaw && neededRaw !== type;
                                return (
                                    <Option key={c.id}
                                        label={RAW_MATERIAL_DATA[type]?.name ?? c.type}
                                        meta={c.usedThisTurn ? 'Consumida esta ronda' : noRoute ? `${regionTitle(c.country)} · sin ruta al frente` : regionTitle(c.country)}
                                        selected={raw === c.id}
                                        disabled={!producing || !tech || c.usedThisTurn || incompatible}
                                        onSelect={() => setRaw(raw === c.id ? null : c.id)} />
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>
        </Modal>
    );
};
