import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CalendarIcon, Download, Clock, BarChart3, Sun, Calendar1, ThumbsUpIcon, ThumbsDownIcon, PercentCircle, Percent, CalendarHeart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { fmtMoneyInt, fmtPercent1, tz } from '../../../lib/format';
import api from '../../../lib/authApi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { KPICard } from '../../Common/KPICard';

type ViewBy = 'DAY' | 'MONTH';

type PageResp<T> = {
  items: T[];
  nextCursor: string | null;
};

type TimeDaySummary = {
  peakHour: number | null;
  peakHourSales: number;
  offpeakHour: number | null;
  offpeakHourSales: number;
  topWeekday: number | null;
  topWeekdaySales: number;
  weekdaySales: number;
  weekendSales: number;
};

type TimeHourlyPointDto = {
  hour: number;
  sales: number;
  orders: number;
  visitOrders: number;
  takeoutOrders: number;
  deliveryOrders: number;
};

type HourlyChartPoint = TimeHourlyPointDto & {
  hourLabel: string;
};

type WeekdaySalesPointDto = {
  weekday: number;
  sales: number;
  orders: number;
};

type WeekdayChartPoint = WeekdaySalesPointDto & {
  weekdayLabel: string;
};

type TimeDayDailyRow = {
  orderDate: string;
  weekday: number;
  hour: number;
  orderCount: number;
  sales: number;
  visitCount: number;
  takeoutCount: number;
  deliveryCount: number;
  visitRate: number;
  takeoutRate: number;
  deliveryRate: number;
};

type TimeDayMonthlyRow = {
  yearMonth: string;
  weekday: number;
  hour: number;
  orderCount: number;
  sales: number;
  visitCount: number;
  takeoutCount: number;
  deliveryCount: number;
  visitRate: number;
  takeoutRate: number;
  deliveryRate: number;
};

type TimeRow = TimeDayDailyRow | TimeDayMonthlyRow;

const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100];

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const weekdayLabel = (w: number) => {
  const arr = ['', '월', '화', '수', '목', '금', '토', '일'];
  return arr[w] ?? '-';
};

const hourRangeLabel = (h: number) =>
  `${String(h).padStart(2, '0')}:00 ~ ${String(h).padStart(2, '0')}:59`;

export default function TimeReport() {
  const [storeId] = useState<number>(1);

  const today = new Date();
  const [end, setEnd] = useState<Date>(() => today);
  const [start, setStart] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6); // 최근 7일
    return d;
  });

  const [viewBy, setViewBy] = useState<ViewBy>('DAY');
  const [pageSize, setPageSize] = useState<number>(20);

  const [summary, setSummary] = useState<TimeDaySummary | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyChartPoint[]>([]);
  const [weekdayData, setWeekdayData] = useState<WeekdayChartPoint[]>([]);
  const [rows, setRows] = useState<TimeRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const startStr = useMemo(() => formatDateLocal(start), [start]);
  const endStr   = useMemo(() => formatDateLocal(end),   [end]);

  const weekdayRateText = useMemo(() => {
    const weekdaySales = summary?.weekdaySales ?? 0;
    const weekendSales = summary?.weekendSales ?? 0;
    const total = weekdaySales + weekendSales;
    if (!total) return { weekdayPercent: '—', weekendPercent: '—' };
    const wRate = (weekdaySales * 100) / total;
    const weRate = (weekendSales * 100) / total;
    return {
      weekdayPercent: fmtPercent1(wRate),
      weekendPercent: fmtPercent1(weRate),
    };
  }, [summary]);

  const hasAnyHourlyValue = (rows: HourlyChartPoint[] = []) =>
    rows?.some(r =>
      (r.sales ?? 0) > 0 ||
      (r.orders ?? 0) > 0 ||
      (r.visitOrders ?? 0) > 0 ||
      (r.takeoutOrders ?? 0) > 0 ||
      (r.deliveryOrders ?? 0) > 0
    );

  const EmptyState: React.FC<{ label?: string }> = ({ label = '데이터가 없습니다' }) => (
    <div className="flex items-center justify-center h-64 text-gray-500 bg-light-gray rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <span className="text-3xl">📭</span>
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );

  // ==========================
  // 조회 (테이블 + 카드 + 차트)
  // ==========================
  async function loadFirst() {
    setLoading(true);
    try {
      const rowsUrl =
        viewBy === 'DAY'
          ? '/api/analytics/time-day/day-rows'
          : '/api/analytics/time-day/month-rows';

      const [rowsRes, summaryRes, hourlyRes, weekdayRes] = await Promise.all([
        api.get<PageResp<TimeRow>>(rowsUrl, {
          params: {
            storeId,
            start: startStr,
            end: endStr,
            size: pageSize,
            cursor: null,
          },
        }),
        api.get<TimeDaySummary>('/api/analytics/time-day/summary', {
          params: { storeId },
        }),
        api.get<TimeHourlyPointDto[]>('/api/analytics/time-day/hourly-chart', {
          params: { storeId, start: startStr, end: endStr },
        }),
        api.get<WeekdaySalesPointDto[]>('/api/analytics/time-day/weekday-chart', {
          params: { storeId, start: startStr, end: endStr },
        }),
      ]);

      setRows(rowsRes.data.items);
      setCursor(rowsRes.data.nextCursor);

      setSummary(summaryRes.data);

      const hourly = (hourlyRes.data ?? []).map((p) => ({
        ...p,
        hourLabel: `${String(p.hour).padStart(2, '0')}:00`,
      }));
      setHourlyData(hourly);

      const weekday = (weekdayRes.data ?? []).map((p) => ({
        ...p,
        weekdayLabel: weekdayLabel(p.weekday),
      }));
      setWeekdayData(weekday);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const rowsUrl =
        viewBy === 'DAY'
          ? '/api/analytics/time-day/day-rows'
          : '/api/analytics/time-day/month-rows';

      const { data } = await api.get<PageResp<TimeRow>>(rowsUrl, {
        params: {
          storeId,
          start: startStr,
          end: endStr,
          size: pageSize,
          cursor,
        },
      });

      setRows((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

// ==========================
// PDF 다운로드
// ==========================
async function handleDownloadReport() {
  try {
    setDownloading(true);

    const { data } = await api.get<Blob>(
      '/api/analytics/time-day/report',
      {
        params: {
          // storeId는 어차피 백엔드에서 로그인 사용자 기준으로 사용하니까 안 보내도 됨
          start: startStr,
          end: endStr,
          viewBy,             // ✅ 일별/월별 상태 같이 전달
        },
        responseType: 'blob',
      } as any
    );

    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    const viewLabel = viewBy === 'DAY' ? 'day' : 'month';
    link.href = url;
    link.download = `time-day-report_${viewLabel}_${startStr}_${endStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('리포트 다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    setDownloading(false);
  }
}


  // 최초 1회 + storeId 변경시 기본 조회
  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const peakHourLabel =
    summary?.peakHour != null ? `${summary.peakHour}시` : '—';

  const offpeakHourLabel =
    summary?.offpeakHour != null ? `${summary.offpeakHour}시` : '—';

  const topWeekdayLabel =
    summary?.topWeekday != null ? `${weekdayLabel(summary.topWeekday)}요일` : '—';

  return (
    <div className="space-y-6">
      {/* 헤더 + 필터 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">시간/요일 분석</h1>
          <p className="text-sm text-gray-600">
            타임존: {tz} / 영업시간 07~20시 기준
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {/* 시작일 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                시작일: {start.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={start}
                onSelect={(d: any) => d && setStart(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* 종료일 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                종료일: {end.toLocaleDateString('ko-KR')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={end}
                onSelect={(d: any) => d && setEnd(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* 일별/월별 토글 */}
          <div className="flex rounded-md border bg-gray-50 overflow-hidden">
            <button
              className={`px-3 py-2 text-sm font-medium ${
                viewBy === 'DAY'
                  ? 'bg-kpi-red text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
              onClick={() => {
                if (viewBy !== 'DAY') {
                  setViewBy('DAY');
                  setRows([]);
                  setCursor(null);
                }
              }}
            >
              일별
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                viewBy === 'MONTH'
                  ? 'bg-kpi-red text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
              onClick={() => {
                if (viewBy !== 'MONTH') {
                  setViewBy('MONTH');
                  setRows([]);
                  setCursor(null);
                }
              }}
            >
              월별
            </button>
          </div>

          {/* 출력개수 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">출력개수</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border px-2 text-sm bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}개
                </option>
              ))}
            </select>
          </div>

          {/* 조회 버튼 */}
          <Button onClick={loadFirst} disabled={loading}>
            {loading ? '조회 중…' : '조회'}
          </Button>

          {/* 리포트 다운로드 (PDF) */}
          <Button onClick={handleDownloadReport} disabled={downloading}>
            <Download className="w-4 h-4 mr-2" />
            {downloading ? '다운로드 중…' : '리포트 다운로드'}
          </Button>
        </div>
      </div>

      {/* 상단 요약 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="피크 시간대"
          value={peakHourLabel}
          change={`매출: ₩${fmtMoneyInt(summary?.peakHourSales ?? 0)}`}
          icon={ThumbsUpIcon}
          color="red"
        />

        <KPICard
          title="비수 시간대"
          value={offpeakHourLabel}
          change={`매출: ₩${fmtMoneyInt(summary?.offpeakHourSales ?? 0)}`}
          icon={ThumbsDownIcon}
          color="orange"
        />

        <KPICard
          title="최고 매출 요일"
          value={topWeekdayLabel}
          change={`매출: ₩${fmtMoneyInt(summary?.topWeekdaySales ?? 0)}`}
          icon={CalendarHeart}
          color="green"
        />

        <KPICard
          title="주중 / 주말 매출 비율"
          value={
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">주중</span>
                <span className="font-semibold">
                  {weekdayRateText.weekdayPercent}{' '}
                  <span className="text-xs text-gray-500">
                    (₩{fmtMoneyInt(summary?.weekdaySales ?? 0)})
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">주말</span>
                <span className="font-semibold">
                  {weekdayRateText.weekendPercent}{' '}
                  <span className="text-xs text-gray-500">
                    (₩{fmtMoneyInt(summary?.weekendSales ?? 0)})
                  </span>
                </span>
              </div>
            </div>
          }
          icon={Percent}
          color="purple"
        />
      </div>

      {/* ===== 차트 영역 ===== */}
      {/* 1) 시간대별 차트 */}
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">시간대별 매출 & 주문수</h3>
          <BarChart3 className="w-5 h-5 text-kpi-red" />
        </div>
        {!hasAnyHourlyValue(hourlyData) ? (
          <EmptyState label="선택한 기간에 시간대별 데이터가 없습니다" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 매출 Bar */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">매출 (만원)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hourLabel" stroke="#6C757D" />
                  <YAxis stroke="#6C757D" />
                  <Tooltip
                    formatter={(value: any) => [`₩${(value / 10000).toFixed(0)}만`, '매출']}
                  />
                  <Bar dataKey="sales" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 주문수 Line + 유형별 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">주문수 / 주문유형</h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hourLabel" stroke="#6C757D" />
                  <YAxis stroke="#6C757D" />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      const label =
                        name === 'orders' ? '총 주문수' :
                        name === 'visitOrders' ? '매장 주문' :
                        name === 'takeoutOrders' ? '포장 주문' :
                        name === 'deliveryOrders' ? '배달 주문' :
                        name;
                      return [`${value}건`, label];
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="orders" name="총 주문수" stroke="#F77F00" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="visitOrders" name="매장 주문" stroke="#06D6A0" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="takeoutOrders" name="포장 주문" stroke="#FFD166" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="deliveryOrders" name="배달 주문" stroke="#4895EF" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      {/* 2) 요일별 차트 */}
      <Card className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">요일별 매출 & 주문수</h3>
          <Calendar className="w-5 h-5 text-kpi-green" />
        </div>
        {weekdayData.length === 0 ? (
          <EmptyState label="선택한 기간에 요일별 데이터가 없습니다" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="weekdayLabel" stroke="#6C757D" />
              <YAxis yAxisId="left" stroke="#6C757D" />
              <YAxis yAxisId="right" orientation="right" stroke="#6C757D" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === 'sales') {
                    return [`₩${(value / 10000).toFixed(0)}만`, '매출'];
                  }
                  if (name === 'orders') {
                    return [`${value}건`, '주문수'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" name="매출(만원)" fill="#FF6B6B" />
              <Bar yAxisId="right" dataKey="orders" name="주문수" fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ===== 테이블 영역 ===== */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-light-gray">
          <CardTitle className="text-base font-semibold text-gray-900">
            {viewBy === 'DAY'
              ? '시간/요일 분석 테이블 (일별)'
              : '시간/요일 분석 테이블 (월별)'}{' '}
            ({startStr} ~ {endStr})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {viewBy === 'DAY' ? (
                <>
                  <thead className="bg-light-gray border-b">
                    <tr>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">날짜</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">요일</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">시간대</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">주문수</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">매출액</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                        주문유형 비율 (매장/포장/배달)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as TimeDayDailyRow[]).map((r, i) => {
                      const total = r.orderCount || 0;
                      const visitRate = total ? r.visitRate * 100 : 0;
                      const takeoutRate = total ? r.takeoutRate * 100 : 0;
                      const deliveryRate = total ? r.deliveryRate * 100 : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-center text-sm text-gray-900">{r.orderDate}</td>
                          <td className="px-6 py-3 text-center text-sm text-gray-900">
                            {weekdayLabel(r.weekday)}요일
                          </td>
                          <td className="px-6 py-3 text-center text-sm text-gray-900">
                            {hourRangeLabel(r.hour)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            {r.orderCount.toLocaleString()}건
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            ₩{fmtMoneyInt(r.sales)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            매장 {fmtPercent1(visitRate)} / 포장 {fmtPercent1(takeoutRate)} / 배달 {fmtPercent1(deliveryRate)}
                          </td>
                        </tr>
                      );
                    })}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-dark-gray">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead className="bg-light-gray border-b">
                    <tr>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">월</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">요일</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">시간대</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">주문수</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">매출액</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                        주문유형 비율 (매장/포장/배달)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as TimeDayMonthlyRow[]).map((r, i) => {
                      const total = r.orderCount || 0;
                      const visitRate = total ? r.visitRate * 100 : 0;
                      const takeoutRate = total ? r.takeoutRate * 100 : 0;
                      const deliveryRate = total ? r.deliveryRate * 100 : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-center text-sm text-gray-900">{r.yearMonth}</td>
                          <td className="px-6 py-3 text-center text-sm text-gray-900">
                            {weekdayLabel(r.weekday)}요일
                          </td>
                          <td className="px-6 py-3 text-center text-sm text-gray-900">
                            {`${String(r.hour).padStart(2, '0')}시`}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            {r.orderCount.toLocaleString()}건
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            ₩{fmtMoneyInt(r.sales)}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-900 text-right">
                            매장 {fmtPercent1(visitRate)} / 포장 {fmtPercent1(takeoutRate)} / 배달 {fmtPercent1(deliveryRate)}
                          </td>
                        </tr>
                      );
                    })}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-dark-gray">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>

          {/* 더보기 */}
          {cursor && (
            <div className="px-6 py-4 border-t bg-light-gray flex justify-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? '불러오는 중…' : '더보기'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
