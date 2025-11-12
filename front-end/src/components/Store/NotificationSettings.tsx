import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/authApi';
import { Bell, AlertTriangle, Clock3, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { KPICard } from '../Common/KPICard';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

type Pref = {
  catNotice: boolean;
  catStockLow: boolean;
  catExpireSoon: boolean;
  storeId?: number;
};

export default function NotificationSettings() {
  const [pref, setPref] = useState<Pref | null>(null);
  const [applySubs, setApplySubs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/fcm/pref/me');
        setPref({
          catNotice: !!data.catNotice,
          catStockLow: !!data.catStockLow,
          catExpireSoon: !!data.catExpireSoon,
          storeId: data.storeId ?? undefined,
        });
      } catch (e: any) {
        console.error('[FCM] pref load error', e);
        toast.error('알림 설정을 불러오지 못했습니다.');
        setPref({ catNotice: true, catStockLow: true, catExpireSoon: true });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requestPerm = async () => {
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p === 'granted') {
        toast.success('알림 권한이 허용되었습니다.');
      } else {
        toast.warning('알림 권한이 차단되었습니다. 브라우저 설정에서 변경할 수 있습니다.');
      }
    } catch {
      toast.error('알림 권한을 요청하는 중 오류가 발생했습니다.');
    }
  };

  const save = async () => {
    if (!pref) return;
    try {
      await api.put(
        '/fcm/pref/me',
        {
          catNotice: pref.catNotice,
          catStockLow: pref.catStockLow,
          catExpireSoon: pref.catExpireSoon,
        },
        { params: { applySubscriptions: applySubs } }
      );
      toast.success('저장되었습니다.');
    } catch (e: any) {
      console.error('[FCM] pref save error', e);
      toast.error('저장에 실패했습니다.');
    }
  };

  const storeIdText = useMemo(() => (pref?.storeId ? String(pref.storeId) : '-'), [pref?.storeId]);

  if (loading || !pref) {
    return (
      <div className="p-6 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">알림 설정</h1>
          <p className="text-sm text-gray-600 mt-1">공지/재고부족/유통임박 알림 구독과 수신 상태를 관리합니다.</p>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="공지 수신"
          value={pref.catNotice ? 'ON' : 'OFF'}
          icon={Bell}
          color="green"
          footerText={`Topic: store-${storeIdText}`}
        />
        <KPICard
          title="재고부족 수신"
          value={pref.catStockLow ? 'ON' : 'OFF'}
          icon={AlertTriangle}
          color="orange"
          footerText={`Topic: inv-low-${storeIdText}`}
        />
        <KPICard
          title="유통임박 수신"
          value={pref.catExpireSoon ? 'ON' : 'OFF'}
          icon={Clock3}
          color="red"
          footerText={`Topic: expire-soon-${storeIdText}`}
        />
      </div>

      {/* 카테고리 구독 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 구독 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-gray-200">
            <SettingRow
              title="공지 수신"
              description={`본사 공지 토픽을 구독합니다. (store-${storeIdText})`}
              checked={pref.catNotice}
              onCheckedChange={(v) => setPref({ ...pref, catNotice: v })}
            />
            <SettingRow
              title="재고부족 수신"
              description={`재고 임계치 미만 상황을 수신합니다. (inv-low-${storeIdText})`}
              checked={pref.catStockLow}
              onCheckedChange={(v) => setPref({ ...pref, catStockLow: v })}
            />
            <SettingRow
              title="유통임박 수신"
              description={`유통기한 임박 알림을 수신합니다. (expire-soon-${storeIdText})`}
              checked={pref.catExpireSoon}
              onCheckedChange={(v) => setPref({ ...pref, catExpireSoon: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 브라우저 알림 권한 */}
      <Card>
        <CardHeader>
          <CardTitle>브라우저 알림 권한</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {perm === 'granted' ? (
              <span className="flex items-center gap-1 text-green-700">
                <ShieldCheck className="w-4 h-4" /> 알림 권한이 허용되었습니다.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-700">
                <ShieldAlert className="w-4 h-4" /> 알림 권한이 차단되었습니다.
              </span>
            )}
          </div>
          <Button variant="outline" onClick={requestPerm}>
            권한 재요청
          </Button>
        </CardContent>
      </Card>

      {/* 저장 */}
      <div className="flex justify-end items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Switch
            id="apply-subs-immediately"
            checked={applySubs}
            onCheckedChange={setApplySubs}
          />
          <Label htmlFor="apply-subs-immediately" className="text-sm text-gray-700">
            저장 시 “즉시 구독/해제 반영”
          </Label>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.history.back()}>
            취소
          </Button>
          <Button onClick={save}>설정 저장</Button>
        </div>
      </div>
    </div>
  );
}

/** 설정 항목 한 줄 */
function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = `setting-${title.replace(/\s+/g, '-')}`;
  return (
    <div className="py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <Label htmlFor={id} className="font-medium text-gray-900">
          {title}
        </Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
