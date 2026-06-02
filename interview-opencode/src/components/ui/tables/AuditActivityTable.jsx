import { useMemo } from 'react';
import { DataTable } from '../DataTable';

export function AuditActivityTable({ data }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: (info) => <span className="text-gray-400 font-mono text-xs">{info.getValue()}</span>
      },
      {
        accessorKey: 'actionId',
        header: 'Action ID / Type',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-mono text-xs text-primary-400">{info.getValue()}</div>
              <div className="text-xs text-gray-300">{row.description}</div>
            </div>
          );
        }
      },
      {
        accessorKey: 'timeSpent',
        header: 'Time Spent',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>
      }
    ],
    []
  );

  return (
    <div className="mt-4">
      <DataTable data={data} columns={columns} />
    </div>
  );
}
