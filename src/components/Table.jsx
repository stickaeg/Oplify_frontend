// src/components/Table.jsx
function Table({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
        {children}
      </table>
    </div>
  );
}

function Head({ children }) {
  return (
    <thead className="bg-gray-50">
      <tr>{children}</tr>
    </thead>
  );
}

function HeaderCell({ children }) {
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
    >
      {children}
    </th>
  );
}

function Body({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

function Row({ children, onClick }) {
  return (
    <tr
      onClick={onClick} // <-- attach click here
      className={`hover:bg-gray-50 transition-colors duration-150 ${
        onClick ? "cursor-pointer" : ""
      }`} // show pointer if clickable
    >
      {children}
    </tr>
  );
}

function Cell({ children }) {
  return (
    <td className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
      {children}
    </td>
  );
}

// Export subcomponents
Table.Head = Head;
Table.HeaderCell = HeaderCell;
Table.Body = Body;
Table.Row = Row;
Table.Cell = Cell;

export default Table;
