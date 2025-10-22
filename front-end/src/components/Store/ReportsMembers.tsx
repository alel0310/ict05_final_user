import React, { useState } from 'react';
import { KPICard } from '../Common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Users, 
  Download, 
  CalendarIcon,
  UserPlus,
  UserCheck,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ComposedChart } from 'recharts';
import { toast } from 'sonner';

// 기간별 방문자 데이터
const yearlyVisitorData = [
  { period: '2022', visitors: 42500, newMembers: 8500, returnRate: 65, avgVisits: 2.3 },
  { period: '2023', visitors: 48200, newMembers: 9640, returnRate: 68, avgVisits: 2.5 },
  { period: '2024', visitors: 56800, newMembers: 11360, returnRate: 72, avgVisits: 2.8 },
];

const monthlyVisitorData = [
  { period: '1월', visitors: 3800, newMembers: 760, returnVisitors: 3040 },
  { period: '2월', visitors: 4200, newMembers: 840, returnVisitors: 3360 },
  { period: '3월', visitors: 4600, newMembers: 920, returnVisitors: 3680 },
  { period: '4월', visitors: 4300, newMembers: 860, returnVisitors: 3440 },
  { period: '5월', visitors: 4900, newMembers: 980, returnVisitors: 3920 },
  { period: '6월', visitors: 5200, newMembers: 1040, returnVisitors: 4160 },
];

const dailyVisitorData = [
  { period: '12/01', visitors: 620, newMembers: 124, returnVisitors: 496 },
  { period: '12/02', visitors: 580, newMembers: 116, returnVisitors: 464 },
  { period: '12/03', visitors: 720, newMembers: 144, returnVisitors: 576 },
  { period: '12/04', visitors: 680, newMembers: 136, returnVisitors: 544 },
  { period: '12/05', visitors: 850, newMembers: 170, returnVisitors: 680 },
  { period: '12/06', visitors: 950, newMembers: 190, returnVisitors: 760 },
  { period: '12/07', visitors: 880, newMembers: 176, returnVisitors: 704 },
  { period: '12/08', visitors: 640, newMembers: 128, returnVisitors: 512 },
  { period: '12/09', visitors: 590, newMembers: 118, returnVisitors: 472 },
  { period: '12/10', visitors: 730, newMembers: 146, returnVisitors: 584 },
];

// 시간대별 방문자 데이터
const hourlyVisitorData = [
  { hour: '2024.12.06 10시', visitors: 45, newMembers: 9, returnVisitors: 36 },
  { hour: '2024.12.06 11시', visitors: 78, newMembers: 16, returnVisitors: 62 },
  { hour: '2024.12.06 12시', visitors: 125, newMembers: 25, returnVisitors: 100 },
  { hour: '2024.12.06 13시', visitors: 142, newMembers: 28, returnVisitors: 114 },
  { hour: '2024.12.06 14시', visitors: 98, newMembers: 20, returnVisitors: 78 },
  { hour: '2024.12.06 15시', visitors: 65, newMembers: 13, returnVisitors: 52 },
  { hour: '2024.12.06 16시', visitors: 58, newMembers: 12, returnVisitors: 46 },
  { hour: '2024.12.06 17시', visitors: 82, newMembers: 16, returnVisitors: 66 },
  { hour: '2024.12.06 18시', visitors: 115, newMembers: 23, returnVisitors: 92 },
  { hour: '2024.12.06 19시', visitors: 135, newMembers: 27, returnVisitors: 108 },
  { hour: '2024.12.06 20시', visitors: 102, newMembers: 20, returnVisitors: 82 },
  { hour: '2024.12.06 21시', visitors: 68, newMembers: 14, returnVisitors: 54 },
];



export function ReportsMembers() {
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 11, 1)); // 2024년 12월 1일
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 11, 10)); // 2024년 12월 10일
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  const handleSearch = () => {
    toast.success(`${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} 기간의 회원 분석 데이터를 조회합니다.`);
  };

  const handleExportReport = (reportType: string) => {
    toast.success(`${reportType} 회원 분석 리포트를 다운로드합니다.`);
  };

  const totalVisitors = dailyVisitorData.reduce((sum, day) => sum + day.visitors, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">회원 분석</h1>
          <p className="text-sm text-gray-600 mt-1">기간별 매장 방문자 수를 분석합니다</p>
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
          <Button onClick={handleSearch} className="bg-kpi-blue text-white hover:bg-blue-600">
            조회
          </Button>
          
          <Button onClick={() => handleExportReport('회원 분석')}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 주요 지표 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="총 방문자수"
          value={`${totalVisitors.toLocaleString()}명`}
          icon={Users}
          color="red"
          trend={+18.5}
        />
        <KPICard
          title="일평균 방문자"
          value={`${Math.round(totalVisitors / dailyVisitorData.length).toLocaleString()}명`}
          icon={Target}
          color="orange"
          trend={+8.7}
        />
      </div>

      <div className="space-y-6">
        {/* 기간별 방문자 분석 */}
        <Card>
          <CardHeader>
            <CardTitle>기간별 방문자 분석</CardTitle>
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
                  <BarChart data={yearlyVisitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()}명`, '방문자수']} />
                    <Bar dataKey="visitors" fill="#FF6B6B" name="방문자수" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="monthly">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyVisitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()}명`, '방문자수']} />
                    <Area type="monotone" dataKey="visitors" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} name="방문자수" />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="daily">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyVisitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value}명`, '방문자수']} />
                    <Bar dataKey="visitors" fill="#FF6B6B" name="방문자수" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="hourly">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyVisitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value}명`, '방문자수']} />
                    <Line type="monotone" dataKey="visitors" stroke="#FF6B6B" strokeWidth={3} name="방문자수" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 방문자 요약 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>방문자 요약 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold mb-2">최고 방문일</h4>
                <p className="text-lg font-bold text-kpi-green">12/06</p>
                <p className="text-sm text-gray-600">950명 방문</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="font-semibold mb-2">피크 시간</h4>
                <p className="text-lg font-bold text-kpi-orange">13시</p>
                <p className="text-sm text-gray-600">142명/시간</p>
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
    </div>
  );
}