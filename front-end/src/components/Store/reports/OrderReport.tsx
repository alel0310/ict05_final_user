import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CalendarIcon, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { fmtMoneyInt, tz } from '../../../lib/format';
import api from '../../../lib/authApi';

type ViewBy = 'DAY' | 'MONTH';

type PageResp<T> = {
  items: T[];
  nextCursor: string | null;
};

type OrderSummary = {
  deliverySalesMtd: number;
  takeoutSalesMtd: number;
  visitSalesMtd: number;
  orderCountMtd: number;
};

type OrderDailyRow = {
  orderDate: string;
  orderId: number;
  orderCode: string;
  orderType: string;    // VISIT/TAKEOUT/DELIVERY
  totalPrice: number;
  menuCount: number;
  paymentType: string;  // CARD/CASH/VOUCHER/EXTERNAL
  channelMemo?: string | null;
};

type OrderMonthlyRow = {
  yearMonth: string;
  totalSales: number;
  orderCount: number;
  avgOrderAmount: number;
  deliverySales: number;
  takeoutSales: number;
  visitSales: number;
};

type OrderRow = OrderDailyRow | OrderMonthlyRow;

const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100];

const orderTypeLabel: Record<string, string> = {
  DELIVERY: '배달',
  TAKEOUT: '포장',
  VISIT: '매장',
};

const paymentTypeLabel: Record<string, string> = {
  CARD: '카드',
  CASH: '현금',
  VOUCHER: '상품권',
  EXTERNAL: '외부 결제',
};

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function OrderReport() {
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

  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startStr = useMemo(() => formatDateLocal(start), [start]);
  const endStr   = useMemo(() => formatDateLocal(end),   [end]);

  // 상단 카드만 따로 로드
  async function loadSummary() {
    try {
      const { data } = await api.get<OrderSummary>('/api/analytics/orders/summary', {
        params: { storeId },
      });
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }

  // 테이블 조회 (일별/월별 공용)
  async function loadFirst() {
    setLoading(true);
    try {
      const url =
        viewBy === 'DAY'
          ? '/api/analytics/orders/day-rows'
          : '/api/analytics/orders/month-rows';

      const { data } = await api.get<PageResp<OrderRow>>(url, {
        params: {
          storeId,
          start: startStr,
          end: endStr,
          size: pageSize,
          cursor: null,
        },
      });

      setRows(data.items);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }

    // 카드 동시 갱신
    loadSummary();
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const url =
        viewBy === 'DAY'
          ? '/api/analytics/orders/day-rows'
          : '/api/analytics/orders/month-rows';

      const { data } = await api.get<PageResp<OrderRow>>(url, {
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

  // 최초 1회 + store 변경 시 자동 조회
  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const deliveryMtd = summary?.deliverySalesMtd ?? 0;
  const takeoutMtd  = summary?.takeoutSalesMtd ?? 0;
  const visitMtd    = summary?.visitSalesMtd ?? 0;
  const orderCountMtd = summary?.orderCountMtd ?? 0;

  return (
    <div className="space-y-6">
      {/* 헤더 + 필터 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">주문 분석</h1>
          <p className="text-sm text-gray-600">
            타임존: {tz} / 상단 카드는 이번달 1일 ~ 어제 기준(MTD)
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
              onClick={() => setViewBy('DAY')}
            >
              일별
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                viewBy === 'MONTH'
                  ? 'bg-kpi-red text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
              onClick={() => setViewBy('MONTH')}
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

          {/* 리포트 다운로드(향후 PDF/엑셀) */}
          <Button onClick={() => { /* TODO: PDF/엑셀 다운로드 */ }}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 상단 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>배달 매출(MTD)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(deliveryMtd)}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>포장 매출(MTD)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(takeoutMtd)}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>매장 매출(MTD)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(visitMtd)}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>주문수(MTD)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {orderCountMtd.toLocaleString()}건
          </CardContent>
        </Card>
      </div>

      {/* 테이블 */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-light-gray">
          <CardTitle className="text-base font-semibold text-gray-900">
            {viewBy === 'DAY' ? '주문 분석 (일별 / 주문 단위)' : '주문 분석 (월별 집계)'}
            {' '}({startStr} ~ {endStr})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {viewBy === 'DAY' ? (
                <>
                  <thead className="bg-light-gray border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">날짜</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">주문ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">주문유형</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">총금액</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">메뉴수</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">결제수단</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">채널메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as OrderDailyRow[]).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{r.orderDate}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{r.orderId}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {orderTypeLabel[r.orderType] ?? r.orderType}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.totalPrice)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          {r.menuCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {paymentTypeLabel[r.paymentType] ?? r.paymentType}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {r.channelMemo || '-'}
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-dark-gray">
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
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">월</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">총매출</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">주문수</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">평균주문금액</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">배달매출</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">포장매출</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">매장매출</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as OrderMonthlyRow[]).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{r.yearMonth}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.totalSales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          {r.orderCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.avgOrderAmount)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.deliverySales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.takeoutSales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.visitSales)}
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-dark-gray">
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
