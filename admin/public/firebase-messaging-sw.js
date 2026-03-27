/* eslint-disable no-undef */
// Firebase messaging service worker for web push notifications.
// Replace placeholder values with your Firebase Web config in production.

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || 'FasoTravel Admin';
    const options = {
      body: payload?.notification?.body || 'Nouvelle notification',
      icon: payload?.notification?.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload?.data || {},
    };

    self.registration.showNotification(title, options);
  });
} catch (error) {
  console.warn('Firebase SW init warning:', error);
}
