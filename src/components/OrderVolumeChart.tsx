
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { day: 'Mon', orders: 35 },
  { day: 'Tue', orders: 42 },
  { day: 'Wed', orders: 28 },
  { day: 'Thu', orders: 45 },
  { day: 'Fri', orders: 38 },
  { day: 'Sat', orders: 25 },
  { day: 'Sun', orders: 32 },
];

export const OrderVolumeChart: React.FC = () => {
  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Order Volume</h3>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          <span>Last 7 Days</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Bar 
              dataKey="orders" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
