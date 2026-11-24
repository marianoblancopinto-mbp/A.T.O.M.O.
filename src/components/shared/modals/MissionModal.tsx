import React, { useState } from 'react';
import { DocumentModal } from '../../../ui/DocumentModal';
import { highlightStyle, textStyle, warningStyle } from '../../../ui/docStyles';

interface MissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type MissionSection = 'briefing' | 'context' | 'method' | 'resource' | 'intel' | 'objectives' | 'warning' | 'closing';

interface SectionData {
    id: MissionSection;
    label: string;
    title: string;
    content: React.ReactNode;
}

export const MissionModal: React.FC<MissionModalProps> = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState<MissionSection>('briefing');

    if (!isOpen) return null;

    const sections: SectionData[] = [
        {
            id: 'briefing', label: 'INFORME INICIAL', title: 'DESCRIPCIÓN DE MISIÓN',
            content: (
                <div style={textStyle}>
                    <p>
                        Tras la disolución de la Organización de la Nueva Paz — consecuencia del escándalo
                        al descubrirse que no destruyó la totalidad de las armas nucleares confiscadas — el mundo
                        se encuentra nuevamente fragmentado y al borde de un conflicto global.
                    </p>
                    <p style={{ marginTop: '15px' }}>
                        Las instituciones internacionales han perdido toda credibilidad. Las naciones que
                        alguna vez confiaron en la ONP ahora se preparan para lo peor.
                    </p>
                </div>
            )
        },
        {
            id: 'context', label: 'OPERACIÓN A.T.O.M.O', title: 'OPERACIÓN A.T.O.M.O.',
            content: (
                <div style={textStyle}>
                    <p>
                        Ya no es posible confiar en organismos internacionales. Ante esta realidad,
                        nuestro país ha tomado la decisión de actuar de manera unilateral.
                    </p>
                    <p style={{ marginTop: '15px' }}>
                        Usted ha sido seleccionado para asumir el mando de la <strong>Operación A.T.O.M.O.</strong>,
                        una iniciativa clasificada cuyo objetivo final es asegurar la supervivencia de nuestra
                        nación mediante la adquisición de capacidad nuclear disuasoria.
                    </p>
                    <div style={highlightStyle}>
                        <strong>Su rol:</strong> Comandante supremo de todas las fuerzas militares,
                        de inteligencia y de producción de su facción. Cada decisión estratégica
                        recae sobre usted.
                    </div>
                </div>
            )
        },
        {
            id: 'method', label: 'MÉTODO SECRETO', title: 'MÉTODO SECRETO',
            content: (
                <div style={textStyle}>
                    <p>
                        Un científico prófugo de la Organización de la Nueva Paz ha contactado a nuestros
                        servicios de inteligencia. Afirma haber desarrollado un nuevo método para fabricar
                        combustible apto para armas nucleares.
                    </p>
                    <p style={{ marginTop: '15px' }}>
                        El método es completamente secreto, lo que nos permitirá avanzar con la operación
                        sin levantar sospechas entre las demás facciones — al menos durante las etapas iniciales.
                    </p>
                </div>
            )
        },
        {
            id: 'resource', label: 'RECURSO ESTRATÉGICO', title: 'RECURSO ESTRATÉGICO',
            content: (
                <div style={textStyle}>
                    <p>
                        El método del científico se basa en la utilización de un mineral clasificado como
                        <strong> [CONFIDENCIAL]</strong> para refinar combustible nuclear. Hasta ahora,
                        este mineral solo se consideraba útil para la producción de energía pacífica,
                        no para la fabricación de armamento.
                    </p>
                    <div style={highlightStyle}>
                        <strong>Implicación:</strong> Si logramos asegurar depósitos de este mineral
                        antes que nuestros adversarios, tendremos una ventaja estratégica decisiva
                        en la carrera nuclear.
                    </div>
                </div>
            )
        },
        {
            id: 'intel', label: 'INTELIGENCIA', title: 'INTELIGENCIA DE CAMPO',
            content: (
                <div style={textStyle}>
                    <p>
                        El científico informó a nuestros agentes sobre la ubicación de un yacimiento
                        del mineral estratégico. Sin embargo, también advirtió que existen más depósitos
                        distribuidos por el mundo.
                    </p>
                    <p style={{ marginTop: '15px' }}>
                        Además, confirmó que varios de sus colegas desertaron de la ONP hacia territorios
                        controlados por facciones enemigas, lo que significa que <strong>no somos los únicos</strong>
                        con acceso a este conocimiento.
                    </p>
                    <div style={warningStyle}>
                        <strong>Alerta:</strong> Es altamente probable que otras facciones estén
                        ejecutando operaciones análogas en este mismo momento.
                    </div>
                </div>
            )
        },
        {
            id: 'objectives', label: 'OBJETIVOS', title: 'OBJETIVOS OPERATIVOS',
            content: (
                <div style={textStyle}>
                    <p style={{ marginBottom: '20px' }}>
                        Para completar exitosamente la Operación A.T.O.M.O., deberá cumplir los siguientes
                        objetivos en el orden que considere más estratégico:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[
                            { code: 'A', text: 'Localizar y asegurar el depósito del mineral secreto, conquistando el territorio donde se encuentra.' },
                            { code: 'B', text: 'Conseguir los planos para misiles intercontinentales de alguno de los programas nucleares que la ONP no logró destruir.' },
                            { code: 'C', text: 'Construir Silos de Lanzamiento en territorios seguros bajo su control.' },
                            { code: 'D', text: 'Asegurar rutas de suministro para el combustible nuclear hacia los silos operativos.' },
                        ].map(obj => (
                            <div key={obj.code} style={{
                                display: 'flex',
                                gap: '15px',
                                padding: '12px 15px',
                                backgroundColor: '#0a0a0a',
                                border: '1px solid #222',
                            }}>
                                <span style={{
                                    color: '#00ff00',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    minWidth: '25px',
                                }}>{obj.code})</span>
                                <span style={{ color: '#ccc' }}>{obj.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'warning', label: 'ADVERTENCIA', title: 'ADVERTENCIA',
            content: (
                <div style={textStyle}>
                    <div style={warningStyle}>
                        <p style={{ margin: '0 0 10px 0' }}>
                            <strong>Espere resistencia armada de las otras facciones al intentar ejecutar estos objetivos.</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                            Todas las naciones están en estado de alerta máxima. Sus fuerzas de inteligencia
                            intentarán infiltrar sus operaciones, sus ejércitos defenderán agresivamente
                            sus territorios, y no dudarán en intentar conquistar los suyos si detectan
                            una vulnerabilidad.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'closing', label: 'RECTA FINAL', title: 'RECTA FINAL',
            content: (
                <div style={textStyle}>
                    <p>
                        Si logramos completar estos objetivos antes que nuestros enemigos,
                        conseguiremos poner fin a lo que la prensa internacional ya denomina
                        la <strong>Cuarta Guerra Mundial</strong>.
                    </p>
                    <p style={{ marginTop: '20px' }}>
                        El destino de nuestra nación — y posiblemente de la humanidad —
                        depende de sus decisiones, Comandante.
                    </p>
                    <div style={{
                        marginTop: '40px',
                        padding: '20px',
                        borderTop: '1px solid #00ff0044',
                        borderBottom: '1px solid #00ff0044',
                        textAlign: 'center',
                        color: '#00ff00',
                        letterSpacing: '3px',
                        fontSize: '1rem',
                    }}>
                        BUENA SUERTE, COMANDANTE.
                    </div>
                </div>
            )
        },
    ];

    const currentSection = sections.find(s => s.id === activeSection)!;

    return (
        <DocumentModal kicker="Operación A.T.O.M.O. — Clasificado" title="Informe de misión" numbered
            items={sections} activeId={activeSection} onSelect={id => setActiveSection(id as MissionSection)} onClose={onClose}>
            <h2>{currentSection.title}</h2>
            {currentSection.content}
        </DocumentModal>
    );
};
