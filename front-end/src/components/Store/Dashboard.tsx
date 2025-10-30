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


// 화면 구성용 상수
const CARD_ORDER: Array<KpiCardDTO['key']> = [
  'sales_today',
  'orders_today',
  'visitors_today',
  'top_menu',
];

// KPI key마다 UI 매핑
const cardConfig: Record<
  string,
  { title: string; icon: React.ComponentType<{ className?: string }>; color: 'red' | 'orange' | 'green' | 'purple' }
> = {
  sales_today: { title: '오늘 매출', icon: DollarSign, color: 'red' },
  orders_today: { title: '오늘 주문수', icon: ShoppingCart, color: 'orange' },
  visitors_today: { title: '오늘 방문자', icon: Users, color: 'green' },
  top_menu: { title: 'TOP 메뉴', icon: Package, color: 'purple' },
};

// 예: src/components/StoreDashboard.tsx 상단 근처
type HourlyPoint = {
  time: string;
  sales: number;
  orders: number;
  visitOrders: number;     // 백엔드 필드명과 맞춰 매핑해도 되고
  takeoutOrders: number;   // 그냥 아래에서 키 바꿔도 됨
  deliveryOrders: number;
};
type HourlyStatsResponse = { date: string; storeId?: number; items: HourlyPoint[] };


// 1) TOP 메뉴 타입과 응답 타입
export type TopMenuItem = {
  menuId: number;       // 백엔드 DTO에 존재
  name: string;
  quantity: number | string; // 혹시 문자열로 올 경우 대비
  sales: number;    // ↑ 동일
  image?: string;
};
export type TopMenusResponseDTO = {
  date: string;            // LocalDateTime → 문자열로 옴
  periodStart: string;
  periodEnd: string;
  storeId?: number | null;
  limit: number;
  items: TopMenuItem[];
};

// 2) 통화 포맷 유틸(만원 표기)
const fmtKRW10k = (v: number) =>
  `₩${(v / 10_000).toFixed(0)}만`;

// 컴포넌트 시작
export function StoreDashboard() {

  const [kpis, setKpis] = useState<KpiCardDTO[] | null>(null);

  // 컴포넌트 시작 내부
  const [topMenus, setTopMenus] = useState<TopMenuItem[] | null>(null);

  //
  const [dailyHourlyData, setDailyHourlyData] = useState<HourlyPoint[]>([]);
  
  // 안전한 숫자 변환 (콤마, 단위 문자 제거까지)
  const toNumber = (v: unknown) => {
    if (v == null) return 0;
    const s = String(v).replace(/[^\d.-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // ① KPI + ② TOP5 메뉴를 동시에
        const [kpiRes, topRes, hourlyRes] = await Promise.all([
          api.get<KpiCardsResponse>('/dashboard/kpis/today'),
          api.get<TopMenusResponseDTO>('/dashboard/menus/top5'),
          api.get<HourlyStatsResponse>('/dashboard/hourly/today'),
        ]);

        if (!alive) return;

        const orderIndex = new Map(CARD_ORDER.map((k, i) => [k, i]));
        const sorted = [...kpiRes.data.cards].sort(
          (a, b) => (orderIndex.get(a.key) ?? 99) - (orderIndex.get(b.key) ?? 99)
        );

        setKpis(sorted);
        // TOP 메뉴 셋
        // 서버에서 rank를 안 주면 여기서 재계산 가능:
        const items = (topRes.data.items ?? [])
          .map(m => ({
            ...m,
            _q: toNumber(m.quantity),
            _sales: toNumber(m.sales),
          }))
          .sort((a, b) => b._q - a._q)        // 판매개수 기준 내림차순
          .map((m, i) => ({
            ...m,
          }));
        setTopMenus(items);
        // 시간대별 데이터 차트
        setDailyHourlyData(hourlyRes.data.items.map(it => ({
          time: it.time,
          sales: it.sales,
          orders: it.orders,
          visitOrders: it.visitOrders,
          takeoutOrders: it.takeoutOrders,
          deliveryOrders: it.deliveryOrders,
        })));
      } catch (e) {
        // 실패 시 폴백
        // KPI
        setKpis([
          { key: 'sales_today', value: '₩542만', change: '어제 대비 +8.2%', changeType: 'increase' },
          { key: 'orders_today', value: '138건', change: '어제 대비 +12건', changeType: 'increase' },
          { key: 'visitors_today', value: '156명', change: '어제 대비 +15명', changeType: 'increase' },
          { key: 'top_menu', value: '치킨버거', change: '28개 판매', changeType: 'increase' },
        ]);
        // TOP 메뉴
        setTopMenus([
          { name: '치킨버거',  quantity: 28, sales: 420000, image: '🍔', menuId:101},
          { name: '불고기버거', quantity: 24, sales: 360000, image: '🍔', menuId:102},
          { name: '감자튀김(L)', quantity: 35, sales: 175000, image: '🍟', menuId:103},
          { name: '콜라(L)',   quantity: 42, sales: 126000, image: '🥤', menuId:104},
          { name: '치즈스틱',   quantity: 18, sales: 108000, image: '🧀', menuId:105},
        ]);
        // 폴백 시간대별
      setDailyHourlyData([
        { time: '09:00', sales: 125000, orders: 8,  visitOrders: 12, takeoutOrders: 7, deliveryOrders: 9 },
        { time: '10:00', sales: 180000, orders: 12, visitOrders: 18, takeoutOrders: 8, deliveryOrders: 9 },
        { time: '11:00', sales: 320000, orders: 18, visitOrders: 25, takeoutOrders: 5, deliveryOrders: 9 },
        { time: '12:00', sales: 580000, orders: 35, visitOrders: 45, takeoutOrders: 5, deliveryOrders: 9 },
        { time: '13:00', sales: 520000, orders: 28, visitOrders: 38, takeoutOrders: 4, deliveryOrders: 9 },
        { time: '14:00', sales: 380000, orders: 22, visitOrders: 30, takeoutOrders: 3, deliveryOrders: 9 },
        { time: '15:00', sales: 280000, orders: 16, visitOrders: 22, takeoutOrders: 4, deliveryOrders: 9 },
        { time: '16:00', sales: 350000, orders: 20, visitOrders: 28, takeoutOrders: 7, deliveryOrders: 9 },
        { time: '17:00', sales: 480000, orders: 28, visitOrders: 35, takeoutOrders: 8, deliveryOrders: 9 },
        { time: '18:00', sales: 620000, orders: 38, visitOrders: 48, takeoutOrders: 2, deliveryOrders: 9 },
        { time: '19:00', sales: 680000, orders: 42, visitOrders: 52, takeoutOrders: 5, deliveryOrders: 9 },
        { time: '20:00', sales: 590000, orders: 35, visitOrders: 42, takeoutOrders: 7, deliveryOrders: 9 },
      ]);
      } 
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* ====== KPI 카드 영역. 로딩 중이면 스켈레톤, 아니면 실제 카드 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(kpis ?? []).map((c) => {
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
            {(topMenus ?? []).map((menu) => (
              <div key={menu.menuId} className="flex flex-col items-center p-4 bg-light-gray rounded-lg">
                <div className="text-2xl mb-2">
                  {menu.image ?? '🍽️'}
                </div>
                <h4 className="font-medium text-gray-900 text-center text-sm mb-1">
                  {menu.name}
                </h4>
                <p className="text-xs text-dark-gray">{menu.quantity}개</p>
                <p className="text-sm font-medium text-gray-900">{fmtKRW10k(menu.sales)}</p>
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
            <TabsTrigger value="orderTypes">주문유형</TabsTrigger>
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
          <TabsContent value="orderTypes" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyHourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6C757D" />
                <YAxis stroke="#6C757D" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const label =
                      name === 'visitOrders'   ? '방문주문' :
                      name === 'takeoutOrders' ? '포장주문' :
                      name === 'deliveryOrders'? '배달주문' : name;
                    return [`${value}건`, label];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="visitOrders"    name="방문주문"  stroke="#06D6A0" strokeWidth={3} dot={{ fill: '#06D6A0', strokeWidth: 2, r: 3 }} />
                <Line type="monotone" dataKey="takeoutOrders"  name="포장주문"  stroke="#F77F00" strokeWidth={3} dot={{ fill: '#F77F00', strokeWidth: 2, r: 3 }} />
                <Line type="monotone" dataKey="deliveryOrders" name="배달주문"  stroke="#4895EF" strokeWidth={3} dot={{ fill: '#4895EF', strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}