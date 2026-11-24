import React, { useState } from 'react';
import { DocumentModal } from '../../../ui/DocumentModal';

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
        <DocumentModal kicker="Registros del colapso" title="Archivo histórico" numbered
            items={periods} activeId={activePeriodId} onSelect={setActivePeriodId} onClose={onClose}>
            <h2>{activePeriod.label}</h2>
            <p className="ui-lore">{activePeriod.description}</p>
            <ol style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', borderLeft: '1px solid rgba(var(--tone-rgb), 0.35)' }}>
                {activePeriod.events.map((event, idx) => (
                    <li key={idx} style={{ position: 'relative', padding: '0 0 22px 20px' }}>
                        <span aria-hidden style={{ position: 'absolute', left: -5, top: 6, width: 9, height: 9, background: 'var(--tone)' }} />
                        <div className="ui-kicker">{event.date}</div>
                        <p className="ui-text" style={{ margin: '4px 0 0' }}>{event.text}</p>
                    </li>
                ))}
            </ol>
        </DocumentModal>
    );
};
