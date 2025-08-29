import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";

interface DeviceCardProps {
  name: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ name, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-3xl w-48 h-60 p-5 shadow-lg shadow-black/10 justify-between"
    >
      {/* Container untuk Ikon dan Nama */}
      <View>
        <View className="w-20 h-20 items-center justify-center">{icon}</View>
        <Text className="font-poppins-semibold text-xl text-text mt-4 leading-6">
          {name}
        </Text>
      </View>

      {/* Container untuk Tombol Panah */}
      <View className="items-end">
        <View className="bg-primary rounded-full w-10 h-10 justify-center items-center">
          <Ionicons name="arrow-forward" size={22} color={Colors.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DeviceCard;
