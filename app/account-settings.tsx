import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// --- PERUBAHAN ---
import { getProfile, UserRole } from "../api/auth";
import AboutAppModal from "../components/modal/about-app";
import { ChangeNameModal } from "../components/modal/ChangeNameModal";
import { ChangePasswordModal } from "../components/modal/ChangePasswordModal";
import { Colors } from "../constants/Colors";

// --- BARU: Tipe untuk data pengguna ---
type UserData = {
  username: string;
  email: string;
  profilePict: string | null;
  role: UserRole;
};

const AccountSettingsScreen: React.FC = () => {
  const router = useRouter();
  // --- PERUBAHAN: Gunakan state untuk data dinamis ---
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isPasswordModalVisible, setPasswordModalVisible] =
    useState<boolean>(false);
  const [isAboutAppModalVisible, setAboutAppModalVisible] =
    useState<boolean>(false);
  const [isNameModalVisible, setNameModalVisible] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  // --- BARU: useEffect untuk fetch data saat komponen dimuat ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const response = await getProfile();
      if (response && response.user) {
        setUserData(response.user);
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await AsyncStorage.multiRemove(["userToken", "userRole"]);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleChangeProfilePicture = async () => {
    // ... (logika ini bisa dihubungkan ke API uploadProfilePicture nanti)
    Alert.alert("Coming Soon", "This feature is under development.");
  };

  const handleSubmitPasswordChange = (passwords: {
    current: string;
    new: string;
  }) => {
    // ... (logika ini bisa dihubungkan ke API updateProfile nanti)
    console.log("Password data to send to backend:", passwords);
    Alert.alert("Success", "Your password has been changed successfully!");
  };

  const handleSubmitNameChange = (newName: string) => {
    // ... (logika ini bisa dihubungkan ke API updateProfile nanti)
    if (userData) {
      setUserData({ ...userData, username: newName });
    }
    setNameModalVisible(false);
    Alert.alert("Name Updated", "Your name has been successfully changed.");
  };

  // --- BARU: Tampilkan loading indicator ---
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      <View
        className="h-[40%] bg-secondary px-5"
        style={{ paddingTop: insets.top }}
      >
        <View className="items-center justify-center mt-12">
          <View>
            <Image
              // --- PERUBAHAN: Gunakan gambar dari state ---
              source={
                userData?.profilePict
                  ? { uri: userData.profilePict }
                  : require("../assets/images/pp.svg")
              }
              className="w-[110px] h-[110px] rounded-full border-4 border-white/80"
            />
            <TouchableOpacity
              className="absolute bottom-0.5 right-0.5 bg-primary rounded-full w-[30px] h-[30px] justify-center items-center border-2 border-white"
              onPress={handleChangeProfilePicture}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          {/* --- PERUBAHAN: Gunakan nama dari state --- */}
          <Text className="text-white text-3xl font-poppins-semibold mt-4">
            {userData?.username || "User"}
          </Text>
        </View>
      </View>

      <View className="flex-1 bg-white px-8 pt-5 rounded-t-[30px] -mt-8">
        <View className="w-[50px] h-[5px] bg-border rounded-full self-center mb-8" />
        <View className="w-full">
          {/* Email */}
          <View className="flex-row items-center py-4 border-b border-border">
            <Ionicons
              name="mail-outline"
              size={26}
              color={Colors.primary}
              className="mr-5"
            />
            <View>
              <Text className="text-lg font-poppins-semibold text-text">
                Email
              </Text>
              {/* --- PERUBAHAN: Gunakan email dari state --- */}
              <Text className="text-base text-textLight">
                {userData?.email || "..."}
              </Text>
            </View>
          </View>

          {/* Name */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={() => setNameModalVisible(true)}
          >
            <Ionicons
              name="person-outline"
              size={26}
              color={Colors.primary}
              className="mr-5"
            />
            <View className="flex-1">
              <Text className="text-lg font-poppins-semibold text-text">
                Name
              </Text>
              {/* --- PERUBAHAN: Gunakan nama dari state --- */}
              <Text className="text-base text-textLight">
                {userData?.username}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textLight}
            />
          </TouchableOpacity>

          {/* (Sisa komponen lainnya tetap sama) */}
          {/* Password */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={() => setPasswordModalVisible(true)}
          >
            <Ionicons
              name="key-outline"
              size={26}
              color={Colors.primary}
              className="mr-5"
            />
            <View className="flex-1">
              <Text className="text-lg font-poppins-semibold text-text">
                Password
              </Text>
              <Text className="text-base text-textLight">
                Change your password
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textLight}
            />
          </TouchableOpacity>

          {/* Add Account (Conditional) */}
          {/* --- PERUBAHAN: Gunakan role dari state --- */}
          {userData?.role === "SUPERUSER" && (
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-border"
              onPress={() => router.push("/adduser")}
            >
              <Ionicons
                name="person-add-outline"
                size={26}
                color={Colors.primary}
                className="mr-5"
              />
              <View className="flex-1">
                <Text className="text-lg font-poppins-semibold text-text">
                  Add Account
                </Text>
                <Text className="text-base text-textLight">
                  Create a new user profile
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.textLight}
              />
            </TouchableOpacity>
          )}

          {/* About App */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={() => setAboutAppModalVisible(true)}
          >
            <Ionicons
              name="information-circle-outline"
              size={26}
              color={Colors.primary}
              className="mr-5"
            />
            <View className="flex-1">
              <Text className="text-lg font-poppins-semibold text-text">
                About App
              </Text>
              <Text className="text-base text-textLight">
                Learn more about the app
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textLight}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-primary py-4 rounded-full w-full self-center items-center mt-auto mb-12"
          onPress={handleLogout}
        >
          <Text className="text-white text-lg font-poppins-bold">Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Components */}
      <ChangePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={handleSubmitPasswordChange}
      />
      <AboutAppModal
        visible={isAboutAppModalVisible}
        onClose={() => setAboutAppModalVisible(false)}
      />
      <ChangeNameModal
        visible={isNameModalVisible}
        onClose={() => setNameModalVisible(false)}
        onSubmit={handleSubmitNameChange}
        currentName={userData?.username || ""}
      />
    </View>
  );
};

export default AccountSettingsScreen;
