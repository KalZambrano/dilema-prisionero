import React, { useState } from "react";

import "./App.css";
import Swal from "sweetalert2";

import { ResultTable } from "./components/ResultTable";
import { ResultsApp } from "./components/ResultsApp";
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
    return (
      <div className="results-container">
        <ResultsApp roundResults={roundResults} players={players} />

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
