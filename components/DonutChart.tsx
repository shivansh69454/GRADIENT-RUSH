'use client';

import React from 'react';

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const radius = 80;
          const circumference = 2 * Math.PI * radius;
          const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
          
          const rotation = currentAngle;
          currentAngle += angle;

          return (
            <circle
              key={index}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="28"
              strokeDasharray={strokeDasharray}
              transform={`rotate(${rotation} 100 100)`}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      
      {/* Center legend */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          {data.map((item, index) => {
            const angle = data.slice(0, index).reduce((sum, d) => {
              return sum + ((d.value / total) * 360);
            }, -90);
            
            const percentage = Math.round((item.value / total) * 100);
            const radius = 65;
            const x = 100 + radius * Math.cos((angle + ((item.value / total) * 360) / 2) * Math.PI / 180);
            const y = 100 + radius * Math.sin((angle + ((item.value / total) * 360) / 2) * Math.PI / 180);

            return (
              <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                className="text-xl font-bold fill-white"
                style={{ fontSize: '20px' }}
              >
                {percentage}%
              </text>
            );
          })}
        </div>
      </div>
    </div>
  );
};
