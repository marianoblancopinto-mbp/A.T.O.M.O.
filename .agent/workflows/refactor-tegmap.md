---
description: Plan Maestro de Refactorización para Multiplayer (TegMap v2)
---

# Plan Maestro de Refactorización y Migración a Multiplayer

## VISIÓN: DE JUEGO LOCAL A MULTIPLAYER REAL-TIME

**Objetivo:** Transformar el juego actual (monolito local `TegMap.tsx`) en una aplicación web distribuida donde cada jugador usa su propio dispositivo par ver su mano, tomar decisiones y votar en batallas.

**Arquitectura Elegida: Supabase (PostgreSQL + Realtime)**
- **¿Por qué?** Necesitamos sincronización de estado en tiempo real (websockets) y persistencia simple sin configurar servidores complejos.
- **Ventaja:** Permite "escuchar" cambios en la base de datos (ej: turno cambió, ataque recibido) y actualizar todos los clientes al instante.
- **Costo: GRATIS.** El "Free Tier" de Supabase (500MB DB, 2GB Bandwidth, 500 concurrent connections, 200 concurrent Realtime channels) es más que suficiente para este juego (incluso con cientos de partidas simultáneas). No requiere tarjeta de crédito.

---

## 1. ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Frontend:** React + Vite (Ya existente)
- **Estado Global Local:** React Context + `useReducer` (para migrar del `useState` gigante actual)
- **Backend/DB:** Supabase (Postgres)
- **Sync:** Supabase Realtime (Websockets)
- **Identidad:** UUIDs generados por cliente (o Supabase Auth anónimo para inicio rápido)

### Esquema de Datos (Supabase)

```sql
-- Tabla: sessions (La "Partida")
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  status text check (status in ('LOBBY', 'PLAYING', 'FINISHED')),
  current_turn_player_id uuid,
  game_state jsonb,  -- Todo el estado crítico (fase, año, etc)
  created_at timestamp with time zone default now()
);

-- Tabla: players (Los Jugadores)
create table players (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references sessions(id),
  name text,
  color text,
  inventory jsonb,       -- Sus cartas y recursos
  is_host boolean,
  last_seen timestamp
);

-- Tabla: territories (Estado del Mapa)
create table territories (
  id text, -- ID de región (ej: 'argentina')
  session_id uuid references sessions(id),
  owner_id uuid references players(id),
  missiles integer default 0,
  defense_level integer default 1,
  primary key (id, session_id)
);

-- Tabla: events (Para acciones transitorias: ataques, ofertas)
create table events (
  id uuid primary key,
  session_id uuid references sessions(id),
  type text, -- 'ATTACK_DECLARED', 'TRUCE_OFFERED', 'CHAT_MSG'
  payload jsonb,
  created_at timestamp default now()
);
```

---

## 2. ESTRATEGIA DE REFACTORIZACIÓN (HACIA EL FUTURO)

Para no tener que reescribir todo dos veces, refactorizaremos **"Supabase-Ready"**.

**Principio "Supabase-Ready":**
En lugar de pasar props como loco, usaremos un **Hook de Estado Global** (`useGameStore`) que inicialmente funcionará en memoria, pero está diseñado para ser reemplazado por suscripciones de Supabase sin cambiar la UI.

### Estructura de Archivos Final (Adaptada para Multiplayer)

```
src/
├── components/
│   ├── game/               # El tablero principal (VISTA PÚBLICA / ADMIN)
│   │   ├── GameBoard.tsx
│   │   └── MapRender.tsx
│   ├── player/             # Interfaz del Jugador (VISTA PRIVADA - MÓVIL)
│   │   ├── PlayerHand.tsx  # Sus cartas
│   │   ├── ActionPanel.tsx # Sus botones de turno
│   │   └── VoteControls.tsx # Votar en batallas
│   ├── shared/             # UI compartida
│   │   ├── modals/         # Modales (ahora reciben datos del Context, no props)
│   │   └── ui/             # Botones, inputs genéricos
│   └── lobby/              # Pantalla de conexión
│       └── LobbyScreen.tsx
├── context/
│   ├── GameContext.tsx     # State local (fase 1) -> Supabase Sync (fase 2)
│   └── SessionContext.tsx  # Info de "Quién soy yo" (mi deviceId)
├── hooks/
│   ├── useGameState.ts     # Lee del Context
│   └── useMyPlayer.ts      # Filtra datos solo para MÍ usuario
├── services/
│   ├── supabase.ts         # Cliente Supabase
│   └── gameService.ts      # API para acciones (atacar, pasar turno)
└── ...
```

---

## 3. PLAN DE EJECUCIÓN PASO A PASO

### FASE 1: PREPARACIÓN DE INFRAESTRUCTURA (Sin romper el juego actual)

1.  **Instalar cliente:** `npm install @supabase/supabase-js @supabase/auth-helpers-react`
2.  **Configurar Contexto:** Crear `GameContext` que envuelva la app.
    *   *Acción:* Mover el estado gigante de `TegMap` (`players`, `owners`, `gamePhase`) adentro del Contexto.
    *   *Beneficio:* Prepara el terreno. En el futuro, este Contexto se llenará con datos de Supabase en vez de `useState`.

### FASE 2: DESACOPLAR TEGMAP (La Gran Migración)

1.  **Extraer Acciones:** Mover lógicas como `handleAttack` o `handleEndTurn` a `services/gameActions.ts`.
    *   *Objetivo:* Que la UI solo llame a `GameActions.attack(origin, target)` y no sepa CÓMO se ejecuta (si local o via DB).
2.  **Componentización por Rol:**
    *   Separar lo que ve TODOS (Tablero) de lo que ve UNO (Mano de cartas).
    *   Identificar componentes "Privados" (Modales de Confidencial, Espionaje).

### FASE 3: IMPLEMENTAR UNIFICACIÓN VISUAL (Misiones)

Al extraer los modales de misiones (Fase 3 del plan anterior), ahora usaremos el `GameContext`:
*   El modal ya no recibe `playerInventory` por props.
*   El modal usa `const { myPlayer } = useMyPlayer()` para saber qué mostrar.
*   Esto es CRÍTICO para multiplayer: Si abro el juego en mi celular, el modal sabe que soy YO y muestra MIS cartas.

### FASE 4: CONEXIÓN REAL (Supabase)

1.  **Migrar Estado:** Reemplazar el `useReducer` local del `GameContext` por suscripciones a Supabase.
2.  **Implementar Lobby:** Pantalla para "Crear Sala" o "Unirse a Sala (Código)".
3.  **Sincronización:**
    *   Host: Crea la row en `sessions`.
    *   Jugadores: Se insertan en `players`.
    *   Juego: Escucha cambios en `sessions` y `players`.

---

## 4. INSTRUCCIONES ESPECÍFICAS PARA EL AGENTE (LLM)

Cuando empieces la ejecución, sigue este flujo mental para CADA componente que extraigas:

1.  **¿Este componente es Global o Privado?**
    *   *Global (Mapa):* Debe leer `gameState` general.
    *   *Privado (Mano de cartas):* Debe leer `myPlayer`.

2.  **¿Cómo recibe sus datos?**
    *   ❌ **MAL:** Pasar props 5 niveles hacia abajo (`<TegMap inventory={...} />`).
    *   ✅ **BIEN:** Usar Hook (`const { inventory } = useMyPlayer()`).

3.  **¿Cómo ejecuta acciones?**
    *   ❌ **MAL:** Pasar callbacks (`onAttack={handleAttack}`).
    *   ✅ **BIEN:** Usar Servicio (`gameService.sendAttack(...)`).

---

## EJEMPLO PRÁCTICO: MIGRAR INVENTARIO

**Actualmente:**
`TegMap` tiene estado `showInventory`. Pasa `players[index].inventory` al modal.

**Futuro (Refactorizado):**
1.  Crear `InventoryModal.tsx`.
2.  Adentro: `const { myPlayer } = useMyPlayer();`
3.  Si `!myPlayer`, no mostrar nada (modo espectador).
4.  Renderizar cartas de `myPlayer.inventory`.

De esta forma, cuando conectemos Supabase, `useMyPlayer` simplemente devolverá los datos frescos de la DB, y el componente **no tendrá que cambiar ni una línea**.
