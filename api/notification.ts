import { apiRequest } from "./client";

export const getNotifications = () => {
  return apiRequest("/notifications", "GET");
};

/**
 * Mendapatkan jumlah notifikasi yang belum dibaca.
 */
export const getUnreadCount = () => {
  return apiRequest("/notifications/unread-count", "GET");
};

/**
 * Menandai semua notifikasi sebagai sudah dibaca.
 */
export const markAllAsRead = () => {
  return apiRequest("/notifications/mark-all-as-read", "POST");
};

/**
 * Menghapus notifikasi berdasarkan ID-nya (NotificationRead ID).
 * @param notificationReadId
 */
export const deleteNotification = (notificationReadId: string) => {
  return apiRequest(`/notifications/${notificationReadId}`, "DELETE");
};
