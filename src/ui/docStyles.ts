import type React from 'react';

/**
 * Estilos de texto de los documentos (manual, informes, ajustes). Antes cada
 * modal definía los suyos con colores distintos; ahora salen de los tokens.
 * La mayoría de los elementos (h3, table, th, td) ya toman estilo de
 * .ui-doc__content; estos objetos quedan para los bloques especiales.
 */
export const sectionStyle: React.CSSProperties = {};
export const textStyle: React.CSSProperties = {};
export const h3Style: React.CSSProperties = {};
export const tableStyle: React.CSSProperties = {};
export const thStyle: React.CSSProperties = {};
export const tdStyle: React.CSSProperties = {};
export const highlightStyle: React.CSSProperties = { color: 'var(--fg-strong)', fontWeight: 'bold' };
export const boxStyle: React.CSSProperties = {
    padding: '14px 16px', margin: '10px 0 16px', border: '1px solid rgba(var(--tone-rgb), 0.35)',
    background: 'rgba(var(--tone-rgb), 0.05)',
};
export const tipStyle: React.CSSProperties = {
    padding: '12px 16px', margin: '14px 0', borderLeft: '3px solid var(--tone)',
    background: 'rgba(var(--tone-rgb), 0.06)', color: 'var(--fg)', fontSize: '0.9rem',
};
export const warningStyle: React.CSSProperties = {
    ...tipStyle, borderLeftColor: 'var(--red)', background: 'rgba(255, 59, 48, 0.07)',
};
