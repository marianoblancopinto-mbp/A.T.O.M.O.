import { THEME } from './theme';

// 3 estilos de misión pre-definidos
export const MISSION_PANEL_STYLES = {
    // Tipo A: Panel completo con requisitos (Antarctica, Estambul, etc)
    activation: {
        container: {
            backgroundColor: '#1a0a00',
            border: `3px solid ${THEME.colors.secondary}`,
            padding: '40px',
            width: '800px',
            maxHeight: '90vh',
            overflowY: 'auto' as const,
            boxShadow: `0 0 50px rgba(255, 145, 0, 0.4)`,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px'
        },
        header: {
            color: THEME.colors.secondary,
            textAlign: 'center' as const,
            margin: 0,
            fontSize: '1.8rem',
            letterSpacing: '2px'
        },
        description: {
            textAlign: 'center' as const,
            color: '#aaa',
            fontStyle: 'italic'
        },
        // Sections for Requirement Lists
        sectionHeader: {
            color: THEME.colors.secondary,
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: `1px solid ${THEME.colors.secondary}`,
            paddingBottom: '5px'
        },
        buttonContainer: {
            display: 'flex',
            gap: '20px',
            marginTop: 'auto'
        }
    },

    // Tipo B: Confirmación simple (Cruce Andes)
    confirmation: {
        container: {
            backgroundColor: '#001a1a', // Cyan tint for simple ops
            border: '2px solid #00ffff',
            padding: '30px',
            width: '500px',
            textAlign: 'center' as const,
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)'
        },
        header: {
            color: '#00ffff',
            fontSize: '1.5rem',
            marginBottom: '20px'
        }
    },

    // Tipo C: Información (Lore)
    info: {
        container: {
            backgroundColor: '#000',
            border: `1px solid ${THEME.colors.text.secondary}`,
            padding: '20px',
            maxWidth: '600px',
        },
        header: {
            color: THEME.colors.text.primary,
            fontSize: '1.2rem',
            marginBottom: '15px'
        }
    }
};
