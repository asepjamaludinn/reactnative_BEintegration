import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Pastikan URL ini sama dengan yang ada di file auth.ts dan device.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:2000";

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (e) {
    console.error("Failed to fetch the auth token from storage", e);
    return null;
  }
};

const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: any
) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication token not found.");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage =
        responseData.error || "An unexpected error occurred.";
      Alert.alert("Error", errorMessage);
      console.error("API Error:", responseData);
      return null;
    }

    return responseData;
  } catch (error: any) {
    console.error(`API request failed: ${error.message}`);
    Alert.alert(
      "Connection Error",
      "Could not connect to the server. Please check your network."
    );
    return null;
  }
};

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
