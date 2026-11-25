# A.T.O.M.O.

Juego de estrategia por turnos en línea, multijugador (2 a 8 jugadores), sobre un mapa mundial: conquista, economía de materias primas y una carrera nuclear como única condición de victoria.

## Estructura

| Carpeta | Qué contiene |
|---|---|
| `shared/` | `@atomo/shared`: tipos, datos del juego y el **motor autoritativo** (`shared/src/engine`). Lo usan el servidor y el cliente. |
| `server/` | Servidor Colyseus. `session.ts` contiene la lógica de la partida y es independiente del transporte; `GameRoom.ts` es el adaptador de Colyseus. |
| `src/` | Cliente React + Vite. Muestra la vista que recibe del servidor y le manda comandos. |

## Modelo de autoridad

El servidor es la única fuente de verdad.

- **Identidad**: al unirse, el servidor asigna a cada jugador un `playerId` y un token secreto. El cliente guarda sólo el token, que es lo que le permite reconectarse. Un cliente no puede elegir su `playerId`.
- **Comandos**: el cliente manda intenciones (`ATTACK`, `BATTLE_PLAY_CARD`, `PRODUCE_SUPPLY`, `END_TURN`, etc.; ver `shared/src/engine/commands.ts`). El servidor las valida, las ejecuta con su propio azar y recalcula los invariantes (`engine/reconcile.ts`).
- **Azar**: la generación de la partida, el mazo de batalla, las manos, la IA neutral, el orden de turnos y el avance del calendario se resuelven en el servidor.
- **Vista por jugador**: cada cliente recibe su propia proyección del estado (`engine/view.ts`). De los rivales sólo ve lo que se vería en la mesa: el mapa, el nombre y el color, si fueron eliminados y si iniciaron un despliegue nuclear. El mineral secreto, la mano, los suministros, los silos y las cartas especiales de cada jugador viajan sólo a su dueño. Para conocerlos hay que espiar, y el informe le llega únicamente al espía.

### Protocolo

| Dirección | Mensaje | Contenido |
|---|---|---|
| cliente → servidor | opciones de join | `{ token?, playerName }` |
| cliente → servidor | `settings` | ajustes de la partida (sólo el anfitrión, en el lobby) |
| cliente → servidor | `start` | inicia la partida (sólo el anfitrión) |
| cliente → servidor | `command` | un `Command` |
| servidor → cliente | `seat` | `{ playerId, token }` (privado) |
| servidor → cliente | `lobby` | jugadores, fase y ajustes |
| servidor → cliente | `state` | la vista de ese cliente |
| servidor → cliente | `rejected` | `{ reason }` cuando un comando es inválido |

## Desarrollo

Requiere Node 22 o superior.

```bash
npm install
```

```bash
npm run server
```

```bash
npm run dev
```

```bash
npm test
```

Partidas por correspondencia en local (otra terminal; sin `DATABASE_URL` guarda en memoria, con `DATABASE_URL` usa Postgres):

```bash
npm run api
```

Vite redirige `/api` a `localhost:3001`.

Para probar con varios jugadores en el mismo navegador, abrí cada pestaña con `?seat=1`, `?seat=2`, etc. El parámetro sólo separa el almacenamiento local de cada pestaña; no da ningún privilegio.

La ruta `/map` abre una pantalla de mapa en modo espectador, que recibe únicamente la vista pública.

## Deploy

El juego tiene dos piezas que se despliegan por separado:

| Pieza | Dónde | Configuración |
|---|---|---|
| Servidor en vivo (Colyseus, WebSockets) | Render | `render.yaml` |
| Cliente (React estático) + API de correspondencia (función) | Vercel | `vercel.json`, `scripts/build-vercel.mjs` |
| Partidas por correspondencia | Postgres (Neon, Supabase, Vercel Postgres…) | `DATABASE_URL` |

El servidor necesita un proceso persistente que mantenga WebSockets abiertos, por eso no puede correr en funciones serverless de Vercel. Toda la lógica de la partida vive en `GameSession` y en el motor puro de `shared`, sin depender de Colyseus: cambiar de transporte o de hosting sólo requiere reescribir el adaptador.

### Servidor en Render

1. En Render: **New → Blueprint**, conectá este repo (rama `main`).
2. Render crea el servicio `atomo-server`. Anotá su host (por ejemplo `atomo-server.onrender.com`).
3. Verificá que responda en `https://<host>/health`.

En el plan gratuito el servidor se duerme tras ~15 minutos sin uso y tarda ~50 segundos en despertar; el cliente reintenta la conexión mientras tanto.

### Cliente en Vercel

1. En Vercel: **Add New → Project** e importá este repo. No hace falta cambiar nada: `vercel.json` define instalación, build y salida.
2. En **Settings → Environment Variables** agregá `VITE_SERVER_URL` con el host del servidor de Render (sólo el host; el cliente le antepone `wss://`). Aplicala a Production y Preview.
3. Para las partidas por correspondencia, conectá una base Postgres: desde **Storage / Marketplace** (por ejemplo Neon) o agregando a mano `DATABASE_URL`. La tabla `atomo_games` se crea sola en el primer pedido.
4. Desplegá. Si agregás o cambiás la variable después, hay que volver a desplegar: Vite la incrusta al compilar.

Sin `VITE_SERVER_URL` el cliente intenta conectarse a `localhost` y no funciona en producción.

### Partidas por correspondencia

Cada jugada es un pedido HTTP a `/api` (una función de Vercel) y la partida vive en Postgres: nadie tiene que estar conectado. Los plazos se aplican de forma perezosa: cuando alguien consulta o juega, el servidor resuelve lo que haya vencido (producción, defensa automática, turno). No hace falta un proceso ni un cron.

El build (`npm run build:vercel`) usa la Build Output API: copia el cliente a `.vercel/output/static` y empaqueta la API con esbuild en `.vercel/output/functions/api.func`.

Cada jugador recibe un token secreto al crear o unirse; en la base sólo se guarda su hash. El **enlace personal** (`/?partida=<id>#t=<token>`) abre la partida en otro dispositivo.

La conexión a Postgres verifica el certificado TLS. Para una base local sin TLS usá `PGSSLMODE=disable`.

