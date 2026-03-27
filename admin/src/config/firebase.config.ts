/**
 * @file firebase.config.ts
 * @description Firebase Cloud Messaging — fully lazy-loaded (dynamic imports).
 *
 * The firebase package is loaded at runtime only (on demand, post-auth).
 * This ensures the Vite/Rollup build succeeds even before `npm install firebase`
 * has been run. No static imports from `firebase/*` are present in this file.
 *
 * 🔧 PRODUCTION SETUP:
 * 1. Run:  npm install firebase         (inside /admin)
 * 2. Set VITE_FIREBASE_* env vars (or edit placeholder fallbacks below)
 * 3. Deploy public/firebase-messaging-sw.js alongside the app
 * 4. Call getFCMToken() after the user has authenticated
 *
 * REQUIRED ENV VARS:
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY  (for Web Push)
 */

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'YOUR_FIREBASE_API_KEY',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'YOUR_PROJECT.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'YOUR_PROJECT_ID',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || 'YOUR_MESSAGING_SENDER_ID',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || 'YOUR_APP_ID',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMsg = any;

let _messaging: AnyMsg | null = null;
let _onMsgFn: ((m: AnyMsg, cb: (p: unknown) => void) => () => void) | null = null;
let _getTokenFn: ((m: AnyMsg, opts?: { vapidKey?: string }) => Promise<string>) | null = null;

async function ensureMessaging(): Promise<AnyMsg | null> {
  if (_messaging) return _messaging;

  try {
    // Resolve module IDs at runtime to keep Firebase optional until enabled/installed.
    const firebaseAppModule = `firebase/${'app'}`;
    const firebaseMessagingModule = `firebase/${'messaging'}`;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { initializeApp } = await import(/* @vite-ignore */ firebaseAppModule);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { getMessaging, onMessage, getToken } = await import(/* @vite-ignore */ firebaseMessagingModule);

    const app = initializeApp(firebaseConfig);
    _messaging = getMessaging(app);
    _onMsgFn = onMessage;
    _getTokenFn = getToken;
    return _messaging;
  } catch (error) {
    console.warn('Firebase not available (run: npm install firebase in /admin):', error);
    return null;
  }
}

/** Request FCM push token — call post-auth after notification permission granted. */
export async function getFCMToken(): Promise<string | null> {
  const messaging = await ensureMessaging();
  if (!messaging || !_getTokenFn) return null;

  try {
    if (!('serviceWorker' in navigator)) return null;

    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    } catch {
      // SW registration optional — continue
    }

    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }

    const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined);
    const token: string = await _getTokenFn(messaging, { vapidKey });
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/** Subscribe to foreground FCM messages. Returns unsubscribe function. */
export function onFCMMessage(callback: (payload: unknown) => void): () => void {
  let unsubscribed = false;
  let cleanup: (() => void) | null = null;

  void ensureMessaging().then((messaging) => {
    if (!messaging || !_onMsgFn || unsubscribed) return;
    cleanup = _onMsgFn(messaging, callback);
  });

  return () => {
    unsubscribed = true;
    cleanup?.();
  };
}

/** Register FCM token on backend after authentication. */
export async function registerFCMTokenWithBackend(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/mobile/fcm/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ token, userId, platform: 'web', userAgent: navigator.userAgent }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface FCMPayload {
  notification?: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    badge?: string;
    tag?: string;
    color?: string;
  };
  data?: Record<string, string>;
}
