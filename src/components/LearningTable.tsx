import { useState } from 'react';
import type { Topic } from '../domain/learning';
export default function LearningTable({
  table,
}: {
  table: NonNullable<Topic['tables']>[number];
}) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(table.rows.length / 8);
  return (
    <div className="learning-table">
      <div
        className="learning-table-scroll"
        role="region"
        aria-label={table.caption}
        tabIndex={0}
      >
        <table>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              {table.headers.map((header, i) => (
                <th key={i} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(page * 8, page * 8 + 8).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{table.note}</p>
      {pages > 1 && (
        <nav className="page-controls" aria-label="Tabellenabschnitte">
          <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            ← Vorige Zeilen
          </button>
          <span>
            {page + 1} / {pages}
          </span>
          <button
            disabled={page === pages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Nächste Zeilen →
          </button>
        </nav>
      )}
    </div>
  );
}
