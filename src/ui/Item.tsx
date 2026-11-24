import React from 'react';

/** Fila de lista con título, descripción, estado y acciones (objetivos, silos, tratados…). */
export const Item: React.FC<{
    title: React.ReactNode;
    desc?: React.ReactNode;
    status?: { label: string; kind: 'ok' | 'wait' | 'no' };
    actions?: React.ReactNode;
    done?: boolean;
    children?: React.ReactNode;
}> = ({ title, desc, status, actions, done, children }) => (
    <div className={`ui-item${done ? ' ui-item--done' : ''}`}>
        <div className="ui-item__main">
            <div className="ui-item__title">{title}</div>
            {desc && <div className="ui-item__desc">{desc}</div>}
        </div>
        {(status || actions) && (
            <div className="ui-item__side">
                {status && <span className={`ui-status ui-status--${status.kind}`}>{status.label}</span>}
                {actions}
            </div>
        )}
        {children && <div className="ui-item__sub">{children}</div>}
    </div>
);
