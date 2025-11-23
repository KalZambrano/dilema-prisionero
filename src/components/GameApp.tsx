import { ResultTable } from "../components/ResultTable";
import type { Player, RoundResult, Decision } from "../../types";

interface Props {
  players: Player[];
  currentDecisions: Decision[];
  roundResults: RoundResult[];
  handleDecision: (idx: number, choice: Decision) => void;
  handleProcess: () => void;
  handleAuto: () => void;
  gameType: "single" | "multiple";
}
export function GameApp({
  players,
  currentDecisions,
  roundResults,
  handleDecision,
  handleProcess,
  handleAuto,
  gameType
}: Props) {
  const playerStrategies = players.map((p) => p.strategy);
  return (
    <>
      <div className="decisions-grid">
        {players.map((player, idx) => (
          <div key={player.id} className="player-decision">
            <h3>{player.name}</h3>
            <div className="strategy-badge">
              {player.strategy === "manual" ? "🎯 Manual" : "🤖 Automático"}
            </div>

            {player.strategy === "manual" ? (
              <div className="decision-buttons">
                <button
                  className={`btn-decision ${
                    currentDecisions[idx] === "C" ? "selected cooperate" : ""
                  }`}
                  onClick={() => handleDecision(idx, "C")}
                >
                  🤝 No Confesar
                </button>
                <button
                  className={`btn-decision ${
                    currentDecisions[idx] === "D" ? "selected defect" : ""
                  }`}
                  onClick={() => handleDecision(idx, "D")}
                >
                  🗣️ Confesar
                </button>
              </div>
            ) : (
              <div className="auto-decision">
                <p>Decisión automática según estrategia:</p>
                <span>
                  {player.strategy === "always-cooperate"
                    ? "Nunca Confesar🫂"
                    : player.strategy === "always-defect"
                    ? "Siempre Confesar🐸"
                    : player.strategy === "tit-for-tat"
                    ? "Ojo por Ojo👁️"
                    : player.strategy === "random"
                    ? "Aleatorio♾️"
                    : ""}
                </span>
              </div>
            )}

            <div className="player-stats">
              <div>Penalidad total: {player.totalPenalty} años</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={handleProcess}>
        Procesar Ronda
      </button>
      {!playerStrategies.includes("manual") && gameType === "multiple" && (
        <button className="btn-skip" onClick={handleAuto}>
          Saltear Rondas ⏩
        </button>
      )}

      {roundResults.length > 0 && (
        <ResultTable roundResults={roundResults} players={players}>
          <h3>📋 Historial Completo de Decisiones</h3>
          <p className="history-description">
            Aquí puedes ver todas las decisiones tomadas en cada ronda, junto
            con las penalidades recibidas por cada jugador.
          </p>
        </ResultTable>
      )}
    </>
  );
}
