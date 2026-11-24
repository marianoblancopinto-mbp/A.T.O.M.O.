/**
 * Componentes base de la interfaz. Toda pantalla nueva se arma con estos:
 *
 *  Modal         diálogo (acción o lectura). Uno solo para todo el juego.
 *  Button        botón con variantes.
 *  Section       bloque con título dentro de un diálogo.
 *  Check         requisito cumplido / pendiente.
 *  Option        opción seleccionable (carta, suministro, país, jugador).
 *  Announcement  anuncio a pantalla completa (turno, año, alerta, fin).
 *
 * Los colores salen del tono (`tone`): default, mission, nuclear, intel,
 * diplomacy, danger, warn. Ver src/ui/ui.css.
 */

import React, { useEffect, useId } from 'react';

export type Tone = 'default' | 'mission' | 'nuclear' | 'intel' | 'diplomacy' | 'danger' | 'warn';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------------------------------------------------------------- Button

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    tone?: Tone;
    block?: boolean;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'secondary', size = 'md', tone, block, className, type = 'button', ...rest }) => (
    <button
        type={type}
        data-tone={tone}
        className={cx('ui-btn', variant !== 'secondary' && `ui-btn--${variant}`, size !== 'md' && `ui-btn--${size}`, block && 'ui-btn--block', className)}
        {...rest}
    />
);

// ---------------------------------------------------------------- Modal

interface ModalProps {
    title: React.ReactNode;
    kicker?: React.ReactNode;
    tone?: Tone;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Sin onClose el diálogo no se puede cerrar (pantallas de fase). */
    onClose?: () => void;
    footer?: React.ReactNode;
    /** 'screen' = fase que bloquea el juego (debajo de los diálogos). */
    layer?: 'dialog' | 'screen';
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, kicker, tone = 'default', size = 'md', onClose, footer, layer = 'dialog', children }) => {
    const titleId = useId();

    useEffect(() => {
        if (!onClose) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className={cx('ui-backdrop', layer === 'screen' && 'ui-backdrop--screen')}
            data-tone={tone}
            onMouseDown={e => { if (onClose && e.target === e.currentTarget) onClose(); }}
        >
            <div className={`ui-dialog ui-dialog--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <header className="ui-dialog__head">
                    <div className="ui-dialog__titles">
                        {kicker && <div className="ui-kicker">{kicker}</div>}
                        <h2 id={titleId} className="ui-dialog__title">{title}</h2>
                    </div>
                    {onClose && <button type="button" className="ui-close" onClick={onClose} aria-label="Cerrar">✕</button>}
                </header>
                <div className="ui-dialog__body">{children}</div>
                {footer && <footer className="ui-dialog__foot">{footer}</footer>}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------- contenido

export const Section: React.FC<{ title?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <section className={cx('ui-section', className)}>
        {title && <h3 className="ui-section__title">{title}</h3>}
        {children}
    </section>
);

export const Check: React.FC<{ ok: boolean; children: React.ReactNode }> = ({ ok, children }) => (
    <div className={cx('ui-check', ok ? 'ui-check--ok' : 'ui-check--bad')}>
        <span className="ui-check__mark" aria-hidden>{ok ? '✓' : '✕'}</span>
        <span>{children}</span>
        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {ok ? '(cumplido)' : '(pendiente)'}
        </span>
    </div>
);

interface OptionProps {
    label: React.ReactNode;
    meta?: React.ReactNode;
    selected?: boolean;
    disabled?: boolean;
    onSelect?: () => void;
    title?: string;
}

export const Option: React.FC<OptionProps> = ({ label, meta, selected, disabled, onSelect, title }) => (
    <button type="button" className="ui-option" aria-pressed={!!selected} disabled={disabled} onClick={onSelect} title={title}>
        <span className="ui-option__label">{label}</span>
        {meta && <span className="ui-option__meta">{meta}</span>}
    </button>
);

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="ui-empty">{children}</div>;

// ---------------------------------------------------------------- Announcement

interface AnnouncementProps {
    tone?: Tone;
    kicker?: React.ReactNode;
    title: React.ReactNode;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    /** Clic en cualquier parte (o Enter/Escape) lo cierra. Sin esto, sólo cierran las acciones. */
    onDismiss?: () => void;
    hint?: string;
    critical?: boolean;
}

export const Announcement: React.FC<AnnouncementProps> = ({ tone = 'default', kicker, title, children, actions, onDismiss, hint, critical }) => {
    useEffect(() => {
        if (!onDismiss) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === 'Enter') onDismiss(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onDismiss]);

    return (
        <div className={cx('ui-announce', critical && 'ui-announce--critical')} data-tone={tone} role="alertdialog" onClick={onDismiss}>
            <div className="ui-announce__card">
                {kicker && <div className="ui-kicker">{kicker}</div>}
                <h1 className="ui-announce__title">{title}</h1>
                {children && <div className="ui-announce__body">{children}</div>}
                {actions && <div className="ui-announce__actions" onClick={e => e.stopPropagation()}>{actions}</div>}
                {onDismiss && !actions && <div className="ui-announce__hint">{hint ?? '> CLIC PARA CONTINUAR <'}</div>}
            </div>
        </div>
    );
};
