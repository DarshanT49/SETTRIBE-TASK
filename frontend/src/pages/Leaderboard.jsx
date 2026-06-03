import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Import subcomponents
import { TopPerformersPodium } from '../components/leaderboard/TopPerformersPodium';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { MyRankInsights } from '../components/leaderboard/MyRankInsights';
import { RecognitionWall } from '../components/leaderboard/RecognitionWall';

export default function Leaderboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly', 'quarterly', 'overall'

  // MOCK DATA GENERATORS
  // In a real application, you'd fetch this data from an API based on activeTab
  
  const generateMockInterns = (count) => {
    const names = [
      'Sarah Jenkins', 'Alex Chen', 'Priya Patel', 'David Kim', 'Emma Watson',
      'Michael Scott', 'Jim Halpert', 'Pam Beesly', 'Dwight Schrute', 'Stanley Hudson',
      'Ryan Howard', 'Kelly Kapoor', 'Toby Flenderson', 'Creed Bratton', 'Meredith Palmer'
    ];
    
    const depts = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
    
    return Array.from({ length: count }).map((_, i) => {
      // Calculate a randomized score between 60 and 99
      const baseScore = 99 - (i * (Math.random() * 2 + 0.5));
      
      return {
        id: `INT-${1000 + i}`,
        name: names[i % names.length],
        department: depts[i % depts.length],
        rank: i + 1,
        score: Math.max(60, baseScore).toFixed(1),
        trend: Math.floor(Math.random() * 5) - 2, // -2 to 2
        metrics: {
          taskRate: (Math.random() * 20 + 80).toFixed(1),
          quality: (Math.random() * 20 + 80).toFixed(1),
          attendance: (Math.random() * 10 + 90).toFixed(1),
        }
      };
    });
  };

  const internsData = generateMockInterns(15);
  const topThree = internsData.slice(0, 3);
  
  // Find current user's mock stats
  // If not in the list (e.g. they are an admin viewing), we just show a generic insight or pick the first intern
  const myRankData = {
    currentRank: 7,
    previousRank: 9,
    departmentRank: 2,
    projectRank: 1,
    trend: 2,
    pointsToNext: 2.4,
    tip: "Maintain your 95% quality score and complete 2 more tasks this week."
  };

  const hallOfFame = {
    internOfMonth: internsData[0],
    mostImproved: internsData[6],
    fastestDelivery: internsData[2],
    risingStar: internsData[4]
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Intern Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Ranking based on multi-factorial performance metrics.</p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'monthly' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setActiveTab('quarterly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'quarterly' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Quarterly
          </button>
          <button 
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overall' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Overall
          </button>
        </div>
      </div>

      {/* Top Section: Podium & Insights & Wall */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Podium takes up most space on large screens */}
        <div className="xl:col-span-6 card p-6 min-h-[400px]">
          <h3 className="text-sm font-medium text-gray-400 mb-2 text-center uppercase tracking-wider">Top 3 Performers</h3>
          <TopPerformersPodium topThree={topThree} />
        </div>

        {/* Insights & Wall share the remaining space */}
        <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentUser?.role === 'intern' ? (
            <MyRankInsights insights={myRankData} />
          ) : (
            <div className="card p-6 flex flex-col items-center justify-center text-center">
              <Trophy size={48} className="text-gray-700 mb-4" />
              <p className="text-gray-400">Personalized insights are only available to intern accounts.</p>
            </div>
          )}
          <RecognitionWall wallOfFame={hallOfFame} />
        </div>

      </div>

      {/* Leaderboard Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <h3 className="text-lg font-bold text-white">Full Rankings</h3>
        </div>
        <LeaderboardTable interns={internsData} />
      </div>

    </div>
  );
}
