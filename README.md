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

Para probar con varios jugadores en el mismo navegador, abrí cada pestaña con `?seat=1`, `?seat=2`, etc. El parámetro sólo separa el almacenamiento local de cada pestaña; no da ningún privilegio.

La ruta `/map` abre una pantalla de mapa en modo espectador, que recibe únicamente la vista pública.

## Deploy

- **Cliente**: es estático (`npm run build` genera `dist/`). Se puede servir desde Netlify, Vercel o cualquier CDN. La variable `VITE_SERVER_URL` indica la dirección del servidor.
- **Servidor**: necesita un proceso persistente que mantenga WebSockets abiertos (hoy corre en Render). Por eso no puede correr en funciones serverless. Toda la lógica de la partida vive en `GameSession` y en el motor puro de `shared`, sin depender de Colyseus, de modo que cambiar de transporte o de hosting sólo requiere reescribir el adaptador.
