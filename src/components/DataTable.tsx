import StatusBadge from './StatusBadge';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (row: any) => void;
}

export default function DataTable({ columns, data, onRowClick }: DataTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr
                            key={idx}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'cursor-pointer' : ''}
                        >
                            {columns.map((col) => (
                                <td key={col.key}>
                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : col.key === 'classification'
                                            ? <StatusBadge status={row[col.key]} />
                                            : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No data available
                </div>
            )}
        </div>
    );
}
