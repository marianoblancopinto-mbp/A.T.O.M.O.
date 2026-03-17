import React, { useState } from 'react';
import { getSpecialMissions } from '../../../data/missionData';

interface SecondaryMissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    proxyWarCountry: string;
}

export const SecondaryMissionsModal: React.FC<SecondaryMissionsModalProps> = ({ 
    isOpen, 
    onClose, 
    proxyWarCountry 
}) => {
    const missions = getSpecialMissions(proxyWarCountry);
    const [activeSection, setActiveSection] = useState<'mission' | 'espionage'>('mission');
    const [activeMissionId, setActiveMissionId] = useState(missions[0].id);

    if (!isOpen) return null;

    const activeMission = missions.find(m => m.id === activeMissionId)!;

    const sectionStyle: React.CSSProperties = {
        color: '#ccc',
        lineHeight: '1.7',
        fontSize: '0.95rem',
    };

    const h3Style: React.CSSProperties = {
        color: '#ff8800',
        borderBottom: '1px solid #ff880044',
        paddingBottom: '8px',
        marginTop: '25px',
        marginBottom: '12px',
        fontSize: '1.1rem',
        letterSpacing: '2px',
    };

    const boxStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 136, 0, 0.05)',
        border: '1px solid #ff880044',
        padding: '20px',
        marginTop: '20px',
        fontSize: '0.9rem',
    };

    const renderEspionage = () => (
        <div style={sectionStyle}>
            <div style={{
                color: '#00ffff',
                fontSize: '0.8rem',
                letterSpacing: '5px',
                marginBottom: '10px',
                opacity: 0.5,
                textTransform: 'uppercase'
            }}>
                PROTOCOLO DE INTELIGENCIA
            </div>
            <h2 style={{ color: '#00ffff', fontSize: '2rem', margin: '0 0 20px 0', letterSpacing: '3px' }}>
                INTELIGENCIA Y ESPIONAJE
            </h2>

            <h3 style={{ ...h3Style, color: '#00ffff', borderColor: '#00ffff44' }}>FUNDAMENTOS OPERATIVOS</h3>
            <p style={{ textAlign: 'justify' }}>
                El espionaje no es una condición de victoria directa, pero es el pilar sobre el cual se construyen las estrategias de defensa y ataque nuclear. Sin inteligencia, el despliegue de un ataque nuclear es un salto al vacío.
            </p>

            <h3 style={{ ...h3Style, color: '#00ffff', borderColor: '#00ffff44' }}>CREACIÓN DE UNA RED</h3>
            <p>Para establecer una <strong>Red de Inteligencia</strong> operativa, se requiere procesar recursos en una sede oficial:</p>
            <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Sedes Válidas:</strong> Nueva York (EE.UU.), Londres (Reino Unido), Beijing (China) o Moscú (Rusia).</li>
                <li><strong>Tecnología:</strong> Se debe asignar una carta de <strong>Industria Electrónica</strong>.</li>
                <li><strong>Materia Prima:</strong> Se deben suministrar <strong>Semiconductores</strong> (requiere ruta de suministro activa a la sede).</li>
            </ul>

            <h3 style={{ ...h3Style, color: '#00ffff', borderColor: '#00ffff44' }}>CAPACIDADES DE INFILTRACIÓN</h3>
            <div style={{ ...boxStyle, backgroundColor: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff44' }}>
                <div style={{ color: '#00ffff', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1rem' }}>
                    EFECTO DE ACTIVACIÓN (UN SOLO USO)
                </div>
                <p style={{ margin: 0, color: '#fff', lineHeight: '1.5' }}>
                    Una vez establecida la red, el jugador puede consumir la carta de espionaje para ejecutar una de las siguientes acciones:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div style={{ border: '1px solid #00ffff22', padding: '10px', backgroundColor: '#001111' }}>
                        <div style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '5px' }}>REVELAR SILOS</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Muestra la ubicación de todos los silos enemigos, su nivel de combustible y si tienen misiles listos.</div>
                    </div>
                    <div style={{ border: '1px solid #00ffff22', padding: '10px', backgroundColor: '#001111' }}>
                        <div style={{ color: '#00ffff', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '5px' }}>LOCALIZAR MINERAL</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Identifica qué país contiene el depósito de Mineral Secreto y revela si el enemigo ya ha comenzado la extracción.</div>
                    </div>
                </div>
            </div>
            
            <h3 style={{ ...h3Style, color: '#00ffff', borderColor: '#00ffff44' }}>AGENCIAS ACTIVAS</h3>
            <p style={{ fontSize: '0.85rem' }}>
                Dependiendo de la sede controlada, se activa una agencia específica con protocolos propios:
                <br /><br />
                • <strong>CIA</strong> (Nueva York) | • <strong>MI6</strong> (Reino Unido) | • <strong>MSS</strong> (China) | • <strong>SVR</strong> (Rusia)
            </p>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            fontFamily: '"Courier New", Courier, monospace',
        }}>
            {/* Sidebar — Missions & Espionage */}
            <div style={{
                width: '280px',
                minWidth: '280px',
                backgroundColor: '#0a0a0a',
                borderRight: '1px solid #222',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 0',
                overflowY: 'auto',
            }}>
                <div style={{
                    padding: '0 20px 20px',
                    borderBottom: '1px solid #222',
                    marginBottom: '10px',
                }}>
                    <h2 style={{
                        color: '#ff8800',
                        fontSize: '1.1rem',
                        margin: 0,
                        letterSpacing: '2px',
                    }}>
                        OBJETIVOS ADICIONALES
                    </h2>
                    <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '5px' }}>
                        Protocolos Secundarios
                    </div>
                </div>

                {/* Espionage Toggle */}
                <button
                    onClick={() => setActiveSection('espionage')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        backgroundColor: activeSection === 'espionage' ? 'rgba(0, 255, 255, 0.1)' : 'transparent',
                        color: activeSection === 'espionage' ? '#00ffff' : '#444',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        borderLeft: activeSection === 'espionage' ? '3px solid #00ffff' : '3px solid transparent',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                    }}
                >
                    INTELIGENCIA Y ESPIONAJE
                </button>

                <div style={{ padding: '0 20px 10px', color: '#222', fontSize: '0.65rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                    OPERACIONES DE CAMPO
                </div>

                {missions.map((mission) => (
                    <button
                        key={mission.id}
                        onClick={() => {
                            setActiveSection('mission');
                            setActiveMissionId(mission.id);
                        }}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: (activeSection === 'mission' && activeMissionId === mission.id) ? 'rgba(255, 136, 0, 0.1)' : 'transparent',
                            color: (activeSection === 'mission' && activeMissionId === mission.id) ? '#ff8800' : '#444',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            borderLeft: (activeSection === 'mission' && activeMissionId === mission.id) ? '3px solid #ff8800' : '3px solid transparent',
                            transition: 'all 0.2s',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                        onMouseEnter={(e) => {
                            if (activeSection !== 'mission' || activeMissionId !== mission.id) {
                                e.currentTarget.style.backgroundColor = '#0d0d0d';
                                e.currentTarget.style.color = '#aaa';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeSection !== 'mission' || activeMissionId !== mission.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#444';
                            }
                        }}
                    >
                        {mission.title}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '40px 60px',
                position: 'relative',
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        right: '20px',
                        background: 'none',
                        border: '1px solid #444',
                        color: '#888',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '5px 12px',
                        zIndex: 10001,
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff4444';
                        e.currentTarget.style.color = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.color = '#888';
                    }}
                >
                    X
                </button>

                <div style={{ maxWidth: '800px' }}>
                    {activeSection === 'espionage' ? renderEspionage() : (
                        <div style={sectionStyle}>
                            <div style={{
                                color: '#ff8800',
                                fontSize: '0.8rem',
                                letterSpacing: '5px',
                                marginBottom: '10px',
                                opacity: 0.5,
                                textTransform: 'uppercase'
                            }}>
                                Análisis de Objetivo: {activeMission.id.replace(/_/g, ' ')}
                            </div>

                            <h2 style={{
                                color: '#ff8800',
                                fontSize: '2rem',
                                margin: '0 0 20px 0',
                                letterSpacing: '3px',
                            }}>
                                {activeMission.title}
                            </h2>

                            <h3 style={{ ...h3Style, marginTop: 0 }}>CONTEXTO TÁCTICO</h3>
                            <p style={{ textAlign: 'justify' }}>
                                {activeMission.lore}
                            </p>

                            <h3 style={h3Style}>REQUISITOS OPERATIVOS</h3>
                            <ul style={{ paddingLeft: '20px' }}>
                                {activeMission.requirements.control.length > 0 && (
                                    <li><strong>Territorios:</strong> {activeMission.requirements.control.map(id => id.replace(/_/g, ' ').toUpperCase()).join(', ')}</li>
                                )}
                                {activeMission.requirements.technology.length > 0 && (
                                    <li><strong>Tecnologías:</strong> {activeMission.requirements.technology.map(t => t.replace(/_/g, ' ')).join(', ')}</li>
                                )}
                                {activeMission.requirements.rawMaterials.length > 0 && (
                                    <li><strong>Materias Primas:</strong> {activeMission.requirements.rawMaterials.map(m => m.replace(/_/g, ' ')).join(', ')}</li>
                                )}
                                <li><strong>Consumo:</strong> {activeMission.description.includes('Suministro') ? activeMission.description : 'Recursos variables según despliegue'}</li>
                            </ul>

                            <h3 style={h3Style}>DETALLE DEL EFECTO</h3>
                            <div style={boxStyle}>
                                <div style={{ color: '#ffcc88', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.2rem', letterSpacing: '1px' }}>
                                    {activeMission.mechanicalEffect.toUpperCase()}
                                </div>
                                <div style={{ 
                                    marginTop: '15px', 
                                    paddingTop: '15px', 
                                    borderTop: '1px dashed #ff880044',
                                    fontSize: '0.9rem',
                                    color: '#ccc',
                                    lineHeight: '1.4'
                                }}>
                                    <strong>Impacto Mecánico:</strong> El beneficio es permanente mientras se mantenga el control de los territorios requeridos. No requiere consumo de turno una vez activado.
                                    <br /><br />
                                    <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                        * {activeMission.description}
                                    </span>
                                </div>
                            </div>

                            <h3 style={{ ...h3Style, color: '#ff4444', marginTop: '30px' }}>PROTOCOLOS DE INTERRUPCIÓN</h3>
                            <div style={{ ...boxStyle, border: '1px solid #ff444440', backgroundColor: '#1a0000' }}>
                                <div style={{ color: '#ffaaaa', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    <span style={{ fontWeight: 'bold', color: '#ff4444' }}>CONDICIÓN DE DESACTIVACIÓN:</span> {activeMission.deactivationConditions}
                                </div>
                                <div style={{ 
                                    marginTop: '10px', 
                                    fontSize: '0.8rem', 
                                    color: '#888', 
                                    fontStyle: 'italic',
                                    borderTop: '1px solid #ff444420',
                                    paddingTop: '10px'
                                }}>
                                    Nota: Si la misión se desactiva por pérdida de territorio, deberá ser reactivada mediante un nuevo despliegue de recursos una vez recuperado el control.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer info */}
                    <div style={{
                        marginTop: '60px',
                        color: '#222',
                        fontSize: '0.7rem',
                        letterSpacing: '2px',
                        textAlign: 'right',
                        borderTop: '1px solid #111',
                        paddingTop: '20px'
                    }}>
                        PROTOCOLO DE SEGURIDAD {activeSection === 'espionage' ? 'CI-7' : 'X-MIL'} ACTIVADO — {activeSection === 'espionage' ? 'EYES ONLY' : 'ACCESO RESTRINGIDO'}
                    </div>
                </div>
            </div>
        </div>
    );
};
