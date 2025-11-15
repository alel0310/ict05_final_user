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
