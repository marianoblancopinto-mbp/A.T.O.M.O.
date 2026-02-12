/**
 * Lore data for the game's intro menu.
 * Contains history logs, mission logs, and placeholders for future content.
 * 
 * To add a new menu section:
 * 1. Add the data array here (e.g. SECONDARY_OBJECTIVES, RULES_ENTRIES)
 * 2. Add a phase entry in the MENU_SECTIONS array
 * 3. Add a gamePhase handler in TegMap.tsx (same pattern as 'history'/'mission')
 */

export interface LoreEntry {
    header: string;
    text: string;
}

/** Static mission briefing logs */
export const MISSION_LOGS: LoreEntry[] = [
    { header: "DESCRIPCIÓN DE MISIÓN", text: "Tras la disolución de la Organización de la Nueva Paz (tras saberse que no destruyó todas las armas nucleares secuestradas), el mundo está nuevamente fragmentado y al borde de la guerra." },
    { header: "OPERACIÓN A.T.O.M.O.", text: "Ya no se puede confiar en organizaciones internacionales, por lo que nuestro país ha decidido ponerle a usted al mando de la operación A.T.O.M.O." },
    { header: "MÉTODO SECRETO", text: "Hemos conseguido, de un científico prófugo de la Organización de la Nueva Paz, un nuevo método para fabricar combustible de bombas nucleares. El método es secreto, por lo que podremos realizar la operación sin levantar sospechas." },
    { header: "RECURSO ESTRATÉGICO", text: "El método se basa en la utilización del mineral [CONFIDENCIAL] para refinar combustible que hasta ahora solo se pensaba útil para la producción de energía, no de armas." },
    { header: "INTELIGENCIA DE CAMPO", text: "El científico dijo que se le informó de la ubicación de un yacimiento del mismo, aunque asegura que hay más de uno y que tenía colegas que desertaron hacia tierras de nuestros enemigos." },
    { header: "OBJETIVOS OPERATIVOS", text: "Por lo tanto, nuestros objetivos son:\n\nA) Asegurar el depósito mineral.\nB) Conseguir los planos para los misiles intercontinentales de alguno de los programas nucleares que no fueron destruidos por la ONP.\nC) Construir los Silos de Lanzamiento.\nD) Asegurar rutas de suministro para el mineral y el combustible hacia los silos." },
    { header: "ADVERTENCIA", text: "Espere resistencia armada de las otras facciones al intentar esta tarea." },
    { header: "RECTA FINAL", text: "Si logramos estos objetivos antes que nuestros enemigos, lograremos terminar lo que algunos periódicos ya están llamando la Cuarta Guerra Mundial." },
    { header: "ACTUALIZACIÓN", text: "Éxitos, Comandante." }
];

/** Dynamic history logs — uses proxyWarCountry for narrative */
export const getHistoryLogs = (proxyWarCountry: string): LoreEntry[] => [
    { header: 'FECHA: ENERO 2052', text: `Tras años de guerra civil en ${proxyWarCountry}, las tensiones internacionales crecen a partir de la abundante evidencia de que Estados Unidos y China estaban financiando a los bandos opuestos.` },
    { header: 'FECHA: ABRIL 2052', text: `Un ataque sopresa deja al bando apoyado por EE. UU. al borde del colapso. EE. UU. anuncia que va a desplegar tropas propias en el territorio.` },
    { header: 'FECHA: AGOSTO 2052', text: `Con el apoyo de las tropas estadounidenses, los rebeldes retoman la tierra perdida y toman por sopresa la capital de ${proxyWarCountry}.` },
    { header: 'FECHA: SEPTIEMBRE 2052', text: `China anuncia que va a desplegar tropas propias en el territorio también. El mundo esta desconcertado. Nunca se supo por qué había tanto interés de las potencias en controlar ${proxyWarCountry}.` },
    { header: 'FECHA: 17 OCT 2052', text: `Primer enfrentamiento directo entre tropas estadounidenses y chinas en décadas. Victoria China, reestableciendo el control de la capital de ${proxyWarCountry} mientras los EE. UU. controlan otras regiones estratégicas. Fue el último avance sustancial de la guerra.` },
    { header: 'FECHA: DI. 2053', text: `En el famoso "Pacto de Año Nuevo", ambos gobiernos se comprometen a no usar armas nucleares.` },
    { header: 'FECHA: NOV. 2055', text: `La guerra en ${proxyWarCountry} es estanca, pero ninguna de las potencias parece querer abandonar el proyecto. Sus recursos ya están severamente drenados.` },
    { header: 'FECHA: AÑO 2056', text: `Al estar centrada la atención de las grandes potencias en ${proxyWarCountry}, otros actores regionales empiezan a presionar militarmente por objetivos propios. Las potencias no tienen recursos para imponer consecuencias. Comienza el "Período de las Diez Guerras".` },
    { header: 'FECHA: 2056-2069', text: `Período de las Diez Guerras. Se vieron conquistas, guerras civiles, disputas menores y bombardeos que resultaron en expansiones territoriales. Países pequeños se agrupan en bloques de defensa.` },
    { header: 'FECHA: 3 MAR 2067', text: `La red de alianzas se vuelve tan compleja que tropas de la Unión Europea se enfrentan accidentalmente entre sí en Estambul, generando la disolución de la organización.` },
    { header: 'FECHA: AGOSTO 2067', text: `La batalla de Estambul evoluciona caóticamente a un asedio prolongado. Termina con la destrucción total de la ciudad tras un bombardeo británico.` },
    { header: 'FECHA: 15 JUL 2069', text: `Oficialmente termina el período de las Diez Guerras con la formación de la Alianza Sudamericana, con el objetivo de desarrollar armas nucleares. Los países del mediterráneo siguen el ejemplo.` },
    { header: 'FECHA: 2069-2075', text: `Tercera Guerra Mundial (Guerra Tetrapolar). Estalla por disputas entre la Alianza Mediterránea y el bloque chino por controlar la caótica Turquía.` },
    { header: 'FECHA: 15 JUL 2075', text: `El Día de las Bombas. En 10 horas, 175 misiles nucleares impactaron en Rusia, EE. UU. y China. Nunca se supo qué misil se disparó primero.` },
    { header: 'FECHA: AÑO 2076', text: `El caos deriva en guerras civiles en los 3 países. Las potencias del nuevo mundo crean la Organización de la Nueva Paz (UNP) para intervenir y detener las guerras.` },
    { header: 'FECHA: AÑO 2077', text: `Las operaciones de la UNP son un éxito. Con inmenso apoyo popular, la UNP anuncia el desarmamiento y destrucción de todos los programas nucleares con fines bélicos.` }
];

/**
 * Menu sections configuration.
 * Each entry maps a phase string to a label for the main menu.
 * To add a new section, add an entry here and handle its phase in TegMap.tsx.
 */
export interface MenuSection {
    label: string;
    phase: string;
    available: boolean;
}

export const MENU_SECTIONS: MenuSection[] = [
    { label: 'HISTORIA PREVIA', phase: 'history', available: true },
    { label: 'OBJETIVO PRINCIPAL', phase: 'mission', available: true },
    { label: 'OBJETIVOS SECUNDARIOS', phase: 'secondary_intro', available: false },
    { label: 'REGLAS E INSTRUCCIONES', phase: 'rules_intro', available: false },
];
