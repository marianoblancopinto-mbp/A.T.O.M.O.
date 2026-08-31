import React, { useState } from 'react';

type Section = 'overview' | 'combat' | 'production' | 'missions' | 'nuclear' | 'treaties' | 'espionage';

const SECTIONS: { id: Section; label: string }[] = [
    { id: 'overview', label: 'OBJETIVO DEL JUEGO' },
    { id: 'combat', label: 'COMBATE' },
    { id: 'production', label: 'PRODUCCIÓN Y ECONOMÍA' },
    { id: 'missions', label: 'MISIONES ESPECIALES' },
    { id: 'nuclear', label: 'CARRERA NUCLEAR' },
    { id: 'espionage', label: 'ESPIONAJE' },
    { id: 'treaties', label: 'TRATADOS' },
];

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState<Section>('overview');

    if (!isOpen) return null;

    const sectionStyle: React.CSSProperties = {
        color: '#ccc',
        lineHeight: '1.7',
        fontSize: '0.95rem',
    };

    const h3Style: React.CSSProperties = {
        color: '#00ff00',
        borderBottom: '1px solid #00ff0044',
        paddingBottom: '8px',
        marginTop: '25px',
        marginBottom: '12px',
        fontSize: '1.1rem',
        letterSpacing: '2px',
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
        marginBottom: '15px',
        fontSize: '0.85rem',
    };

    const thStyle: React.CSSProperties = {
        padding: '8px 12px',
        backgroundColor: '#111',
        color: '#00ff00',
        border: '1px solid #333',
        textAlign: 'left',
    };

    const tdStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid #222',
        color: '#aaa',
    };

    const tipStyle: React.CSSProperties = {
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid #00ff0044',
        borderLeft: '3px solid #00ff00',
        padding: '12px 16px',
        marginTop: '15px',
        marginBottom: '15px',
        fontSize: '0.85rem',
        color: '#88ff88',
    };

    const warningStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        border: '1px solid #ff000044',
        borderLeft: '3px solid #ff0000',
        padding: '12px 16px',
        marginTop: '15px',
        marginBottom: '15px',
        fontSize: '0.85rem',
        color: '#ff8888',
    };

    const renderOverview = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>QUÉ ES A.T.O.M.O</h3>
            <p>
                <strong>A.T.O.M.O</strong> es un juego de estrategia global multijugador ambientado en un futuro donde las grandes
                potencias mundiales compiten por los restos de la civilización. Cada jugador asume el rol de un <strong>Comandante</strong> que
                controla un imperio de países repartidos aleatoriamente al inicio de la partida.
            </p>

            <h3 style={h3Style}>CONDICIÓN DE VICTORIA</h3>
            <p>
                Hay <strong>una única forma de ganar</strong>: completar y desplegar tu <strong>protocolo nuclear</strong>. Para lograrlo, necesitarás cumplir <strong>todas</strong> estas condiciones simultáneamente:
            </p>
            <ol style={{ paddingLeft: '20px' }}>
                <li>Un <strong>Diseño de Armas Nucleares</strong> — generado en un país con <strong>capacidad nuclear bélica</strong></li>
                <li>Un <strong>Silo de Lanzamiento</strong> construido y operativo (2 turnos de construcción)</li>
                <li>Una carta de <strong>Combustible Nuclear</strong> (materia prima) asignada al silo y <strong>no consumida</strong></li>
                <li>El <strong>Mineral Secreto</strong> extraído — sin él, el lanzamiento es imposible</li>
            </ol>
            <p style={{ color: '#ff8888', marginTop: '10px' }}>
                Si alguno de estos requisitos se pierde en cualquier momento (te conquistan un país clave,
                te consumen el combustible), el protocolo se aborta.
            </p>

            <h3 style={h3Style}>FLUJO DE RONDA</h3>
            <p>Cada ronda (año) se divide en <strong>dos fases</strong>:</p>
            <ol style={{ paddingLeft: '20px' }}>
                <li>
                    <strong>Preturno de producción (simultáneo):</strong> al inicio de la ronda, <strong>todos
                    los comandantes a la vez</strong> deciden qué suministros producir, combinando materias
                    primas + tecnologías. Cada uno marca <strong>"LISTO"</strong> cuando termina; cuando el
                    último confirma, arranca la ronda de acciones.
                </li>
                <li>
                    <strong>Ronda de acciones (por turnos):</strong> los comandantes juegan su turno en orden.
                    <strong> Durante esta fase ya no se pueden producir suministros.</strong>
                </li>
            </ol>
            <div style={tipStyle}>
                <strong>¿Por qué el preturno?</strong> Obliga a planificar con anticipación qué suministros
                vas a necesitar y evita frenar el juego produciendo en plena batalla. Durante la ronda solo
                usás lo que ya tenés.
            </div>
            <p>Durante tu turno (fase de acciones) puedes:</p>
            <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Atacar</strong> países enemigos adyacentes a los tuyos (solo en tu turno)</li>
                <li><strong>Usar suministros</strong> de tu inventario (los que produjiste en el preturno)</li>
                <li><strong>Activar misiones especiales</strong> si cumples sus requisitos (pueden gastar materias primas y tecnologías)</li>
                <li><strong>Construir infraestructura nuclear</strong> (diseño, silos, asignación de combustible)</li>
                <li><strong>Espiar</strong> a otros jugadores con redes de inteligencia</li>
                <li><strong>Negociar tratados</strong> diplomáticos</li>
            </ul>

            <h3 style={h3Style}>EL MAPA</h3>
            <p>
                El mundo está dividido en <strong>más de 70 países</strong>. Al inicio de cada partida,
                los países se reparten aleatoriamente entre todos los jugadores. Cada país tiene:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
                <li>Un <strong>bioma</strong> que otorga bonificadores defensivos en combate</li>
                <li>Posibilidad de contener <strong>materias primas</strong> o <strong>tecnologías</strong></li>
                <li><strong>Conexiones terrestres y marítimas</strong> con otros países</li>
            </ul>
        </div>
    );

    const renderCombat = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>SISTEMA DE COMBATE</h3>
            <p>
                El combate en A.T.O.M.O usa un sistema de <strong>cartas tácticas</strong> en lugar
                de dados tradicionales. Cada batalla es un duelo <strong>al mejor de 3 rondas</strong>
                entre un atacante y un defensor.
            </p>

            <h3 style={h3Style}>CÓMO ATACAR</h3>
            <ol style={{ paddingLeft: '20px' }}>
                <li>Selecciona un país <strong>enemigo</strong> en el mapa</li>
                <li>Presiona <strong>"ATACAR PAÍS"</strong></li>
                <li>Elige desde cuál de tus países adyacentes lanzar el ataque</li>
                <li>Se inicia la pantalla de batalla</li>
            </ol>
            <div style={warningStyle}>
                <strong>Desembarco marítimo:</strong> Si atacas cruzando el mar, tu Infantería recibe <strong>-1</strong> pero
                tu Artillería recibe <strong>+1</strong>.
            </div>

            <h3 style={h3Style}>CARTAS DE BATALLA</h3>
            <p>Al iniciar una batalla, cada jugador recibe <strong>5 cartas</strong> de un mazo temporal. Cada carta tiene:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Propiedad</th>
                        <th style={thStyle}>Valores</th>
                        <th style={thStyle}>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}><strong>Regimiento</strong></td>
                        <td style={tdStyle}>Aéreo (A), Infantería (B), Artillería (C)</td>
                        <td style={tdStyle}>El tipo de fuerza militar</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Tier</strong></td>
                        <td style={tdStyle}>1 (Rookie), 2 (Veterano), 3 (Élite), 4 (Leyenda)</td>
                        <td style={tdStyle}>Determina la potencia base de la carta</td>
                    </tr>
                </tbody>
            </table>

            <h3 style={h3Style}>RESOLUCIÓN DE CADA RONDA</h3>
            <ol style={{ paddingLeft: '20px' }}>
                <li>El <strong>Atacante</strong> elige una carta de su mano (el defensor no la ve)</li>
                <li>El <strong>Defensor</strong> elige una carta de respuesta</li>
                <li>Se comparan los puntajes:</li>
            </ol>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Rol</th>
                        <th style={thStyle}>Cálculo del Puntaje</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}><strong>Atacante</strong></td>
                        <td style={tdStyle}>Tier de la carta + bonificadores de misiones activas</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Defensor</strong></td>
                        <td style={tdStyle}>Tier de la carta (solo si coincide el regimiento) + bonus de terreno</td>
                    </tr>
                </tbody>
            </table>
            <div style={tipStyle}>
                <strong>Regla Crítica — Coincidencia de Regimiento:</strong> La carta del defensor solo cuenta su Tier si es del <strong>mismo regimiento</strong> que
                la carta del atacante. Si no coinciden, la base del defensor es 0 (solo le quedan los bonus de terreno). Si el atacante saca Artillería Tier 3, la carta ideal del defensor es Artillería (cualquier Tier), ya que tendría su Tier + bonificaciones de terreno. Si el defensor juega Infantería (distinto regimiento), su Tier no cuenta.
            </div>

            <h3 style={h3Style}>BIOMAS Y BONIFICADORES DE TERRENO</h3>
            <p>Cada país tiene un bioma que otorga bonificadores <strong>defensivos</strong>:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Bioma</th>
                        <th style={thStyle}>Defensa vs Artillería</th>
                        <th style={thStyle}>Defensa vs Aéreo</th>
                        <th style={thStyle}>Defensa vs Infantería</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Montaña</td><td style={tdStyle}>+1</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td></tr>
                    <tr><td style={tdStyle}>Llanura</td><td style={tdStyle}>—</td><td style={tdStyle}>—</td><td style={tdStyle}>+1</td></tr>
                    <tr><td style={tdStyle}>Selva</td><td style={tdStyle}>+1</td><td style={tdStyle}>+1</td><td style={tdStyle}>—</td></tr>
                    <tr><td style={tdStyle}>Urbano</td><td style={tdStyle}>—</td><td style={tdStyle}>+1</td><td style={tdStyle}>—</td></tr>
                </tbody>
            </table>
            <div style={tipStyle}>
                Algunos países tienen <strong>múltiples biomas</strong> (ej: Japón = Montaña + Selva + Urbano),
                lo que <strong>acumula</strong> sus bonificaciones. Son fortalezas naturales extremadamente difíciles de conquistar.
            </div>

            <h3 style={h3Style}>SUMINISTROS EN BATALLA</h3>
            <p>
                Durante la batalla, ambos jugadores pueden gastar <strong>Suministros de su inventario</strong> para
                robar cartas adicionales del mazo. Esto amplía tu mano y te da más opciones tácticas. Los suministros
                se consumen al usarlos.
            </p>
            <div style={warningStyle}>
                Solo podés usar los suministros que <strong>ya produjiste en el preturno</strong>:
                <strong> no se puede producir durante la batalla</strong>. Si llegás al combate sin reservas, peleás con la mano base.
            </div>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Combinación</th>
                        <th style={thStyle}>Cartas Extra</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>1 de cada tipo (Alimentos + Manufactura + Energía)</td><td style={tdStyle}>4 cartas</td></tr>
                    <tr><td style={tdStyle}>1 suministro individual</td><td style={tdStyle}>1 carta</td></tr>
                </tbody>
            </table>
        </div>
    );

    const renderProduction = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>CADENA DE PRODUCCIÓN</h3>
            <p>
                La economía del juego sigue un flujo de <strong>3 pasos</strong>:
                Materias Primas + Tecnología = Suministros. Los suministros se usan para activar misiones,
                mejorar batallas y avanzar hacia la victoria nuclear.
            </p>

            <h3 style={h3Style}>CUÁNDO SE PRODUCE — SOLO EN EL PRETURNO</h3>
            <p>
                Los suministros <strong>solo pueden producirse en el preturno</strong>: la fase de producción
                simultánea al inicio de cada ronda. Ahí, todos los comandantes a la vez combinan sus
                materias primas + tecnologías. Cada suministro generado queda <strong>radicado en el país
                de origen</strong> de la materia prima usada.
            </p>
            <div style={warningStyle}>
                <strong>Durante la ronda NO se pueden generar suministros.</strong> Sí podés <strong>usar</strong> los
                que tengas en el inventario, y también gastar materias primas y tecnologías para <strong>misiones</strong>
                (principales y secundarias) e infraestructura nuclear. Decidí en el preturno qué vas a necesitar.
            </div>

            <h3 style={h3Style}>CÓMO FUNCIONA EL CONSUMO DE CARTAS</h3>
            <p>
                Las cartas de Materias Primas y Tecnologías <strong>no se destruyen</strong> al usarse.
                En cambio, se marcan como <strong>"consumidas esta ronda"</strong>. Se
                <strong> desbloquean recién al inicio de la ronda siguiente</strong> (en el próximo preturno),
                no en cada turno.
            </p>
            <div style={tipStyle}>
                <strong>Implicación estratégica:</strong> Si usás una carta de Semiconductores para producir un
                suministro en el preturno, esa misma carta queda consumida por el resto de la ronda: no podrás
                usarla también para generar un Diseño Nuclear en tu turno. Planificá el orden de tus acciones.
            </div>

            <h3 style={h3Style}>MATERIAS PRIMAS INDEXADAS POR PAÍS</h3>
            <p>
                Las cartas están vinculadas a <strong>países específicos</strong>. Si controlás un país que produce
                Hierro, tenés acceso a esa carta. Si perdés ese país en combate, <strong>pierdes la carta</strong>.
            </p>
            <div style={warningStyle}>
                <strong>El consumo viaja con el país, no con el jugador.</strong> Si un comandante agota la materia
                prima de un país durante el preturno y <strong>otro lo conquista en esa misma ronda</strong>, el
                conquistador <strong>no dispondrá de esa carta</strong>: ya fue consumida y no se desbloquea hasta
                la próxima ronda. Conquistar un país cuyos recursos ya se gastaron no te da acceso inmediato a ellos.
            </div>

            <h3 style={h3Style}>MATERIAS PRIMAS — 9 TIPOS</h3>
            <p>Cada materia prima se obtiene de países específicos y pertenece a una de las 3 categorías de producción:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Materias Primas</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}><strong>Alimentos</strong></td>
                        <td style={tdStyle}>Cereales, Oleaginosas, Agua Dulce</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Manufactura</strong></td>
                        <td style={tdStyle}>Hierro, Aluminio, Semiconductores</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Energía</strong></td>
                        <td style={tdStyle}>Hidrocarburos, Combustible Nuclear, Litio y Tierras Raras</td>
                    </tr>
                </tbody>
            </table>

            <h3 style={h3Style}>TECNOLOGÍAS — 9 TIPOS</h3>
            <p>Cada tecnología requiere una materia prima específica para funcionar y produce un tipo de suministro:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Tecnología</th>
                        <th style={thStyle}>Requiere</th>
                        <th style={thStyle}>Produce</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Ganadería Intensiva</td><td style={tdStyle}>Oleaginosas</td><td style={tdStyle}>Alimentos</td></tr>
                    <tr><td style={tdStyle}>Agroindustria</td><td style={tdStyle}>Cereales</td><td style={tdStyle}>Alimentos</td></tr>
                    <tr><td style={tdStyle}>Purificación de Agua</td><td style={tdStyle}>Agua Dulce</td><td style={tdStyle}>Alimentos</td></tr>
                    <tr><td style={tdStyle}>Industria Pesada</td><td style={tdStyle}>Hierro</td><td style={tdStyle}>Manufactura</td></tr>
                    <tr><td style={tdStyle}>Industria Ligera</td><td style={tdStyle}>Aluminio</td><td style={tdStyle}>Manufactura</td></tr>
                    <tr><td style={tdStyle}>Electrónica Avanzada</td><td style={tdStyle}>Semiconductores</td><td style={tdStyle}>Manufactura</td></tr>
                    <tr><td style={tdStyle}>Centrales Térmicas</td><td style={tdStyle}>Hidrocarburos</td><td style={tdStyle}>Energía</td></tr>
                    <tr><td style={tdStyle}>Tecnología Nuclear</td><td style={tdStyle}>Combustible Nuclear</td><td style={tdStyle}>Energía</td></tr>
                    <tr><td style={tdStyle}>Energías Renovables</td><td style={tdStyle}>Litio y Tierras Raras</td><td style={tdStyle}>Energía</td></tr>
                </tbody>
            </table>
            <div style={tipStyle}>
                <strong>Para producir 1 suministro:</strong> Necesitas tener en tu inventario 1 Tecnología + 1 Materia Prima compatible.
                Ambas cartas se marcan como "usadas" por ese turno. Al inicio del turno siguiente, se desbloquean automáticamente.
            </div>

            <h3 style={h3Style}>SUMINISTROS</h3>
            <p>
                Los suministros son unidades consumibles de <strong>Alimentos</strong>, <strong>Manufactura</strong> y <strong>Energía</strong>.
                A diferencia de las cartas (que se reutilizan), los suministros sí <strong>desaparecen</strong> al usarse.
                Sirven para:
            </p>
            <ul style={{ paddingLeft: '20px' }}>
                <li>Activar <strong>misiones especiales</strong> (la mayoría requiere 1 de cada tipo)</li>
                <li>Robar <strong>cartas extra en batalla</strong></li>
                <li>Alimentar ciertas <strong>infraestructuras</strong></li>
            </ul>

        </div>
    );

    const renderMissions = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>MISIONES ESPECIALES</h3>
            <p>
                Las misiones aparecen dinámicamente cuando controlas ciertos países. Cada una otorga
                <strong> bonificaciones de combate</strong> o <strong>ventajas estratégicas</strong>.
                Si pierdes los países requeridos, pierdes la misión.
            </p>

            <h3 style={h3Style}>MISIONES DE COMBATE</h3>
            <p>Otorgan bonificadores de ataque entre países específicos:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Misión</th>
                        <th style={thStyle}>Requisito</th>
                        <th style={thStyle}>Bonus</th>
                        <th style={thStyle}>Países Afectados</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Cruce de los Andes</td><td style={tdStyle}>Argentina + 1 Alimento</td><td style={tdStyle}>+1 Infantería</td><td style={tdStyle}>Argentina / Chile</td></tr>
                    <tr><td style={tdStyle}>Desembarco de Normandía</td><td style={tdStyle}>UK + Hierro + Ind. Pesada</td><td style={tdStyle}>+2 Art. / +1 Inf.</td><td style={tdStyle}>UK / Francia</td></tr>
                    <tr><td style={tdStyle}>Op. Alejandro Magno</td><td style={tdStyle}>Grecia + 1 de cada suministro</td><td style={tdStyle}>+1 Infantería</td><td style={tdStyle}>Grecia, Turquía, Egipto, Irán</td></tr>
                    <tr><td style={tdStyle}>Legado Otomano</td><td style={tdStyle}>Turquía + 1 de cada suministro</td><td style={tdStyle}>+1 Infantería</td><td style={tdStyle}>Turquía, Egipto, Arabia, Grecia</td></tr>
                    <tr><td style={tdStyle}>Op. Gengis Khan</td><td style={tdStyle}>Mongolia + 1 de cada suministro</td><td style={tdStyle}>+1 Infantería</td><td style={tdStyle}>Mongolia, Kazajistán, China, Rusia</td></tr>
                    <tr><td style={tdStyle}>Op. Bolívar</td><td style={tdStyle}>Venezuela + 1 de cada suministro</td><td style={tdStyle}>+1 Infantería</td><td style={tdStyle}>Venezuela, Colombia, Panamá, Perú</td></tr>
                    <tr><td style={tdStyle}>Fuego del Pacífico</td><td style={tdStyle}>Japón + 1 de cada suministro</td><td style={tdStyle}>+1 Aéreo</td><td style={tdStyle}>Japón, Corea, Kamchatka, Filipinas</td></tr>
                </tbody>
            </table>

            <h3 style={h3Style}>MISIONES ESTRATÉGICAS</h3>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Misión</th>
                        <th style={thStyle}>Requisito</th>
                        <th style={thStyle}>Efecto</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Ruta Antártica</td><td style={tdStyle}>Chile, Argentina, Australia, Sudáfrica + techs</td><td style={tdStyle}>Ruta de suministros entre países del sur</td></tr>
                    <tr><td style={tdStyle}>Cúpula Dorada</td><td style={tdStyle}>Los 5 países de Norteamérica + techs</td><td style={tdStyle}>+1 defensa aérea para América del Norte</td></tr>
                    <tr><td style={tdStyle}>Refundación de Estanbul</td><td style={tdStyle}>Turquía + Grecia + Hierro + Ind. Pesada</td><td style={tdStyle}>Puente del Bósforo (conexión Europa-Asia)</td></tr>
                    <tr><td style={tdStyle}>Planta Desalinizadora</td><td style={tdStyle}>España, Marruecos, Arabia, Chile o California</td><td style={tdStyle}>Produce Agua Dulce (persiste si el país cambia de dueño)</td></tr>
                    <tr><td style={tdStyle}>Energía Geotérmica</td><td style={tdStyle}>Islandia + Filipinas + Hierro + Ind. Pesada</td><td style={tdStyle}>Fuente de energía renovable</td></tr>
                    <tr><td style={tdStyle}>Secretos de la Guerra</td><td style={tdStyle}>Control del País de la Guerra Proxy</td><td style={tdStyle}>Revela depósitos de materias primas ocultas</td></tr>
                </tbody>
            </table>
            <div style={warningStyle}>
                <strong>Pérdida de misiones:</strong> Las misiones activas que otorgan bonus de combate se pierden si
                un país involucrado es conquistado por un enemigo. Esto aplica incluso si pierdes la batalla atacando
                desde uno de los países afectados.
            </div>
        </div>
    );

    const renderNuclear = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>CARRERA NUCLEAR — RUTA A LA VICTORIA</h3>
            <p>
                El programa nuclear es la <strong>única vía para ganar</strong>. Es un proceso
                largo, costoso y peligroso que requiere planificación logística precisa.
                Cada paso tiene requisitos estrictos.
            </p>

            <h3 style={h3Style}>PASO 1: DISEÑO DE ARMAS NUCLEARES</h3>
            <p>Crea los planos para tus armas nucleares intercontinentales.</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Requisito</th>
                        <th style={thStyle}>Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}><strong>País con capacidad nuclear bélica</strong></td>
                        <td style={tdStyle}>El diseño solo puede generarse en un país que tenga <strong>Tecnología Nuclear con fines bélicos</strong>. No todos los países con centrales nucleares sirven: existe una distinción entre "Nuclear Energía" (pacífica) y "Nuclear Bélica" (potencias militares como Francia, China, Rusia, EEUU, UK, Corea). Solo los países del segundo grupo pueden albergar el diseño.</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Electrónica Avanzada</strong></td>
                        <td style={tdStyle}>1 carta de tecnología Electrónica Avanzada (se marca como usada)</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}><strong>Semiconductores</strong></td>
                        <td style={tdStyle}>1 carta de materia prima Semiconductores (se marca como usada)</td>
                    </tr>
                </tbody>
            </table>
            <div style={tipStyle}>
                <strong>Distribución nuclear:</strong> Al inicio de cada partida, el sistema selecciona aleatoriamente
                qué países tendrán capacidad nuclear bélica (limitado a la cantidad de jugadores, tomados de la lista
                de potencias: Francia, China, Rusia, California, Nueva York, Texas, UK, Corea). Los restantes
                países nucleares solo tendrán capacidad energética. Debes conquistar uno de los países seleccionados
                como "bélico" para poder iniciar tu diseño.
            </div>

            <h3 style={h3Style}>PASO 2: EXTRACCIÓN DEL MINERAL SECRETO</h3>
            <p>
                Al inicio del juego, a cada jugador se le asigna secretamente un país <strong>enemigo</strong> que
                contiene un mineral estratégico esencial. La extracción de este mineral es <strong>obligatoria</strong>
                para poder lanzar tus armas.
            </p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Requisito</th>
                        <th style={thStyle}>Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}><strong>Conquistar el país objetivo</strong></td><td style={tdStyle}>Debes controlar el país donde está tu mineral secreto</td></tr>
                    <tr><td style={tdStyle}><strong>1 Tecnología</strong></td><td style={tdStyle}>Cualquier tecnología disponible (se marca como usada)</td></tr>
                    <tr><td style={tdStyle}><strong>1 Hierro</strong></td><td style={tdStyle}>Materia prima de Hierro (se marca como usada)</td></tr>
                    <tr><td style={tdStyle}><strong>1 Agua Dulce</strong></td><td style={tdStyle}>Materia prima de Agua Dulce (se marca como usada)</td></tr>
                </tbody>
            </table>
            <div style={warningStyle}>
                <strong>Sin Mineral Secreto = Sin Victoria.</strong> El mineral es una condición indispensable para el
                lanzamiento final. No importa cuántos silos, diseños o combustible tengas: sin este mineral,
                no podés ganar el juego. Usá el espionaje para descubrir dónde están los minerales de tus rivales
                y protegé el tuyo a toda costa.
            </div>

            <h3 style={h3Style}>PASO 3: CONSTRUCCIÓN DEL SILO</h3>
            <p>Construye una plataforma de lanzamiento en uno de tus territorios.</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Categoría</th>
                        <th style={thStyle}>Cartas Requeridas</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}><strong>Tecnologías (3)</strong></td><td style={tdStyle}>Industria Ligera + Industria Pesada + Electrónica Avanzada</td></tr>
                    <tr><td style={tdStyle}><strong>Materias Primas (3)</strong></td><td style={tdStyle}>Hierro + Aluminio + Semiconductores</td></tr>
                </tbody>
            </table>
            <p style={{ marginTop: '10px' }}>
                El silo inicia en estado <strong>CONSTRUCCIÓN</strong> y tarda <strong>2 turnos</strong> en activarse.
                Una vez activo, pasa a estado <strong>OPERATIVO</strong> y está listo para recibir combustible.
            </p>
            <div style={tipStyle}>
                El silo es una <strong>estructura física</strong> vinculada a un país específico.
                Si pierdes ese país, pierdes el silo y toda la inversión de recursos.
            </div>

            <h3 style={h3Style}>PASO 4: ASIGNACIÓN DE COMBUSTIBLE AL SILO</h3>
            <p>
                Una vez que el silo está operativo, debes asignarle una <strong>carta de Combustible Nuclear</strong>
                (materia prima) como reserva de lanzamiento.
            </p>
            <ul style={{ paddingLeft: '20px' }}>
                <li>Cada silo tiene un <strong>slot de combustible</strong> individual</li>
                <li>La carta asignada queda <strong>reservada</strong> para ese silo específico</li>
                <li>La carta de combustible <strong>no debe estar consumida</strong> al momento del despliegue</li>
                <li>Si la carta de combustible se pierde (ej: conquistan el país que la produce), el silo queda sin alimentar</li>
            </ul>

            <h3 style={h3Style}>PASO 5: DESPLIEGUE NUCLEAR — VICTORIA</h3>
            <p>Con todos los componentes en su lugar, puedes iniciar la secuencia final:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Verificación Requerida</th>
                        <th style={thStyle}>Estado Necesario</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Diseño de Armas Nucleares</td><td style={tdStyle}>Activo (país controlado)</td></tr>
                    <tr><td style={tdStyle}>Mineral Secreto</td><td style={tdStyle}>Extraído</td></tr>
                    <tr><td style={tdStyle}>Silo de Lanzamiento</td><td style={tdStyle}>Operativo (construcción completada)</td></tr>
                    <tr><td style={tdStyle}>Combustible Nuclear</td><td style={tdStyle}>Asignado al silo y no consumido</td></tr>
                </tbody>
            </table>

            <h3 style={h3Style}>DESTRUCCIÓN MUTUA ASEGURADA — MAD</h3>
            <p>
                Si <strong>más de un jugador</strong> tiene un arsenal nuclear funcional al mismo tiempo,
                se activa el protocolo <strong>MAD</strong> (Mutual Assured Destruction): ninguno puede lanzar
                mientras el otro tenga capacidad nuclear operativa.
            </p>
            <div style={warningStyle}>
                <strong>Para romper el MAD:</strong> Debes conquistar los territorios donde el enemigo
                tiene sus silos, diseños o combustible, cortando su cadena nuclear.
                Solo entonces podrás lanzar sin que se active la destrucción mutua.
                El silo que intentó lanzar durante un MAD entra en <strong>enfriamiento (cooldown)</strong>
                y no puede usarse hasta el siguiente turno.
            </div>
        </div>
    );

    const renderEspionage = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>RED DE ESPIONAJE</h3>
            <p>
                La inteligencia es poder. Crea redes de espionaje para descubrir los secretos de tus enemigos.
            </p>

            <h3 style={h3Style}>CREAR UNA RED DE ESPIONAJE</h3>
            <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Requiere:</strong> 1 Electrónica Avanzada + 1 carta de Semiconductores</li>
                <li><strong>Base:</strong> Se establece en uno de tus países (cada país solo puede ser sede de espionaje una vez)</li>
                <li><strong>Límite:</strong> Máximo 4 redes de espionaje por jugador en toda la partida</li>
            </ul>

            <h3 style={h3Style}>USAR ESPIONAJE</h3>
            <p>Una vez que tengas una red activa, puedes espiar a otro jugador para descubrir:</p>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Tipo de Inteligencia</th>
                        <th style={thStyle}>Información Revelada</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Silos Nucleares</td><td style={tdStyle}>Ubicación y estado operativo de todos los silos nucleares del enemigo</td></tr>
                    <tr><td style={tdStyle}>Mineral Secreto</td><td style={tdStyle}>Ubicación del mineral secreto del enemigo y si ya fue extraído</td></tr>
                </tbody>
            </table>
            <div style={tipStyle}>
                La carta de espionaje se <strong>consume permanentemente</strong> al usarla. Planificá cuándo espiar.
                Es una de las herramientas más poderosas del juego: saber dónde está el silo de un rival
                te permite conquístarlo y cortar su cadena nuclear.
            </div>
        </div>
    );

    const renderTreaties = () => (
        <div style={sectionStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>SISTEMA DE TRATADOS</h3>
            <p>
                La diplomacia puede ser tu mejor arma. Los tratados permiten negociar con otros jugadores
                para intercambiar recursos, territorio o establecer pactos de no agresión.
            </p>

            <h3 style={h3Style}>TIPOS DE CLÁUSULAS</h3>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Tipo</th>
                        <th style={thStyle}>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style={tdStyle}>Cesión de Región</td><td style={tdStyle}>Transfiere la propiedad de un país a otro jugador</td></tr>
                    <tr><td style={tdStyle}>Cesión de Materia Prima</td><td style={tdStyle}>Transfiere una carta de materia prima al otro jugador</td></tr>
                    <tr><td style={tdStyle}>Préstamo de Tecnología</td><td style={tdStyle}>Presta temporalmente una tecnología (se devuelve al expirar)</td></tr>
                    <tr><td style={tdStyle}>Duplicado de Tecnología</td><td style={tdStyle}>Duplica una tecnología para el otro jugador</td></tr>
                    <tr><td style={tdStyle}>Pacto de No Agresión</td><td style={tdStyle}>Prohíbe atacar desde regiones específicas al jugador aliado</td></tr>
                </tbody>
            </table>

            <h3 style={h3Style}>CICLO DE VIDA DE UN TRATADO</h3>
            <ol style={{ paddingLeft: '20px' }}>
                <li><strong>Borrador:</strong> Un jugador redacta el tratado con sus cláusulas</li>
                <li><strong>Propuesta:</strong> Se envía al otro jugador para revisión</li>
                <li><strong>Aceptación:</strong> El otro jugador acepta o rechaza</li>
                <li><strong>Pendiente:</strong> Si se acepta, entra en vigor el <strong>siguiente año</strong> del juego</li>
                <li><strong>Activo:</strong> Las cláusulas se ejecutan automáticamente</li>
                <li><strong>Expiración:</strong> Las cláusulas con duración limitada revierten sus efectos al caducar</li>
            </ol>
            <div style={warningStyle}>
                Los tratados de No Agresión <strong>restringen físicamente</strong> tus ataques.
                No podrás atacar al jugador aliado desde las regiones pactadas mientras el tratado esté vigente.
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'overview': return renderOverview();
            case 'combat': return renderCombat();
            case 'production': return renderProduction();
            case 'missions': return renderMissions();
            case 'nuclear': return renderNuclear();
            case 'espionage': return renderEspionage();
            case 'treaties': return renderTreaties();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            fontFamily: '"Courier New", Courier, monospace',
        }}>
            {/* Sidebar Navigation */}
            <div style={{
                width: '260px',
                minWidth: '260px',
                backgroundColor: '#0a0a0a',
                borderRight: '1px solid #222',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 0',
                overflowY: 'auto',
            }}>
                <div style={{
                    padding: '0 20px 20px',
                    borderBottom: '1px solid #222',
                    marginBottom: '10px',
                }}>
                    <h2 style={{
                        color: '#00ff00',
                        fontSize: '1.2rem',
                        margin: 0,
                        letterSpacing: '3px',
                    }}>
                        MANUAL DE OPERACIONES
                    </h2>
                    <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '5px' }}>
                        A.T.O.M.O v2 — Guía del Comandante
                    </div>
                </div>

                {SECTIONS.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: activeSection === section.id ? '#001a00' : 'transparent',
                            color: activeSection === section.id ? '#00ff00' : '#888',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            borderLeft: activeSection === section.id ? '3px solid #00ff00' : '3px solid transparent',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            if (activeSection !== section.id) {
                                e.currentTarget.style.backgroundColor = '#0d0d0d';
                                e.currentTarget.style.color = '#aaa';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeSection !== section.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#888';
                            }
                        }}
                    >
                        <span>{section.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '30px 40px',
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        right: '20px',
                        background: 'none',
                        border: '1px solid #444',
                        color: '#888',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '5px 12px',
                        zIndex: 10001,
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff4444';
                        e.currentTarget.style.color = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.color = '#888';
                    }}
                >
                    X
                </button>

                <div style={{ maxWidth: '800px' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
