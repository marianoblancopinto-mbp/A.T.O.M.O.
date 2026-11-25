import React, { useState } from 'react';
import { regionTitle, type BattleReport } from '@atomo/shared';
import { useGameContext } from '../../context/GameContext';
import { BattleCard } from '../shared/battle/BattleCard';
import { Modal, Section, Button } from '../../ui/components';

const seenKey = (gameId: string | null) => `atomo_seen_battles_${gameId ?? ''}`;
const loadSeen = (gameId: string | null): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(seenKey(gameId)) || '[]')); } catch { return new Set(); }
};

/**
 * Informe de una batalla resuelta (correspondencia). Se muestra una vez a cada
 * participante, aunque se haya resuelto mientras no estaba conectado.
 */
export const BattleReportView: React.FC = () => {
    const { state, multiplayer } = useGameContext();
    const [seen, setSeen] = useState<Set<string>>(() => loadSeen(multiplayer.gameId));
    const me = String(multiplayer.playerId);
    const report: BattleReport | undefined = state.battleReports.find(r =>
        !seen.has(r.id) && (String(r.attacker.id) === me || String(r.defender.id) === me));
    if (!report) return null;

    const close = () => {
        const next = new Set(seen).add(report.id);
        setSeen(next);
        try { localStorage.setItem(seenKey(multiplayer.gameId), JSON.stringify([...next].slice(-50))); } catch { /* sin storage */ }
    };
    const iWon = (report.winner === 'attacker') === (String(report.attacker.id) === me);
    const score = report.clashes.filter(c => c.winner === 'attacker').length;

    return (
        <Modal tone={iWon ? 'default' : 'danger'} kicker="Informe de batalla" size="lg" onClose={close}
            title={`${iWon ? 'Victoria' : 'Derrota'} en ${regionTitle(report.targetId)}`}
            footer={<Button variant="primary" onClick={close}>Archivar</Button>}>
            <p className="ui-text">
                {report.attacker.name} atacó {regionTitle(report.targetId)} desde {regionTitle(report.sourceId)}.{' '}
                {report.winner === 'attacker' ? `La conquistó (${score}-${3 - score}).` : `${report.defender.name} la defendió (${3 - score}-${score}).`}
                {report.autoDefense && ' La defensa la organizó el mando local.'}
            </p>
            {report.clashes.map((c, i) => (
                <Section key={i} title={`Ronda ${i + 1} · gana ${c.winner === 'attacker' ? report.attacker.name : report.defender.name} (${c.attackerScore} contra ${c.defenderScore})`}>
                    <div className="ui-row" style={{ justifyContent: 'center', gap: 20 }}>
                        <BattleCard card={c.attackerCard} role="attacker" highlight={c.winner === 'attacker'} disabled />
                        <strong className="ui-muted">VS</strong>
                        {c.defenderCard ? <BattleCard card={c.defenderCard} role="defender" highlight={c.winner === 'defender'} disabled /> : <span className="ui-muted">Sin carta</span>}
                    </div>
                </Section>
            ))}
        </Modal>
    );
};
