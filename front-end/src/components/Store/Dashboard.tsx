import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { KPICard } from '../Common/KPICard';
import { KpiCardsResponse, KpiCardDTO } from '../Common/kpi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../lib/authApi';


// 표시 순서
const CARD_ORDER: Array<KpiCardDTO['key']> = [
  'sales_today',
  'orders_today',
  'visitors_today',
  'top_menu',
];

// key별 UI 매핑
const cardConfig: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }>; color: 'red' | 'orange' | 'green' | 'purple' }
> = {
  sales_today: { title: '오늘 매출', icon: DollarSign, color: 'red' },
  orders_today: { title: '오늘 주문수', icon: ShoppingCart, color: 'orange' },
  visitors_today: { title: '오늘 방문자', icon: Users, color: 'green' },
  top_menu: { title: 'TOP 메뉴', icon: Package, color: 'purple' },
};

// 샘플 데이터
const dailyHourlyData = [
  { time: '09:00', sales: 125000, orders: 8, visitors: 12 },
  { time: '10:00', sales: 180000, orders: 12, visitors: 18 },
  { time: '11:00', sales: 320000, orders: 18, visitors: 25 },
  { time: '12:00', sales: 580000, orders: 35, visitors: 45 },
  { time: '13:00', sales: 520000, orders: 28, visitors: 38 },
  { time: '14:00', sales: 380000, orders: 22, visitors: 30 },
  { time: '15:00', sales: 280000, orders: 16, visitors: 22 },
  { time: '16:00', sales: 350000, orders: 20, visitors: 28 },
  { time: '17:00', sales: 480000, orders: 28, visitors: 35 },
  { time: '18:00', sales: 620000, orders: 38, visitors: 48 },
  { time: '19:00', sales: 680000, orders: 42, visitors: 52 },
  { time: '20:00', sales: 590000, orders: 35, visitors: 42 },
];

const topMenus = [
  { rank: 1, name: '치킨버거', quantity: 28, sales: 420000, image: '🍔' },
  { rank: 2, name: '불고기버거', quantity: 24, sales: 360000, image: '🍔' },
  { rank: 3, name: '감자튀김(L)', quantity: 35, sales: 175000, image: '🍟' },
  { rank: 4, name: '콜라(L)', quantity: 42, sales: 126000, image: '🥤' },
  { rank: 5, name: '치즈스틱', quantity: 18, sales: 108000, image: '🧀' },
];

const weeklyData = [
  { date: '2024-01-22 (월)', sales: 5420000, orders: 138, visitors: 156 },
  { date: '2024-01-23 (화)', sales: 4980000, orders: 125, visitors: 142 },
  { date: '2024-01-24 (수)', sales: 5680000, orders: 145, visitors: 168 },
  { date: '2024-01-25 (목)', sales: 5120000, orders: 132, visitors: 152 },
  { date: '2024-01-26 (금)', sales: 6250000, orders: 165, visitors: 185 },
  { date: '2024-01-27 (토)', sales: 7800000, orders: 195, visitors: 220 },
  { date: '2024-01-28 (일)', sales: 7450000, orders: 188, visitors: 210 },
];

const monthlyData = [
  { month: '2024년 1월', sales: 156800000, orders: 3985, visitors: 4520, days: 31 },
  { month: '2023년 12월', sales: 148200000, orders: 3756, visitors: 4280, days: 31 },
  { month: '2023년 11월', sales: 142500000, orders: 3612, visitors: 4150, days: 30 },
  { month: '2023년 10월', sales: 138900000, orders: 3521, visitors: 4020, days: 31 },
  { month: '2023년 9월', sales: 145600000, orders: 3689, visitors: 4235, days: 30 },
  { month: '2023년 8월', sales: 152300000, orders: 3865, visitors: 4410, days: 31 },
];

export function StoreDashboard() {

  const [kpis, setKpis] = useState<KpiCardDTO[] | null>(null);
  const [loadingKpi, setLoadingKpi] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get<KpiCardsResponse>('/dashboard/kpis/today');

        if (!alive) return;

        const orderIndex = new Map(CARD_ORDER.map((k, i) => [k, i]));
        const sorted = [...data.cards].sort(
          (a, b) => (orderIndex.get(a.key) ?? 99) - (orderIndex.get(b.key) ?? 99)
        );

        setKpis(sorted);
      } catch (e) {
        // 폴백
        setKpis([
          { key: 'sales_today', value: '₩542만', change: '어제 대비 +8.2%', changeType: 'increase' },
          { key: 'orders_today', value: '138건', change: '어제 대비 +12건', changeType: 'increase' },
          { key: 'visitors_today', value: '156명', change: '어제 대비 +15명', changeType: 'increase' },
          { key: 'top_menu', value: '치킨버거', change: '28개 판매', changeType: 'increase' },
        ]);
      } finally {
        if (alive) setLoadingKpi(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* ====== KPI Cards: API 응답으로 렌더 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingKpi && (
          <>
            <Card className="h-28 animate-pulse bg-gray-100 rounded-xl" />
            <Card className="h-28 animate-pulse bg-gray-100 rounded-xl" />
            <Card className="h-28 animate-pulse bg-gray-100 rounded-xl" />
            <Card className="h-28 animate-pulse bg-gray-100 rounded-xl" />
          </>
        )}
        {!loadingKpi &&
          (kpis ?? []).map((c) => {
            const cfg = cardConfig[c.key] ?? {
              title: c.key,
              icon: Package,
              color: "purple" as const,
            };
            return (
              <KPICard
                key={c.key}
                id={c.key}
                title={cfg.title}
                value={c.value}
                change={c.change}
                changeType={c.changeType}
                icon={cfg.icon}
                color={cfg.color}
              />
            );
          })}
      </div>

      {/* TOP 5 메뉴 카드 */}
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">인기 메뉴 TOP 5</h3>
          <Package className="w-5 h-5 text-kpi-green" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topMenus.map((menu) => (
            <div key={menu.rank} className="flex flex-col items-center p-4 bg-light-gray rounded-lg">
              <div className="w-8 h-8 bg-kpi-green text-white rounded-full flex items-center justify-center text-sm font-bold mb-2">
                {menu.rank}
              </div>
              <div className="text-2xl mb-2">{menu.image}</div>
              <h4 className="font-medium text-gray-900 text-center text-sm mb-1">{menu.name}</h4>
              <p className="text-xs text-dark-gray">{menu.quantity}개</p>
              <p className="text-sm font-medium text-gray-900">₩{(menu.sales / 10000).toFixed(0)}만</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 시간대별 데이터 차트 */}
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">오늘 시간대별 현황</h3>
          <TrendingUp className="w-5 h-5 text-kpi-red" />
        </div>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">매출</TabsTrigger>
            <TabsTrigger value="orders">주문수</TabsTrigger>
            <TabsTrigger value="visitors">방문자</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6C757D" />
                <YAxis stroke="#6C757D" />
                <Tooltip 
                  formatter={(value: any) => [`₩${(value / 10000).toFixed(0)}만`, '매출']}
                />
                <Bar dataKey="sales" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6C757D" />
                <YAxis stroke="#6C757D" />
                <Tooltip 
                  formatter={(value: any) => [`${value}건`, '주문수']}
                />
                <Line type="monotone" dataKey="orders" stroke="#F77F00" strokeWidth={3} dot={{ fill: '#F77F00', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          <TabsContent value="visitors" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6C757D" />
                <YAxis stroke="#6C757D" />
                <Tooltip 
                  formatter={(value: any) => [`${value}명`, '방문자']}
                />
                <Line type="monotone" dataKey="visitors" stroke="#06D6A0" strokeWidth={3} dot={{ fill: '#06D6A0', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 주/월 누적 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주 누적 데이터 */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">주 누적 현황</h3>
            <Calendar className="w-5 h-5 text-kpi-purple" />
          </div>
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-light-gray rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{day.date}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-xs text-dark-gray">매출</p>
                    <p className="font-medium text-gray-900">₩{(day.sales / 10000).toFixed(0)}만</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-gray">주문</p>
                    <p className="font-medium text-gray-900">{day.orders}건</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-gray">방문</p>
                    <p className="font-medium text-gray-900">{day.visitors}명</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">주간 합계</h4>
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <p className="font-semibold text-kpi-red">₩{(weeklyData.reduce((sum, day) => sum + day.sales, 0) / 10000).toFixed(0)}만</p>
                </div>
                <div>
                  <p className="font-semibold text-kpi-orange">{weeklyData.reduce((sum, day) => sum + day.orders, 0)}건</p>
                </div>
                <div>
                  <p className="font-semibold text-kpi-green">{weeklyData.reduce((sum, day) => sum + day.visitors, 0)}명</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 월 누적 데이터 */}
        <Card className="p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">월 누적 현황</h3>
            <CalendarDays className="w-5 h-5 text-kpi-green" />
          </div>
          <div className="space-y-3">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-light-gray rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{month.month}</h4>
                  <p className="text-xs text-dark-gray">{month.days}일</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-xs text-dark-gray">매출</p>
                    <p className="font-medium text-gray-900">₩{(month.sales / 100000000).toFixed(1)}억</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-gray">주문</p>
                    <p className="font-medium text-gray-900">{(month.orders / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-gray">방문</p>
                    <p className="font-medium text-gray-900">{(month.visitors / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">6개월 평균</h4>
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <p className="font-semibold text-kpi-red">₩{(monthlyData.reduce((sum, month) => sum + month.sales, 0) / monthlyData.length / 100000000).toFixed(1)}억</p>
                </div>
                <div>
                  <p className="font-semibold text-kpi-orange">{(monthlyData.reduce((sum, month) => sum + month.orders, 0) / monthlyData.length / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="font-semibold text-kpi-green">{(monthlyData.reduce((sum, month) => sum + month.visitors, 0) / monthlyData.length / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}