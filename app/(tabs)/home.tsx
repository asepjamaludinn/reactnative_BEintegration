import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProfile } from "../../api/auth";
import FanIcon from "../../assets/images/fandua.svg";
import LamphomeIcon from "../../assets/images/leddua.svg";
import DeviceCard from "../../components/home/DeviceCard";
import { Colors } from "../../constants/Colors";
import { useDevices } from "../../context/DeviceContext";

type Device = {
  id: string;
  deviceName: string;
  deviceTypes: ("lamp" | "fan")[];
};

type UserData = {
  id: string;
  username: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { devices, isLoading } = useDevices();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("User");

  // [MODIFIKASI] Menggunakan useFocusEffect untuk memuat ulang data profil
  // setiap kali layar ini mendapatkan fokus (misalnya, saat kembali dari halaman lain).
  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        const profileResponse = await getProfile();
        if (profileResponse && profileResponse.user) {
          setUserName(profileResponse.user.username);
        }
      };

      loadProfileData();
    }, [])
  );

  // useEffect ini tetap ada untuk menangani jam yang berjalan
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
      setDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDevicePress = (device: Device) => {
    if (device.deviceTypes.includes("lamp")) {
      router.push({
        pathname: "/lamp-control",
        params: { deviceId: device.id },
      });
    } else if (device.deviceTypes.includes("fan")) {
      router.push({
        pathname: "/fan-control",
        params: { deviceId: device.id },
      });
    }
  };

  const handleViewMotion = () => {
    router.push({ pathname: "/(tabs)/history", params: { filter: "motion" } });
  };

  const HEADER_HEIGHT = 325;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        className="bg-secondary h-[380px] rounded-b-[40px] px-6 pb-5 absolute top-0 left-0 right-0 z-10 justify-between shadow-lg shadow-black/25"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View>
          <Text
            className="font-poppins-bold text-3xl text-white mt-16"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.25)",
              textShadowOffset: { width: 1, height: 2 },
              textShadowRadius: 3,
            }}
          >
            Smart Motion Detection
          </Text>
          <Text className="font-poppins-medium text-lg text-primary mt-0.5">
            Sense Beyond Limits
          </Text>
          <Text className="font-poppins-regular text-3xl text-white mt-0.5">
            Hi,{" "}
            <Text className="font-poppins-regular text-white">
              {userName}! 👋
            </Text>
          </Text>
        </View>
        <View className="flex-row justify-between items-end mt-2.5">
          <Text className="font-poppins-regular text-base text-white">
            #LightsUpWhenLifeMoves
          </Text>
          <View className="mb-1.5">
            <TouchableOpacity
              className="bg-primary py-3 px-6 rounded-full mb-5"
              onPress={handleViewMotion}
            >
              <Text className="text-white font-poppins-semibold text-base">
                View Motion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
      >
        <View className="flex-row justify-between items-center px-6 mt-5 mb-2.5">
          <Text className="font-poppins-regular text-base text-textLight">
            {date}
          </Text>
          <Text className="font-poppins-semibold text-base text-text">
            {time}
          </Text>
        </View>

        <View className="pl-6 mt-2">
          <Text
            className="font-poppins-semibold text-3xl text-text mb-4"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.2)",
              textShadowOffset: { width: 1, height: 2 },
              textShadowRadius: 4,
            }}
          >
            Devices
          </Text>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              className="h-60"
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 120,
                paddingRight: 25,
                gap: 30,
              }}
            >
              {devices.length > 0 ? (
                devices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    name={device.deviceName}
                    icon={
                      device.deviceTypes.includes("lamp") ? (
                        <LamphomeIcon
                          width={80}
                          height={80}
                          fill={Colors.lampOnColor}
                        />
                      ) : (
                        <FanIcon width={80} height={80} fill={Colors.primary} />
                      )
                    }
                    onPress={() => handleDevicePress(device)}
                  />
                ))
              ) : (
                <View className="h-60 justify-center items-center w-screen pr-12">
                  <Text className="font-poppins-medium text-base text-textLight">
                    No devices found.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
