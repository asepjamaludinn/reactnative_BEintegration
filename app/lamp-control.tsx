import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import resolveConfig from "tailwindcss/resolveConfig";
import { controlDevice, updateDeviceSettings } from "../api/device";
import LampIcon from "../assets/images/leddua.svg";
import { Colors } from "../constants/Colors";
import { useDevices } from "../context/DeviceContext";
import tailwindConfig from "../tailwind.config.js";

const fullConfig = resolveConfig(tailwindConfig);
const themeColors = fullConfig.theme.colors as any;
const TRACK_WIDTH = 76;
const TRACK_HEIGHT = 40;
const THUMB_SIZE = 32;
const PADDING = 4;

interface CustomSwitchProps {
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
}
const CustomSwitch: React.FC<CustomSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      friction: 7,
      tension: 100,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_WIDTH - THUMB_SIZE - PADDING],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [themeColors.border, themeColors.primary],
  });

  return (
    <Pressable
      onPress={onValueChange}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View
        className={`rounded-full justify-center ${disabled ? "opacity-50" : ""}`}
        style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT, backgroundColor }}
      >
        <Animated.View
          className="absolute bg-white justify-center items-center shadow-lg"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            transform: [{ translateX }],
            elevation: 5,
          }}
        />
      </Animated.View>
    </Pressable>
  );
};

const StatusItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <View className="flex-1 items-center">
    <Ionicons name={icon} size={24} color={Colors.primary} />
    <View className="items-center mt-2">
      <Text className="font-poppins-regular text-sm text-textLight">
        {label}
      </Text>
      <Text
        className="font-poppins-semibold text-[15px] font-bold mt-1"
        style={{ color }}
      >
        {value}
      </Text>
    </View>
  </View>
);

export default function LampControlScreen() {
  const insets = useSafeAreaInsets();
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();
  const router = useRouter();

  const { getDeviceById, isLoading: isContextLoading } = useDevices();
  const [isActionLoading, setActionLoading] = useState(false);

  const device = getDeviceById(deviceId);

  useEffect(() => {
    if (!isContextLoading && !device) {
      Alert.alert("Error", "Device not found or failed to load.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [isContextLoading, device, router]);

  const handleAutoModeToggle = async () => {
    if (!device) return;
    setActionLoading(true);
    await updateDeviceSettings(deviceId, {
      autoModeEnabled: !device.setting.autoModeEnabled,
    });
    setActionLoading(false);
  };

  const handleLampToggle = async () => {
    if (!device || device.setting.autoModeEnabled) return;
    setActionLoading(true);
    const action = device.operationalStatus === "on" ? "turn_off" : "turn_on";
    await controlDevice(deviceId, action);
    setActionLoading(false);
  };

  if (isContextLoading || !device) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <ActivityIndicator size="large" color={Colors.white} />
        <Text className="mt-2.5 text-white text-base">
          Loading Device Status...
        </Text>
      </View>
    );
  }

  const isLampOn = device.operationalStatus === "on";
  const isAutoMode = device.setting.autoModeEnabled;

  return (
    <View
      className="flex-1 bg-secondary"
      style={{ paddingTop: insets.top + 50 }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header Section */}
      <View className="items-center justify-start px-5">
        <Text
          className="font-poppins-semibold text-3xl font-bold text-white mt-0.5"
          style={{
            textShadowColor: "rgba(0, 0, 0, 0.2)",
            textShadowOffset: { width: 1, height: 2 },
            textShadowRadius: 3,
          }}
        >
          Smart Lamp
        </Text>
        <Text className="font-poppins-regular text-[15px] text-textLight mt-0.5">
          Control your smart lighting
        </Text>
        <View className="w-52 h-52 justify-center items-center my-5 p-4">
          <LampIcon
            width="120%"
            height="120%"
            fill={isLampOn ? Colors.lampOnColor : Colors.lampOffColor}
          />
        </View>
      </View>

      {/* Control Section (White Panel) */}
      <View className="bg-white flex-1 rounded-t-[30px] items-center shadow-lg shadow-black/10">
        <View className="w-full items-center px-6 pt-5 pb-16">
          <View className="w-[50px] h-[5px] bg-border rounded-full mb-6" />

          <TouchableOpacity
            className={`w-24 h-24 rounded-full justify-center items-center bg-secondary shadow-lg shadow-primary/30 mb-2.5 border-2 border-white ${isAutoMode ? "bg-border" : ""}`}
            onPress={handleLampToggle}
            disabled={isAutoMode || isActionLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="power"
              size={36}
              color={isLampOn && !isAutoMode ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>
          <Text
            className={`font-poppins-semibold text-base font-semibold mb-6 ${
              isLampOn ? "text-greenDot" : "text-textLight"
            }`}
          >
            Lamp is {isLampOn ? "On" : "Off"}
          </Text>

          <View className="w-full h-px bg-border mb-5" />

          {/* Status Panel */}
          <View className="flex-row w-full justify-around bg-[#F4F3F3] rounded-2xl p-4 mb-5">
            <StatusItem
              icon="body-outline"
              label="Person Status"
              value={"-"}
              color={Colors.textLight}
            />
            <View className="w-px bg-border mx-2.5" />
            <StatusItem
              icon="bulb-outline"
              label="Lamp Status"
              value={isLampOn ? "On" : "Off"}
              color={isLampOn ? Colors.greenDot : Colors.redDot}
            />
          </View>

          {/* Automatic Mode Panel */}
          <View className="flex-row justify-between items-center bg-[#F4F3F3] rounded-2xl p-5 w-full">
            <View>
              <Text className="font-poppins-semibold text-[15px] font-semibold text-text">
                Automatic Mode
              </Text>
              <Text className="font-poppins-regular text-xs text-textLight mt-0.5">
                Control lamp based on detection
              </Text>
            </View>
            <CustomSwitch
              value={isAutoMode}
              onValueChange={handleAutoModeToggle}
              disabled={isActionLoading}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
