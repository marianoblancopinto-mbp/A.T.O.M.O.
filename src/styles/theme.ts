// Centralizar TODOS los colores del juego
export const THEME = {
    colors: {
        primary: '#00ff00',      // Verde terminal
        secondary: '#ff9100',    // Naranja misiones
        danger: '#ff4444',       // Rojo alertas
        background: {
            dark: '#000000',
            modal: 'rgba(0,0,0,0.95)',
            panel: '#001100',
        },
        text: {
            primary: '#00ff00',
            secondary: '#aaaaaa',
            disabled: '#555555',
        }
    },
    fonts: {
        main: "'Courier New', monospace",
    },
    borders: {
        standard: '1px solid #00ff00',
        modal: '3px solid #00ff00',
    },
    shadows: {
        glow: '0 0 15px rgba(0, 255, 0, 0.4)',
    }
};

// Estilos base de modales
export const MODAL_BASE_STYLE = {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8000,
    fontFamily: THEME.fonts.main,
};
