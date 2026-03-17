import React, { useState } from 'react';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    proxyWarCountry: string;
}

interface HistoricalEvent {
    date: string;
    text: string;
}

interface PeriodEntry {
    id: string;
    label: string;
    description: string;
    events: HistoricalEvent[];
}

const getPeriodEntries = (proxyWarCountry: string): PeriodEntry[] => [
    {
        id: 'estallido',
        label: 'EL ESTALLIDO',
        description: 'El colapso de la diplomacia y el inicio de la intervención directa de las superpotencias.',
        events: [
            {
                date: 'ENERO 2052',
                text: `Tras años de guerra civil en ${proxyWarCountry}, las tensiones internacionales se intensifican. Se acumula evidencia irrefutable de que Estados Unidos y China financiaban secretamente a los bandos opuestos del conflicto.`
            },
            {
                date: 'ABRIL 2052',
                text: `Un ataque sorpresa deja al bando respaldado por EE. UU. al borde del colapso. Washington anuncia el despliegue de tropas propias en el territorio, marcando su intervención directa.`
            },
            {
                date: 'AGOSTO 2052',
                text: `Con el apoyo de las tropas estadounidenses, los rebeldes retoman la tierra perdida y toman por sorpresa la capital de ${proxyWarCountry}. El equilibrio de poder se invierte drásticamente.`
            },
            {
                date: 'SEPTIEMBRE 2052',
                text: `China anuncia que también desplegará tropas propias en ${proxyWarCountry}. El mundo queda desconcertado. Nunca se comprendió por qué ambas superpotencias tenían tanto interés en controlar este territorio.`
            },
            {
                date: '17 OCTUBRE 2052',
                text: `Primer enfrentamiento directo entre tropas estadounidenses y chinas en décadas. Victoria china, reestableciendo el control de la capital de ${proxyWarCountry} mientras EE. UU. consolida otras regiones estratégicas. Fue el último avance sustancial de la guerra.`
            },
            {
                date: 'DICIEMBRE 2053',
                text: `En el célebre "Pacto de Año Nuevo", ambos gobiernos se comprometen públicamente a no utilizar armas nucleares bajo ninguna circunstancia.`
            },
            {
                date: 'NOVIEMBRE 2055',
                text: `La guerra en ${proxyWarCountry} se estanca en un punto muerto, pero ninguna de las potencias parece dispuesta a abandonar el conflicto. Los recursos de ambas naciones están severamente drenados.`
            }
        ]
    },
    {
        id: 'diez-guerras',
        label: 'LAS DIEZ GUERRAS',
        description: 'Una era de fragmentación global y el surgimiento de nuevos bloques regionales.',
        events: [
            {
                date: 'AÑO 2056',
                text: `Con la atención de las grandes potencias consumida por el estancamiento bélico, otros actores regionales aprovechan para presionar militarmente por objetivos propios. Sin recursos para imponer consecuencias, las superpotencias observan impotentes. Comienza el "Período de las Diez Guerras".`
            },
            {
                date: '2056 — 2069',
                text: `Una era de conquistas, guerras civiles y disputas fronterizas que redibujaron el mapa mundial. Los países pequeños, incapaces de defenderse solos, se agrupan en bloques de defensa mutua, sembrando la semilla de nuevas potencias.`
            },
            {
                date: '3 MARZO 2067',
                text: `La red de alianzas alcanza tal complejidad que tropas de la Unión Europea se enfrentan accidentalmente entre sí en Estambul. El incidente desencadena una crisis institucional que culmina en la disolución definitiva de la organización.`
            },
            {
                date: 'AGOSTO 2067',
                text: `La batalla de Estambul escala caóticamente a un asedio prolongado. Termina con la destrucción total de la ciudad tras un devastador bombardeo británico. Los restos de la antigua Constantinopla se convierten en símbolo del fin del viejo orden.`
            },
            {
                date: '15 JULIO 2069',
                text: `Termina oficialmente el Período de las Diez Guerras con la formación de la Alianza Sudamericana, cuyo objetivo declarado es desarrollar un programa de armas nucleares propio. Los países del Mediterráneo siguen el ejemplo poco después.`
            }
        ]
    },
    {
        id: 'tetrapolar',
        label: 'CONFLICTO TETRAPOLAR',
        description: 'La Tercera Guerra Mundial estalla por el control de la cuenca mediterránea y culmina en el intercambio nuclear total.',
        events: [
            {
                date: '2069 — 2075',
                text: `La Tercera Guerra Mundial estalla por la disputa entre la Alianza Mediterránea y el bloque chino por el control de la caótica Turquía, arrastrando a las demás potencias al conflicto. La tecnología bélica avanza a pasos agigantados mientras la diplomacia desaparece.`
            },
            {
                date: '15 JULIO 2075',
                text: `El Día de las Bombas. En apenas 10 horas, 175 misiles nucleares impactan en Rusia, Estados Unidos y China. Nunca se determinó qué misil se disparó primero. Millones mueren en la primera hora. El orden mundial colapsa instantáneamente bajo una nube de ceniza radiactiva.`
            }
        ]
    },
    {
        id: 'renacimiento',
        label: 'EL RENACIMIENTO',
        description: 'La humanidad se une sobre las cenizas para evitar su propia extinción.',
        events: [
            {
                date: 'AÑO 2076',
                text: `El caos post-nuclear deriva en guerras civiles en los países devastados. Las potencias emergentes del nuevo mundo crean la Organización de la Nueva Paz (ONP) para intervenir, estabilizar la situación y evitar una segunda catástrofe nuclear.`
            },
            {
                date: 'AÑO 2077',
                text: `Las operaciones de la ONP son un éxito rotundo. Con inmenso apoyo popular, la organización anuncia el desarmamiento y destrucción de todos los programas nucleares con fines bélicos existentes. Una nueva era de paz parece posible... hasta el escándalo que lo cambió todo.`
            }
        ]
    }
];

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, proxyWarCountry }) => {
    const periods = getPeriodEntries(proxyWarCountry);
    const [activePeriodId, setActivePeriodId] = useState(periods[0].id);

    if (!isOpen) return null;

    const activePeriod = periods.find(p => p.id === activePeriodId)!;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            fontFamily: '"Courier New", Courier, monospace',
        }}>
            {/* Sidebar — Periods */}
            <div style={{
                width: '260px',
                minWidth: '260px',
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
                        color: '#00ff00',
                        fontSize: '1.1rem',
                        margin: 0,
                        letterSpacing: '2px',
                    }}>
                        ARCHIVO HISTÓRICO
                    </h2>
                    <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '5px' }}>
                        Registros del Colapso
                    </div>
                </div>

                {periods.map((period, idx) => (
                    <button
                        key={period.id}
                        onClick={() => setActivePeriodId(period.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: activePeriodId === period.id ? '#001a00' : 'transparent',
                            color: activePeriodId === period.id ? '#00ff00' : '#444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            borderLeft: activePeriodId === period.id ? '3px solid #00ff00' : '3px solid transparent',
                            transition: 'all 0.2s',
                            gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                            if (activePeriodId !== period.id) {
                                e.currentTarget.style.backgroundColor = '#0d0d0d';
                                e.currentTarget.style.color = '#aaa';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activePeriodId !== period.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#444';
                            }
                        }}
                    >
                        <div style={{ color: activePeriodId === period.id ? '#00ff00' : '#333', fontSize: '0.65rem', fontWeight: 'bold' }}>
                            {String(idx + 1).padStart(2, '0')}.
                        </div>
                        <div style={{ letterSpacing: '1px' }}>{period.label}</div>
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
                    <div style={{
                        color: '#00ff00',
                        fontSize: '0.8rem',
                        letterSpacing: '5px',
                        marginBottom: '10px',
                        opacity: 0.5,
                        textTransform: 'uppercase'
                    }}>
                        Periodo de Análisis: {activePeriod.label}
                    </div>

                    <h2 style={{
                        color: '#00ff00',
                        fontSize: '2rem',
                        margin: '0 0 10px 0',
                        letterSpacing: '3px',
                    }}>
                        {activePeriod.label}
                    </h2>
                    
                    <p style={{
                        color: '#888',
                        fontSize: '0.95rem',
                        margin: '0 0 40px 0',
                        fontStyle: 'italic',
                        borderBottom: '1px solid #00ff0022',
                        paddingBottom: '20px'
                    }}>
                        {activePeriod.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        {activePeriod.events.map((event, idx) => (
                            <div key={idx} style={{
                                position: 'relative',
                                paddingLeft: '30px',
                                borderLeft: '1px solid #00ff0033'
                            }}>
                                {/* Dot on timeline */}
                                <div style={{
                                    position: 'absolute',
                                    left: '-5px',
                                    top: '8px',
                                    width: '9px',
                                    height: '9px',
                                    backgroundColor: '#00ff00',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 10px #00ff00'
                                }} />
                                
                                <div style={{
                                    color: '#00ff00',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    letterSpacing: '2px',
                                    opacity: 0.9
                                }}>
                                    {event.date}
                                </div>
                                <p style={{
                                    color: '#ccc',
                                    fontSize: '1.05rem',
                                    lineHeight: '1.6',
                                    margin: 0,
                                    textAlign: 'justify',
                                }}>
                                    {event.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Navigation hint */}
                    <div style={{
                        marginTop: '60px',
                        color: '#222',
                        fontSize: '0.7rem',
                        letterSpacing: '2px',
                        textAlign: 'right',
                        borderTop: '1px solid #111',
                        paddingTop: '20px'
                    }}>
                        REGISTROS DISPONIBLES: {activePeriod.events.length} EVENTOS ENCONTRADOS
                    </div>
                </div>
            </div>
        </div>
    );
};
