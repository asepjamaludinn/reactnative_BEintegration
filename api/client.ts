import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (e) {
    console.error("Failed to fetch the auth token from storage", e);
    return null;
  }
};

/**
 * @param endpoint - Path API setelah '/api', contoh: '/auth/login'.
 * @param method - Metode HTTP (GET, POST, PUT, PATCH, DELETE).
 * @param body - Body permintaan. Bisa berupa objek biasa (untuk JSON) atau FormData (untuk upload file).
 * @param isProtected - Tentukan apakah endpoint ini memerlukan token otentikasi.
 */
export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any,
  isProtected: boolean = true
) => {
  try {
    const headers: HeadersInit = {};

    if (isProtected) {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    let requestBody: BodyInit | null = null;

    if (body) {
      if (body instanceof FormData) {
        requestBody = body;
      } else {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method,
      headers,
      body: requestBody,
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
