import { useMemo } from 'react';
import { DataTable } from '../DataTable';

export function MeetingLogTable({ data }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'period',
        header: 'Period',
      },
      {
        accessorKey: 'totalMeetings',
        header: 'Total Attended',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>
      },
      {
        accessorKey: 'totalHours',
        header: 'Total Hours',
        cell: (info) => <span>{info.getValue().toFixed(1)} hrs</span>
      },
      {
        accessorKey: 'noShowRate',
        header: 'No-Show Rate',
        cell: (info) => {
          const val = info.getValue();
          const color = val > 10 ? 'text-red-400' : val > 0 ? 'text-amber-400' : 'text-emerald-400';
          return <span className={`${color} font-medium`}>{val.toFixed(1)}%</span>;
        }
      },
      {
        accessorKey: 'avgDurationMins',
        header: 'Avg Duration',
        cell: (info) => <span>{Math.round(info.getValue())} mins</span>
      }
    ],
    []
  );

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-200 mb-3 print:text-black">Granular Meeting Log</h3>
      <DataTable data={data} columns={columns} />
    </div>
  );
}
