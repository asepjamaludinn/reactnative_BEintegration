import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Ganti dengan IP Address lokal Anda (sama seperti di auth.ts)
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
  method: "GET" | "POST" | "PATCH",
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

export const getDevices = () => {
  // CATATAN: Endpoint ini diasumsikan ada di backend Anda.
  // Anda perlu menambahkan route `GET /api/devices` di backend
  // yang mengembalikan semua perangkat dari database.
  return apiRequest(`/device`, "GET");
};

export const getDeviceSettings = (deviceId: string) => {
  return apiRequest(`/settings/${deviceId}`, "GET");
};

export const getLatestDeviceStatus = (deviceId: string) => {
  // Kita ambil entri terakhir untuk mengetahui status terakhir
  const endpoint = `/sensorHistory?deviceId=${deviceId}&limit=1&sortBy=createdAt&sortOrder=desc`;
  return apiRequest(endpoint, "GET");
};

export const controlDevice = (
  deviceId: string,
  action: "turn_on" | "turn_off"
) => {
  return apiRequest(`/device/${deviceId}/action`, "POST", { action });
};

export const updateDeviceSettings = (
  deviceId: string,
  settings: { autoModeEnabled?: boolean; scheduleEnabled?: boolean }
) => {
  return apiRequest(`/settings/${deviceId}`, "PATCH", settings);
};

export const getHistory = (params: URLSearchParams) => {
  return apiRequest(`/sensorHistory?${params.toString()}`, "GET");
};
