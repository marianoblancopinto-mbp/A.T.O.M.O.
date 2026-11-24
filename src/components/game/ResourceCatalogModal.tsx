import React from 'react';
import { useGameContext } from '../../context/GameContext';
import { REGIONS, RAW_MATERIAL_DATA, TECHNOLOGY_DATA, type RawMaterialType, type TechnologyType } from '@atomo/shared';
import { Modal } from '../../ui/components';

/**
 * Catálogo global de recursos: qué países producen cada materia prima o
 * tecnología y quién los controla hoy. Un solo componente para ambos tipos
 * (antes eran dos archivos casi idénticos).
 */
export const ResourceCatalogModal: React.FC<{ kind: 'raw' | 'tech'; onClose: () => void }> = ({ kind, onClose }) => {
    const { state } = useGameContext();
    const { regionResources, owners, players } = state;
    const entries = regionResources ? Object.entries(kind === 'raw' ? regionResources.rawMaterials : regionResources.technologies) : [];
    const name = (k: string) => (kind === 'raw' ? RAW_MATERIAL_DATA[k as RawMaterialType]?.name : TECHNOLOGY_DATA[k as TechnologyType]?.name) ?? k.replace(/_/g, ' ');
    const desc = (k: string) => (kind === 'raw' ? RAW_MATERIAL_DATA[k as RawMaterialType]?.description : TECHNOLOGY_DATA[k as TechnologyType]?.description);

    return (
        <Modal kicker="Catálogo global" title={kind === 'raw' ? 'Materias primas' : 'Tecnologías'} size="md" onClose={onClose}>
            {entries.map(([key, countries]) => (
                <details key={key} className="ui-acc">
                    <summary><span>{name(key)}</span><span className="ui-muted" style={{ fontWeight: 'normal', fontSize: '0.8rem', marginLeft: 'auto' }}>{countries.length} países</span></summary>
                    <div className="ui-acc__body">
                        {desc(key) && <p className="ui-lore" style={{ margin: '4px 0 8px' }}>{desc(key)}</p>}
                        {countries.map((cid: string) => {
                            const owner = players.find(p => String(p.id) === String(owners[cid]));
                            return (
                                <div key={cid} className="ui-kv">
                                    <span>{REGIONS.find(r => r.id === cid)?.title ?? cid}</span>
                                    <span style={{ color: owner?.color ?? 'var(--muted)' }}>{owner?.name ?? 'Neutral'}</span>
                                </div>
                            );
                        })}
                    </div>
                </details>
            ))}
        </Modal>
    );
};
