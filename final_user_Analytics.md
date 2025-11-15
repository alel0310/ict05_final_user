--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\front-end\src\components\Store\reports\OrderReport.tsx ---

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
                className={`px-3 py-2 text-sm font-medium ${ viewBy === 'DAY'
                    ? 'bg-kpi-red text-white'
                    : 'text-gray-700 hover:bg-white'
                }`}
                onClick={() => {
                if (viewBy !== 'DAY') {
                    setViewBy('DAY');
                    setRows([]);     // 🔹 rows 초기화
                    setCursor(null); // 🔹 cursor 초기화
                }
                }}
            >
                일별
            </button>
            <button
                className={`px-3 py-2 text-sm font-medium ${ viewBy === 'MONTH'
                    ? 'bg-kpi-red text-white'
                    : 'text-gray-700 hover:bg-white'
                }`}
                onClick={() => {
                if (viewBy !== 'MONTH') {
                    setViewBy('MONTH');
                    setRows([]);     // 🔹 rows 초기화
                    setCursor(null); // 🔹 cursor 초기화
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
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">날짜</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">주문ID</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">주문유형</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">총금액</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">메뉴수</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">결제수단</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">채널메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as OrderDailyRow[]).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-center text-sm text-gray-900">{r.orderDate}</td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">{r.orderId}</td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                          {orderTypeLabel[r.orderType] ?? r.orderType}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.totalPrice)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          {(r.menuCount ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">
                          {paymentTypeLabel[r.paymentType] ?? r.paymentType}
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-gray-900">
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
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">월</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">총매출</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">주문수</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">평균주문금액</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">배달매출</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">포장매출</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">매장매출</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(rows as OrderMonthlyRow[]).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-center text-sm text-gray-900">{r.yearMonth}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          ₩{fmtMoneyInt(r.totalSales)}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          {(r.orderCount ?? 0).toLocaleString()}
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

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\front-end\src\components\Store\reports\KpiReport.tsx ---

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CalendarIcon, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Calendar } from '../../../components/ui/calendar';
import { fmtMoneyInt, fmtUPT, fmtPercent1, tz } from '../../../lib/format';
import api from '../../../lib/authApi';

// ====== 로컬 타입(서비스 의존 제거, 파일 단독 사용 가능) ======
type ViewBy = 'DAY' | 'MONTH';

type KpiRow = {
  label: string; // 'YYYY-MM-DD' 또는 'YYYY-MM'
  sales: number;
  tx: number;
  upt: number;
  ads: number;
  aur: number;
};

type PageResp<T> = {
  items: T[];
  nextCursor: string | null;
};

// ✅ 백엔드 KpiSummaryDto와 필드 맞춤
type KpiSummary = {
  salesMtd: number;
  txMtd: number;
  unitsMtd: number;
  uptMtd: number;
  adsMtd: number;
  aurMtd: number;
  wowPercent?: number | null;
};

const PAGE_SIZE_OPTIONS = [20, 40, 60, 80, 100];

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // 예: 2025-11-14
}

export default function KpiReport() {
  const [storeId] = useState<number>(1); // 추후 상단 필터와 연동

  // 백엔드가 endInclusive(YYYY-MM-DD 그대로) + 내부에서 plusDays(1) 처리
  const today = new Date();

  const [end, setEnd] = useState<Date>(() => today);
  const [start, setStart] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6); // 오늘이 14일이면 8일로 설정
    return d;
  });
  const [viewBy, setViewBy] = useState<ViewBy>('DAY');

  const [pageSize, setPageSize] = useState<number>(20);

  const [rows, setRows] = useState<KpiRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<KpiSummary | null>(null);

  const startStr = useMemo(() => formatDateLocal(start), [start]);
  const endStr   = useMemo(() => formatDateLocal(end),   [end]);


  // ====== 데이터 로드 ======
  async function loadFirst() {
    setLoading(true);
    try {
      // 테이블: 조회기간 + viewBy + pageSize + cursor=null
      const { data: page } = await api.get<PageResp<KpiRow>>(
        '/api/analytics/kpi/rows',
        {
          params: {
            storeId,
            start: startStr,
            end: endStr,
            viewBy,
            size: pageSize,
            cursor: null,
          },
        }
      );
      setRows(page.items);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }

    // 요약 카드: 항상 "이번달 1일 ~ 어제(MTD)" 기준
    api
      .get<KpiSummary>('/api/analytics/kpi/summary', {
        params: { storeId },
      })
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const { data: page } = await api.get<PageResp<KpiRow>>(
        '/api/analytics/kpi/rows',
        {
          params: {
            storeId,
            start: startStr,
            end: endStr,
            viewBy,
            size: pageSize,
            cursor,
          },
        }
      );
      setRows((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  // 최초 1회 + storeId 변경 시에만 자동 조회
  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // 요약카드, 테이블 표시용 안전값
  const salesMtd = summary?.salesMtd ?? 0;
  const txMtd = summary?.txMtd ?? 0;
  const unitsMtd = summary?.unitsMtd ?? 0;
  const uptMtd = summary?.uptMtd ?? 0;
  const adsMtd = summary?.adsMtd ?? 0;
  const aurMtd = summary?.aurMtd ?? 0;
  const wowRaw = summary?.wowPercent ?? null;
  const wowText = wowRaw == null ? '—' : fmtPercent1(wowRaw);

  return (
    <div className="space-y-6">
      {/* 헤더 + 기간/뷰/출력개수/조회 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPI 분석</h1>
          <p className="text-sm text-gray-600">
            타임존: {tz} / 이번달 1일 ~ 어제 기준(MTD)
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
              className={`px-3 py-2 text-sm font-medium ${ viewBy === 'DAY'
                  ? 'bg-kpi-red text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
              onClick={() => setViewBy('DAY')}
            >
              일별
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${ viewBy === 'MONTH'
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

          {/* 리포트 다운로드 (TODO 유지) */}
          <Button onClick={() => { /* TODO: PDF/엑셀 다운로드 */ }}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 카드1: 매출 MTD */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>매출(MTD)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(salesMtd)}
          </CardContent>
        </Card>

        {/* 카드2: 주문수 MTD */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>주문수(MTD)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {txMtd.toLocaleString()}건
          </CardContent>
        </Card>

        {/* 카드3: KPI 3종(+Units) */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>KPI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Units(판매수량)</span>
              <span className="font-semibold">
                {unitsMtd.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">UPT(주문당 수량)</span>
              <span className="font-semibold">
                {fmtUPT(uptMtd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ADS(객단가)</span>
              <span className="font-semibold">
                ₩{fmtMoneyInt(adsMtd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">AUR(개당 단가)</span>
              <span className="font-semibold">
                ₩{fmtMoneyInt(aurMtd)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 카드4: WoW% */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>전주 대비 매출(WoW)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {wowText}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              어제 기준 최근 7일 vs 그 이전 7일
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== 테이블 영역 ===== */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-light-gray">
          <CardTitle className="text-base font-semibold text-gray-900">
            {viewBy === 'DAY' ? '일별 KPI' : '월별 KPI'} (조회기간: {startStr} ~ {endStr})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* --- 테이블 디자인 시작 --- */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-gray border-b">
                <tr>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    날짜/월
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    매출
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    주문수
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    UPT
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    ADS
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    AUR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-center text-sm text-gray-900">
                      {r.label}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right">
                      ₩{fmtMoneyInt(r.sales)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right">
                      {(r.tx ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right">
                      {fmtUPT(r.upt)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right">
                      ₩{fmtMoneyInt(r.ads)}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right">
                      ₩{fmtMoneyInt(r.aur)}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-dark-gray"
                    >
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* --- 테이블 디자인 끝 --- */}

          {/* 더보기 (커서 있으면 노출) */}
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

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\controller\AnalyticsRestController.java ---

package com.boot.ict05_final_user.domain.analytics.controller;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

// import com.boot.ict05_final_user.common.web.StoreScoped; // 실제에선 ArgumentResolver 등 사용

@RestController
@RequiredArgsConstructor
public class AnalyticsRestController {

	private final AnalyticsService service;

	/**
	 * KPI 요약 카드 조회 (로그인 점포 기준, MTD + WoW%)
	 *
	 * - 현재는 임시로 storeId를 쿼리 파라미터로 받음
	 *   (운영 시 @StoreScoped Long storeId 로 교체 예정)
	 */
	@GetMapping("/api/analytics/kpi/summary")
	public ResponseEntity<KpiSummaryDto> getKpiSummary(
			// @StoreScoped Long storeId
			@RequestParam(required = false) Long storeId // 임시 파라미터(로컬 테스트)
	) {
		if (storeId == null) storeId = 1L; // 임시 방어
		return ResponseEntity.ok(service.getKpiSummary(storeId));
	}

	/**
	 * KPI 테이블(일별/월별) 커서 페이징 조회
	 *
	 * @param start  조회 시작일 (YYYY-MM-DD, inclusive)
	 * @param end   조회 종료일 (YYYY-MM-DD, inclusive, 예: 2025-10-01이면 10월 1일 데이터까지 포함)	 * @param viewBy DAY or MONTH
	 * @param size   페이지 크기 (50/100/150/200/300)
	 * @param cursor 커서 (이전 응답의 nextCursor, 없으면 첫 페이지)
	 */
	@GetMapping("/api/analytics/kpi/rows")
	public ResponseEntity<CursorPage<KpiRowDto>> getKpiRows(
			// @StoreScoped Long storeId,
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "DAY") AnalyticsSearchDto.ViewBy viewBy,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Long storeId // 임시 파라미터 (운영시 @StoreScoped 교체)
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				java.time.LocalDate.parse(start),
				java.time.LocalDate.parse(end),
				viewBy, size, cursor
		);
		return ResponseEntity.ok(service.getKpiRows(storeId, cond));
	}


	// ======================
	// 주문 분석 Summary (상단 카드)
	// ======================
	@GetMapping("/api/analytics/orders/summary")
	public ResponseEntity<OrderSummaryDto> getOrderSummary(
			// @StoreScoped Long storeId
			Long storeId // 임시 파라미터(로컬 테스트). 운영 시 @StoreScoped로 교체
	) {
		if (storeId == null) storeId = 1L;
		return ResponseEntity.ok(service.getOrderSummary(storeId));
	}

	// ======================
	// 주문 분석 테이블 - 일별(주문 단위)
	// ======================
	@GetMapping("/api/analytics/orders/day-rows")
	public ResponseEntity<CursorPage<OrderDailyRowDto>> getOrderDailyRows(
			@RequestParam String start,
			@RequestParam String end,                 // 조회 종료일(포함)
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			Long storeId // 임시 파라미터(운영시 @StoreScoped 교체)
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.DAY,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getOrderDailyRows(storeId, cond));
	}

	// ======================
	// 주문 분석 테이블 - 월별(월 단위 집계)
	// ======================
	@GetMapping("/api/analytics/orders/month-rows")
	public ResponseEntity<CursorPage<OrderMonthlyRowDto>> getOrderMonthlyRows(
			@RequestParam String start,
			@RequestParam String end,
			@RequestParam(defaultValue = "50") Integer size,
			@RequestParam(required = false) String cursor,
			Long storeId
	) {
		if (storeId == null) storeId = 1L;
		AnalyticsSearchDto cond = new AnalyticsSearchDto(
				LocalDate.parse(start),
				LocalDate.parse(end),
				AnalyticsSearchDto.ViewBy.MONTH,
				size,
				cursor
		);
		return ResponseEntity.ok(service.getOrderMonthlyRows(storeId, cond));
	}


}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\service\AnalyticsService.java ---

package com.boot.ict05_final_user.domain.analytics.service;


import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.repository.AnalyticsRespositoryCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

	private final AnalyticsRespositoryCustom repo;
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");

	public KpiSummaryDto getKpiSummary(Long storeId) {
		LocalDate today = LocalDate.now(KST);
		return repo.fetchKpiSummary(storeId, today);
	}

	public CursorPage<KpiRowDto> getKpiRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchKpiRows(storeId, cond);
	}

	// ===== 주문 분석 =====
	public OrderSummaryDto getOrderSummary(Long storeId) {
		LocalDate today = LocalDate.now(KST);
		return repo.fetchOrderSummary(storeId, today);
	}

	public CursorPage<OrderDailyRowDto> getOrderDailyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchOrderDailyRows(storeId, cond);
	}

	public CursorPage<OrderMonthlyRowDto> getOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond) {
		return repo.fetchOrderMonthlyRows(storeId, cond);
	}

}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\repository\AnalyticsRepositoryImpl.java ---

package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import com.boot.ict05_final_user.domain.analytics.dto.AnalyticsSearchDto.ViewBy;
import com.boot.ict05_final_user.domain.order.entity.*;
import com.boot.ict05_final_user.domain.store.entity.QStore;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ConstantImpl;
import com.querydsl.core.types.dsl.*;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RequiredArgsConstructor
@Repository
public class AnalyticsRepositoryImpl implements AnalyticsRespositoryCustom {

	private final JPAQueryFactory query;

	private final QCustomerOrder co = QCustomerOrder.customerOrder;
	private final QCustomerOrderDetail cod = QCustomerOrderDetail.customerOrderDetail;
	private final QStore s = QStore.store;

	// =========================
	//  KPI Summary (카드 4개)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public KpiSummaryDto fetchKpiSummary(Long storeId, LocalDate today) {

		// 기준 시간 (KST 기준 LocalDate 들어온다고 가정)
		LocalDateTime todayStart = today.atStartOfDay();
		LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

		// 어제 D, 최근7일/이전7일
		LocalDate d = today.minusDays(1);                  // 어제
		LocalDateTime l7Start = d.minusDays(6).atStartOfDay(); // [D-6, D+1)
		LocalDateTime l7EndEx = todayStart;
		LocalDateTime p7Start = d.minusDays(13).atStartOfDay(); // [D-13, D-6)
		LocalDateTime p7EndEx = l7Start;

		// 스캔 범위: MTD와 P7/L7 전체를 모두 포함하도록 min(monthStart, p7Start)
		LocalDateTime scanStart = monthStart.isBefore(p7Start) ? monthStart : p7Start;

		// 공통 WHERE: 상태 + 점포 + 스캔 범위
		BooleanExpression base = statusCompleted() 
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, scanStart, todayStart));

		// co.totalPrice(BigDecimal) 기반 CASE 합계들
		NumberExpression<BigDecimal> salesMtdExpr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, monthStart, todayStart))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<Long> txMtdExpr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, monthStart, todayStart))
				.then(1L).otherwise(0L).sum();

		NumberExpression<BigDecimal> salesL7Expr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, l7Start, l7EndEx))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> salesP7Expr = new CaseBuilder()
				.when(betweenClosedOpen(co.orderedAt, p7Start, p7EndEx))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		Tuple t = query
				.select(salesMtdExpr, txMtdExpr, salesL7Expr, salesP7Expr)
				.from(co)
				.join(co.store, s)
				.where(base)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		BigDecimal salesMtdBD = nvlBD(t == null ? null : t.get(salesMtdExpr));
		long txMtd            = nvlLong(t == null ? null : t.get(txMtdExpr));
		BigDecimal salesL7BD  = nvlBD(t == null ? null : t.get(salesL7Expr));
		BigDecimal salesP7BD  = nvlBD(t == null ? null : t.get(salesP7Expr));

		// Units_MTD (상세 테이블 cod 기준 별도 스캔)
		Integer unitsMtdInt = query
				.select(cod.quantity.sum())
				.from(cod)
				.join(co).on(cod.order.id.eq(co.id))
				.join(co.store, s)
				.where(
						statusCompleted(),
					eqStore(storeId),
						betweenClosedOpen(co.orderedAt, monthStart, todayStart)
				)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		long unitsMtd = (unitsMtdInt == null) ? 0L : unitsMtdInt.longValue();

		// 파생 계산(Java)
		long salesMtd = salesMtdBD.longValue();
		long salesL7  = salesL7BD.longValue();
		long salesP7  = salesP7BD.longValue();

		double upt = safeDiv(unitsMtd, txMtd);         // UPT = units / tx
		long ads   = Math.round(safeDiv(salesMtd, txMtd));   // ADS(객단가)
		long aur   = Math.round(safeDiv(salesMtd, unitsMtd)); // AUR(단가)

		Double wow = (salesP7 == 0L)
				? null
				: round1(((salesL7 - salesP7) * 100.0) / salesP7);

		return new KpiSummaryDto(salesMtd, txMtd, unitsMtd, upt, ads, aur, wow);
	}

	// =========================
	//  KPI Rows (일별/월별, 커서 페이징)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<KpiRowDto> fetchKpiRows(Long storeId, AnalyticsSearchDto cond) {
		boolean byMonth = cond.viewBy() == ViewBy.MONTH;
		int size = (cond.size() == null ? 50 : cond.size());

		// 기간 (열림-닫힘) : [start 00:00, end 00:00)
		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		// 공통 WHERE
		BooleanExpression filter = statusCompleted() 
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		// 라벨 (일별 or 월별)
		StringExpression dayLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m-%d"));
		StringExpression monthLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m"));
		StringExpression labelExpr = byMonth ? monthLabel : dayLabel;

		// 커서(최근순) - label 문자열 비교 (YYYY-MM[-DD] 포맷이므로 문자열 비교 = 날짜 역순)
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			filter = filter.and(labelExpr.lt(cond.cursor()));
		}

		// 1) 매출/주문수 기본 집계 (co만 스캔 → 중복 합계 방지)
		NumberExpression<BigDecimal> salesSum = co.totalPrice.sum();     // BigDecimal
		NumberExpression<Long> txCount = co.id.countDistinct();          // Long

		List<Tuple> rows = query
				.select(labelExpr, salesSum, txCount)
				.from(co)
				.join(co.store, s)
				.where(filter)
				.groupBy(labelExpr)
				.orderBy(labelExpr.desc())
				.limit(size + 1) // 다음 커서 유무 확인용으로 +1
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<KpiRowDto> items = new ArrayList<>();
		if (rows.isEmpty()) {
			return new CursorPage<>(items, null);
		}

		boolean hasNext = rows.size() > size;
		List<Tuple> pageRows = hasNext ? rows.subList(0, size) : rows;

		// 현재 페이지 라벨만 추출
		List<String> labels = new ArrayList<>(pageRows.size());
		for (Tuple t : pageRows) {
			labels.add(t.get(labelExpr));
		}

		// 2) 수량(units) 집계: cod 기준, label 기준으로 SUM(quantity)
		Map<String, Long> unitsMap = new HashMap<>();
		if (!labels.isEmpty()) {
			List<Tuple> unitRows = query
					.select(labelExpr, cod.quantity.sum())
					.from(cod)
					.join(cod.order, co)
					.join(co.store, s)
					.where(
							statusCompleted(),
						eqStore(storeId),
							betweenClosedOpen(co.orderedAt, start, endEx),
							labelExpr.in(labels)
					)
					.groupBy(labelExpr)
					.setHint("org.hibernate.readOnly", true)
					.setHint("org.hibernate.flushMode", "COMMIT")
					.setHint("jakarta.persistence.query.timeout", 3000)
					.fetch();

			for (Tuple t : unitRows) {
				String label = t.get(labelExpr);
				Integer unitsInt = t.get(1, Integer.class);
				long units = (unitsInt == null) ? 0L : unitsInt.longValue();
				unitsMap.put(label, units);
			}
		}

		// 3) DTO 변환 + 파생 KPI 계산
		for (Tuple t : pageRows) {
			String label = t.get(labelExpr);
			BigDecimal salesBD = nvlBD(t.get(salesSum));
			long sales = salesBD.longValue();
			long tx = nvlLong(t.get(txCount));
			long units = unitsMap.getOrDefault(label, 0L);

			double upt = safeDiv(units, tx);
			long ads = Math.round(safeDiv(sales, tx));    // 객단가
			long aur = Math.round(safeDiv(sales, units)); // 단가

			items.add(new KpiRowDto(label, sales, tx, upt, ads, aur));
		}

		String nextCursor = null;
		if (hasNext) {
			Tuple last = pageRows.get(pageRows.size() - 1);
			nextCursor = last.get(labelExpr); // YYYY-MM-DD or YYYY-MM
		}

		return new CursorPage<>(items, nextCursor);
	}

	// =========================
	//  주문 분석 Summary (카드 4개)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public OrderSummaryDto fetchOrderSummary(Long storeId, LocalDate today) {

		LocalDateTime todayStart = today.atStartOfDay();
		LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

		BooleanExpression base = statusCompleted() 
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, monthStart, todayStart)); // 이번달 1일 ~ 어제까지

		NumberExpression<BigDecimal> deliverySalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> takeoutSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> visitSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<Long> orderCountExpr = co.id.countDistinct();

		Tuple t = query
				.select(deliverySalesExpr, takeoutSalesExpr, visitSalesExpr, orderCountExpr)
				.from(co)
				.join(co.store, s)
				.where(base)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetchOne();

		BigDecimal deliveryBD = nvlBD(t == null ? null : t.get(deliverySalesExpr));
		BigDecimal takeoutBD  = nvlBD(t == null ? null : t.get(takeoutSalesExpr));
		BigDecimal visitBD    = nvlBD(t == null ? null : t.get(visitSalesExpr));
		long orderCount       = nvlLong(t == null ? null : t.get(orderCountExpr));

		return new OrderSummaryDto(
			deliveryBD.longValue(),
			takeoutBD.longValue(),
			visitBD.longValue(),
			orderCount
		);
	}

	// =========================
	//  주문 분석 일별 테이블(주문 단위)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<OrderDailyRowDto> fetchOrderDailyRows(Long storeId, AnalyticsSearchDto cond) {
		int size = (cond.size() == null ? 50 : cond.size());

		// [start 00:00, end+1 00:00)
		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression filter = statusCompleted() 
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		// 🔹 커서: "마지막 주문 ID" 기준으로만 사용
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			try {
				Long lastId = Long.valueOf(cond.cursor());
				filter = filter.and(co.id.lt(lastId));
			} catch (NumberFormatException ignore) {
				// 잘못된 커서 값이면 그냥 무시하고 처음 페이지처럼 동작
			}
		}

		// 🔹 메뉴 수량 합계 (상세 테이블 기준)
		NumberExpression<Integer> menuCountExpr = cod.quantity.sum();

		List<Tuple> rows = query
				.select(
						co.orderedAt,
						co.id,
						co.orderCode,
						co.orderType,
						co.totalPrice,
						menuCountExpr,
						co.paymentType,
						co.memo
				)
				.from(co)
				.join(co.store, s)
				// ⭐ 여기 추가: 주문 ↔ 주문상세 조인 (LEFT JOIN)
				.leftJoin(cod).on(cod.order.id.eq(co.id))
				.where(filter)
				.groupBy(
						co.orderedAt,
						co.id,
						co.orderCode,
						co.orderType,
						co.totalPrice,
						co.paymentType,
						co.memo
				)
				// 🔹 화면 정렬: 날짜 내림차순 + 같은 날은 ID 내림차순
				.orderBy(co.orderedAt.desc(), co.id.desc())
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<OrderDailyRowDto> items = new ArrayList<>();
		List<Tuple> pageRows = rows.size() > size ? rows.subList(0, size) : rows;

		for (Tuple t : pageRows) {
			LocalDateTime orderedAt = t.get(co.orderedAt);
			Long orderId            = t.get(co.id);
			String orderCode        = t.get(co.orderCode);
			OrderType orderType     = t.get(co.orderType);
			BigDecimal totalPriceBD = nvlBD(t.get(co.totalPrice));
			Integer menuCountInt    = t.get(menuCountExpr);
			PaymentType payType     = t.get(co.paymentType);
			String memo             = t.get(co.memo);

			String orderDate = orderedAt.toLocalDate().toString();
			long totalPrice  = totalPriceBD.longValue();
			long menuCount   = menuCountInt == null ? 0L : menuCountInt.longValue();

			items.add(new OrderDailyRowDto(
					orderDate,
					orderId,
					orderCode,
					orderType != null ? orderType.name() : null,
					totalPrice,
					menuCount,
					payType != null ? payType.name() : null,
					memo
			));
		}

		String nextCursor = null;
		if (rows.size() > size) {
			Tuple last = rows.get(size - 1);
			Long lastId = last.get(co.id);
			if (lastId != null) {
				nextCursor = String.valueOf(lastId); // 🔹 커서 = 마지막 주문 ID
			}
		}

		return new CursorPage<>(items, nextCursor);
	}



	// =========================
	//  주문 분석 월별 테이블(월 단위 집계)
	// =========================
	@Override
	@Transactional(readOnly = true)
	public CursorPage<OrderMonthlyRowDto> fetchOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond) {
		int size = (cond.size() == null ? 50 : cond.size());

		LocalDateTime start = cond.startDate().atStartOfDay();
		LocalDateTime endEx = cond.endDate().plusDays(1).atStartOfDay();

		BooleanExpression filter = statusCompleted() 
				.and(eqStore(storeId))
				.and(betweenClosedOpen(co.orderedAt, start, endEx));

		StringExpression monthLabel = Expressions.stringTemplate(
				"DATE_FORMAT({0}, {1})", co.orderedAt, ConstantImpl.create("%Y-%m"));

		// 커서: 최근 월 기준 (YYYY-MM) 내려가기
		if (cond.cursor() != null && !cond.cursor().isBlank()) {
			filter = filter.and(monthLabel.lt(cond.cursor()));
		}

		NumberExpression<BigDecimal> totalSalesExpr = co.totalPrice.sum();
		NumberExpression<Long>       orderCountExpr = co.id.countDistinct();

		NumberExpression<BigDecimal> deliverySalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.DELIVERY))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> takeoutSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.TAKEOUT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		NumberExpression<BigDecimal> visitSalesExpr = new CaseBuilder()
				.when(co.orderType.eq(OrderType.VISIT))
				.then(co.totalPrice)
				.otherwise(Expressions.constant(BigDecimal.ZERO))
				.sum();

		List<Tuple> rows = query
				.select(
						monthLabel,
						totalSalesExpr,
						orderCountExpr,
						deliverySalesExpr,
						takeoutSalesExpr,
						visitSalesExpr
				)
				.from(co)
				.join(co.store, s)
				.where(filter)
				.groupBy(monthLabel)
				.orderBy(monthLabel.desc())
				.limit(size + 1)
				.setHint("org.hibernate.readOnly", true)
				.setHint("org.hibernate.flushMode", "COMMIT")
				.setHint("jakarta.persistence.query.timeout", 3000)
				.fetch();

		List<OrderMonthlyRowDto> items = new ArrayList<>();
		List<Tuple> pageRows = rows.size() > size ? rows.subList(0, size) : rows;

		for (Tuple t : pageRows) {
			String ym = t.get(monthLabel);

			BigDecimal totalSalesBD = nvlBD(t.get(totalSalesExpr));
			long totalSales         = totalSalesBD.longValue();
			long orderCount         = nvlLong(t.get(orderCountExpr));

			BigDecimal deliveryBD = nvlBD(t.get(deliverySalesExpr));
			BigDecimal takeoutBD  = nvlBD(t.get(takeoutSalesExpr));
			BigDecimal visitBD    = nvlBD(t.get(visitSalesExpr));

			long delivery = deliveryBD.longValue();
			long takeout  = takeoutBD.longValue();
			long visit    = visitBD.longValue();

			long avgOrderAmount = Math.round(safeDiv(totalSales, orderCount));

			items.add(new OrderMonthlyRowDto(
					ym,
					totalSales,
					orderCount,
					avgOrderAmount,
					delivery,
					takeout,
					visit
			));
		}

		String nextCursor = null;
		if (rows.size() > size) {
			Tuple last = rows.get(size - 1);
			String lastYm = last.get(monthLabel);
			nextCursor = lastYm;
		}

		return new CursorPage<>(items, nextCursor);
	}



	// ===== Helpers =====
	private static BigDecimal nvlBD(BigDecimal v) {
		return v == null ? BigDecimal.ZERO : v;
	}

	private static long nvlLong(Long v) {
		return v == null ? 0L : v;
	}

	private static double safeDiv(long num, long den) {
		return den == 0L ? 0.0 : (double) num / (double) den;
	}

	private static double round1(double v) {
		return Math.round(v * 10.0) / 10.0;
	}

	private BooleanExpression statusCompleted() {
		// Enum 매핑(@Enumerated STRING) → 그대로 enum 비교
		return co.status.eq(OrderStatus.COMPLETED);
	}

	private BooleanExpression eqStore(Long storeId) {
		return s.id.eq(storeId);
	}

	/**
	 * 닫힌–열린(>=, <) 기간 필터 (LocalDateTime 기준)
	 */
	private BooleanExpression betweenClosedOpen(DateTimePath<LocalDateTime> col,
																	LocalDateTime start, LocalDateTime endEx) {
		return col.goe(start).and(col.lt(endEx));
	}
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\repository\AnalyticsRespositoryCustom.java ---

package com.boot.ict05_final_user.domain.analytics.repository;

import com.boot.ict05_final_user.domain.analytics.dto.*;
import java.time.LocalDate;

public interface AnalyticsRespositoryCustom {

	// KPI
	KpiSummaryDto fetchKpiSummary(Long storeId, LocalDate today);
	CursorPage<KpiRowDto> fetchKpiRows(Long storeId, AnalyticsSearchDto cond);

	// 주문 분석
	OrderSummaryDto fetchOrderSummary(Long storeId, LocalDate today);
	CursorPage<OrderDailyRowDto> fetchOrderDailyRows(Long storeId, AnalyticsSearchDto cond);
	CursorPage<OrderMonthlyRowDto> fetchOrderMonthlyRows(Long storeId, AnalyticsSearchDto cond);
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\OrderSummaryDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 상단 카드 요약 DTO.
 * - 기간: 이번달 1일 ~ 어제까지 매출 (today 00:00 기준 MTD)
 * - 기준: 단일 storeId, 상태 COMPLETED, KST
 */
public record OrderSummaryDto(
		long deliverySalesMtd, // 배달 매출
		long takeoutSalesMtd,  // 포장 매출
		long visitSalesMtd,    // 방문 매출
		long orderCountMtd     // 주문수
) {
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\OrderMonthlyRowDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 월별 테이블 한 행 (월 단위 집계).
 */
public record OrderMonthlyRowDto(
		String yearMonth,      // YYYY-MM
		long totalSales,       // 총매출
		long orderCount,       // 주문수
		long avgOrderAmount,   // 평균주문금액 = totalSales / orderCount
		long deliverySales,    // 배달 매출
		long takeoutSales,     // 포장 매출
		long visitSales        // 매장 매출
) {
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\OrderDailyRowDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * 주문 분석 일별 테이블 한 행 (주문 1건 기준).
 */
public record OrderDailyRowDto(
		String orderDate,   // YYYY-MM-DD
		Long orderId,
		String orderCode,
		String orderType,   // VISIT / TAKEOUT / DELIVERY
		long totalPrice,    // 총금액
		long menuCount,     // 메뉴수(수량 합)
		String paymentType, // CARD / CASH / VOUCHER / EXTERNAL
		String channelMemo  // 메모(채널 메모 등)
) {
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\KpiSummaryDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

/**
 * KPI 요약 카드용 DTO.
 *
 * - Sales_MTD : 이번달 1일 ~ 어제까지 매출 합계
 * - Tx_MTD    : 이번달 1일 ~ 어제까지 주문 건수
 * - Units_MTD : 이번달 1일 ~ 어제까지 판매 수량 합계
 * - UPT_MTD   : Units_MTD / Tx_MTD
 * - ADS_MTD   : Sales_MTD / Tx_MTD
 * - AUR_MTD   : Sales_MTD / Units_MTD
 * - WoW%      : 최근 7일 vs 그 이전 7일 매출 증감률
 */
public record KpiSummaryDto(
		long salesMtd,      // ₩
		long txMtd,         // 건
		long unitsMtd,      // 판매 수량
		double uptMtd,      // 단위/건
		long adsMtd,        // ₩/건 (반올림)
		long aurMtd,        // ₩/단위 (반올림)
		Double wowPercent   // null 가능 (분모 0 보호)
) { } 

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\AnalyticsSearchDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

import java.time.LocalDate;

public record AnalyticsSearchDto(
		LocalDate startDate, // 조회 시작일 (inclusive)
		LocalDate endDate,   // 조회 종료일 (inclusive, YYYY-MM-DD 그대로)
		ViewBy viewBy,       // DAY or MONTH
		Integer size,        // 50/100/150/200/300
		String cursor        // null or "YYYY-MM-DD" / "YYYY-MM"
) {
	public enum ViewBy { DAY, MONTH }
}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\CursorPage.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

import java.util.List;

/** [더보기] 커서 페이징 응답 */
public record CursorPage<T>(List<T> items, String nextCursor) {}

--- FILE: D:\Workspace_IntelliJ\Final_Project\ict05_final_user\src\main\java\com\boot\ict05_final_user\domain\analytics\dto\KpiRowDto.java ---

package com.boot.ict05_final_user.domain.analytics.dto;

/** KPI 테이블 한 행 (일별/월별 공용) */
public record KpiRowDto(
		String label,    // YYYY-MM-DD 또는 YYYY-MM
		long sales,      // 매출액 합
		long tx,         // 주문수 합
		double upt,      // 판매수량/주문수
		long ads,        // 매출/주문수 (객단가, 반올림)
		long aur         // 매출/판매수량 (단가, 반올림)
) {}
