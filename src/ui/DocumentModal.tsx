import React from 'react';
import { Modal, type Tone } from './components';

export interface DocItem { id: string; label: React.ReactNode; group?: string }

/**
 * Documento con índice lateral (pestañas en móvil): manual, historia, informe
 * de misión, misiones secundarias y ajustes. Un único layout para todos.
 */
export const DocumentModal: React.FC<{
    kicker: React.ReactNode;
    title: React.ReactNode;
    tone?: Tone;
    items: DocItem[];
    activeId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    numbered?: boolean;
    footer?: React.ReactNode;
    children: React.ReactNode;
}> = ({ kicker, title, tone, items, activeId, onSelect, onClose, numbered, footer, children }) => {
    let lastGroup: string | undefined;
    return (
        <Modal kicker={kicker} title={title} tone={tone} size="xl" onClose={onClose} footer={footer}>
            <div className="ui-doc">
                <nav className="ui-doc__nav" aria-label="Secciones">
                    {items.map((it, i) => {
                        const header = it.group && it.group !== lastGroup ? <div className="ui-doc__group">{it.group}</div> : null;
                        lastGroup = it.group ?? lastGroup;
                        return (
                            <React.Fragment key={it.id}>
                                {header}
                                <button type="button" className="ui-doc__link" aria-current={it.id === activeId} onClick={() => onSelect(it.id)}>
                                    {numbered && <span className="ui-doc__num">{String(i + 1).padStart(2, '0')}</span>}
                                    <span>{it.label}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </nav>
                <div className="ui-doc__content">{children}</div>
            </div>
        </Modal>
    );
};
