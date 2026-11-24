import React, { useState } from 'react';
import type { PlayerSupplies, SupplyType } from '../../../types/productionTypes';
import { regionTitle } from '@atomo/shared';
import { useSupplyRoute } from '../../../hooks/useSupplyRoute';
import { Modal, Section, Option, Empty, Button } from '../../../ui/components';

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

const LABEL: Record<SupplyType, string> = { food: 'Alimentos', manufacture: 'Manufactura', energy: 'Energía' };

/** Cartas extra por suministros: cada set completo (1 de cada tipo) = 4, cada suelto = 1. */
export function drawCountFor(supplies: PlayerSupplies, selected: Set<string>): number {
    let m = supplies.manufacture.filter(s => selected.has(s.id)).length;
    let f = supplies.food.filter(s => selected.has(s.id)).length;
    let e = supplies.energy.filter(s => selected.has(s.id)).length;
    let sets = 0;
    while (m > 0 && f > 0 && e > 0) { sets++; m--; f--; e--; }
    return sets * 4 + m + f + e;
}

export const BattleSupplyModal: React.FC<BattleSupplyModalProps> = ({ isOpen, onClose, supplies, playerName, playerIndex, targetRegionId, onConfirm }) => {
    const { checkRoute } = useSupplyRoute();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    if (!isOpen) return null;

    const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const draw = drawCountFor(supplies, selected);
    const all = (['food', 'manufacture', 'energy'] as SupplyType[]).flatMap(t => supplies[t].map(s => ({ ...s, t })));

    return (
        <Modal
            kicker={`Comandante ${playerName}`}
            title="Suministros de batalla"
            size="md"
            onClose={onClose}
            footer={<>
                <span className="ui-muted" style={{ flex: '2 1 220px', alignSelf: 'center' }}>
                    {draw === 0 ? 'Set completo (1 de cada tipo) = 4 cartas · suelto = 1 carta.' : `Vas a robar ${draw} carta${draw === 1 ? '' : 's'}.`}
                </span>
                <Button variant="primary" disabled={draw === 0} onClick={() => { onConfirm(selected); setSelected(new Set()); }}>Usar suministros</Button>
            </>}
        >
            <Section title={`Frente: ${regionTitle(targetRegionId)}`}>
                {all.length === 0 ? <Empty>No tenés suministros. Se producen en el preturno.</Empty> : (
                    <div className="ui-grid">
                        {all.map(s => {
                            const route = checkRoute(s.originCountry, targetRegionId, playerIndex);
                            return (
                                <Option key={s.id} label={LABEL[s.t]}
                                    meta={route ? `Origen: ${regionTitle(s.originCountry)}` : `${regionTitle(s.originCountry)} · sin ruta al frente`}
                                    selected={selected.has(s.id)} disabled={!route} onSelect={() => toggle(s.id)} />
                            );
                        })}
                    </div>
                )}
            </Section>
        </Modal>
    );
};
