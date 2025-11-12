// firebase.ts — Firebase 초기화 & FCM 도우미
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getMessaging, isSupported as messagingSupported, getToken, onMessage, Messaging } from 'firebase/messaging';

// 1) Firebase 구성 — Vite의 환경변수 사용
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

// (옵션) GA 사용 시
analyticsSupported().then((ok) => { if (ok) getAnalytics(firebaseApp); });

// 2) Messaging 인스턴스 보장
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  const ok = await messagingSupported();
  if (!ok) return null;
  return getMessaging(firebaseApp);
}

// 3) 브라우저 권한 요청 + 토큰 발급
export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  // 1) SW 경로를 base('/user/')에 맞춰 안전 등록
  const swUrl = (import.meta.env.BASE_URL || '/') + 'firebase-messaging-sw.js';
  const reg =
    (await navigator.serviceWorker.getRegistration(swUrl)) ||
    (await navigator.serviceWorker.register(swUrl, {
      scope: import.meta.env.BASE_URL || '/',
    }));

  // 2) 권한
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return null;

  // 3) 토큰 발급
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
    serviceWorkerRegistration: reg,
  });

  if (token) localStorage.setItem('fcm_token', token); // ⬅️ 디버깅/로그아웃용
  return token ?? null;
}

// 4) 포그라운드 메시지 리스너 (앱 켜진 상태에서 토스트 등)
export async function bindOnMessage(callback: (payload: any) => void) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;
  onMessage(messaging, callback);
}
