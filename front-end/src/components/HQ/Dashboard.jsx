import React from 'react';
import { Card } from '../ui/card';
import { KPICard } from '../Common/KPICard';
import { StatusBadge } from '../Common/StatusBadge';
import {
  DollarSign,
  ShoppingCart,
  Building2,
  Plus,
  TrendingUp,
  Package
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// 샘플 데이터
const salesData = [
  { month: '1월', revenue: 450000000, orders: 12500 },
  { month: '2월', revenue: 520000000, orders: 14200 },
  { month: '3월', revenue: 480000000, orders: 13100 },
  { month: '4월', revenue: 610000000, orders: 16800 },
  { month: '5월', revenue: 680000000, orders: 18900 },
  { month: '6월', revenue: 720000000, orders: 19500 },
];

const regionData = [
  { name: '서울', value: 35, color: '#FF6B6B' },
  { name: '경기', value: 28, color: '#F77F00' },
  { name: '부산', value: 15, color: '#06D6A0' },
  { name: '기타', value: 22, color: '#9D4EDD' },
];

const recentStores = [
  { id: 1, name: '강남점', owner: '김철수', status: 'active',     openDate: '2024-01-15' },
  { id: 2, name: '홍대점', owner: '이영희', status: 'preparing',  openDate: '2024-02-01' },
  { id: 3, name: '신촌점', owner: '박민수', status: 'active',     openDate: '2024-01-28' },
  { id: 4, name: '마포점', owner: '최지은', status: 'warning',    openDate: '2024-01-10' },
];

const topMenus = [
  { rank: 1, name: '치킨버거',   sales: 2840, change: '+12%' },
  { rank: 2, name: '불고기버거', sales: 2650, change: '+8%'  },
  { rank: 3, name: '새우버거',   sales: 2180, change: '+15%' },
  { rank: 4, name: '치즈버거',   sales: 1920, change: '+5%'  },
  { rank: 5, name: '베이컨버거', sales: 1760, change: '+3%'  },
];

export function HQDashboard() {
  // 순수 JS 안전 포맷터
  const fmtMoneyToHundredMillion = (v) =>
    `₩${(Number(v || 0) / 100000000).toFixed(1)}억`;
  const fmtCount = (v) => `${Number(v || 0).toLocaleString()}건`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="총 매출"
          value="₩72억"
          change="전월 대비 +15.8%"
          changeType="increase"
          icon={DollarSign}
          color="red"
        />
        <KPICard
          title="총 주문수"
          value="19,500건"
          change="전월 대비 +3.2%"
          changeType="increase"
          icon={ShoppingCart}
          color="orange"
        />
        <KPICard
          title="가맹점 수"
          value="127개"
          change="신규 3개점"
          changeType="increase"
          icon={Building2}
          color="green"
        />
        <KPICard
          title="신규 매장"
          value="3개"
          change="이번 달"
          changeType="neutral"
          icon={Plus}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">매출 추이</h3>
            <TrendingUp className="w-5 h-5 text-kpi-green" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6C757D" />
              <YAxis stroke="#6C757D" />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? fmtMoneyToHundredMillion(value) : fmtCount(value),
                  name === 'revenue' ? '매출' : '주문수',
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B6B"
                strokeWidth={3}
                dot={{ fill: '#FF6B6B', strokeWidth: 2, r: 6 }}
                name="매출"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Region Distribution */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">지역별 매장 분포</h3>
            <Building2 className="w-5 h-5 text-kpi-purple" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {regionData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}개`, '매장수']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Row - Recent Stores & Top Menus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stores */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">최근 등록 가맹점</h3>
            <Building2 className="w-5 h-5 text-kpi-orange" />
          </div>
          <div className="space-y-4">
            {recentStores.map((store) => (
              <div
                key={store.id}
                className="flex items-center justify-between p-4 bg-light-gray rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium text-gray-900">{store.name}</h4>
                    <StatusBadge
                      status={store.status}
                      text={
                        store.status === 'active'
                          ? '운영중'
                          : store.status === 'preparing'
                          ? '개점 준비'
                          : store.status === 'warning'
                          ? '점검 필요'
                          : '폐점'
                      }
                    />
                  </div>
                  <p className="text-sm text-dark-gray">점주: {store.owner}</p>
                  <p className="text-xs text-dark-gray">개점일: {store.openDate}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Menus */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">인기 메뉴 TOP 5</h3>
            <Package className="w-5 h-5 text-kpi-green" />
          </div>
          <div className="space-y-4">
            {topMenus.map((menu) => (
              <div
                key={menu.rank}
                className="flex items-center justify-between p-4 bg-light-gray rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-kpi-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {menu.rank}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{menu.name}</h4>
                    <p className="text-sm text-dark-gray">
                      {Number(menu.sales || 0).toLocaleString()}개 판매
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-kpi-green font-medium">{menu.change}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
