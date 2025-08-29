import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// Ganti dengan IP Address lokal Anda agar bisa diakses dari HP
// Contoh: "http://192.168.1.10:2000"
// Jangan gunakan "http://localhost:2000" jika testing di HP fisik
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:2000"; // 10.0.2.2 untuk emulator Android

export type UserRole = "SUPERUSER" | "USER";

// Fungsi untuk mendapatkan token dari penyimpanan
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken");
  } catch (e) {
    console.error("Failed to fetch the auth token from storage", e);
    return null;
  }
};

// Fungsi pembantu untuk melakukan request API
const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any,
  isProtected: boolean = false
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
      // Menggunakan pesan error dari backend jika ada
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

// --- Fungsi Spesifik untuk Endpoint Auth ---

export const login = async (email: string, password: string) => {
  return apiRequest("/auth/login", "POST", { email, password });
};

export const onboardDevice = async (
  ip_address: string,
  wifi_ssid: string,
  wifi_password: string
) => {
  // Endpoint ini dilindungi, butuh token
  return apiRequest(
    "/device/onboarding",
    "POST",
    { ip_address, wifi_ssid, wifi_password },
    true
  );
};

export const resetPassword = async (email: string, newPassword: string) => {
  return apiRequest("/auth/forgot-password", "POST", { email, newPassword });
};

export const getProfile = async () => {
  return apiRequest("/auth/profile", "GET", null, true);
};

export const createUser = async (
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
  role: "USER" | "SUPERUSER"
) => {
  // Endpoint ini dilindungi, butuh token
  return apiRequest(
    "/auth/create-user",
    "POST",
    { username, email, password, confirmPassword, role },
    true
  );
};

// Fungsi untuk menyimpan sesi pengguna
export const storeUserSession = async (token: string, role: UserRole) => {
  try {
    await AsyncStorage.setItem("userToken", token);
    await AsyncStorage.setItem("userRole", role);
  } catch (e) {
    console.error("Failed to save user session", e);
    Alert.alert("Error", "Could not save user session.");
  }
};

export const updateProfile = async (updateData: {
  username?: string;
  password?: string;
}) => {
  return apiRequest("/auth/profile", "PUT", updateData, true);
};

export const uploadProfilePicture = async (formData: FormData) => {
  // Untuk upload file, kita butuh fetch yang sedikit berbeda
  try {
    const token = await getAuthToken();
    if (!token) throw new Error("Authentication token not found.");

    const response = await fetch(`${API_URL}/api/auth/upload-profile-picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Content-Type' akan di-set otomatis oleh fetch saat menggunakan FormData
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      const errorMessage =
        responseData.error || "An unexpected error occurred.";
      Alert.alert("Error", errorMessage);
      return null;
    }
    return responseData;
  } catch (error: any) {
    console.error(`API request failed: ${error.message}`);
    Alert.alert("Connection Error", "Could not connect to the server.");
    return null;
  }
};
