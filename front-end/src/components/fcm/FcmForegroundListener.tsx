// src/components/fcm/FcmForegroundListener.tsx
import { useEffect, useRef } from "react";
import { getMessaging, onMessage, isSupported } from "firebase/messaging";

type Props = {
  onNavigate?: (path: string) => void; // SPA 내비게이션이 필요하면 주입 (Layout의 onPageChange 연결)
};

export default function FcmForegroundListener({ onNavigate }: Props) {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return; // Hot reload 중복 방지
    mounted.current = true;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      const supported = await isSupported().catch(() => false);
      if (!supported) return;

      // 알림 권한 보정(최초 한 번)
      if (Notification.permission === "default") {
        try { await Notification.requestPermission(); } catch {}
      }

      const messaging = getMessaging();
      unsubscribe = onMessage(messaging, async (payload) => {
        const title = payload.notification?.title ?? payload.data?.title ?? "알림";
        const body  = payload.notification?.body  ?? payload.data?.body  ?? "";
        const link  = payload.data?.link ?? "/";

        // 포어그라운드일 때도 보이도록 페이지에서 직접 띄움
        const showInPage = async () => {
          try {
            // 페이지 알림
            const n = new Notification(title, { body, data: { link } });
            n.onclick = () => {
              window.focus();
              // SPA 내비게이션을 쓰고 싶으면 onNavigate 사용
              if (onNavigate && link.startsWith("/")) {
                onNavigate(link);
              } else {
                // 단순 이동
                const base = window.location.origin; 
                window.location.href = link.startsWith("/") ? (base + link) : link;
              }
            };
          } catch {
            // Notification API가 막힌 환경이면 SW로 대체 표시
            const reg = await navigator.serviceWorker?.ready;
            await reg?.showNotification(title, { body, data: { link } });
          }
        };

        // 포어그라운드에선 우리가, 백그라운드에선 SW가 처리
        if (document.visibilityState === "visible") {
          await showInPage();
        }
      });
    })();

    return () => { try { unsubscribe?.(); } catch {} };
  }, [onNavigate]);

  return null;
}
