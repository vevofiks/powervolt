import './DataTable.css';

export default function DataTable({ columns = [], data = [], emptyMessage = 'No data found', loading = false }) {
  if (loading) {
    return (
      <div className="data-table__empty">
        <p>Loading...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="data-table__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table__wrapper">
      <table className="data-table" id="data-table">
        <thead>
          <tr>
            <th className="data-table__num-col">#</th>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              <td className="data-table__num-col">{rowIndex + 1}</td>
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
