import React from 'react';
import { useGameContext } from '../../context/GameContext';
import { useMyPlayer } from '../../hooks/useMyPlayer';
import { regionTitle, hasRoute, getSpecialMissions, DESIGN_NAME, RAW_MATERIAL_DATA, REGIONS, type RawMaterialType } from '@atomo/shared';
import { Modal, Section, Button, Empty } from '../../ui/components';
import { Item } from '../../ui/Item';
import { useOpenOperation } from '../../ui/operations/OperationModal';
import type { OperationId } from '../../ui/operations/specs';

/**
 * Expediente confidencial: el tablero de objetivos del jugador. Muestra el
 * estado de la carrera nuclear, las misiones disponibles, las redes de
 * espionaje y sus informes, y los activos especiales. Toda acción abre la
 * pantalla única de operaciones.
 */
export const ConfidentialInfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state } = useGameContext();
    const { myPlayer: me } = useMyPlayer();
    const open = useOpenOperation();
    if (!me) return null;

    const owns = (r: string | null | undefined) => !!r && String(state.owners[r]) === String(me.id);
    const run = (id: OperationId, regionId?: string, cardId?: string) => open({ id, regionId, cardId });

    const capable = state.regionResources?.nuclearWarCapable ?? [];
    const hasDesign = me.specialCards.some(c => c.name === DESIGN_NAME);
    const mineral = me.specialCards.find(c => c.type === 'SECRET_MINERAL');
    const site = me.secretMineralLocation;
    const year = state.gameDate.getFullYear();

    const missions = getSpecialMissions(state.proxyWarCountry).filter(m =>
        m.visibleFor.some(owns) || me.activeSpecialMissions.some(a => a.id === m.id) || me.specialCards.some(c => c.name === m.title));
    const missionDone = (id: string, title: string) =>
        me.activeSpecialMissions.some(a => a.id === id) || me.specialCards.some(c => c.name === title || c.name.startsWith(title));
    const networks = me.specialCards.filter(c => c.type === 'ESPIONAJE');

    return (
        <Modal kicker={`Comandante ${me.name}`} title="Expediente confidencial" size="lg" onClose={onClose}>
            <Section title="Carrera nuclear">
                <Item
                    title="1 · Diseño de armas nucleares"
                    desc={`En una potencia bélica: ${capable.map(regionTitle).join(', ') || 'ninguna'}.`}
                    done={hasDesign}
                    status={hasDesign ? { label: 'Completo', kind: 'ok' } : capable.some(owns) ? { label: 'Disponible', kind: 'wait' } : { label: 'Sin potencia', kind: 'no' }}
                    actions={!hasDesign && <Button size="sm" tone="nuclear" disabled={!capable.some(owns)} onClick={() => run('nuclear_design')}>Diseñar</Button>}
                />
                <Item
                    title="2 · Mineral secreto"
                    desc={`Yacimiento en ${regionTitle(site)}.`}
                    done={!!mineral}
                    status={mineral ? { label: 'Extraído', kind: 'ok' } : owns(site) ? { label: 'Disponible', kind: 'wait' } : { label: 'Hay que conquistarlo', kind: 'no' }}
                    actions={!mineral && <Button size="sm" tone="nuclear" disabled={!owns(site)} onClick={() => run('extract_mineral')}>Extraer</Button>}
                />
                <Item
                    title="3 · Silos de lanzamiento"
                    desc="Tardan 2 turnos en quedar operativos y necesitan combustible nuclear asignado."
                    actions={<Button size="sm" tone="nuclear" onClick={() => run('construct_silo')}>Construir silo</Button>}
                >
                    {me.silos.length === 0 ? <span className="ui-muted">Sin silos.</span> : me.silos.map(siloId => {
                        const st = me.siloStatus[siloId];
                        const fuelId = me.siloFuelCards?.[siloId];
                        const fuel = fuelId && state.productionDeck
                            ? [...state.productionDeck.rawMaterials, ...me.inventory.rawMaterials].find(c => c.id === fuelId)
                            : undefined;
                        const operative = st?.status === 'active';
                        const routeOk = !!mineral && hasRoute(state, me.id, mineral.originCountry, siloId);
                        return (
                            <Item
                                key={siloId}
                                title={`Silo en ${regionTitle(siloId)}`}
                                desc={<>
                                    {operative ? 'Operativo' : `${st?.status === 'construction' ? 'En construcción' : 'En enfriamiento'} · operable en ${year + (st?.turnsRemaining ?? 0)}`}
                                    {' · '}Combustible: {fuel ? `${RAW_MATERIAL_DATA[fuel.type as RawMaterialType]?.name ?? fuel.type} (${regionTitle(fuel.country)})` : 'sin asignar'}
                                    {mineral && <> · Ruta del mineral: {routeOk ? 'OK' : 'cortada'}</>}
                                </>}
                                status={operative ? { label: 'Operativo', kind: 'ok' } : { label: 'No operativo', kind: 'wait' }}
                                actions={<>
                                    <Button size="sm" tone="nuclear" disabled={st?.status === 'construction'} onClick={() => run('assign_fuel', siloId)}>{fuel ? 'Cambiar' : 'Asignar'} combustible</Button>
                                    {hasDesign && mineral && !me.nuclearDeploymentActive && (
                                        <Button size="sm" variant="primary" tone="nuclear" disabled={!operative} onClick={() => run('deploy', siloId)}>Desplegar</Button>
                                    )}
                                </>}
                            />
                        );
                    })}
                </Item>
                {me.nuclearDeploymentActive && (
                    <p className="ui-note" data-tone="nuclear">☢ Despliegue en curso. Ganás al cierre de la ronda si el silo sigue bajo tu control y nadie más activa su arsenal.</p>
                )}
            </Section>

            <Section title="Inteligencia">
                <Item
                    title="Redes de espionaje"
                    desc="Cada red permite revelar los silos o el yacimiento de mineral de un rival."
                    actions={<Button size="sm" tone="intel" onClick={() => run('espionage_network')}>Activar red</Button>}
                >
                    {networks.length === 0 ? <span className="ui-muted">Sin redes activas.</span> : networks.map(c => (
                        <Item key={c.id} title={`Agencia en ${regionTitle(c.originCountry)}`} status={{ label: 'Operativa', kind: 'ok' }}
                            actions={<Button size="sm" variant="primary" tone="intel" onClick={() => run('espionage_execute', undefined, c.id)}>Ejecutar</Button>} />
                    ))}
                </Item>
                {(me.intelReports ?? []).length > 0 && (
                    <Item title="Informes obtenidos">
                        {(me.intelReports ?? []).map(r => (
                            <div key={r.id} className="ui-text" style={{ margin: 0 }}>
                                <strong>{r.targetPlayerName}</strong> — {r.type === 'mineral'
                                    ? `mineral en ${r.data.location} (${r.data.isExtracted ? 'extraído' : 'sin extraer'})`
                                    : (r.data as { location: string; status: string }[]).length === 0 ? 'sin silos' : `silos: ${(r.data as { location: string; status: string }[]).map(s => `${s.location} (${s.status})`).join(', ')}`}
                            </div>
                        ))}
                    </Item>
                )}
            </Section>

            <Section title="Misiones especiales">
                {missions.length === 0 && <Empty>No controlás países con misiones disponibles.</Empty>}
                {missions.map(m => {
                    const multiSite = m.id === 'planta_desalinizacion' || m.id === 'energia_geotermica';
                    if (multiSite) {
                        return (
                            <Item key={m.id} title={m.title} desc={m.mechanicalEffect}>
                                {m.requirements.control.filter(r => owns(r) || me.specialCards.some(c => c.originCountry === r && (c.type === 'PLANTA_DESALINIZADORA' || c.type === 'PLANTA_GEOTERMICA'))).map(r => {
                                    const built = me.specialCards.some(c => c.originCountry === r && (m.id === 'planta_desalinizacion' ? c.type === 'PLANTA_DESALINIZADORA' : c.type === 'PLANTA_GEOTERMICA'));
                                    return (
                                        <Item key={r} title={regionTitle(r)} done={built}
                                            status={built ? { label: 'Operativa', kind: 'ok' } : { label: 'Disponible', kind: 'wait' }}
                                            actions={!built && <Button size="sm" tone="mission" onClick={() => run(m.id as OperationId, r)}>Construir</Button>} />
                                    );
                                })}
                            </Item>
                        );
                    }
                    const done = missionDone(m.id, m.title);
                    return (
                        <Item key={m.id} title={m.title} desc={m.mechanicalEffect} done={done}
                            status={done ? { label: 'Activa', kind: 'ok' } : { label: 'Disponible', kind: 'wait' }}
                            actions={!done && <Button size="sm" tone={m.id === 'secretos_guerra' ? 'intel' : 'mission'} onClick={() => run(m.id as OperationId)}>Ver operación</Button>} />
                    );
                })}
            </Section>

            <Section title="Activos especiales">
                {me.specialCards.length === 0 ? <Empty>Ningún activo especial en posesión.</Empty> : (
                    <div className="ui-grid">
                        {me.specialCards.map(c => (
                            <div key={c.id} className="ui-item" style={{ display: 'block', margin: 0 }}>
                                <div className="ui-item__title">{c.name}</div>
                                <div className="ui-item__desc">Origen: {REGIONS.find(r => r.id === c.originCountry)?.title ?? c.originCountry}</div>
                                <p className="ui-text" style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>{c.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </Modal>
    );
};
