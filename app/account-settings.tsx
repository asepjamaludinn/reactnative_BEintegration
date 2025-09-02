import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  UserRole,
} from "../api/auth";
import AboutAppModal from "../components/modal/about-app";
import { ChangeNameModal } from "../components/modal/ChangeNameModal";
import { ChangePasswordModal } from "../components/modal/ChangePasswordModal";
import { Colors } from "../constants/Colors";

type UserData = {
  id: string;
  username: string;
  email: string;
  profilePict: string | null;
  role: UserRole;
  updatedAt: string;
};

const AccountSettingsScreen: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isPasswordModalVisible, setPasswordModalVisible] =
    useState<boolean>(false);
  const [isAboutAppModalVisible, setAboutAppModalVisible] =
    useState<boolean>(false);
  const [isNameModalVisible, setNameModalVisible] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  const fetchUserData = async () => {
    setIsLoading(true);
    const response = await getProfile();
    if (response && response.user) {
      setUserData(response.user);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          if (userData?.role === "SUPERUSER") {
            await AsyncStorage.setItem("justLoggedOut", "true");
          }
          await AsyncStorage.multiRemove(["userToken", "userRole"]);
          router.replace("/(auth)/onboarding");
        },
      },
    ]);
  };

  const handleChangeProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need permission to access your photos to set a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const localUri = asset.uri;
    const filename = localUri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append("profilePict", {
      uri: localUri,
      name: filename,
      type,
    } as any);

    setIsUploading(true);
    const response = await uploadProfilePicture(formData);
    setIsUploading(false);

    if (response && response.user) {
      setUserData((prevData) =>
        prevData ? { ...prevData, ...response.user } : null
      );
      Alert.alert("Success", "Profile picture has been updated!");
    }
  };

  // --- [PERBAIKAN] ---
  // Fungsi ini sekarang mengirimkan password lama dan baru ke API
  const handleSubmitPasswordChange = async (passwords: {
    current: string;
    new: string;
  }) => {
    setIsSubmitting(true);
    const response = await updateProfile({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
    setIsSubmitting(false);

    // Jika response tidak null, berarti sukses.
    // Jika gagal, apiRequest sudah menampilkan alert error dari backend.
    if (response) {
      setPasswordModalVisible(false);
      Alert.alert("Success", "Your password has been changed successfully!");
    }
  };

  const handleSubmitNameChange = async (newName: string) => {
    if (!newName.trim()) return;
    setIsSubmitting(true);
    const response = await updateProfile({ username: newName });
    setIsSubmitting(false);
    if (response && response.user) {
      setUserData((prevData) =>
        prevData ? { ...prevData, ...response.user } : null
      );
      setNameModalVisible(false);
      Alert.alert("Success", "Your name has been updated successfully.");
    }
  };

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
              source={
                userData?.profilePict
                  ? { uri: userData.profilePict }
                  : require("../assets/images/pp.svg")
              }
              className="w-[110px] h-[110px] rounded-full border-4 border-white/80"
            />
            {isUploading && (
              <View className="absolute inset-0 bg-black/50 rounded-full justify-center items-center">
                <ActivityIndicator color={Colors.white} />
              </View>
            )}
            <TouchableOpacity
              className="absolute bottom-0.5 right-0.5 bg-primary rounded-full w-[30px] h-[30px] justify-center items-center border-2 border-white"
              onPress={handleChangeProfilePicture}
              disabled={isUploading}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
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
            <View className="mr-5">
              <Ionicons name="mail-outline" size={26} color={Colors.primary} />
            </View>
            <View>
              <Text className="text-lg font-poppins-semibold text-text">
                Email
              </Text>
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
            <View className="mr-5">
              <Ionicons
                name="person-outline"
                size={26}
                color={Colors.primary}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-poppins-semibold text-text">
                Name
              </Text>
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

          {/* Password */}
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-border"
            onPress={() => setPasswordModalVisible(true)}
          >
            <View className="mr-5">
              <Ionicons name="key-outline" size={26} color={Colors.primary} />
            </View>
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

          {userData?.role === "SUPERUSER" && (
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-border"
              onPress={() => router.push("/adduser")}
            >
              <View className="mr-5">
                <Ionicons
                  name="person-add-outline"
                  size={26}
                  color={Colors.primary}
                />
              </View>
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
            <View className="mr-5">
              <Ionicons
                name="information-circle-outline"
                size={26}
                color={Colors.primary}
              />
            </View>
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

      <ChangePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={handleSubmitPasswordChange}
        isSubmitting={isSubmitting}
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
        isSubmitting={isSubmitting}
      />
    </View>
  );
};

export default AccountSettingsScreen;
