import { useMemo } from 'react';
import { DataTable } from '../DataTable';

export function ProjectDataGrid({ data }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Project Name',
      },
      {
        accessorKey: 'projectId',
        header: 'ID',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>
      },
      {
        accessorKey: 'hoursBilled',
        header: 'Hours Billed',
        cell: (info) => <span className="font-medium">{info.getValue().toFixed(1)}</span>
      },
      {
        id: 'budgetVsActual',
        header: 'Budget vs Actual',
        accessorFn: row => `${row.actualHours} / ${row.budgetHours} hrs`,
        cell: (info) => {
          const row = info.row.original;
          const isOver = row.actualHours > row.budgetHours;
          return (
            <span className={isOver ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
              {info.getValue()}
            </span>
          );
        }
      },
      {
        id: 'milestones',
        header: 'Milestones',
        accessorFn: row => `${row.milestonesCompleted} of ${row.milestonesTotal}`,
      },
      {
        accessorKey: 'overdueDays',
        header: 'Overdue (Days)',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className={val > 0 ? 'text-red-400 font-bold' : 'text-gray-500'}>
              {val > 0 ? val : '-'}
            </span>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3 print:text-black">Detailed Project Data</h3>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
