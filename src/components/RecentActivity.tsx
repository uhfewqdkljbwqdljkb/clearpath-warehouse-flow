
import React from 'react';

const activities = [
  { action: 'Inventory updated for SKU-12345', time: '2 minutes ago' },
  { action: 'Order ORD-001 shipped to Los Angeles, CA', time: '15 minutes ago' },
  { action: 'Low stock alert for Product ABC', time: '1 hour ago' },
  { action: 'New order received from Client XYZ', time: '2 hours ago' },
  { action: 'Warehouse Zone A maintenance completed', time: '3 hours ago' },
  { action: 'Order ORD-002 picked and ready for shipping', time: '4 hours ago' },
];

export const RecentActivity: React.FC = () => {
  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-accent hover:text-accent/80 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="activity-dot mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{activity.action}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
