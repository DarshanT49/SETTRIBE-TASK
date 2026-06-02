import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export function DataTable({ data, columns }) {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto border border-gray-800 rounded-lg print:border-gray-300 print:break-inside-avoid">
      <table className="w-full text-sm text-left text-gray-300 print:text-black">
        <thead className="text-xs uppercase bg-gray-900/50 border-b border-gray-800 print:bg-gray-100 print:border-gray-300 print:text-gray-700">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-800/50 print:hover:bg-gray-100 transition-colors whitespace-nowrap"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <span className="text-gray-500">
                        {{
                          asc: <ChevronUp size={14} />,
                          desc: <ChevronDown size={14} />,
                        }[header.column.getIsSorted()] ?? <ArrowUpDown size={12} className="opacity-50" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-800 print:divide-gray-300">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-800/30 print:hover:bg-transparent transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
