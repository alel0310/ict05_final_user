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

type KpiSummary = {
  sales: number;
  tx: number;
  upt: number;
  ads: number;
  aur: number;
  wowPercent?: number;
};

export default function KpiReport() {
  const [storeId] = useState<number>(1); // 추후 상단 필터와 연동
  // 백엔드가 endExclusive(다음날 00:00) 기준이면 아래 날짜가 자연스럽게 맞음
  const [start, setStart] = useState<Date>(new Date('2025-09-01'));
  const [end, setEnd] = useState<Date>(new Date('2025-10-01'));
  const [viewBy, setViewBy] = useState<ViewBy>('DAY');

  const [rows, setRows] = useState<KpiRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<KpiSummary | null>(null);

  const startStr = useMemo(() => start.toISOString().slice(0, 10), [start]);
  const endStr   = useMemo(() => end.toISOString().slice(0, 10),   [end]);

  // ====== 데이터 로드 ======
  async function loadFirst() {
    setLoading(true);
    try {
      const { data: page } = await api.get<PageResp<KpiRow>>(
        '/api/analytics/kpi/rows',
        { params: { storeId, start: startStr, end: endStr, viewBy, size: 50, cursor: null } }
      );
      setRows(page.items);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }

    // 요약은 실패해도 화면은 뜨게
    api.get<KpiSummary>('/api/analytics/kpi/summary', {
      params: { storeId, start: startStr, end: endStr }
    })
      .then(res => setSummary(res.data))
      .catch(() => setSummary(null));
  }

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const { data: page } = await api.get<PageResp<KpiRow>>(
        '/api/analytics/kpi/rows',
        { params: { storeId, start: startStr, end: endStr, viewBy, size: 50, cursor } }
      );
      setRows(prev => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, startStr, endStr, viewBy]);

  // 요약카드 안전값(백엔드 없으면 wowPercent -100)
  const wow = summary?.wowPercent ?? -100;

  return (
    <div className="space-y-6">
      {/* 헤더 + 기간/뷰 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPI 분석</h1>
          <p className="text-sm text-gray-600">타임존: {tz}</p>
        </div>
        <div className="flex flex-wrap gap-2">
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

          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-2 text-sm ${
                viewBy === 'DAY' ? 'bg-gray-900 text-white' : 'bg-white'
              }`}
              onClick={() => setViewBy('DAY')}
            >
              일별
            </button>
            <button
              className={`px-3 py-2 text-sm ${
                viewBy === 'MONTH' ? 'bg-gray-900 text-white' : 'bg-white'
              }`}
              onClick={() => setViewBy('MONTH')}
            >
              월별
            </button>
          </div>

          <Button onClick={() => {/* TODO: 다운로드 핸들러 */}}>
            <Download className="w-4 h-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>매출</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">₩{fmtMoneyInt(summary?.sales)}</CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>주문수</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {(summary?.tx ?? 0).toLocaleString()}건
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>UPT</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {fmtUPT(summary?.upt)}
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>ADS</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(summary?.ads)}
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader><CardTitle>AUR</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            ₩{fmtMoneyInt(summary?.aur)}
          </CardContent>
        </Card>
      </div>

      {/* 전주/전월 대비(있으면) */}
      <div className="text-sm text-gray-600">
        전주 대비: {fmtPercent1(wow)}
      </div>

      {/* ===== 테이블 영역 ===== */}
      <Card className="bg-white rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-light-gray">
          <CardTitle className="text-base font-semibold text-gray-900">
            {viewBy === 'DAY' ? '일별 KPI' : '월별 KPI'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* --- 테이블 디자인 시작 --- */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-gray border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    날짜/월
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    매출
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    주문수
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    UPT
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    ADS
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    AUR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">
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

          {cursor && (
            <div className="px-6 py-4 border-t bg-light-gray flex justify-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? '불러오는 중…' : '다음 페이지'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
