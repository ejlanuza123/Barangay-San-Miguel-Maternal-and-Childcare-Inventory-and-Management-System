export const isPushNotificationSupported = () => {
  if (typeof window === "undefined") return false;

  return "Notification" in window;
};

export const requestAndStorePushSubscription = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error("Push notification permission was not granted.");
  }

  return true;
};

export const disablePushSubscription = async () => {
  return;
};

export const showLocalNotification = (title, options = {}) => {
  if (!isPushNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  return new Notification(title, {
    icon: "/logo192.png",
    ...options,
  });
};
