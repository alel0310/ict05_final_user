import React from 'react';
import { Card } from '../ui/card';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: 'red' | 'orange' | 'green' | 'purple';
  className?: string;
  /** 전월/전일 대비 증감율(%) – 선택 */
  trend?: number; // ✅ 추가
}

const colorClasses = {
  red: 'bg-kpi-red',
  orange: 'bg-kpi-orange',
  green: 'bg-kpi-green',
  purple: 'bg-kpi-purple'
};

export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color,
  className = '',
  trend, // ✅ 추가
}: KPICardProps) {
  return (
    <Card className={`${colorClasses[color]} text-white p-6 rounded-xl shadow-lg border-0 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/80 text-sm mb-2">{title}</p>
          <p className="text-2xl font-bold mb-1">{value}</p>

          {change && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm ${
                  changeType === 'increase'
                    ? 'text-white'
                    : changeType === 'decrease'
                    ? 'text-white/70'
                    : 'text-white/80'
                }`}
              >
                {changeType === 'increase' && '↗'}
                {changeType === 'decrease' && '↘'}
                {change}
              </span>
            </div>
          )}

          {/* ✅ trend를 넘기면 추가로 표시 (없으면 렌더 안됨) */}
          {typeof trend === 'number' && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-sm ${trend > 0 ? 'text-white' : trend < 0 ? 'text-white/70' : 'text-white/80'}`}>
                {trend > 0 ? '↗' : trend < 0 ? '↘' : '•'}
                {trend > 0 ? `+${trend}` : trend}% 
              </span>
            </div>
          )}
        </div>

        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}
