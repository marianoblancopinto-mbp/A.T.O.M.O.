import type { RawMaterialType, TechnologyType } from '../types/productionTypes';
import { REGIONS } from './mapRegions';

export interface SpecialMission {
    id: string;
    title: string;
    description: string;
    highlightedText?: string;
    mechanicalEffect: string;
    deactivationConditions: string;
    lore: string;
    requirements: {
        control: string[];
        technology: TechnologyType[];
        rawMaterials: RawMaterialType[];
    };
    visibleFor: string[];
}

// Logic for proxyWarCountry needs to be consistent, but since it's a random choice 
// that should be stable per game session, we might want it to be part of game state.
// For now, we'll provide a central place for it.
export const getProxyWarCountry = () => {
    const excludedIds = new Set([
        'california', 'texas', 'nueva_york', 'flordia', 'alaska',
        'siberia', 'kamchakta', 'rusia', 'kazajistan',
        'china', 'australia', 'canada'
    ]);
    const candidates = REGIONS.filter(r => !excludedIds.has(r.id) && r.continent !== 'st5');
    // Note: Stability across renders/components is handled by the parent using this.
    return candidates[Math.floor(Math.random() * candidates.length)];
};

export const getSpecialMissions = (proxyWarCountryTitle: string): SpecialMission[] => {
    const proxyWarCountryId = REGIONS.find(r => r.title === proxyWarCountryTitle)?.id || '';

    return [
        {
            id: 'ruta_antartica',
            title: 'RUTA ANTÁRTICA',
            lore: 'Tener dominio sobre las bases militares más australes del mundo nos permitirá navegar seguramente por el océano antártico, pudiendo establecer una RUTA DE SUMINISTROS entre los países del sur, siempre y cuando podamos mantener una Armada ejemplar y la tecnología necesaria para monitorear el área.',
            description: 'Controlar las bases del sur permite establecer una ruta segura.',
            highlightedText: 'RUTA DE SUMINISTROS',
            mechanicalEffect: 'Establece una Ruta de Suministros permanente entre Chile, Argentina, Australia y Sudáfrica.',
            deactivationConditions: 'Pérdida de la Base de Operaciones: Eliminación definitiva de la misión. Pérdida de cualquier otra base de la red: El beneficio se suspende hasta recuperar el control del territorio.',
            requirements: {
                control: ['chile', 'argentina', 'australia', 'sudafrica'],
                technology: ['INDUSTRIA_PESADA', 'INDUSTRIA_ELECTRONICA'],
                rawMaterials: ['HIERRO', 'CONDUCTORES_SEMICONDUCTORES']
            },
            visibleFor: ['chile', 'argentina', 'australia', 'sudafrica']
        },
        {
            id: 'golden_dome',
            title: 'CÚPULA DORADA',
            lore: 'La defensa del norte requiere una red impenetrable. Un sistema de defensa aérea coordinado entre las potencias de América del Norte creará una "Cúpula Dorada" capaz de interceptar cualquier amenaza. El control unificado de estos territorios es esencial para el despliegue de los sistemas de radar y baterías antiaéreas.',
            description: 'Establecer una red de defensa aérea en América del Norte.',
            highlightedText: 'DEFENSA AÉREA',
            mechanicalEffect: '+1 en Defensa Aérea en todos los territorios de América del Norte.',
            deactivationConditions: 'Pérdida de la Base de Comando: Eliminación definitiva de la misión. Pérdida de cualquier otro territorio: El bono se desactiva solo en la región perdida, manteniendo la protección en las demás.',
            requirements: {
                control: ['nueva_york', 'california', 'texas', 'flordia', 'alaska'],
                technology: ['INDUSTRIA_LIGERA', 'INDUSTRIA_ELECTRONICA'],
                rawMaterials: ['ALUMINIO', 'CONDUCTORES_SEMICONDUCTORES']
            },
            visibleFor: ['nueva_york', 'california', 'texas', 'flordia', 'alaska']
        },
        {
            id: 'secretos_guerra',
            title: `LOS SECRETOS DE LA GUERRA EN ${proxyWarCountryTitle.toUpperCase()}`,
            lore: `Casi 50 años después, el mundo no sabe aún porqué Estados Unidos y China tenían tanta necesidad de ir a la guerra en este país. Quizás si restauráramos alguna de sus redes de espionaje y tuviéramos control del país podríamos investigar. Los locales rumorean que puede tener que ver con ciertos depósitos de MATERIAS PRIMAS.`,
            description: 'Dominar el país y usar inteligencia para revelar secretos.',
            highlightedText: 'MATERIAS PRIMAS',
            mechanicalEffect: 'Revela la ubicación del depósito de Mineral Secreto en el país en conflicto.',
            deactivationConditions: 'Pérdida del país en conflicto. Aunque la ubicación ya fue revelada, la explotación requiere control constante del territorio.',
            requirements: {
                control: [proxyWarCountryId],
                technology: [],
                rawMaterials: []
            },
            visibleFor: [proxyWarCountryId]
        },
        {
            id: 'refundacion_estanbul',
            title: 'REFUNDACIÓN DE ESTANBUL',
            lore: 'La antigua ciudad de Estanbul fue destruida en 2067. Sin embargo, su posición estratégica sigue siendo vital para controlar el paso entre Europa y Asia. Reconstruir el Puente del Bósforo permitiría un flujo de tropas sin precedentes.',
            description: 'Reconstruir el puente Bósforo para conectar Europa y Asia.',
            highlightedText: 'PUENTE DEL BÓSFORO',
            mechanicalEffect: 'Conexión terrestre permanente entre Grecia y Turquía (elimina penalización de desembarco).',
            deactivationConditions: 'Pérdida de Grecia o Turquía. La conexión terrestre entre ambos continentes queda desactivada inmediatamente.',
            requirements: {
                control: ['turquia', 'grecia'],
                technology: ['INDUSTRIA_PESADA'],
                rawMaterials: ['HIERRO']
            },
            visibleFor: ['turquia', 'grecia']
        },
        {
            id: 'planta_desalinizacion',
            title: 'PLANTA DE DESALINIZACIÓN',
            lore: 'Las costas áridas del mundo esconden un recurso vital: el mar. Con la tecnología adecuada y suficiente energía, podemos convertir agua salada en el recurso más preciado: AGUA DULCE. Esta infraestructura permanecerá en el territorio incluso si cambia de manos.',
            description: 'Construir infraestructura de desalinización para obtener agua dulce.',
            highlightedText: 'AGUA DULCE',
            mechanicalEffect: 'Generación permanente de Agua Dulce en el país (infraestructura indestructible).',
            deactivationConditions: 'Pérdida del país donde se ubica la planta. El nuevo propietario obtiene el beneficio automáticamente.',
            requirements: {
                control: ['espana', 'marruecos', 'arabia', 'chile', 'california'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['espana', 'marruecos', 'arabia', 'chile', 'california']
        },
        {
            id: 'energia_geotermica',
            title: 'ENERGÍA GEOTÉRMICA',
            description: 'Aprovechar la actividad volcánica para generar energía.',
            lore: 'El núcleo de la Tierra es una fuente inagotable de poder para quienes saben dominarlo.',
            mechanicalEffect: 'Producción adicional de Energía en el territorio de forma permanente.',
            deactivationConditions: 'Pérdida de Islandia o Filipinas. El beneficio de energía adicional está ligado a la soberanía sobre el territorio.',
            requirements: {
                control: ['islandia', 'filipinas'],
                technology: ['INDUSTRIA_PESADA'],
                rawMaterials: ['HIERRO']
            },
            visibleFor: ['islandia', 'filipinas']
        },
        {
            id: 'cruce_andes',
            title: 'CRUCE DE LOS ANDES',
            description: 'Requiere 1 Suministro de Alimentos.',
            lore: 'Asegura el paso cordillerano para flanquear las defensas enemigas. Bonus +1 Infanteria atacando Chile desde Argentina.',
            mechanicalEffect: '+1 Infantería al atacar desde Argentina hacia Chile.',
            deactivationConditions: 'Pérdida de Argentina. El bono es operacional y requiere control del punto de despliegue.',
            requirements: {
                control: ['argentina'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['argentina']
        },
        {
            id: 'desembarco_normandia',
            title: 'DESEMBARCO DE NORMANDÍA',
            description: 'Requiere UK, Hierro e Industria Pesada. Francia y Alemania deben ser del mismo enemigo.',
            lore: 'Una operación anfibia masiva para liberar Europa. Revierte la penalización de desembarco y otorga bonificaciones adicionales al atacar Francia.',
            mechanicalEffect: 'Elimina penalización de desembarco y otorga +1 de Ataque en Francia.',
            deactivationConditions: 'Pérdida de Reino Unido o cambio en la situación política de Europa (Francia/Alemania no controlados por el mismo enemigo).',
            requirements: {
                control: ['reino_unido'],
                technology: ['INDUSTRIA_PESADA'],
                rawMaterials: ['HIERRO']
            },
            visibleFor: ['reino_unido']
        },
        {
            id: 'alejandro_magno',
            title: 'OPERACIÓN ALEJANDRO MAGNO',
            description: 'Requiere 1 Suministro de Alimentos, 1 de Manufacturas y 1 de Energía.',
            lore: 'El espíritu del conquistador macedonio renace. Abre el paso hacia Oriente y otorga bonificaciones tácticas en la cuna de la civilización. Bonus +1 Infantería atacando entre países involucrados (Grecia, Turquía, Egipto, Irán).',
            mechanicalEffect: '+1 Infantería atacando entre Grecia, Turquía, Egipto e Irán.',
            deactivationConditions: 'Pérdida del control de Grecia u origen del ataque fuera de los países involucrados.',
            requirements: {
                control: ['grecia'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['grecia']
        },
        {
            id: 'legado_otomano',
            title: 'OPERACIÓN LEGADO OTOMANO',
            description: 'Requiere 1 Suministro de Alimentos, 1 de Manufacturas y 1 de Energía.',
            lore: 'Recupera la gloria del antiguo imperio. Controlar las rutas entre los tres continentes otorga una ventaja estratégica sin igual. Bonus +1 Infantería atacando entre países involucrados (Turquía, Egipto, Arabia, Grecia).',
            mechanicalEffect: '+1 Infantería atacando entre Turquía, Egipto, Arabia y Grecia.',
            deactivationConditions: 'Pérdida de Turquía o despliegue fuera de la zona de influencia otomana.',
            requirements: {
                control: ['turquia'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['turquia']
        },
        {
            id: 'gengis_khan',
            title: 'OPERACIÓN GENGIS KHAN',
            description: 'Requiere 1 Suministro de Alimentos, 1 de Manufacturas y 1 de Energía.',
            lore: 'El rugido del lobo estepario vuelve a resonar. Domina las vastas llanuras y estepas para forjar el imperio más grande que el mundo haya visto. Bonus +1 Infantería atacando entre países involucrados (Mongolia, Kazajistán, China, Rusia).',
            mechanicalEffect: '+1 Infantería atacando entre Mongolia, Kazajistán, China y Rusia.',
            deactivationConditions: 'Pérdida de Mongolia o ataque originado fuera de las llanuras centrales.',
            requirements: {
                control: ['mongolia'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['mongolia']
        },
        {
            id: 'bolivar',
            title: 'OPERACIÓN BOLÍVAR',
            description: 'Requiere 1 Suministro de Alimentos, 1 de Manufacturas y 1 de Energía.',
            lore: 'El sueño del Libertador renace en el Cono Norte. Une a las naciones bajo un solo estandarte para asegurar la libertad de América. Bonus +1 Infantería atacando entre países involucrados (Venezuela, Colombia, Panamá, Perú).',
            mechanicalEffect: '+1 Infantería atacando entre Venezuela, Colombia, Panamá y Perú.',
            deactivationConditions: 'Pérdida de Venezuela o flanqueo fuera del Cono Norte.',
            requirements: {
                control: ['venezuela'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['venezuela']
        },
        {
            id: 'fuego_del_pacifico',
            title: 'FUEGO DEL PACÍFICO',
            description: 'Requiere 1 Suministro de Energía, 1 de Manufacturas y 1 de Alimentos.',
            lore: 'El dominio del aire es la llave del Pacífico. Despliega la flota aérea desde las bases imperiales para asegurar la hegemonía regional. Bonus +1 Fuerza Aérea atacando o defendiendo entre países involucrados (Japón, Corea, Kamchatka, Filipinas).',
            mechanicalEffect: '+1 Fuerza Aérea (Ataque y Defensa) en Japón, Corea, Kamchatka y Filipinas.',
            deactivationConditions: 'Pérdida de Japón. La hegemonía aérea requiere una base de portaaviones y radares centralizada.',
            requirements: {
                control: ['japon'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['japon']
        }
    ];
};

export const getMissionById = (id: string, proxyWarCountryTitle: string): SpecialMission | undefined => {
    return getSpecialMissions(proxyWarCountryTitle).find(m => m.id === id);
};
