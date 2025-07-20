import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const floorData = {
  'Floor 1': {
    sections: [
      { id: 'A1', category: 'Electronics', available: '20/100', color: 'bg-red-100 border-red-300' },
      { id: 'A2', category: 'Electronics', available: '15/100', color: 'bg-red-100 border-red-300' },
      { id: 'A3', category: 'Electronics', available: '25/100', color: 'bg-red-100 border-red-300' },
      { id: 'C1', category: 'Home & Kitchen', available: '10/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'C2', category: 'Home & Kitchen', available: '5/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'C3', category: 'Home & Kitchen', available: '8/100', color: 'bg-pink-100 border-pink-300' },
    ]
  },
  'Floor 2': {
    sections: [
      { id: 'B1', category: 'Apparel', available: '30/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'B2', category: 'Apparel', available: '20/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'B3', category: 'Apparel', available: '35/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'D1', category: 'Automotive Parts', available: '45/100', color: 'bg-red-100 border-red-300' },
      { id: 'D2', category: 'Automotive Parts', available: '55/100', color: 'bg-red-100 border-red-300' },
      { id: 'D3', category: 'Automotive Parts', available: '40/100', color: 'bg-red-100 border-red-300' },
    ]
  },
  'Floor 3': {
    sections: [
      { id: 'E1', category: 'Beauty & Health', available: '25/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'E2', category: 'Beauty & Health', available: '30/100', color: 'bg-pink-100 border-pink-300' },
      { id: 'F1', category: 'Sports Equipment', available: '20/100', color: 'bg-orange-100 border-orange-300' },
      { id: 'F2', category: 'Sports Equipment', available: '35/100', color: 'bg-orange-100 border-orange-300' },
      { id: 'F3', category: 'Sports Equipment', available: '45/100', color: 'bg-orange-100 border-orange-300' },
    ]
  }
};

const floorTabs = ['Floor 1', 'Floor 2', 'Floor 3'];

export const WarehouseMapView: React.FC = () => {
  const [activeFloor, setActiveFloor] = useState('Floor 1');

  const currentFloorData = floorData[activeFloor as keyof typeof floorData];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Map</CardTitle>
        <div className="flex space-x-1">
          {floorTabs.map((floor) => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                activeFloor === floor 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {floor}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium mb-2">Electronics</div>
            <div className="grid grid-cols-3 gap-2">
              {currentFloorData.sections
                .filter(s => s.category === 'Electronics')
                .map((section) => (
                  <div 
                    key={section.id}
                    className={`p-2 rounded border-2 ${section.color} text-center cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="font-medium text-xs">{section.id}</div>
                    <div className="text-xs text-muted-foreground">Available Space: {section.available}</div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Home & Kitchen</div>
            <div className="grid grid-cols-3 gap-2">
              {currentFloorData.sections
                .filter(s => s.category === 'Home & Kitchen')
                .map((section) => (
                  <div 
                    key={section.id}
                    className={`p-2 rounded border-2 ${section.color} text-center cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="font-medium text-xs">{section.id}</div>
                    <div className="text-xs text-muted-foreground">Available Space: {section.available}</div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">
              {activeFloor === 'Floor 1' ? 'Automotive Parts' : 
               activeFloor === 'Floor 2' ? 'Apparel' : 'Sports Equipment'}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {currentFloorData.sections
                .filter(s => s.category !== 'Electronics' && s.category !== 'Home & Kitchen')
                .map((section) => (
                  <div 
                    key={section.id}
                    className={`p-2 rounded border-2 ${section.color} text-center cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="font-medium text-xs">{section.id}</div>
                    <div className="text-xs text-muted-foreground">Available Space: {section.available}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-800 rounded"></div>
            <span>Full</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};