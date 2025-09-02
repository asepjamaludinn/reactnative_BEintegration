// components/home/DeviceCard.tsx
import React, { ReactElement } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type DeviceCardProps = {
  icon: ReactElement; // Menerima JSX element (SVG)
  name: string;
  onPress: () => void;
};

export default function DeviceCard({ icon, name, onPress }: DeviceCardProps) {
  return (
    <TouchableOpacity
      className="w-48 h-60 rounded-[25px] bg-white shadow-md shadow-black/10"
      onPress={onPress}
    >
      {/* Bagian Atas (SVG atau Ikon) */}
      <View className="w-full h-[130px] bg-offWhite rounded-t-[25px] justify-center items-center p-2.5">
        {icon}
      </View>

      {/* Bagian Bawah (Teks dan Tombol) */}
      <View className="flex-1 flex-row justify-between items-center px-4">
        <Text className="font-poppins-bold text-lg text-text">{name}</Text>
      </View>
    </TouchableOpacity>
  );
}
