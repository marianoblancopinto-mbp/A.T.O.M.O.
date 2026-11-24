import React, { useState } from 'react';
import { DocumentModal } from '../../../ui/DocumentModal';
import { boxStyle, h3Style, sectionStyle } from '../../../ui/docStyles';
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
        <DocumentModal kicker="Protocolos secundarios" title="Objetivos adicionales" onClose={onClose}
            items={[{ id: 'espionage', label: 'Inteligencia y espionaje' }, ...missions.map(m => ({ id: m.id, label: m.title, group: 'Operaciones de campo' }))]}
            activeId={activeSection === 'espionage' ? 'espionage' : activeMissionId}
            onSelect={id => { if (id === 'espionage') setActiveSection('espionage'); else { setActiveSection('mission'); setActiveMissionId(id); } }}>
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
        </DocumentModal>
    );
};
