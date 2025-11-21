import { ChartSection } from "./ChartSection";
import { ResultTable } from "./ResultTable";

import type { Player, RoundResult } from "../../types";

export function ResultsApp({roundResults, players}: {roundResults: RoundResult[], players: Player[]}) {
  
  // Analizar equilibrio de Nash
    const analyzeNashEquilibrium = (): {
    status: string;
    explanation: string;
  } => {
    if (roundResults.length === 0)
      return { status: "Sin datos", explanation: "" };

    const lastRound = roundResults[roundResults.length - 1];
    const allDefect = lastRound.decisions.every((d) => d === "D");
    const allCooperate = lastRound.decisions.every((d) => d === "C");

    if (allDefect) {
      return {
        status: "✓ Equilibrio de Nash detectado",
        explanation:
          "Cuando todos confiesan, ningún jugador puede mejorar su resultado cambiando unilateralmente su decisión. Si un jugador cambia a no confesar, recibirá una penalidad peor.",
      };
    } else if (allCooperate) {
      return {
        status: "⚠️ Comportamiento cooperativo (NO es equilibrio de Nash)",
        explanation:
          "Aunque todos cooperan, cualquier jugador podría mejorar su resultado confesando. Por tanto, esta situación es inestable.",
      };
    } else {
      return {
        status: "⚠️ Comportamiento mixto (NO es equilibrio de Nash)",
        explanation:
          "Los jugadores tienen incentivos para cambiar sus estrategias. No se ha alcanzado un punto donde nadie quiera cambiar unilateralmente.",
      };
    }
  };
  const nashAnalysis = analyzeNashEquilibrium();
  return (
    <>
      <h1>📊 Resultados Finales</h1>

      <div className="results-grid">
        <div className="result-card">
          <h3>🏆 Clasificación Final</h3>
          <p className="card-description">
            El jugador con menos años de penalidad gana.
          </p>
          <div className="ranking">
            {[...players]
              .sort((a, b) => a.totalPenalty - b.totalPenalty)
              .map((player, idx) => (
                <div key={player.id} className="rank-item">
                  <span className="rank-position">{idx + 1}°</span>
                  <span className="rank-name">{player.name}</span>
                  <span className="rank-penalty">
                    {player.totalPenalty} años
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="result-card">
          <h3>🧠 Análisis Estratégico</h3>
          <div className="analysis">
            <div className="nash-analysis">
              <h4>{nashAnalysis.status}</h4>
              <p className="explanation">{nashAnalysis.explanation}</p>
            </div>
            <hr />
            <h4>Tasa de Cooperación (No confesar):</h4>
            {players.map((p) => {
              const cooperations = p.decisions.filter((d) => d === "C").length;
              const rate = ((cooperations / p.decisions.length) * 100).toFixed(
                1
              );
              return (
                <div key={p.id} className="cooperation-bar">
                  <span className="player-label">{p.name}:</span>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${rate}%` }}
                    ></div>
                    <span className="bar-text">{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {roundResults.length > 1 && (
        <div className="chart-container">
          <h3>📈 Evolución de Penalidades por Ronda</h3>
          <p className="chart-description">
            Este gráfico muestra cuántos años de penalidad recibió cada jugador
            en cada ronda individual. Te permite ver cómo las decisiones
            cambiaron a lo largo del tiempo y qué jugadores recibieron las
            penalidades más altas en cada momento.
          </p>
          <ChartSection roundResults={roundResults} players={players} />
        </div>
      )}

      <div className="chart-container">
        <ResultTable roundResults={roundResults} players={players}>
          <h3>📝 Detalles de las Rondas</h3>
          <p className="chart-description">
            Estas son las decisiones de cada jugador en cada ronda.
          </p>
        </ResultTable>
      </div>
    </>
  );
}
