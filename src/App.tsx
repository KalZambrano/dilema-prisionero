import React, { useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import "./App.css";
import Swal from "sweetalert2";

import { ResultTable } from "./components/ResultTable";
import type { Player, RoundResult, Decision, Strategy } from "../types";

const App: React.FC = () => {
  const [step, setStep] = useState<"config" | "game" | "results">("config");
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [gameType, setGameType] = useState<"single" | "multiple">("single");
  const [numRounds, setNumRounds] = useState<number>(10);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [currentDecisions, setCurrentDecisions] = useState<Decision[]>([]);

  // Inicializar juego

  const startGame = () => {
    if (numPlayers < 2 || numPlayers > 5) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El juego debe tener entre 2 y 5 jugadores.",
      });
    } else if ((gameType === "multiple" && numRounds > 50) || numRounds < 5) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El juego debe tener entre 5 y 50 rondas.",
      });
    } else {
      startRound();
    }
  };
  const startRound = () => {
    const newPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: i,
      name: players[i]?.name || `Jugador ${i + 1}`,
      strategy: players[i]?.strategy || "manual",
      decisions: [],
      penalties: [],
      totalPenalty: 0,
    }));
    setPlayers(newPlayers);
    setCurrentRound(1);
    setCurrentDecisions(Array(numPlayers).fill(null));
    setRoundResults([]);
    setStep("game");
  };

  // Calcular penalidades según las reglas
  const calculatePenalties = (decisions: Decision[]): number[] => {
    const cooperators = decisions.filter((d) => d === "C").length;
    const defectors = decisions.filter((d) => d === "D").length;
    const total = cooperators + defectors;

    if (total === 2) {
      // Reglas clásicas para 2 jugadores
      if (cooperators === 2) return [2, 2];
      if (cooperators === 1) {
        return decisions.map((d) => (d === "C" ? 10 : 0));
      }
      return [5, 5];
    } else {
      // Reglas para 3-5 jugadores
      // const penalties: number[] = [];

      if (cooperators === total) {
        // Todos cooperan
        return Array(total).fill(2);
      } else if (defectors === total) {
        // Todos confiesan
        return Array(total).fill(5);
      } else if (defectors === 1) {
        // Solo uno confiesa
        return decisions.map((d) => (d === "D" ? 0 : 6));
      } else {
        // Más de uno confiesa
        return decisions.map((d) => (d === "D" ? 2 : 8));
      }
    }
  };

  // Generar decisión según estrategia
  const generateDecision = (player: Player, roundNum: number): Decision => {
    const playerChoice = player.strategy;
    if (playerChoice === "always-cooperate") {
      return "C";
    } else if (playerChoice === "always-defect") {
      return "D";
    } else if (playerChoice === "tit-for-tat") {
      if (roundNum === 1) return "C";
      // Copiar la decisión más común de la ronda anterior
      const lastRound = roundResults[roundResults.length - 1];
      if (lastRound) {
        const cooperators = lastRound.decisions.filter((d) => d === "C").length;
        return cooperators > numPlayers / 2 ? "C" : "D";
      }
      return "C";
    } else if (playerChoice === "random") {
      return Math.random() > 0.5 ? "C" : "D";
    } else {
      return null;
    }
  };

  // Procesar ronda
  const processRound = () => {
    let finalDecisions = [...currentDecisions];

    // Generar decisiones automáticas para jugadores con estrategia
    finalDecisions = finalDecisions.map((decision, idx) => {
      if (decision !== null) return decision;
      if (players[idx].strategy !== "manual") {
        return generateDecision(players[idx], currentRound);
      }
      return decision;
    });

    // Verificar que todas las decisiones estén tomadas
    if (finalDecisions.some((d) => d === null)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los jugadores deben tomar una decisión.",
      });
      return;
    }

    const penalties = calculatePenalties(finalDecisions);

    // Actualizar jugadores
    const updatedPlayers = players.map((player, idx) => ({
      ...player,
      decisions: [...player.decisions, finalDecisions[idx]!],
      penalties: [...player.penalties, penalties[idx]],
      totalPenalty: player.totalPenalty + penalties[idx],
    }));

    setPlayers(updatedPlayers);
    setRoundResults([
      ...roundResults,
      {
        round: currentRound,
        decisions: finalDecisions as Decision[],
        penalties,
      },
    ]);

    const totalRounds = gameType === "single" ? 1 : numRounds;

    if (currentRound >= totalRounds) {
      setStep("results");
    } else {
      setCurrentRound(currentRound + 1);
      setCurrentDecisions(Array(numPlayers).fill(null));
    }
  };

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

  // Renderizar configuración
  const renderConfig = () => (
    <div className="config-container">
      <h1>🎮 Simulador del Dilema del Prisionero</h1>

      <div className="config-section">
        <h2>Configuración del Juego</h2>

        <div className="form-group">
          <label>Número de jugadores (2-5):</label>
          <input
            type="number"
            min="2"
            max="5"
            value={numPlayers}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setNumPlayers(val);
              setPlayers(
                Array.from({ length: val }, (_, i) => ({
                  id: i,
                  name: `Jugador ${i + 1}`,
                  strategy: "manual",
                  decisions: [],
                  penalties: [],
                  totalPenalty: 0,
                }))
              );
            }}
          />
        </div>

        <div className="form-group">
          <label>Tipo de juego:</label>
          <select
            value={gameType}
            onChange={(e) =>
              setGameType(e.target.value as "single" | "multiple")
            }
          >
            <option value="single">Una sola ronda</option>
            <option value="multiple">Rondas repetidas</option>
          </select>
        </div>

        {gameType === "multiple" && (
          <div className="form-group">
            <label>Número de rondas (5-50):</label>
            <input
              type="number"
              min="5"
              max="50"
              value={numRounds}
              onChange={(e) => setNumRounds(parseInt(e.target.value))}
            />
          </div>
        )}

        <h3>Configuración de Jugadores</h3>
        {Array.from({ length: numPlayers }, (_, i) => (
          <div key={i} className="player-config">
            <div className="form-group">
              <label>Nombre:</label>
              <input
                type="text"
                value={players[i]?.name || `Jugador ${i + 1}`}
                onChange={(e) => {
                  const newPlayers = [...players];
                  newPlayers[i] = { ...newPlayers[i], name: e.target.value };
                  setPlayers(newPlayers);
                }}
              />
            </div>
            <div className="form-group">
              <label>Estrategia:</label>
              <select
                value={players[i]?.strategy || "manual"}
                onChange={(e) => {
                  const newPlayers = [...players];
                  newPlayers[i] = {
                    ...newPlayers[i],
                    strategy: e.target.value as Strategy,
                  };
                  setPlayers(newPlayers);
                }}
              >
                <option value="manual">Manual</option>
                <option value="always-cooperate">Nunca Confesar</option>
                <option value="always-defect">Siempre Confesar</option>
                <option value="tit-for-tat">Ojo por Ojo</option>
                <option value="random">Aleatorio</option>
              </select>
            </div>
          </div>
        ))}

        <button className="btn-primary" onClick={startGame}>
          Iniciar Juego
        </button>
      </div>
    </div>
  );

  // Renderizar juego
  const renderGame = () => (
    <div className="game-container">
      <h1>
        Ronda {currentRound} de {gameType === "single" ? 1 : numRounds}
      </h1>

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
                  onClick={() => {
                    const newDecisions = [...currentDecisions];
                    newDecisions[idx] = "C";
                    setCurrentDecisions(newDecisions);
                  }}
                >
                  🤝 No Confesar
                </button>
                <button
                  className={`btn-decision ${
                    currentDecisions[idx] === "D" ? "selected defect" : ""
                  }`}
                  onClick={() => {
                    const newDecisions = [...currentDecisions];
                    newDecisions[idx] = "D";
                    setCurrentDecisions(newDecisions);
                  }}
                >
                  🗣️ Confesar
                </button>
              </div>
            ) : (
              <div className="auto-decision">
                <p>Decisión automática según estrategia</p>
              </div>
            )}

            <div className="player-stats">
              <div>Penalidad total: {player.totalPenalty} años</div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={processRound}>
        Procesar Ronda
      </button>

      {roundResults.length > 0 && (
        <ResultTable roundResults={roundResults} players={players}>
          <h3>📋 Historial Completo de Decisiones</h3>
          <p className="history-description">
            Aquí puedes ver todas las decisiones tomadas en cada ronda, junto
            con las penalidades recibidas por cada jugador.
          </p>
        </ResultTable>
      )}
    </div>
  );

  // Renderizar resultados
  const renderResults = () => {
    // const chartData = players.map(p => ({
    //   name: p.name,
    //   penalidad: Math.abs(p.totalPenalty)
    // }));

    const roundChartData = roundResults.map((r) => {
      const data: Record<string, number> = { round: r.round };
      players.forEach((p, idx) => {
        data[p.name] = Math.abs(r.penalties[idx]);
      });
      return data;
    });

    const nashAnalysis = analyzeNashEquilibrium();

    return (
      <div className="results-container">
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
                const cooperations = p.decisions.filter(
                  (d) => d === "C"
                ).length;
                const rate = (
                  (cooperations / p.decisions.length) *
                  100
                ).toFixed(1);
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

        {/* <div className="chart-container">
          <h3>📊 Penalidades Totales Acumuladas</h3>
          <p className="chart-description">Suma total de años de penalidad por jugador.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Años de penalidad', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="penalidad" fill="#8884d8" name="Años de penalidad" />
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {roundResults.length > 1 && (
          <div className="chart-container">
            <h3>📈 Evolución de Penalidades por Ronda</h3>
            <p className="chart-description">
              Este gráfico muestra cuántos años de penalidad recibió cada
              jugador en cada ronda individual. Te permite ver cómo las
              decisiones cambiaron a lo largo del tiempo y qué jugadores
              recibieron las penalidades más altas en cada momento.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roundChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="round"
                  label={{
                    value: "Número de Ronda",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Años de penalidad en la ronda",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                {players.map((p, idx) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.name}
                    stroke={`hsl(${(idx * 360) / players.length}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
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

        <button
          className="btn-primary"
          onClick={() => {
            setStep("config");
            setPlayers([]);
            setRoundResults([]);
            setCurrentRound(0);
          }}
        >
          Nuevo Juego
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      {step === "config" && renderConfig()}
      {step === "game" && renderGame()}
      {step === "results" && renderResults()}
    </div>
  );
};

export default App;
