import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { apiRequest } from "./client";

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
  currentPassword?: string;
  newPassword?: string;
}) => {
  const payload = {
    username: updateData.username,
    currentPassword: updateData.currentPassword,
    newPassword: updateData.newPassword,
  };
  return apiRequest("/auth/profile", "PUT", payload, true);
};

/**
 * @param formData - Objek FormData yang berisi file gambar.
 */
export const uploadProfilePicture = async (formData: FormData) => {
  return apiRequest("/auth/upload-profile-picture", "POST", formData, true);
};
