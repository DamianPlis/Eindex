importScripts("https://www.gstatic.com/firebasejs/9.27.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.27.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAcGIhuBtSsXAtvbCCfjRgxDTrKs45DtDM",
  authDomain: "eindex-fe0ae.firebaseapp.com",
  projectId: "eindex-fe0ae",
  storageBucket: "eindex-fe0ae.firebasestorage.app",
  messagingSenderId: "479220145537",
  appId: "1:479220145537:web:43079d6f870edc09e69c80",
  measurementId: "G-0G4M4VD4VQ",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Eindex";
    const options = {
      body: payload.notification?.body || "",
      icon: payload.notification?.icon || "/favicon.ico",
      data: payload.data || {},
    };
    self.registration.showNotification(title, options);
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification?.data?.url || "/";
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const c of clientList) {
          if (c.url === url && "focus" in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
        return null;
      }),
    );
  });
} catch {}
