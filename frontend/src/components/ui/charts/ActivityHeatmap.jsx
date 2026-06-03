export function ActivityHeatmap({ data }) {
  if (!data || data.length === 0) {
    return <div className="h-40 flex items-center justify-center text-gray-500">No data available</div>;
  }

  // Expecting data to be an array of intensity values (0-4) for the last 90 days
  // Group into weeks (columns) and days (rows)
  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const getColor = (intensity) => {
    switch (intensity) {
      case 4: return 'bg-emerald-500';
      case 3: return 'bg-emerald-600';
      case 2: return 'bg-emerald-700';
      case 1: return 'bg-emerald-900';
      default: return 'bg-gray-800';
    }
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((day, dIdx) => (
              <div 
                key={`${wIdx}-${dIdx}`} 
                className={`w-3 h-3 rounded-sm ${getColor(day.intensity)}`}
                title={`${day.date}: ${day.count} activities`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-end items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
