import { useCallback } from 'react';
import type { RegionData } from '../data/mapRegions';
import type { PlayerData } from '../types/playerTypes';

// Continent base colors (neutral territories)
const CONTINENT_COLORS: Record<string, string> = {
    st1: '#2ecc71', // South America - Green
    st2: '#3498db', // North America - Blue
    st3: '#f39c12', // Asia - Orange
    st4: '#e74c3c', // Africa - Red
    st5: '#9b59b6', // Europe - Purple
    st6: '#1abc9c', // Oceania - Teal
    antarctica: '#ecf0f1' // Antarctica - Light Gray
};

// Manual label position offsets for specific countries
const LABEL_OFFSETS: Record<string, { x: number; y: number }> = {
    'alaska': { x: -30, y: 20 },
    'canada': { x: 20, y: 30 },
    'quebec': { x: 20, y: -10 },
    'nueva_york': { x: 20, y: -10 },
    'texas': { x: 0, y: 10 },
    'california': { x: -20, y: 0 },
    'groenlandia': { x: 0, y: 30 },
    'siberia': { x: 0, y: 20 },
    'kamchakta': { x: -20, y: 30 },
    'mongolia': { x: 0, y: 20 },
    'china': { x: 0, y: 30 },
    'korea': { x: 10, y: 0 },
    'japon': { x: 15, y: 10 },
    'filipinas': { x: 0, y: 10 },
    'vietnam': { x: -10, y: 10 },
    'tailandia': { x: -10, y: 10 },
    'india': { x: 0, y: 10 },
    'kazajistan': { x: 0, y: 10 },
    'tibet': { x: 0, y: 10 },
    'iran': { x: 0, y: 20 },
    'arabia': { x: -15, y: 10 },
    'turquia': { x: 0, y: 10 },
    'rusia': { x: 0, y: 30 },
    'suecia': { x: 0, y: 20 },
    'noruega': { x: -10, y: 10 },
    'islandia': { x: 10, y: 10 },
    'reino_unido': { x: 0, y: 20 },
    'francia': { x: 0, y: 20 },
    'espana': { x: 0, y: 10 },
    'italia': { x: 0, y: 20 },
    'alemania': { x: 0, y: 10 },
    'polonia': { x: 0, y: 10 },
    'yugoslavia': { x: 0, y: 10 },
    'rumania': { x: 0, y: 5 },
    'grecia': { x: 0, y: 10 },
    'marruecos': { x: 0, y: 20 },
    'algeria': { x: 0, y: 20 },
    'sahel': { x: 0, y: 10 },
    'egipto': { x: 0, y: 10 },
    'etiopia': { x: 0, y: 10 },
    'costa_de_marfil': { x: 0, y: 10 },
    'congo': { x: 0, y: 10 },
    'sudafrica': { x: 0, y: 30 },
    'mozambique': { x: 0, y: 10 },
    'madagascar': { x: 10, y: 10 },
    'colombia': { x: -10, y: 10 },
    'venezuela': { x: 0, y: 10 },
    'peru': { x: -10, y: 10 },
    'brasil': { x: 20, y: 0 },
    'chile': { x: -20, y: 30 },
    'argentina': { x: 0, y: 30 },
    'uruguay': { x: 15, y: 0 },
    'cuba': { x: 0, y: 10 },
    'borneo': { x: 0, y: 10 },
    'java': { x: 0, y: 10 },
    'sumatra': { x: 0, y: 10 },
    'australia': { x: 0, y: 10 }
};

interface UseTegMapHelpersProps {
    owners: Record<string, number | null>;
    players: PlayerData[];
}

export const useTegMapHelpers = ({ owners, players }: UseTegMapHelpersProps) => {
    const getFillColor = useCallback((regionId: string, continent: string): string => {
        const ownerId = owners[regionId];
        if (ownerId === -2) return '#000000'; // Black for destruction
        if (ownerId !== undefined && ownerId !== null) {
            // Find player by ID (string/UUID) or index (number)
            const player = players.find(p => p.id === ownerId) || players[ownerId as number];
            if (player) return player.color;
        }
        return CONTINENT_COLORS[continent] || '#f1c40f';
    }, [owners, players]);

    const getRegionCenter = useCallback((region: RegionData): { x: number; y: number } => {
        let x = 0, y = 0;
        if (region.type === 'polygon' || region.type === 'polyline') {
            const points = region.data.trim().split(/\s+/).map(Number);
            let xSum = 0, ySum = 0;
            for (let i = 0; i < points.length; i += 2) {
                xSum += points[i];
                ySum += points[i + 1];
            }
            x = xSum / (points.length / 2);
            y = ySum / (points.length / 2);
        } else {
            const match = /M([\d.]+),([\d.]+)/.exec(region.data);
            if (match) {
                x = parseFloat(match[1]);
                y = parseFloat(match[2]);
            }
        }
        const offset = LABEL_OFFSETS[region.id];
        if (offset) {
            x += offset.x;
            y += offset.y;
        }
        return { x, y };
    }, []);

    return { getFillColor, getRegionCenter, CONTINENT_COLORS, LABEL_OFFSETS };
};
