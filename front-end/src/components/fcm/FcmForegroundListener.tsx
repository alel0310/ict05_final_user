// src/components/fcm/FcmForegroundListener.tsx
import { useEffect, useRef } from "react";
import { onForegroundMessage } from "../../lib/firebase"; // ← 공용 헬퍼 사용

type Props = {
  onNavigate?: (path: string) => void; // Layout의 navigateByLink 주입
};

function normalizeLink(raw?: string): string {
  const origin = window.location.origin;
  const base = origin + "/user";
  if (!raw) return base;
  try {
    const u = new URL(raw, base);
    // 동일 출처만 허용
    if (u.origin !== origin) return base;
    return u.toString();
  } catch {
    return base;
  }
}

export default function FcmForegroundListener({ onNavigate }: Props) {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    // 포그라운드 수신
    const unsubPromise = onForegroundMessage(async (payload) => {
      // payload.notification 우선, 없으면 data 사용
      const title = payload?.notification?.title ?? payload?.data?.title ?? "알림";
      const body  = payload?.notification?.body  ?? payload?.data?.body  ?? "";
      const link  = normalizeLink(payload?.data?.link);

      // 가시 상태에서만 UI 표시 (백그라운드는 SW가 표시)
      if (document.visibilityState !== "visible") return;

      const show = async () => {
        // 브라우저 권한 허용 시: 시스템 알림
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = new Notification(title, { body, data: { link } });
            n.onclick = () => {
              window.focus();
              // SPA 내비게이션을 쓰고 싶으면 onNavigate 사용
              if (onNavigate) onNavigate(link);
              else window.location.href = link;
            };
            return;
          }
        } catch { /* ignore */ }

        // 권한 거부/불가: SW로 대체 표시(일부 브라우저에서 허용)
        try {
          const reg = await navigator.serviceWorker?.ready;
          await reg?.showNotification?.(title, { body, data: { link } });
        } catch {
          // 최후: 단순 이동 버튼 토스트 등으로 대체 (필요 시 프로젝트 토스트 컴포넌트 연동)
          // e.g., toast(title + " - " + body)
          console.log("[FCM] Foreground:", title, body);
        }
      };

      await show();
    });

    // onForegroundMessage는 즉시 리스너 등록이므로 특별한 해제 함수가 없습니다.
    // 필요 시 헬퍼를 수정해 해제 함수를 제공하도록 확장 가능.
    return () => {
      // 현재 구현에서는 해제 로직 없음
      void unsubPromise;
    };
  }, [onNavigate]);

  return null;
}
