import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Smartphone, 
  Monitor, 
  Truck, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CalendarIcon,
  RefreshCw,
  Download,
  UtensilsCrossed,
  ShoppingBag
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

// 서비스 채널별 당일 매출 데이터
const channelData = [
  {
    id: 'visit',
    name: '방문',
    description: '매장 내 식사',
    icon: UtensilsCrossed,
    color: '#FF6B6B',
    revenue: 2450000,
    orders: 156,
    averageOrder: 15705,
    growth: +8.5,
    peakHour: '12:00-13:00',
    avgStayTime: '45분',
    tableUtilization: '78%'
  },
  {
    id: 'takeout',
    name: '포장',
    description: '테이크아웃',
    icon: ShoppingBag,
    color: '#F77F00',
    revenue: 1890000,
    orders: 142,
    averageOrder: 13310,
    growth: +12.3,
    peakHour: '18:00-19:00',
    avgWaitTime: '8분',
    packagingCost: '2.5%'
  },
  {
    id: 'delivery',
    name: '배달',
    description: '배달 주문',
    icon: Truck,
    color: '#9D4EDD',
    revenue: 3250000,
    orders: 89,
    averageOrder: 36517,
    growth: -2.1,
    peakHour: '19:00-20:00',
    avgDeliveryTime: '28분',
    deliveryRadius: '3km'
  }
];

// 시간대별 서비스 채널 매출 데이터
const hourlyData = [
  { hour: '09', visit: 45000, takeout: 28000, delivery: 52000 },
  { hour: '10', visit: 89000, takeout: 65000, delivery: 126000 },
  { hour: '11', visit: 185000, takeout: 142000, delivery: 245000 },
  { hour: '12', visit: 420000, takeout: 285000, delivery: 380000 },
  { hour: '13', visit: 385000, takeout: 298000, delivery: 420000 },
  { hour: '14', visit: 225000, takeout: 165000, delivery: 285000 },
  { hour: '15', visit: 185000, takeout: 125000, delivery: 195000 },
  { hour: '16', visit: 165000, takeout: 145000, delivery: 225000 },
  { hour: '17', visit: 245000, takeout: 225000, delivery: 385000 },
  { hour: '18', visit: 285000, takeout: 385000, delivery: 485000 },
  { hour: '19', visit: 225000, takeout: 142000, delivery: 520000 },
  { hour: '20', visit: 185000, takeout: 85000, delivery: 385000 },
  { hour: '21', visit: 125000, takeout: 45000, delivery: 245000 },
];

// 서비스 채널별 분포
const orderTypeData = [
  { name: '방문', value: 40.0, fill: '#FF6B6B' },
  { name: '포장', value: 36.5, fill: '#F77F00' },
  { name: '배달', value: 23.5, fill: '#9D4EDD' }
];

export function ChannelRevenue() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const totalRevenue = channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalOrders = channelData.reduce((sum, channel) => sum + channel.orders, 0);
  const averageOrderValue = totalRevenue / totalOrders;

  const refreshData = () => {
    setIsLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setIsLoading(false);
      toast.success('데이터가 새로고침되었습니다.');
    }, 1500);
  };

  const exportData = () => {
    toast.success('서비스 채널 매출 데이터를 엑셀로 다운로드합니다.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">서비스 채널</h2>
          <p className="text-sm text-dark-gray">
            매장 내 식사, 포장 주문, 배달 서비스별 매출 현황 및 운영 지표
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {selectedDate.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date: any) => date && setSelectedDate(date)}
              />
            </PopoverContent>
          </Popover>
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button 
            variant="outline" 
            onClick={exportData}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 서비스 채널별 매출 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channelData.map((channel) => {
          const IconComponent = channel.icon;
          return (
            <Card key={channel.id} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: channel.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: channel.color }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                      <p className="text-xs text-dark-gray">{channel.description}</p>
                    </div>
                  </div>
                  <Badge 
                    className={`${
                      channel.growth > 0 ? 'bg-kpi-green' : 'bg-kpi-red'
                    } text-white`}
                  >
                    {channel.growth > 0 ? '+' : ''}{channel.growth}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold" style={{ color: channel.color }}>
                    ₩{channel.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-dark-gray">
                    총 {channel.orders}건 주문
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-dark-gray">평균 주문액</p>
                    <p className="font-medium">₩{channel.averageOrder.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-dark-gray">피크 시간</p>
                    <p className="font-medium">{channel.peakHour}</p>
                  </div>
                  <div>
                    <p className="text-dark-gray">
                      {channel.id === 'visit' ? '평균 체류시간' : 
                       channel.id === 'takeout' ? '평균 대기시간' : '평균 배달시간'}
                    </p>
                    <p className="font-medium">
                      {channel.id === 'visit' ? channel.avgStayTime : 
                       channel.id === 'takeout' ? channel.avgWaitTime : channel.avgDeliveryTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-gray">
                      {channel.id === 'visit' ? '테이블 이용률' : 
                       channel.id === 'takeout' ? '포장재 비용' : '배달 반경'}
                    </p>
                    <p className="font-medium">
                      {channel.id === 'visit' ? channel.tableUtilization : 
                       channel.id === 'takeout' ? channel.packagingCost : channel.deliveryRadius}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-gray">전체 매출 비중</span>
                    <span className="font-medium">
                      {((channel.revenue / totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 서비스 채널 매출 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>시간대별 서비스 채널 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#6C757D"
                  tickFormatter={(value) => `${value}시`}
                />
                <YAxis 
                  stroke="#6C757D"
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `₩${(value || 0).toLocaleString()}`,
                    name === 'visit' ? '방문' :
                    name === 'takeout' ? '포장' : '배달'
                  ]}
                  labelFormatter={(label) => `${label}시`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visit" 
                  stroke="#FF6B6B" 
                  strokeWidth={2}
                  name="방문"
                />
                <Line 
                  type="monotone" 
                  dataKey="takeout" 
                  stroke="#F77F00" 
                  strokeWidth={2}
                  name="포장"
                />
                <Line 
                  type="monotone" 
                  dataKey="delivery" 
                  stroke="#9D4EDD" 
                  strokeWidth={2}
                  name="배달"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 서비스 채널별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>서비스 채널별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              {orderTypeData.map((item, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-4 h-4 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: item.fill }}
                  />
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-lg font-bold" style={{ color: item.fill }}>
                    {item.value}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 채널별 상세 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스 채널별 상세 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 매출 순위 */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                매출 순위
              </h4>
              <div className="space-y-3">
                {channelData
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((channel, index) => {
                    const IconComponent = channel.icon;
                    return (
                      <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold">
                            {index + 1}
                          </div>
                          <IconComponent className="w-4 h-4" style={{ color: channel.color }} />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <span className="font-bold" style={{ color: channel.color }}>
                          ₩{(channel.revenue / 10000).toFixed(0)}만
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 주문량 순위 */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                주문량 순위
              </h4>
              <div className="space-y-3">
                {channelData
                  .sort((a, b) => b.orders - a.orders)
                  .map((channel, index) => {
                    const IconComponent = channel.icon;
                    return (
                      <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold">
                            {index + 1}
                          </div>
                          <IconComponent className="w-4 h-4" style={{ color: channel.color }} />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <span className="font-bold" style={{ color: channel.color }}>
                          {channel.orders}건
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 성장률 순위 */}
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                성장률 순위
              </h4>
              <div className="space-y-3">
                {channelData
                  .sort((a, b) => b.growth - a.growth)
                  .map((channel, index) => {
                    const IconComponent = channel.icon;
                    const isPositive = channel.growth > 0;
                    return (
                      <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold">
                            {index + 1}
                          </div>
                          <IconComponent className="w-4 h-4" style={{ color: channel.color }} />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-kpi-green" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-kpi-red" />
                          )}
                          <span className={`font-bold ${isPositive ? 'text-kpi-green' : 'text-kpi-red'}`}>
                            {isPositive ? '+' : ''}{channel.growth}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 서비스별 운영 지표 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스별 운영 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {channelData.map((channel) => {
              const IconComponent = channel.icon;
              return (
                <div key={channel.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: channel.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{channel.name}</h4>
                      <p className="text-xs text-dark-gray">{channel.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-gray">총 주문</span>
                      <span className="font-medium">{channel.orders}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-gray">평균 주문액</span>
                      <span className="font-medium">₩{channel.averageOrder.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-gray">피크 시간대</span>
                      <span className="font-medium">{channel.peakHour}</span>
                    </div>
                    
                    {channel.id === 'visit' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">평균 체류시간</span>
                          <span className="font-medium">{channel.avgStayTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">테이블 이용률</span>
                          <span className="font-medium text-kpi-green">{channel.tableUtilization}</span>
                        </div>
                      </>
                    )}
                    
                    {channel.id === 'takeout' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">평균 대기시간</span>
                          <span className="font-medium">{channel.avgWaitTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">포장재 비용</span>
                          <span className="font-medium text-kpi-orange">{channel.packagingCost}</span>
                        </div>
                      </>
                    )}
                    
                    {channel.id === 'delivery' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">평균 배달시간</span>
                          <span className="font-medium">{channel.avgDeliveryTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dark-gray">배달 반경</span>
                          <span className="font-medium text-kpi-purple">{channel.deliveryRadius}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 요약 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>매출 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">총 매출</h4>
              <p className="text-lg font-bold text-kpi-green">₩{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-dark-gray">당일 전체</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">총 주문수</h4>
              <p className="text-lg font-bold text-kpi-orange">{totalOrders}건</p>
              <p className="text-xs text-dark-gray">전 채널 합계</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">평균 주문액</h4>
              <p className="text-lg font-bold text-kpi-purple">₩{averageOrderValue.toFixed(0)}</p>
              <p className="text-xs text-dark-gray">전체 평균</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold mb-2">조회 일시</h4>
              <p className="text-lg font-bold text-kpi-red">{selectedDate.toLocaleDateString('ko-KR')}</p>
              <p className="text-xs text-dark-gray">선택된 날짜</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}