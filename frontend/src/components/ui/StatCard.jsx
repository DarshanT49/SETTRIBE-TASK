export function StatCard({ title, value, variance, isPositiveVariance }) {
  return (
    <div className="card p-4 flex flex-col justify-between print:border-gray-300 print:bg-white print:break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 print:text-gray-600">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-100 print:text-black leading-none">{value}</span>
        {variance && (
          <span className={`text-xs font-medium ml-2 mb-1 ${isPositiveVariance ? 'text-emerald-500' : 'text-red-500'}`}>
            {variance}
          </span>
        )}
      </div>
    </div>
  );
}
