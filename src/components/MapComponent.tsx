import React, { useState } from 'react';

// Define the region type
type RegionId = 'na' | 'sa' | 'eu' | 'af' | 'as' | 'oc';

interface Region {
  id: RegionId;
  name: string;
  path: string; // SVG path data
  cx: number;
  cy: number;
}

// Low-poly stylized continents
// Coordinates based on a 1000x600 viewBox
const INITIAL_REGIONS: Region[] = [
  {
    id: 'na',
    name: 'North America',
    path: 'M 50,50 L 150,30 L 280,40 L 400,20 L 350,150 L 300,300 L 150,250 L 100,200 L 40,150 Z',
    cx: 200,
    cy: 150,
  },
  {
    id: 'sa',
    name: 'South America',
    path: 'M 200,310 L 320,320 L 380,400 L 300,580 L 220,550 L 180,400 Z',
    cx: 280,
    cy: 450,
  },
  {
    id: 'eu',
    name: 'Europe',
    path: 'M 420,40 L 550,30 L 600,60 L 580,180 L 500,200 L 450,180 L 410,100 Z',
    cx: 500,
    cy: 120,
  },
  {
    id: 'af',
    name: 'Africa',
    path: 'M 430,220 L 520,210 L 600,230 L 620,350 L 550,500 L 480,480 L 420,350 Z',
    cx: 520,
    cy: 350,
  },
  {
    id: 'as',
    name: 'Asia',
    path: 'M 610,50 L 850,40 L 950,50 L 920,250 L 800,350 L 680,300 L 620,180 Z',
    cx: 780,
    cy: 180,
  },
  {
    id: 'oc',
    name: 'Oceania',
    path: 'M 750,350 L 850,340 L 950,380 L 920,550 L 800,530 L 730,450 Z',
    cx: 840,
    cy: 450,
  },
];

type Player = 'player1' | 'player2';

export const MapComponent: React.FC = () => {
  const [owners, setOwners] = useState<Record<RegionId, Player | null>>({
    na: null, sa: null, eu: null,
    af: null, as: null, oc: null,
  });

  const [currentPlayer, setCurrentPlayer] = useState<Player>('player1');

  const handleRegionClick = (regionId: RegionId) => {
    setOwners((prev) => ({
      ...prev,
      [regionId]: currentPlayer,
    }));
    // Toggle player for demo purposes
    setCurrentPlayer((prev) => (prev === 'player1' ? 'player2' : 'player1'));
  };

  const getFillColor = (regionId: RegionId) => {
    const owner = owners[regionId];
    if (owner === 'player1') return '#e74c3c'; // Red
    if (owner === 'player2') return '#3498db'; // Blue
    return '#f1c40f'; // Neutral Gold/Paper color
  };

  return (
    <div className="map-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#fdf6e3', // Parchment-like background
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <h1>Mappa Mundi Game</h1>
      <p>Current Turn: <span style={{ color: currentPlayer === 'player1' ? '#e74c3c' : '#3498db', fontWeight: 'bold' }}>
        {currentPlayer === 'player1' ? 'Red Empire' : 'Blue Republic'}
      </span></p>

      <div style={{ position: 'relative', border: '5px solid #8b4513', padding: '10px', backgroundColor: '#fff8dc', borderRadius: '10px' }}>
        {/* SVG Map */}
        <svg width="1000" height="600" viewBox="0 0 1000 600" style={{ cursor: 'pointer', maxWidth: '100%' }}>
          {/* Filter for paper texture effect can be added here */}
          <defs>
            <filter id="paper-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
              <feDiffuseLighting in="noise" lightingColor="#f5deb3" surfaceScale="2">
                <feDistantLight azimuth="45" elevation="60" />
              </feDiffuseLighting>
            </filter>
          </defs>

          <rect width="100%" height="100%" filter="url(#paper-texture)" opacity="0.5" />

          {INITIAL_REGIONS.map((region) => (
            <g key={region.id} onClick={() => handleRegionClick(region.id)}>
              <path
                d={region.path}
                fill={getFillColor(region.id)}
                stroke="#5d4037"
                strokeWidth="3"
                style={{ transition: 'fill 0.3s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              />
              <text
                x={region.cx}
                y={region.cy}
                textAnchor="middle"
                fill="#3e2723"
                style={{ pointerEvents: 'none', userSelect: 'none', fontSize: '14px', fontWeight: 'bold' }}
              >
                {region.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>Click on a continent to conquer it!</p>
      </div>
    </div>
  );
};
