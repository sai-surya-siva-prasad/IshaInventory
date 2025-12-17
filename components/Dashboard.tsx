import React from 'react';
import { Item, Assignment, Volunteer } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PackageCheck, PackageSearch, Award, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  items: Item[];
  volunteers: Volunteer[];
  assignments: Assignment[];
}

export const Dashboard: React.FC<DashboardProps> = ({ items, volunteers, assignments }) => {
  const totalUnitsInStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const unitsAssigned = assignments.reduce((sum, a) => sum + a.quantity_assigned, 0);
  const unitsAvailable = totalUnitsInStock - unitsAssigned;

  const holdersMap = new Map<string, number>();
  assignments.forEach(a => {
    holdersMap.set(a.volunteerId, (holdersMap.get(a.volunteerId) || 0) + a.quantity_assigned);
  });
  
  const topHolders = Array.from(holdersMap.entries())
    .map(([id, count]) => {
      const vol = volunteers.find(v => v.id === id);
      const fullName = vol ? `${vol.first_name} ${vol.last_name}`.trim() : 'Unknown';
      return { name: fullName, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const data = [
    { name: 'Available', value: unitsAvailable, color: '#34C759' },
    { name: 'Assigned', value: unitsAssigned, color: '#007AFF' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-iosDivider/10 shadow-sm flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
            <PackageCheck size={18} />
          </div>
          <div>
            <p className="text-3xl font-black text-black leading-none">{unitsAvailable}</p>
            <p className="text-[10px] font-bold text-iosGray uppercase tracking-widest mt-1.5">Units Available</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-iosDivider/10 shadow-sm flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-xl bg-iosBlue/10 text-iosBlue flex items-center justify-center">
            <PackageSearch size={18} />
          </div>
          <div>
            <p className="text-3xl font-black text-black leading-none">{unitsAssigned}</p>
            <p className="text-[10px] font-bold text-iosGray uppercase tracking-widest mt-1.5">Units In Field</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[28px] border border-iosDivider/10 shadow-sm">
        <h3 className="text-[12px] font-bold text-iosGray uppercase tracking-widest mb-4">Stock Distribution</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[13px] font-semibold text-black">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {topHolders.length > 0 && (
        <div className="bg-white p-6 rounded-[28px] border border-iosDivider/10 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-iosBlue" size={18} />
            <h3 className="text-[12px] font-bold text-iosGray uppercase tracking-widest">Top Resource Holders</h3>
          </div>
          <div className="space-y-4">
            {topHolders.map((holder, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-iosBg flex items-center justify-center text-[13px] font-bold text-iosGray">
                    {idx + 1}
                  </div>
                  <p className="text-[15px] font-semibold text-black">{holder.name}</p>
                </div>
                <span className="text-[15px] font-bold text-iosBlue">{holder.count} units</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};