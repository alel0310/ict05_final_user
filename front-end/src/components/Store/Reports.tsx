import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  Download, 
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

// 일별 매출 데이터 (임시)
const dailySalesData = [
  { date: '01/01', revenue: 850000, orders: 142, customers: 118, avgOrder: 5986 },
  { date: '01/02', revenue: 920000, orders: 156, customers: 128, avgOrder: 5897 },
  { date: '01/03', revenue: 780000, orders: 128, customers: 105, avgOrder: 6094 },
  { date: '01/04', revenue: 1100000, orders: 185, customers: 152, avgOrder: 5946 },
  { date: '01/05', revenue: 1250000, orders: 208, customers: 171, avgOrder: 6010 },
  { date: '01/06', revenue: 1380000, orders: 228, customers: 189, avgOrder: 6053 },
  { date: '01/07', revenue: 1150000, orders: 195, customers: 164, avgOrder: 5897 },
];

// 시간대별 매출 데이터
const hourlyData = [
  { hour: '10시', revenue: 45000, orders: 8 },
  { hour: '11시', revenue: 120000, orders: 22 },
  { hour: '12시', revenue: 280000, orders: 48 },
  { hour: '13시', revenue: 320000, orders: 54 },
  { hour: '14시', revenue: 180000, orders: 32 },
  { hour: '15시', revenue: 95000, orders: 18 },
  { hour: '16시', revenue: 85000, orders: 16 },
  { hour: '17시', revenue: 150000, orders: 28 },
  { hour: '18시', revenue: 250000, orders: 45 },
  { hour: '19시', revenue: 290000, orders: 52 },
  { hour: '20시', revenue: 210000, orders: 38 },
  { hour: '21시', revenue: 125000, orders: 24 },
];

// 메뉴별 판매 데이터
const menuSalesData = [
  { name: '시그니처 버거', sales: 450, revenue: 4050000, ratio: 35 },
  { name: '치킨 버거', sales: 320, revenue: 2880000, ratio: 25 },
  { name: '콜라', sales: 380, revenue: 760000, ratio: 8 },
  { name: '감자튀김', sales: 290, revenue: 1450000, ratio: 15 },
  { name: '치즈스틱', sales: 180, revenue: 1260000, ratio: 12 },
  { name: '기타', sales: 150, revenue: 750000, ratio: 5 },
];

// 고객 분석 데이터
const customerData = [
  { type: '신규 고객', count: 45, ratio: 25, color: '#FF6B6B' },
  { type: '재방문 고객', count: 98, ratio: 55, color: '#F77F00' },
  { type: 'VIP 고객', count: 28, ratio: 15, color: '#06D6A0' },
  { type: '휴면 고객', count: 9, ratio: 5, color: '#9D4EDD' },
];

// 목표 대비 실적 데이터
const targetData = [
  { metric: '매출', target: 30000000, actual: 28500000, achievement: 95 },
  { metric: '주문수', target: 5000, actual: 4750, achievement: 95 },
  { metric: '고객수', target: 4000, actual: 3800, achievement: 95 },
  { metric: '평균주문금액', target: 6000, actual: 6000, achievement: 100 },
];

// 경쟁점 비교 데이터
const competitorData = [
  { store: '우리 매장', revenue: 28500000, growth: 12.5, ranking: 3 },
  { store: '인근 A점', revenue: 32000000, growth: 8.3, ranking: 1 },
  { store: '인근 B점', revenue: 30000000, growth: 15.2, ranking: 2 },
  { store: '인근 C점', revenue: 25000000, growth: -2.1, ranking: 4 },
  { store: '인근 D점', revenue: 22000000, growth: 6.7, ranking: 5 },
];

export function StoreReports() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleExportReport = (reportType: string) => {
    toast.success(`${reportType} 리포트를 다운로드합니다.`);
  };

  const currentData = dailySalesData[dailySalesData.length - 1];
  const previousData = dailySalesData[dailySalesData.length - 2];
  const revenueGrowth = ((currentData.revenue - previousData.revenue) / previousData.revenue) * 100;

  const totalRevenue = dailySalesData.reduce((sum, day) => sum + day.revenue, 0);
  const totalOrders = dailySalesData.reduce((sum, day) => sum + day.orders, 0);
  const totalCustomers = dailySalesData.reduce((sum, day) => sum + day.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">매장 리포트</h1>
          <p className="text-sm text-gray-600 mt-1">우리 매장의 상세 분석 리포트를 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {selectedDate.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date: any) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => handleExportReport('매장')}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 성과 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="주간 매출"
          value={`₩${Math.round(totalRevenue / 10000)}만원`}
          icon={DollarSign}
          color="red"
          trend={revenueGrowth}
        />
        <KPICard
          title="총 주문수"
          value={`${totalOrders}건`}
          icon={ShoppingCart}
          color="orange"
          trend={+8.3}
        />
        <KPICard
          title="총 고객수"
          value={`${totalCustomers}명`}
          icon={Users}
          color="green"
          trend={+5.7}
        />
        <KPICard
          title="평균 주문금액"
          value={`₩${Math.round(avgOrderValue || 0).toLocaleString()}`}
          icon={Target}
          color="purple"
          trend={+2.1}
        />
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">매출 분석</TabsTrigger>
          <TabsTrigger value="menu">메뉴 분석</TabsTrigger>
          <TabsTrigger value="customer">고객 분석</TabsTrigger>
          <TabsTrigger value="performance">성과 분석</TabsTrigger>
          <TabsTrigger value="comparison">경쟁 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          {/* 일별 매출 추이 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                일별 매출 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any) => [`₩${(value || 0).toLocaleString()}`, '매출']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#FF6B6B" 
                    fill="#FF6B6B" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 시간대별 매출 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                시간대별 매출 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any, name) => [
                      name === 'revenue' ? `₩${(value || 0).toLocaleString()}` : `${value || 0}건`,
                      name === 'revenue' ? '매출' : '주문수'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#FF6B6B" name="매출" />
                  <Bar dataKey="orders" fill="#F77F00" name="주문수" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 매출 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>매출 요약 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">최고 매출일</h4>
                  <p className="text-lg font-bold text-kpi-green">01/06</p>
                  <p className="text-sm text-gray-600">₩1,380,000</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">평균 일매출</h4>
                  <p className="text-lg font-bold text-kpi-orange">₩{Math.round(totalRevenue / 7 / 10000)}만원</p>
                  <p className="text-sm text-gray-600">주간 평균</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">피크 시간</h4>
                  <p className="text-lg font-bold text-kpi-purple">13시</p>
                  <p className="text-sm text-gray-600">₩320,000</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">주문 전환율</h4>
                  <p className="text-lg font-bold text-kpi-red">83%</p>
                  <p className="text-sm text-gray-600">방문→주문</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          {/* 메뉴별 판매 순위 */}
          <Card>
            <CardHeader>
              <CardTitle>메뉴별 판매 순위</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {menuSalesData.map((menu, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{menu.name}</div>
                        <div className="text-xs text-gray-500">{menu.sales}개 판매</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₩{(menu.revenue || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{menu.ratio}% 비중</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 메뉴 성과 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>메뉴 성과 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    베스트 메뉴
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">시그니처 버거</div>
                    <div className="text-sm text-gray-600">450개 판매 (35%)</div>
                    <div className="text-sm text-kpi-green">+15% 증가</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    성장 메뉴
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">치즈스틱</div>
                    <div className="text-sm text-gray-600">180개 판매 (12%)</div>
                    <div className="text-sm text-kpi-green">+35% 증가</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    개선 필요
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">기타 메뉴</div>
                    <div className="text-sm text-gray-600">150개 판매 (5%)</div>
                    <div className="text-sm text-kpi-red">-8% 감소</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          {/* 고객 유형별 분석 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>고객 유형별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, ratio }) => `${name} ${ratio}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="ratio"
                    >
                      {customerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>고객 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerData.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: customer.color }}
                        ></div>
                        <span className="font-medium">{customer.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{customer.count}명</div>
                        <div className="text-xs text-gray-500">{customer.ratio}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 고객 만족도 */}
          <Card>
            <CardHeader>
              <CardTitle>고객 만족도 지표</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">평균 만족도</h4>
                  <p className="text-2xl font-bold text-kpi-green">4.6/5.0</p>
                  <p className="text-sm text-gray-600">전월 +0.2</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">재방문 의향</h4>
                  <p className="text-2xl font-bold text-kpi-orange">85%</p>
                  <p className="text-sm text-gray-600">매우 높음</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">추천 의향</h4>
                  <p className="text-2xl font-bold text-kpi-purple">78%</p>
                  <p className="text-sm text-gray-600">양호</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">리뷰 평점</h4>
                  <p className="text-2xl font-bold text-kpi-red">4.4/5.0</p>
                  <p className="text-sm text-gray-600">126개 리뷰</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* 목표 대비 실적 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                목표 대비 실적
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targetData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {item.metric === '매출' ? `₩${(item.actual || 0).toLocaleString()}` :
                           item.metric === '평균주문금액' ? `₩${(item.actual || 0).toLocaleString()}` :
                           `${(item.actual || 0).toLocaleString()}${item.metric === '주문수' ? '건' : '명'}`}
                          /
                          {item.metric === '매출' ? `₩${(item.target || 0).toLocaleString()}` :
                           item.metric === '평균주문금액' ? `₩${(item.target || 0).toLocaleString()}` :
                           `${(item.target || 0).toLocaleString()}${item.metric === '주문수' ? '건' : '명'}`}
                        </span>
                        <Badge className={
                          item.achievement >= 100 ? 'bg-green-100 text-green-700' :
                          item.achievement >= 90 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {item.achievement}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.achievement >= 100 ? 'bg-kpi-green' :
                          item.achievement >= 90 ? 'bg-kpi-orange' :
                          'bg-kpi-red'
                        }`}
                        style={{ width: `${Math.min(item.achievement, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 성과 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>이번 달 성과 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    달성 항목
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-green rounded-full"></div>
                      평균 주문금액 목표 달성 (100%)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-green rounded-full"></div>
                      매출 목표 95% 달성
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-green rounded-full"></div>
                      고객 만족도 4.6점 유지
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    개선 필요 항목
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-orange rounded-full"></div>
                      주문수 목표 대비 5% 부족
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-orange rounded-full"></div>
                      신규 고객 비율 증대 필요
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-kpi-orange rounded-full"></div>
                      일부 메뉴 판매량 감소
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* 인근 매장 비교 */}
          <Card>
            <CardHeader>
              <CardTitle>인근 매장과의 성과 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitorData.map((store, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${
                    store.store === '우리 매장' ? 'bg-blue-50 border-blue-200' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        store.ranking === 1 ? 'bg-yellow-100 text-yellow-800' :
                        store.ranking === 2 ? 'bg-gray-100 text-gray-600' :
                        store.ranking === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {store.ranking}
                      </div>
                      <div>
                        <div className={`font-medium ${store.store === '우리 매장' ? 'text-blue-700' : ''}`}>
                          {store.store}
                        </div>
                        {store.store === '우리 매장' && (
                          <div className="text-xs text-blue-600">현재 순위: {store.ranking}위</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₩{(store.revenue / 10000).toFixed(0)}만원</div>
                      <div className={`text-xs flex items-center gap-1 ${store.growth > 0 ? 'text-kpi-green' : 'text-kpi-red'}`}>
                        {store.growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(store.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 경쟁력 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>경쟁력 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">시장 점유율</h4>
                  <p className="text-2xl font-bold text-kpi-green">18.5%</p>
                  <p className="text-sm text-gray-600">인근 지역 기준</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">성장률 순위</h4>
                  <p className="text-2xl font-bold text-kpi-orange">2위</p>
                  <p className="text-sm text-gray-600">5개 매장 중</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">개선 가능성</h4>
                  <p className="text-2xl font-bold text-kpi-purple">+12%</p>
                  <p className="text-sm text-gray-600">1위까지 격차</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}