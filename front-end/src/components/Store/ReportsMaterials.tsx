import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { 
  Package, 
  Download, 
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Truck,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Scale
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { toast } from 'sonner';

// 기간별 발주 데이터
const yearlyOrderData = [
  { period: '2022', amount: 285000000, quantity: 4850, avgMonthly: 23750000 },
  { period: '2023', amount: 324000000, quantity: 5420, avgMonthly: 27000000 },
  { period: '2024', amount: 378000000, quantity: 6150, avgMonthly: 31500000 },
];

const monthlyOrderData = [
  { period: '1월', amount: 28500000, quantity: 485, items: 45, avgPrice: 58763 },
  { period: '2월', amount: 32000000, quantity: 520, items: 48, avgPrice: 61538 },
  { period: '3월', amount: 35500000, quantity: 580, items: 52, avgPrice: 61207 },
  { period: '4월', amount: 33000000, quantity: 540, items: 49, avgPrice: 61111 },
  { period: '5월', amount: 38000000, quantity: 615, items: 54, avgPrice: 61789 },
  { period: '6월', amount: 41000000, quantity: 650, items: 58, avgPrice: 63077 },
];

const weeklyOrderData = [
  { period: '1주차', amount: 9500000, quantity: 158, items: 18, peakItem: '치즈' },
  { period: '2주차', amount: 10200000, quantity: 165, items: 19, peakItem: '패티' },
  { period: '3주차', amount: 11800000, quantity: 185, items: 21, peakItem: '소스' },
  { period: '4주차', amount: 9500000, quantity: 142, items: 16, peakItem: '빵' },
];

// 품목별 발주 데이터
const materialOrderData = [
  { 
    name: '햄버거 패티', 
    category: '주재료',
    yearlyAmount: 85000000, 
    yearlyQuantity: 2850, 
    unit: 'kg',
    trend: 'up', 
    trendValue: 15.3,
    share: 22.5,
    avgPrice: 29824,
    color: '#FF6B6B'
  },
  { 
    name: '치즈 슬라이스', 
    category: '주재료',
    yearlyAmount: 58000000, 
    yearlyQuantity: 2320, 
    unit: 'kg',
    trend: 'up', 
    trendValue: 25.4,
    share: 15.3,
    avgPrice: 25000,
    color: '#F77F00'
  },
  { 
    name: '햄버거 번', 
    category: '주재료',
    yearlyAmount: 45000000, 
    yearlyQuantity: 1800, 
    unit: '개',
    trend: 'up', 
    trendValue: 8.7,
    share: 11.9,
    avgPrice: 25000,
    color: '#06D6A0'
  },
  { 
    name: '감자', 
    category: '주재료',
    yearlyAmount: 38000000, 
    yearlyQuantity: 1520, 
    unit: 'kg',
    trend: 'up', 
    trendValue: 5.2,
    share: 10.1,
    avgPrice: 25000,
    color: '#9D4EDD'
  },
  { 
    name: '양상추', 
    category: '부재료',
    yearlyAmount: 28000000, 
    yearlyQuantity: 1120, 
    unit: 'kg',
    trend: 'up', 
    trendValue: 12.1,
    share: 7.4,
    avgPrice: 25000,
    color: '#20C997'
  },
  { 
    name: '토마토', 
    category: '부재료',
    yearlyAmount: 25000000, 
    yearlyQuantity: 1000, 
    unit: 'kg',
    trend: 'down', 
    trendValue: -2.1,
    share: 6.6,
    avgPrice: 25000,
    color: '#FD7E14'
  },
  { 
    name: '소스류', 
    category: '조미료',
    yearlyAmount: 32000000, 
    yearlyQuantity: 640, 
    unit: 'L',
    trend: 'up', 
    trendValue: 18.5,
    share: 8.5,
    avgPrice: 50000,
    color: '#E83E8C'
  },
  { 
    name: '식용유', 
    category: '조미료',
    yearlyAmount: 18000000, 
    yearlyQuantity: 360, 
    unit: 'L',
    trend: 'up', 
    trendValue: 3.8,
    share: 4.8,
    avgPrice: 50000,
    color: '#6610F2'
  },
];

// 카테고리별 발주 데이터
const categoryOrderData = [
  { name: '주재료', amount: 226000000, ratio: 59.8, items: 4, color: '#FF6B6B' },
  { name: '부재료', amount: 53000000, ratio: 14.0, items: 2, color: '#F77F00' },
  { name: '조미료', amount: 50000000, ratio: 13.2, items: 2, color: '#06D6A0' },
  { name: '포장재', amount: 35000000, ratio: 9.3, items: 3, color: '#9D4EDD' },
  { name: '기타', amount: 14000000, ratio: 3.7, items: 2, color: '#20C997' },
];

// 월별 주요 품목 발주 추이
const monthlyMaterialTrend = [
  { month: '1월', 치즈: 4800000, 패티: 7200000, 소스: 2800000, 빵: 3500000 },
  { month: '2월', 치즈: 5200000, 패티: 7800000, 소스: 3000000, 빵: 3800000 },
  { month: '3월', 치즈: 6100000, 패티: 8500000, 소스: 3400000, 빵: 4200000 },
  { month: '4월', 치즈: 5800000, 패티: 8200000, 소스: 3200000, 빵: 3900000 },
  { month: '5월', 치즈: 6500000, 패티: 9200000, 소스: 3600000, 빵: 4400000 },
  { month: '6월', 치즈: 7200000, 패티: 9800000, 소스: 3800000, 빵: 4700000 },
];

export function ReportsMaterials() {
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 11, 1)); // 2024년 12월 1일
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 11, 10)); // 2024년 12월 10일
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const handleSearch = () => {
    toast.success(`${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} 기간의 원재료 분석 데이터를 조회합니다.`);
  };

  const handleExportReport = (reportType: string) => {
    toast.success(`${reportType} 원재료 분석 리포트를 다운로드합니다.`);
  };

  const totalAmount = monthlyOrderData.reduce((sum, month) => sum + month.amount, 0);
  const totalQuantity = monthlyOrderData.reduce((sum, month) => sum + month.quantity, 0);
  const totalItems = Math.max(...monthlyOrderData.map(month => month.items));
  const avgPrice = totalAmount / totalQuantity;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">원재료 분석</h1>
          <p className="text-sm text-gray-600 mt-1">기간별 발주량과 품목별 발주 현황을 분석합니다</p>
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
          
          <Button onClick={() => handleExportReport('원재료 분석')}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 지표 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="총 발주금액"
          value={`₩${Math.round(totalAmount / 10000)}만원`}
          icon={DollarSign}
          color="red"
          trend={+16.7}
        />
        <KPICard
          title="총 발주수량"
          value={`${totalQuantity.toLocaleString()}${materialOrderData[0]?.unit || '개'}`}
          icon={Package}
          color="orange"
          trend={+13.5}
        />
        <KPICard
          title="발주 품목수"
          value={`${totalItems}개`}
          icon={ShoppingCart}
          color="green"
          trend={+8.2}
        />
        <KPICard
          title="평균 단가"
          value={`₩${Math.round(avgPrice).toLocaleString()}`}
          icon={Scale}
          color="purple"
          trend={+2.8}
        />
      </div>

      <Tabs defaultValue="period" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="period">기간별 발주</TabsTrigger>
          <TabsTrigger value="materials">품목별 분석</TabsTrigger>
          <TabsTrigger value="category">카테고리별</TabsTrigger>
        </TabsList>

        <TabsContent value="period" className="space-y-6">
          {/* 기간별 발주 분석 */}
          <Card>
            <CardHeader>
              <CardTitle>기간별 발주 분석</CardTitle>
              <p className="text-sm text-gray-600">
                조회 기간: {startDate.toLocaleDateString('ko-KR')} ~ {endDate.toLocaleDateString('ko-KR')}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="yearly">년간</TabsTrigger>
                  <TabsTrigger value="monthly">월간</TabsTrigger>
                  <TabsTrigger value="weekly">주간</TabsTrigger>
                </TabsList>

                <TabsContent value="yearly">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={yearlyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `₩${(value / 100000000).toFixed(1)}억`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip 
                        formatter={(value: any, name) => [
                          name === 'amount' ? `₩${value.toLocaleString()}` : `${value.toLocaleString()}개`,
                          name === 'amount' ? '발주금액' : '발주수량'
                        ]}
                      />
                      <Bar yAxisId="left" dataKey="amount" fill="#FF6B6B" name="발주금액" />
                      <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#06D6A0" strokeWidth={3} name="발주수량" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="monthly">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={monthlyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name) => [
                          name === 'amount' ? `₩${value.toLocaleString()}` : `${value}개`,
                          name === 'amount' ? '발주금액' : name === 'quantity' ? '발주수량' : '품목수'
                        ]}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="amount" fill="#FF6B6B" fillOpacity={0.3} stroke="#FF6B6B" />
                      <Line yAxisId="right" type="monotone" dataKey="items" stroke="#F77F00" strokeWidth={2} name="품목수" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="weekly">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyOrderData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '발주금액']} />
                      <Bar dataKey="amount" fill="#06D6A0" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 기간별 요약 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>발주 요약 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">최대 발주월</h4>
                  <p className="text-lg font-bold text-kpi-green">6월</p>
                  <p className="text-sm text-gray-600">₩4,100만원</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">평균 월발주</h4>
                  <p className="text-lg font-bold text-kpi-orange">₩3,450만원</p>
                  <p className="text-sm text-gray-600">6개월 평균</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">발주 증가율</h4>
                  <p className="text-lg font-bold text-kpi-purple">+16.7%</p>
                  <p className="text-sm text-gray-600">전년 동기 대비</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          {/* 품목별 발주 순위 */}
          <Card>
            <CardHeader>
              <CardTitle>품목별 발주 순위</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materialOrderData.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: material.color }}></div>
                        <div>
                          <div className="font-medium">{material.name}</div>
                          <div className="text-xs text-gray-500">
                            {material.yearlyQuantity.toLocaleString()}{material.unit} | {material.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₩{(material.yearlyAmount / 10000).toFixed(0)}만원</div>
                      <div className="flex items-center gap-1 text-xs">
                        {material.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-kpi-green" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-kpi-red" />
                        )}
                        <span className={material.trend === 'up' ? 'text-kpi-green' : 'text-kpi-red'}>
                          {material.trend === 'up' ? '+' : ''}{material.trendValue}%
                        </span>
                        <span className="text-gray-500">({material.share}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 월별 주요 품목 발주 추이 */}
          <Card>
            <CardHeader>
              <CardTitle>월별 주요 품목 발주 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyMaterialTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="패티" stroke="#FF6B6B" strokeWidth={2} name="햄버거 패티" />
                  <Line type="monotone" dataKey="치즈" stroke="#F77F00" strokeWidth={2} name="치즈 슬라이스" />
                  <Line type="monotone" dataKey="빵" stroke="#06D6A0" strokeWidth={2} name="햄버거 번" />
                  <Line type="monotone" dataKey="소스" stroke="#9D4EDD" strokeWidth={2} name="소스류" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 발주 인사이트 */}
          <Card>
            <CardHeader>
              <CardTitle>발주 분석 인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    효율적 발주
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">햄버거 패티</div>
                    <div className="text-sm text-gray-600">안정적 발주량 유지</div>
                    <Badge className="bg-green-100 text-green-700">최적화 완료</Badge>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    급증 품목
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">치즈 슬라이스</div>
                    <div className="text-sm text-gray-600">치즈버거 판매 증가</div>
                    <Badge className="bg-blue-100 text-blue-700">+25.4% 증가</Badge>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    관리 필요
                  </h4>
                  <div className="space-y-2">
                    <div className="font-medium">토마토</div>
                    <div className="text-sm text-gray-600">발주량 감소 추세</div>
                    <Badge className="bg-orange-100 text-orange-700">-2.1% 감소</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-6">
          {/* 카테고리별 발주 분포 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 발주 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryOrderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, ratio }) => `${name} ${ratio}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="ratio"
                    >
                      {categoryOrderData.map((entry, index) => (
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
                <CardTitle>카테고리별 상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryOrderData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-xs text-gray-500">{category.items}개 품목</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₩{(category.amount / 10000).toFixed(0)}만원</div>
                        <div className="text-xs text-gray-500">{category.ratio}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 카테고리별 발주 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 발주 금액 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryOrderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₩${(value / 10000000).toFixed(0)}천만`} />
                  <Tooltip formatter={(value: any) => [`₩${value.toLocaleString()}`, '발주금액']} />
                  <Bar dataKey="amount" fill="#9D4EDD" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
}