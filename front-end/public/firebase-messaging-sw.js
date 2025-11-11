/* firebase-messaging-sw.js — 백그라운드 알림 표시용 SW (compat 사용) */
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA7m5jVdo-w7TBG6h6wW4h6mc5gbNjqYlU",
  authDomain: "ict05-final.firebaseapp.com",
  projectId: "ict05-final",
  storageBucket: "ict05-final.firebasestorage.app",
  messagingSenderId: "382264607725",
  appId: "1:382264607725:web:a8187a0a64f88667045de4",
  measurementId: "G-VLKM1XP7ZG"
});

const messaging = firebase.messaging();

// 서버에서 data 포함 시 여기서 직접 표시
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || '알림';
  const body  = payload?.notification?.body  || '';
  const link  = (payload?.data && payload.data.link) || '/';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    data: { link }
  });
});

// 알림 클릭 시 라우팅
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(clients.openWindow(url));
});
