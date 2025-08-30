import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { API_URL, apiRequest } from "./client";

export type UserRole = "SUPERUSER" | "USER";

export const login = async (email: string, password: string) => {
  return apiRequest("/auth/login", "POST", { email, password }, false);
};

export const onboardDevice = async (data: { uniqueId: string }) => {
  return apiRequest("/device/onboarding", "POST", data, true);
};

export const resetPassword = async (email: string, newPassword: string) => {
  return apiRequest(
    "/auth/forgot-password",
    "POST",
    { email, newPassword },
    false
  );
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
  return apiRequest(
    "/auth/create-user",
    "POST",
    { username, email, password, confirmPassword, role },
    true
  );
};

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
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) throw new Error("Authentication token not found.");

    const response = await fetch(`${API_URL}/api/auth/upload-profile-picture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
