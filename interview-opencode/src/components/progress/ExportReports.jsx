import { Download, FileText, FileSpreadsheet } from 'lucide-react';

export function ExportReports() {
  const handleExport = (type) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
    alert(`Exporting ${type} report generated. Check your downloads.`);
  };

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Download size={16} /> Export & Reports
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => handleExport('Performance PDF')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2">
          <FileText size={24} className="text-red-400" />
          <span className="text-sm font-medium text-gray-200">Performance Report (PDF)</span>
        </button>
        
        <button onClick={() => handleExport('Internship Progress')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2">
          <FileText size={24} className="text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Internship Progress</span>
        </button>
        
        <button onClick={() => handleExport('Monthly Report')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2">
          <FileSpreadsheet size={24} className="text-emerald-400" />
          <span className="text-sm font-medium text-gray-200">Monthly Report</span>
        </button>
        
        <button onClick={() => handleExport('Project Contribution')} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2">
          <FileSpreadsheet size={24} className="text-purple-400" />
          <span className="text-sm font-medium text-gray-200">Project Contribution</span>
        </button>
      </div>
    </div>
  );
}
