import { apiRequest } from "./client";

export const getNotifications = () => {
  return apiRequest("/notifications", "GET");
};

/**
 * Menghapus notifikasi berdasarkan ID-nya (NotificationRead ID).
 * @param notificationReadId
 */
export const deleteNotification = (notificationReadId: string) => {
  return apiRequest(`/notifications/${notificationReadId}`, "DELETE");
};
