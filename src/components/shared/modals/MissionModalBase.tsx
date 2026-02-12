import React from 'react';
import { MISSION_PANEL_STYLES } from '../../../styles/missionStyles';
import { THEME } from '../../../styles/theme';

export type MissionType = 'activation' | 'confirmation' | 'info';

interface MissionModalBaseProps {
    title: string;
    type?: MissionType;
    onClose: () => void;
    children: React.ReactNode;
}

export const MissionModalBase: React.FC<MissionModalBaseProps> = ({
    title,
    type = 'activation',
    onClose,
    children
}) => {
    const styles = MISSION_PANEL_STYLES[type];

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: THEME.colors.background.modal,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9000,
            fontFamily: THEME.fonts.main
        }}>
            <div style={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={styles.header}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: THEME.colors.secondary,
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
