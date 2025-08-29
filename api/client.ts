import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:2000";

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (e) {
    console.error("Failed to fetch the auth token from storage", e);
    return null;
  }
};

/**
 * Fungsi terpusat untuk semua permintaan API.
 * @param endpoint - Path API setelah '/api', contoh: '/auth/login'.
 * @param method - Metode HTTP (GET, POST, PUT, PATCH, DELETE).
 * @param body - Body permintaan untuk metode POST, PUT, PATCH.
 * @param isProtected - Tentukan apakah endpoint ini memerlukan token otentikasi.
 */
export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any,
  isProtected: boolean = true
) => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (isProtected) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

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
    if (error.message.includes("Network request failed")) {
      Alert.alert(
        "Connection Error",
        "Could not connect to the server. Please check your network."
      );
    }
    return null;
  }
};
