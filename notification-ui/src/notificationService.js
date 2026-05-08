const API_BASE = 'http://4.224.186.213/evaluation-service/notifications';

export async function fetchNotifications({ limit = 50, page = 1, notificationType = '' } = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set('limit', limit);
  url.searchParams.set('page', page);
  if (notificationType) {
    url.searchParams.set('notification_type', notificationType);
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  const token = process.env.REACT_APP_API_TOKEN;
  const clientId = process.env.REACT_APP_CLIENT_ID;
  const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
  const accessCode = process.env.REACT_APP_ACCESS_CODE;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (clientId && clientSecret) {
    const basic = btoa(`${clientId}:${clientSecret}`);
    headers.Authorization = `Basic ${basic}`;
  } else if (accessCode) {
    headers.Authorization = `Bearer ${accessCode}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Notification fetch failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return Array.isArray(data.notifications) ? data.notifications : [];
}
