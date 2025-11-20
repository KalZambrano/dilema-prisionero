import type { Player, RoundResult } from "../../types";

export function ResultTable({
  roundResults,
  players,
  children
}: {
  roundResults: RoundResult[];
  players: Player[];
  children?: React.ReactNode
}) {
  return (
    <div className="round-history">
        {children}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ronda</th>
              {players.map((p) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roundResults.map((result, idx) => (
              <tr key={idx}>
                <td>
                  <strong>#{result.round}</strong>
                </td>
                {result.decisions.map((decision, pidx) => (
                  <td key={pidx}>
                    <div className="decision-cell">
                      <span
                        className={`decision-badge ${
                          decision === "C" ? "cooperate" : "defect"
                        }`}
                      >
                        {decision === "C" ? "🤝 No Confesó" : "🗣️ Confesó"}
                      </span>
                      <span className="penalty-value">
                        {result.penalties[pidx]} años
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
