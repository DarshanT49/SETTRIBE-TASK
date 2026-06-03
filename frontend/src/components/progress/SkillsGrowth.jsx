import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

export function SkillsGrowth({ skillsData }) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center gap-2">
        <Target size={16} /> Skills & Competencies Radar
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-full lg:w-1/2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Proficiency" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full lg:w-1/2 space-y-4">
          <h4 className="text-white font-medium mb-3">Skill Breakdown</h4>
          {skillsData.map((skill, index) => (
            <div key={index}>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm text-gray-300">{skill.subject}</span>
                <span className="text-xs font-bold text-gray-400">{skill.A}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    skill.A >= 80 ? 'bg-emerald-500' :
                    skill.A >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} 
                  style={{ width: `${skill.A}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
