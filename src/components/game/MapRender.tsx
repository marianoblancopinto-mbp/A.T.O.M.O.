import React, { useCallback } from 'react';
import { REGIONS } from '../../data/mapRegions';
import { MARITIME_ROUTES, WRAPAROUND_ROUTES } from '../../data/mapData';
import { useGameContext } from '../../context/GameContext';
import { useTegMapHelpers } from '../../hooks/useTegMapHelpers';

interface MapRenderProps {
    selectedRegionId: string | null;
    onRegionClick: (regionId: string) => void;
    spectator?: boolean;
}

export const MapRender: React.FC<MapRenderProps> = ({ selectedRegionId, onRegionClick, spectator }) => {
    const { state } = useGameContext();
    const { owners, players } = state;
    const { getFillColor, getRegionCenter } = useTegMapHelpers({ owners, players });

    const getPointForRoute = useCallback((regionId: string) => {
        const region = REGIONS.find(r => r.id === regionId);
        if (!region) return { x: 0, y: 0 };
        return getRegionCenter(region);
    }, [getRegionCenter]);

    return (
        <svg
            viewBox="0 0 1700.79 835"
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Tactical Grid Pattern */}
            <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00ff00" strokeWidth="1" opacity="0.3" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />

            {/* Maritime Routes - Rendered BEHIND regions */}
            {MARITIME_ROUTES.map(([id1, id2], index) => {
                let p1 = getPointForRoute(id1);
                let p2 = getPointForRoute(id2);

                // Detect Wraparound (Alaska-Kamchatka, Chile-Australia)
                const isWraparound =
                    (id1 === 'alaska' && id2 === 'kamchakta') || (id1 === 'kamchakta' && id2 === 'alaska') ||
                    (id1 === 'chile' && id2 === 'australia') || (id1 === 'australia' && id2 === 'chile');

                if (isWraparound) {
                    // Find exit points from WRAPAROUND_ROUTES
                    const exit1 = WRAPAROUND_ROUTES.find(w => w.id === id1);
                    const exit2 = WRAPAROUND_ROUTES.find(w => w.id === id2);

                    if (exit1 && exit2) {
                        return (
                            <React.Fragment key={`route - ${index} `}>
                                {/* Line from Region 1 to its edge */}
                                <line
                                    x1={p1.x} y1={p1.y}
                                    x2={exit1.x} y2={exit1.y}
                                    stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5"
                                    opacity="0.5" pointerEvents="none"
                                />
                                {/* Line from Region 2 to its edge */}
                                <line
                                    x1={p2.x} y1={p2.y}
                                    x2={exit2.x} y2={exit2.y}
                                    stroke="#00ff00" strokeWidth="2" strokeDasharray="5,5"
                                    opacity="0.5" pointerEvents="none"
                                />
                            </React.Fragment>
                        );
                    }
                }

                // Manual tweaks for specific routes
                if (id1 === 'brasil' && id2 === 'costa_de_marfil') {
                    p1 = { x: p1.x + 50, y: p1.y + 60 };
                    p2 = { x: p2.x, y: p2.y + 5 }; // Move Brazil endpoint further down
                }

                if (id1 === 'arabia' && id2 === 'etiopia') {
                    p1 = { x: p1.x + 10, y: p1.y + 30 };
                    p2 = { ...p2, x: p2.x + 20 };
                }

                return (
                    <line
                        key={`route - ${index} `}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#00ff00"
                        strokeWidth="2"
                        strokeDasharray="5,5" // Dashed line
                        opacity="0.5"
                        pointerEvents="none"
                    />
                );
            })}


            {/* Wraparound Routes */}
            {WRAPAROUND_ROUTES.map((route, index) => {
                const p1 = getPointForRoute(route.id);
                return (
                    <line
                        key={`wrap - ${index} `}
                        x1={p1.x}
                        y1={p1.y}
                        x2={route.x}
                        y2={route.y}
                        stroke="#00ff00"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                    />
                );
            })}

            {/* Render Regions */}
            {REGIONS.map((region) => {
                const isSelected = selectedRegionId === region.id;
                const commonProps = {
                    key: region.id,
                    id: region.id,
                    fill: getFillColor(region.id, region.continent),
                    stroke: isSelected ? '#ffffff' : '#00ff00', // White stroke when selected
                    strokeWidth: isSelected ? "4" : "3",
                    strokeOpacity: "1", // Full opacity for borders
                    strokeLinecap: "round" as "round",
                    strokeLinejoin: "round" as "round",
                    style: {
                        transition: 'all 0.2s ease',
                        cursor: spectator ? 'default' : 'crosshair',
                        filter: isSelected ? 'brightness(1.5)' : 'brightness(0.9)',
                        pointerEvents: spectator ? 'none' : 'auto'
                    } as React.CSSProperties,
                    onClick: spectator ? undefined : () => onRegionClick(region.id),
                    onMouseEnter: (e: React.MouseEvent<SVGElement>) => {
                        if (selectedRegionId !== region.id) {
                            e.currentTarget.style.opacity = '0.8';
                            e.currentTarget.style.strokeWidth = '3';
                            e.currentTarget.style.filter = 'brightness(1.2)';
                        }
                    },
                    onMouseLeave: (e: React.MouseEvent<SVGElement>) => {
                        if (selectedRegionId !== region.id) {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.strokeWidth = '3';
                            e.currentTarget.style.filter = 'brightness(0.9)';
                        }
                    },
                };

                if (region.type === 'path') {
                    return <path {...commonProps} d={region.data} />;
                } else if (region.type === 'polyline') {
                    return <polyline {...commonProps} points={region.data} />;
                } else {
                    return <polygon {...commonProps} points={region.data} />;
                }
            })}

            {/* Render Labels */}
            {REGIONS.map((region) => {
                const center = getRegionCenter(region);
                return (
                    <text
                        key={`label - ${region.id} `}
                        x={center.x}
                        y={center.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            fontSize: window.innerWidth <= 768 ? '16px' : '11px',
                            fontFamily: "Arial, Helvetica, sans-serif",
                            fontWeight: '900',
                            pointerEvents: 'none',
                            fill: '#ffffff',
                            stroke: '#000000',
                            strokeWidth: window.innerWidth <= 768 ? '4px' : '3px',
                            paintOrder: 'stroke',
                            strokeLinejoin: 'round',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}

                    >
                        {region.title}
                    </text>
                );
            })}
        </svg>
    );
};
