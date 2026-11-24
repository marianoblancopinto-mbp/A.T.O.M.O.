import React, { useEffect } from 'react';
import { useMultiplayerContext } from '../../../context/GameContext';

/**
 * Muestra el motivo cuando el servidor rechaza una acción (no es tu turno,
 * carta ya consumida, falta una ruta de suministro, etc.). La validación
 * vive en el servidor; este aviso es la única forma de enterarse.
 */
export const ServerRejectionToast: React.FC = () => {
    const { error, clearError } = useMultiplayerContext();

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(clearError, 6000);
        return () => clearTimeout(t);
    }, [error, clearError]);

    if (!error) return null;
    return (
        <div
            role="alert"
            onClick={clearError}
            style={{
                position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
                maxWidth: 'calc(100vw - 32px)', zIndex: 12000, cursor: 'pointer',
                background: 'rgba(40, 0, 0, 0.95)', border: '2px solid #ff4444', color: '#ffaaaa',
                padding: '12px 18px', fontFamily: '"Courier New", Courier, monospace', fontSize: '0.95rem',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.35)',
            }}
        >
            <strong style={{ color: '#ff4444', letterSpacing: '2px' }}>ORDEN RECHAZADA: </strong>{error}
        </div>
    );
};
