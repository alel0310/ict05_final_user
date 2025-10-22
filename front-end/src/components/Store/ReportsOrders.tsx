import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { 
  ShoppingCart, 
  Download, 
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  Monitor,
  Smartphone,
  Truck,
  Store as StoreIcon,
  Package,
  Award,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

// 기간별 주문 데이터
const yearlyOrderData = [
  { period: '2022', orders: 58500, avgDaily: 160, growth: 12.5 },
  { period: '2023', orders: 67200, avgDaily: 184, growth: 14.9 },
  { period: '2024', orders: 78800, avgDaily: 216, growth: 17.3 },
];

const monthlyOrderData = [
  { period: '1월', orders: 4750, dailyAvg: 153, store: 2470, takeout: 1425, delivery: 855 },
  { period: '2월', orders: 5200, dailyAvg: 186, store: 2704, takeout: 1560, delivery: 936 },
  { period: '3월', orders: 5800, dailyAvg: 187, store: 3016, takeout: 1740, delivery: 1044 },
  { period: '4월', orders: 5400, dailyAvg: 180, store: 2808, takeout: 1620, delivery: 972 },
  { period: '5월', orders: 6100, dailyAvg: 197, store: 3172, takeout: 1830, delivery: 1098 },
  { period: '6월', orders: 6500, dailyAvg: 217, store: 3380, takeout: 1950, delivery: 1170 },
];

const dailyOrderData = [
  { period: '2024.12.01 (월)', orders: 850, store: 442, takeout: 255, delivery: 153, peakHour: '12시' },
  { period: '2024.12.02 (화)', orders: 780, store: 406, takeout: 234, delivery: 140, peakHour: '13시' },
  { period: '2024.12.03 (수)', orders: 920, store: 478, takeout: 276, delivery: 166, peakHour: '12시' },
  { period: '2024.12.04 (목)', orders: 980, store: 509, takeout: 294, delivery: 177, peakHour: '13시' },
  { period: '2024.12.05 (금)', orders: 1200, store: 624, takeout: 360, delivery: 216, peakHour: '19시' },
  { period: '2024.12.06 (토)', orders: 1300, store: 676, takeout: 390, delivery: 234, peakHour: '18시' },
  { period: '2024.12.07 (일)', orders: 1250, store: 650, takeout: 375, delivery: 225, peakHour: '14시' },
];

const hourlyOrderData = [
  { hour: '2024.12.06 10시', orders: 38, store: 20, takeout: 12, delivery: 6 },
  { hour: '2024.12.06 11시', orders: 65, store: 34, takeout: 20, delivery: 11 },
  { hour: '2024.12.06 12시', orders: 95, store: 49, takeout: 29, delivery: 17 },
  { hour: '2024.12.06 13시', orders: 105, store: 55, takeout: 32, delivery: 18 },
  { hour: '2024.12.06 14시', orders: 72, store: 37, takeout: 22, delivery: 13 },
  { hour: '2024.12.06 15시', orders: 48, store: 25, takeout: 15, delivery: 8 },
  { hour: '2024.12.06 16시', orders: 45, store: 23, takeout: 14, delivery: 8 },
  { hour: '2024.12.06 17시', orders: 58, store: 30, takeout: 18, delivery: 10 },
  { hour: '2024.12.06 18시', orders: 88, store: 46, takeout: 27, delivery: 15 },
  { hour: '2024.12.06 19시', orders: 96, store: 50, takeout: 29, delivery: 17 },
  { hour: '2024.12.06 20시', orders: 78, store: 41, takeout: 24, delivery: 13 },
  { hour: '2024.12.06 21시', orders: 52, store: 27, takeout: 16, delivery: 9 },
];

// 서비스 채널별 주문 데이터
const channelOrderData = [
  { name: '매장', orders: 7800, ratio: 52, avgOrder: 5800, color: '#FF6B6B' },
  { name: '포장', orders: 4900, ratio: 33, avgOrder: 5820, color: '#F77F00' },
  { name: '배달', orders: 2300, ratio: 15, avgOrder: 5780, color: '#06D6A0' },
];

// 상품 매출 순위 데이터
const productRankingData = [
  { rank: 1, name: '시그니처 버거', orders: 2250, revenue: 20250000, share: 23.5, trend: 'up', trendValue: 15.3 },
  { rank: 2, name: '치킨 버거', orders: 1800, revenue: 16200000, share: 18.8, trend: 'up', trendValue: 8.7 },
  { rank: 3, name: '베이컨 치즈버거', orders: 1200, revenue: 12000000, share: 13.9, trend: 'up', trendValue: 12.1 },
  { rank: 4, name: '감자튀김', orders: 2800, revenue: 14000000, share: 16.3, trend: 'up', trendValue: 5.2 },
  { rank: 5, name: '콜라', orders: 3200, revenue: 6400000, share: 7.4, trend: 'up', trendValue: 3.8 },
  { rank: 6, name: '치즈스틱', orders: 950, revenue: 6650000, share: 7.7, trend: 'up', trendValue: 25.4 },
  { rank: 7, name: '치킨 너겟', orders: 780, revenue: 5460000, share: 6.3, trend: 'down', trendValue: -2.1 },
  { rank: 8, name: '피클 버거', orders: 520, revenue: 4680000, share: 5.4, trend: 'down', trendValue: -8.5 },
];

// 시간대별 채널 분석 데이터
const timeChannelData = [
  { time: '오전(10-12시)', store: 62, takeout: 23, delivery: 15, total: 198 },
  { time: '점심(12-14시)', store: 58, takeout: 25, delivery: 17, total: 200 },
  { time: '오후(14-17시)', store: 55, takeout: 28, delivery: 17, total: 151 },
  { time: '저녁(17-20시)', store: 48, takeout: 30, delivery: 22, total: 242 },
  { time: '야간(20-22시)', store: 52, takeout: 28, delivery: 20, total: 130 },
];

export function ReportsOrders() {
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 11, 1)); // 2024년 12월 1일
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 11, 10)); // 2024년 12월 10일
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleSearch = () => {
    toast.success(`${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} 기간의 주문 분석 데이터를 조회합니다.`);
  };

  const handleExportReport = (reportType: string) => {
    toast.success(`${reportType} 주문 분석 리포트를 다운로드합니다.`);
  };

  const totalOrders = monthlyOrderData.reduce((sum, month) => sum + month.orders, 0);
  const avgDailyOrders = Math.round(totalOrders / 180); // 6개월 평균
  const totalStoreOrders = monthlyOrderData.reduce((sum, month) => sum + month.store, 0);
  const totalTakeoutOrders = monthlyOrderData.reduce((sum, month) => sum + month.takeout, 0);
  const totalDeliveryOrders = monthlyOrderData.reduce((sum, month) => sum + month.delivery, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">주문 분석</h1>
          <p className="text-sm text-gray-600 mt-1">기간별, 서비스 채널별 주문 현황과 상품 순위를 분석합니다</p>
        </div>
        <div className="flex gap-2">
          {/* 시작일 선택 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                시작일: {startDate.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date: any) => date && setStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* 종료일 선택 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                종료일: {endDate.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date: any) => date && setEndDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* 조회 버튼 */}
          <Button onClick={handleSearch} className="bg-blue-600 text-white hover:bg-blue-700">
            조회
          </Button>
          
          <Button onClick={() => handleExportReport('주문 분석')}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 지표 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="총 주문수"
          value={`${totalOrders.toLocaleString()}건`}
          icon={ShoppingCart}
          color="red"
          trend={+17.3}
        />
        <KPICard
          title="일평균 주문"
          value={`${avgDailyOrders}건`}
          icon={Target}
          color="orange"
          trend={+12.8}
        />
        <KPICard
          title="주문 전환율"
          value="83.2%"
          icon={TrendingUp}
          color="green"
          trend={+2.5}
        />
      </div>

      <Tabs defaultValue="period" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="period">기간별 주문</TabsTrigger>
          <TabsTrigger value="channel">서비스 채널 매출</TabsTrigger>
          <TabsTrigger value="ranking">상품 순위</TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="space-y-6">
          {/* 기간별 주문 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>기간별 주문 분석</CardTitle>
              <p className="text-sm text-gray-600">
                조회 기간: {startDate.toLocaleDateString('ko-KR')} ~ {endDate.toLocaleDateString('ko-KR')}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="yearly">년간</TabsTrigger>
                  <TabsTrigger value="monthly">월간</TabsTrigger>
                  <TabsTrigger value="daily">일간</TabsTrigger>
                  <TabsTrigger value="hourly">시간</TabsTrigger>
                </TabsList>

                <TabsContent value="yearly">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => [`${value.toLocaleString()}건`, '주문수']} />
                      <Bar dataKey="orders" fill="#FF6B6B" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="monthly">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: any) => [`${value.toLocaleString()}건`, '주문수']} />
                      <Area type="monotone" dataKey="orders" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="daily">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value.toLocaleString()}건`, '주문수']} />
                      <Bar dataKey="orders" fill="#F77F00" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="hourly">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value}건`, '주문수']} />
                      <Line type="monotone" dataKey="orders" stroke="#06D6A0" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 기간별 요약 */}
          <Card>
            <CardHeader>
              <CardTitle>기간별 주문 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">최고 주문일</h4>
                  <p className="text-lg font-bold text-kpi-green">토요일</p>
                  <p className="text-sm text-gray-600">1,300건</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">피크 시간</h4>
                  <p className="text-lg font-bold text-kpi-orange">13시</p>
                  <p className="text-sm text-gray-600">105건/시간</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">주간 증가율</h4>
                  <p className="text-lg font-bold text-kpi-purple">+17.3%</p>
                  <p className="text-sm text-gray-600">전년 대비</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channel" className="space-y-6">
          {/* 서비스 채널별 주문 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>서비스 채널별 주문 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={channelOrderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, ratio }) => `${name} ${ratio}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="ratio"
                    >
                      {channelOrderData.map((entry, index) => (
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
                <CardTitle>서비스 채널별 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelOrderData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: channel.color }}></div>
                        <div className="flex items-center gap-1">
                          {channel.name === '매장' && <StoreIcon className="w-4 h-4" />}
                          {channel.name === '포장' && <Monitor className="w-4 h-4" />}
                          {channel.name === '배달' && <Truck className="w-4 h-4" />}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{channel.orders.toLocaleString()}건</div>
                        <div className="text-xs text-gray-500">평균 ₩{channel.avgOrder.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 시간대별 채널 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 서비스 채널 주문 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeChannelData.map((time, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{time.time}</span>
                      <span className="text-sm text-gray-600">총 {time.total}건</span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div 
                        className="bg-kpi-red rounded-l" 
                        style={{ width: `${time.store}%` }}
                        title={`매장: ${time.store}%`}
                      ></div>
                      <div 
                        className="bg-kpi-orange" 
                        style={{ width: `${time.takeout}%` }}
                        title={`포장: ${time.takeout}%`}
                      ></div>
                      <div 
                        className="bg-kpi-green rounded-r" 
                        style={{ width: `${time.delivery}%` }}
                        title={`배달: ${time.delivery}%`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>매장 {time.store}%</span>
                      <span>포장 {time.takeout}%</span>
                      <span>배달 {time.delivery}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 월간 채널별 추이 */}
          <Card>
            <CardHeader>
              <CardTitle>월간 서비스 채널별 주문 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyOrderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()}건`, '']} />
                  <Area type="monotone" dataKey="store" stackId="1" stroke="#FF6B6B" fill="#FF6B6B" />
                  <Area type="monotone" dataKey="takeout" stackId="1" stroke="#F77F00" fill="#F77F00" />
                  <Area type="monotone" dataKey="delivery" stackId="1" stroke="#06D6A0" fill="#06D6A0" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-6">
          {/* 상품 매출 순위 */}
          <Card>
            <CardHeader>
              <CardTitle>상품 매출 순위</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productRankingData.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        product.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.rank}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.orders.toLocaleString()}회 주문</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₩{product.revenue.toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-xs">
                        {product.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-kpi-green" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-kpi-red" />
                        )}
                        <span className={product.trend === 'up' ? 'text-kpi-green' : 'text-kpi-red'}>
                          {product.trend === 'up' ? '+' : ''}{product.trendValue}%
                        </span>
                        <span className="text-gray-500">({product.share}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 상품별 주문 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>상품별 주문량 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productRankingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value.toLocaleString()}건`, '주문수']} />
                  <Bar dataKey="orders" fill="#9D4EDD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 주문 인사이트 */}
          <Card>
            <CardHeader>
              <CardTitle>주문 분석 인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-500" />
                    베스트 셀러
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">시그니처 버거</div>
                    <div className="text-sm text-gray-600">2,250건 주문 (23.5%)</div>
                    <Badge className="bg-blue-100 text-blue-700">+15.3% 증가</Badge>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    급성장 상품
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">치즈스틱</div>
                    <div className="text-sm text-gray-600">950건 주문 (7.7%)</div>
                    <Badge className="bg-green-100 text-green-700">+25.4% 급증</Badge>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    개선 필요
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">피클 버거</div>
                    <div className="text-sm text-gray-600">520건 주문 (5.4%)</div>
                    <Badge className="bg-orange-100 text-orange-700">-8.5% 감소</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}