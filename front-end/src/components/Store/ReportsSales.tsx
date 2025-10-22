import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  BarChart3, 
  Download, 
  CalendarIcon,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Monitor,
  Smartphone,
  Truck,
  Store as StoreIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

// 기간별 매출 데이터
const yearlySalesData = [
  { period: '2022', revenue: 280000000, growth: 15.2 },
  { period: '2023', revenue: 324000000, growth: 15.7 },
  { period: '2024', revenue: 385000000, growth: 18.8 },
];

const monthlySalesData = [
  { period: '1월', revenue: 28500000, orders: 4750, customers: 3800 },
  { period: '2월', revenue: 32000000, orders: 5200, customers: 4100 },
  { period: '3월', revenue: 35500000, orders: 5800, customers: 4500 },
  { period: '4월', revenue: 33000000, orders: 5400, customers: 4200 },
  { period: '5월', revenue: 38000000, orders: 6100, customers: 4800 },
  { period: '6월', revenue: 41000000, orders: 6500, customers: 5100 },
];

const dailySalesData = [
  { period: '2024.12.01 (월)', revenue: 5200000, orders: 850, peakHour: '12시' },
  { period: '2024.12.02 (화)', revenue: 4800000, orders: 780, peakHour: '13시' },
  { period: '2024.12.03 (수)', revenue: 5800000, orders: 920, peakHour: '12시' },
  { period: '2024.12.04 (목)', revenue: 6200000, orders: 980, peakHour: '13시' },
  { period: '2024.12.05 (금)', revenue: 7500000, orders: 1200, peakHour: '19시' },
  { period: '2024.12.06 (토)', revenue: 8200000, orders: 1300, peakHour: '18시' },
  { period: '2024.12.07 (일)', revenue: 7800000, orders: 1250, peakHour: '14시' },
];

const hourlySalesData = [
  { hour: '2024.12.06 10시', revenue: 450000, orders: 38, visit: 180000, takeout: 150000, delivery: 120000 },
  { hour: '2024.12.06 11시', revenue: 780000, orders: 65, visit: 320000, takeout: 280000, delivery: 180000 },
  { hour: '2024.12.06 12시', revenue: 1200000, orders: 95, visit: 520000, takeout: 450000, delivery: 230000 },
  { hour: '2024.12.06 13시', revenue: 1350000, orders: 105, visit: 580000, takeout: 520000, delivery: 250000 },
  { hour: '2024.12.06 14시', revenue: 890000, orders: 72, visit: 380000, takeout: 320000, delivery: 190000 },
  { hour: '2024.12.06 15시', revenue: 620000, orders: 48, visit: 280000, takeout: 220000, delivery: 120000 },
  { hour: '2024.12.06 16시', revenue: 580000, orders: 45, visit: 250000, takeout: 200000, delivery: 130000 },
  { hour: '2024.12.06 17시', revenue: 750000, orders: 58, visit: 320000, takeout: 280000, delivery: 150000 },
  { hour: '2024.12.06 18시', revenue: 1100000, orders: 88, visit: 480000, takeout: 380000, delivery: 240000 },
  { hour: '2024.12.06 19시', revenue: 1250000, orders: 96, visit: 550000, takeout: 420000, delivery: 280000 },
  { hour: '2024.12.06 20시', revenue: 980000, orders: 78, visit: 420000, takeout: 350000, delivery: 210000 },
  { hour: '2024.12.06 21시', revenue: 650000, orders: 52, visit: 280000, takeout: 230000, delivery: 140000 },
];

// 메뉴별 매출 데이터
const menuSalesData = [
  { name: '시그니처 버거', sales: 2250, revenue: 20250000, growth: 15.3 },
  { name: '치킨 버거', sales: 1800, revenue: 16200000, growth: 8.7 },
  { name: '베이컨 치즈버거', sales: 1200, revenue: 12000000, growth: 12.1 },
  { name: '감자튀김', sales: 2800, revenue: 14000000, growth: 5.2 },
  { name: '콜라', sales: 3200, revenue: 6400000, growth: 3.8 },
  { name: '치즈스틱', sales: 950, revenue: 6650000, growth: 25.4 },
];

// 서비스 채널 매출 데이터
const channelSalesData = [
  { name: '방문', revenue: 45200000, orders: 7800, ratio: 52, color: '#FF6B6B' },
  { name: '포장', revenue: 28500000, orders: 4900, ratio: 33, color: '#F77F00' },
  { name: '배달', revenue: 13300000, orders: 2300, ratio: 15, color: '#06D6A0' },
];

export function ReportsSales() {
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 11, 1)); // 2024년 12월 1일
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 11, 10)); // 2024년 12월 10일
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleSearch = () => {
    toast.success(`${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} 기간의 매출 분석 데이터를 조회합니다.`);
  };

  const handleExportReport = (reportType: string) => {
    toast.success(`${reportType} 매출 분석 리포트를 다운로드합니다.`);
  };

  const totalRevenue = monthlySalesData.reduce((sum, month) => sum + month.revenue, 0);
  const totalOrders = monthlySalesData.reduce((sum, month) => sum + month.orders, 0);
  const totalCustomers = monthlySalesData.reduce((sum, month) => sum + month.customers, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">매출 분석</h1>
          <p className="text-sm text-gray-600 mt-1">기간별 매출과 메뉴별, 서비스 채널별 매출을 분석합니다</p>
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
                onSelect={(date:any) => date && setStartDate(date)}
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
          
          <Button onClick={() => handleExportReport('매출 분석')}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 지표 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="월 총 매출"
          value={`₩${Math.round(totalRevenue / 10000)}만원`}
          icon={DollarSign}
          color="red"
          trend={+12.5}
        />
        <KPICard
          title="총 주문수"
          value={`${totalOrders.toLocaleString()}건`}
          icon={ShoppingCart}
          color="orange"
          trend={+8.3}
        />
        <KPICard
          title="총 고객수"
          value={`${totalCustomers.toLocaleString()}명`}
          icon={Users}
          color="green"
          trend={+5.7}
        />
        <KPICard
          title="평균 주문금액"
          value={`₩${Math.round(avgOrderValue).toLocaleString()}`}
          icon={BarChart3}
          color="purple"
          trend={+2.1}
        />
      </div>

      <Tabs defaultValue="period" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="period">기간별 매출</TabsTrigger>
          <TabsTrigger value="menu">메뉴별 매출</TabsTrigger>
          <TabsTrigger value="channel">서비스 채널 매출</TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="space-y-6">
          {/* 기간 선택 */}
          <Card>
            <CardHeader>
              <CardTitle>기간별 매출 분석</CardTitle>
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
                    <BarChart data={yearlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `₩${(value / 100000000).toFixed(1)}억`} />
                      <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '매출']} />
                      <Bar dataKey="revenue" fill="#FF6B6B" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="monthly">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '매출']} />
                      <Area type="monotone" dataKey="revenue" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="daily">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '매출']} />
                      <Bar dataKey="revenue" fill="#F77F00" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="hourly">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '매출']} />
                      <Line type="monotone" dataKey="revenue" stroke="#06D6A0" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          {/* 메뉴별 매출 순위 */}
          <Card>
            <CardHeader>
              <CardTitle>메뉴별 매출 순위</CardTitle>
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
                      <div className="font-semibold">₩{menu.revenue.toLocaleString()}</div>
                      <div className={`text-xs ${menu.growth > 0 ? 'text-kpi-green' : 'text-kpi-red'}`}>
                        {menu.growth > 0 ? '+' : ''}{menu.growth}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 메뉴별 매출 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>메뉴별 매출 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={menuSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '매출']} />
                  <Bar dataKey="revenue" fill="#9D4EDD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channel" className="space-y-6">
          {/* 서비스 채널별 매출 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>서비스 채널별 매출 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={channelSalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, ratio }) => `${name} ${ratio}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="ratio"
                    >
                      {channelSalesData.map((entry, index) => (
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
                  {channelSalesData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: channel.color }}></div>
                        <div className="flex items-center gap-1">
                          {channel.name === '방문' && <StoreIcon className="w-4 h-4" />}
                          {channel.name === '포장' && <Monitor className="w-4 h-4" />}
                          {channel.name === '배달' && <Truck className="w-4 h-4" />}
                          <span className="font-medium">{channel.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₩{(channel.revenue / 10000).toFixed(0)}만원</div>
                        <div className="text-xs text-gray-500">{channel.orders}건 ({channel.ratio}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 시간대별 서비스 채널 매출 */}
          <Card>
            <CardHeader>
              <CardTitle>시간대별 서비스 채널 매출</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="visit" stackId="1" stroke="#FF6B6B" fill="#FF6B6B" />
                  <Area type="monotone" dataKey="takeout" stackId="1" stroke="#F77F00" fill="#F77F00" />
                  <Area type="monotone" dataKey="delivery" stackId="1" stroke="#06D6A0" fill="#06D6A0" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 매출 요약 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>매출 요약 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">최고 매출일</h4>
              <p className="text-lg font-bold text-kpi-green">12/06 (토)</p>
              <p className="text-sm text-gray-600">₩820만원</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">피크 시간</h4>
              <p className="text-lg font-bold text-kpi-orange">13시</p>
              <p className="text-sm text-gray-600">₩135만원/시간</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">주 채널</h4>
              <p className="text-lg font-bold text-kpi-purple">방문</p>
              <p className="text-sm text-gray-600">전체 매출 52%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">조회 기간</h4>
              <p className="text-lg font-bold text-kpi-red">{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1)}일</p>
              <p className="text-sm text-gray-600">{startDate.toLocaleDateString('ko-KR')} ~ {endDate.toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}