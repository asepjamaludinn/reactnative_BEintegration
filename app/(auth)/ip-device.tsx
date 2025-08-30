import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { onboardDevice } from "../../api/auth";
import FullLogo from "../../assets/images/fulldmouv.svg";
import { Colors } from "../../constants/Colors";

export default function RegisterDeviceScreen() {
  const [uniqueId, setUniqueId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<boolean>(false);
  const router = useRouter();

  const validateField = () => {
    if (!uniqueId.trim()) {
      setError("Device ID cannot be empty.");
      return false;
    }
    setError("");
    return true;
  };

  const handleRegisterDevice = async () => {
    if (!validateField()) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await onboardDevice({ uniqueId: uniqueId.trim() });
      if (response) {
        Alert.alert("Success", "Device registered successfully!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      }
    } catch (error) {
      console.error("Onboarding failed unexpectedly:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center p-5"
      >
        <View className="items-center mb-8">
          <FullLogo width={280} height={60} className="mb-5" />
          <Text
            className="font-poppins-medium text-2xl text-primary text-center mt-2"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.4)",
              textShadowOffset: { width: 1.5, height: 1.5 },
              textShadowRadius: 2,
            }}
          >
            Register a New Device
          </Text>
          <Text className="font-poppins-extralight text-base text-primary text-center mt-2">
            Enter the unique ID from the sticker on your physical device.
          </Text>
        </View>

        <View className="bg-cardgray rounded-2xl p-6 shadow-lg shadow-black/25">
          <View className="mb-5">
            <Text className="font-poppins-semibold text-lg text-primary mb-2">
              Device ID
            </Text>
            <TextInput
              className={`border rounded-xl px-4 h-12 text-base font-roboto-regular text-text bg-white shadow-sm ${
                focusedInput ? "border-primary border-2" : "border-border"
              } ${!!error ? "border-redDot" : ""}`}
              style={{ lineHeight: 20 }}
              placeholder="Example: dmouv-utama"
              placeholderTextColor={Colors.textLight}
              value={uniqueId}
              onChangeText={(text) => {
                setUniqueId(text);
                if (error) setError("");
              }}
              autoCapitalize="none"
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
            />
            {error ? (
              <Text className="text-redDot font-roboto-regular text-xs mt-1 pl-1">
                {error}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            className={`py-4 rounded-2xl items-center mt-2.5 ${
              isLoading ? "bg-primary/70" : "bg-primary"
            }`}
            onPress={handleRegisterDevice}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text className="font-poppins-bold text-lg text-white">
                Register Device
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
