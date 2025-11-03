import React from 'react';
import { Card } from '../ui/card';

// 색상 클래스 매핑
const colorClasses = {
  red: 'bg-kpi-red',
  orange: 'bg-kpi-orange',
  green: 'bg-kpi-green',
  purple: 'bg-kpi-purple',
};

export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral', // 'increase' | 'decrease' | 'neutral'
  icon: Icon,             // 아이콘 컴포넌트
  color,
  className = '',
}) {
  return (
    <Card className={`${colorClasses[color]} text-white card-pad-24 rounded-xl shadow-lg border-0 ${className}`}>
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <p className="kpi-title">{title}</p>
      <p className="kpi-value">{value}</p>
      {change && (
        <div className="kpi-sub">
          <span>
            {changeType === 'increase' && '↗ '}
            {changeType === 'decrease' && '↘ '}
            {change}
          </span>
        </div>
      )}
    </div>
    <div className="kpi-icon-box">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
</Card>

  );
}
