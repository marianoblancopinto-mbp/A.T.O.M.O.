import type { RawMaterialType, TechnologyType } from '../types/productionTypes';
import { REGIONS } from './mapRegions';

export interface SpecialMission {
    id: string;
    title: string;
    description: string;
    highlightedText?: string;
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
            requirements: {
                control: ['chile', 'argentina', 'australia', 'sudafrica'],
                technology: ['INDUSTRIA_PESADA', 'INDUSTRIA_ELECTRONICA'],
                rawMaterials: ['HIERRO', 'CONDUCTORES_SEMICONDUCTORES']
            },
            visibleFor: ['chile', 'argentina', 'australia', 'sudafrica']
        },
        {
            id: 'secretos_guerra',
            title: `LOS SECRETOS DE LA GUERRA EN ${proxyWarCountryTitle.toUpperCase()}`,
            lore: `Casi 50 años después, el mundo no sabe aún porqué Estados Unidos y China tenían tanta necesidad de ir a la guerra en este país. Quizás si restauráramos alguna de sus redes de espionaje y tuviéramos control del país podríamos investigar. Los locales rumorean que puede tener que ver con ciertos depósitos de MATERIAS PRIMAS.`,
            description: 'Dominar el país y usar inteligencia para revelar secretos.',
            highlightedText: 'MATERIAS PRIMAS',
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
            requirements: {
                control: ['turquia', 'grecia'],
                technology: ['INDUSTRIA_PESADA'],
                rawMaterials: ['HIERRO']
            },
            visibleFor: ['turquia', 'grecia', 'GLOBAL']
        },
        {
            id: 'planta_desalinizacion',
            title: 'PLANTA DE DESALINIZACIÓN',
            lore: 'Las costas áridas del mundo esconden un recurso vital: el mar. Con la tecnología adecuada y suficiente energía, podemos convertir agua salada en el recurso más preciado: AGUA DULCE. Esta infraestructura permanecerá en el territorio incluso si cambia de manos.',
            description: 'Construir infraestructura de desalinización para obtener agua dulce.',
            highlightedText: 'AGUA DULCE',
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
            requirements: {
                control: ['reino_unido'],
                technology: ['INDUSTRIA_PESADA'],
                rawMaterials: ['HIERRO']
            },
            visibleFor: ['reino_unido', 'GLOBAL']
        },
        {
            id: 'alejandro_magno',
            title: 'OPERACIÓN ALEJANDRO MAGNO',
            description: 'Requiere 1 Suministro de Alimentos, 1 de Manufacturas y 1 de Energía.',
            lore: 'El espíritu del conquistador macedonio renace. Abre el paso hacia Oriente y otorga bonificaciones tácticas en la cuna de la civilización. Bonus +1 Infantería atacando entre países involucrados (Grecia, Turquía, Egipto, Irán).',
            requirements: {
                control: ['grecia'],
                technology: [],
                rawMaterials: []
            },
            visibleFor: ['grecia']
        }
    ];
};
