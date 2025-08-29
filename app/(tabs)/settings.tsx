import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  LayoutAnimation,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  addOrUpdateSchedule,
  deleteSchedule,
  getDeviceSettings,
} from "../../api/device";
import { Colors } from "../../constants/Colors";

import { useDevices } from "../../context/DeviceContext";

type DeviceType = "lamp" | "fan";
type Schedule = { id: string; day: string; onTime: string; offTime: string };

const dayMap: { [key: string]: string } = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  )
    return NaN;
  return hours * 60 + minutes;
};

const ScheduleFormComponent = ({
  selectedDevice,
  schedulesForDevice,
  onSubmit,
}: {
  selectedDevice: DeviceType;
  schedulesForDevice: Schedule[];
  onSubmit: (data: Omit<Schedule, "id">) => void;
}) => {
  const [isDayModalVisible, setDayModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [inputOnTime, setInputOnTime] = useState("");
  const [inputOffTime, setInputOffTime] = useState("");
  const [error, setError] = useState<{ field: string; message: string } | null>(
    null
  );

  const isSubmitDisabled = !selectedDay || !inputOnTime || !inputOffTime;

  const handleTimeInputChange = useCallback(
    (text: string, setter: (value: string) => void) => {
      if (error?.field === "time" || error?.field === "submit") {
        setError(null);
      }
      const nums = text.replace(/[^0-9]/g, "");
      if (nums.length > 4) return;
      let formattedText = nums;
      if (nums.length > 2) {
        formattedText = `${nums.slice(0, 2)}:${nums.slice(2)}`;
      }
      setter(formattedText);
    },
    [error]
  );

  const clearForm = useCallback(() => {
    setSelectedDay(null);
    setInputOnTime("");
    setInputOffTime("");
    setError(null);
  }, []);

  const proceedSubmit = () => {
    if (!selectedDay || !inputOnTime || !inputOffTime) return;
    onSubmit({
      day: selectedDay,
      onTime: inputOnTime,
      offTime: inputOffTime,
    });
    clearForm();
  };

  const handleLocalSubmit = () => {
    setError(null);
    Keyboard.dismiss();

    if (isSubmitDisabled) {
      if (!selectedDay)
        return setError({ field: "day", message: "Please select a day." });
      return setError({
        field: "time",
        message: "Please fill in both On and Off times.",
      });
    }

    const newStartTime = timeToMinutes(inputOnTime);
    const newEndTime = timeToMinutes(inputOffTime);

    if (isNaN(newStartTime) || isNaN(newEndTime)) {
      return setError({
        field: "submit",
        message: "Invalid time format. Please use HH:MM.",
      });
    }

    if (newEndTime <= newStartTime) {
      return setError({
        field: "submit",
        message: "Off time must be after on time.",
      });
    }

    const isDayAlreadyScheduled = schedulesForDevice.some(
      (s) => s.day === selectedDay
    );

    if (isDayAlreadyScheduled) {
      Alert.alert(
        "Schedule Exists",
        `A schedule for ${selectedDay} already exists. Do you want to overwrite it?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Overwrite", onPress: proceedSubmit },
        ]
      );
    } else {
      proceedSubmit();
    }
  };

  return (
    <>
      {/* ... SISA KODE JSX ANDA TETAP SAMA ... */}
      <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm shadow-black/5">
        <Text className="text-lg font-bold text-text mb-4">
          Set {selectedDevice === "lamp" ? "Lamp" : "Fan"} Schedule
        </Text>
        <TouchableOpacity
          className="flex-row justify-between items-center bg-background rounded-xl p-4"
          onPress={() => {
            setError(null);
            setDayModalVisible(true);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text className="flex-1 text-center text-base font-medium text-text">
            {selectedDay || "Select Day"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.primary} />
        </TouchableOpacity>
        {error && error.field === "day" && (
          <Text className="text-redDot text-sm mt-2 ml-2 font-medium">
            {error.message}
          </Text>
        )}
        <View className="mt-4">
          <View className="flex-row items-center bg-background rounded-xl px-4 mb-2.5">
            <Ionicons name="time-outline" size={20} color={Colors.textLight} />
            <Text className="text-lg text-text mx-2.5">On Time</Text>
            <TextInput
              className="flex-1 py-4 h-18 text-base text-right"
              style={{ lineHeight: 20 }}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
              value={inputOnTime}
              onChangeText={(text) =>
                handleTimeInputChange(text, setInputOnTime)
              }
            />
          </View>
          <View className="flex-row items-center bg-background rounded-xl px-4">
            <Ionicons name="time-outline" size={20} color={Colors.textLight} />
            <Text className="text-lg text-text mx-2.5">Off Time</Text>
            <TextInput
              className="flex-1 py-4 h-18 text-base text-right"
              style={{ lineHeight: 20 }}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
              value={inputOffTime}
              onChangeText={(text) =>
                handleTimeInputChange(text, setInputOffTime)
              }
            />
          </View>
        </View>
        {error && error.field === "time" && (
          <Text className="text-redDot text-sm mt-2 ml-2 font-medium">
            {error.message}
          </Text>
        )}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center mt-4 ${
            isSubmitDisabled ? "bg-gray-300" : "bg-primary"
          }`}
          onPress={handleLocalSubmit}
          disabled={isSubmitDisabled}
        >
          <Text className="text-lg font-bold text-white">Save Schedule</Text>
        </TouchableOpacity>
        {error && error.field === "submit" && (
          <Text className="text-redDot text-sm text-center mt-4 font-medium">
            {error.message}
          </Text>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDayModalVisible}
        onRequestClose={() => setDayModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/50 p-5"
          onPress={() => setDayModalVisible(false)}
        >
          <Pressable className="bg-white rounded-2xl p-5">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4" />
            <Text className="text-lg font-bold mb-4 text-center">
              Select a Day
            </Text>
            {daysOfWeek.map((item) => (
              <TouchableOpacity
                key={item}
                className="py-4 border-b border-gray-200"
                onPress={() => {
                  setSelectedDay(item);
                  setDayModalVisible(false);
                }}
              >
                <Text className="text-center text-base text-text">{item}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
const ScheduleForm = React.memo(ScheduleFormComponent);

const AutoModeOverlay = () => (
  <View className="absolute inset-0 bg-gray-100/80 justify-center items-center rounded-2xl z-10 p-4">
    <Ionicons name="lock-closed" size={32} color={Colors.textLight} />
    <Text className="text-center font-bold text-textLight mt-2">
      Automatic Mode is On
    </Text>
    <Text className="text-center text-base text-textLight">
      Schedules cannot be modified.
    </Text>
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();

  const { devices, isLoading: isDevicesLoading } = useDevices();
  const [selectedDeviceType, setSelectedDeviceType] =
    useState<DeviceType>("lamp");
  const [deviceSettings, setDeviceSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [profileImage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editOnTime, setEditOnTime] = useState("");
  const [editOffTime, setEditOffTime] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const activeDevice = devices.find(
    (d) => d.deviceTypes[0] === selectedDeviceType
  );
  const isCurrentDeviceAuto = deviceSettings?.autoModeEnabled ?? false;

  const fetchSettings = useCallback(async () => {
    if (!activeDevice) {
      setIsLoading(false);
      setDeviceSettings(null);
      return;
    }
    setIsLoading(true);
    const settings = await getDeviceSettings(activeDevice.id);
    if (settings) {
      settings.schedules.sort(
        (a: Schedule, b: Schedule) =>
          daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)
      );
      setDeviceSettings(settings);
    } else {
      setDeviceSettings(null);
    }
    setIsLoading(false);
  }, [activeDevice]);

  useEffect(() => {
    if (!isDevicesLoading) {
      fetchSettings();
    }
  }, [fetchSettings, isDevicesLoading]);

  const showSuccessMessage = useCallback(
    (msg: string) => {
      setDeleteMessage(msg);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setDeleteMessage(null));
    },
    [fadeAnim]
  );

  const handleApiAction = async (
    action: Promise<any>,
    successMessage: string
  ) => {
    const response = await action;
    if (response) {
      showSuccessMessage(successMessage);
      fetchSettings();
    }
  };

  const handleDeviceChange = useCallback((device: DeviceType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDeviceType(device);
  }, []);

  const handleEditTimeChange = useCallback(
    (text: string, setter: (value: string) => void) => {
      setEditError(null);
      const nums = text.replace(/[^0-9]/g, "");
      if (nums.length > 4) return;
      let formattedText = nums;
      if (nums.length > 2) {
        formattedText = `${nums.slice(0, 2)}:${nums.slice(2)}`;
      }
      setter(formattedText);
    },
    []
  );

  const handleStartEdit = useCallback((schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditOnTime(schedule.onTime);
    setEditOffTime(schedule.offTime);
    setEditError(null);
    setIsEditModalVisible(true);
  }, []);

  const handleSubmitNewSchedule = (newScheduleData: Omit<Schedule, "id">) => {
    if (!activeDevice) return;
    handleApiAction(
      addOrUpdateSchedule(activeDevice.id, newScheduleData),
      "Schedule saved successfully"
    );
  };

  const handleDelete = (dayToDelete: string) => {
    if (!activeDevice) return;

    handleApiAction(
      deleteSchedule(activeDevice.id, dayToDelete),
      "Schedule removed successfully"
    );
  };
  const handleUpdateSchedule = useCallback(() => {
    if (!editingSchedule || !activeDevice) return;

    setEditError(null);

    const newStartTime = timeToMinutes(editOnTime);
    const newEndTime = timeToMinutes(editOffTime);

    if (isNaN(newStartTime) || isNaN(newEndTime)) {
      return setEditError("Invalid time format. Please use HH:MM.");
    }
    if (newEndTime <= newStartTime) {
      return setEditError("Off time must be after on time.");
    }

    const otherSchedulesOnDay = (deviceSettings?.schedules || []).filter(
      (s: Schedule) =>
        s.day === editingSchedule.day && s.id !== editingSchedule.id
    );

    for (const schedule of otherSchedulesOnDay) {
      const existingStartTime = timeToMinutes(schedule.onTime);
      const existingEndTime = timeToMinutes(schedule.offTime);
      if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
        return setEditError("This schedule overlaps with an existing one.");
      }
    }

    // [INTEGRASI] Panggil API untuk update
    const updatedSchedule = {
      ...editingSchedule,
      onTime: editOnTime,
      offTime: editOffTime,
    };

    handleApiAction(
      addOrUpdateSchedule(activeDevice.id, updatedSchedule),
      "Schedule updated successfully"
    );

    setIsEditModalVisible(false);
    setEditingSchedule(null);
  }, [
    editingSchedule,
    editOnTime,
    editOffTime,
    deviceSettings,
    activeDevice,
    showSuccessMessage,
  ]);

  // --- Render Functions (Menggunakan UI dari kode Anda) ---

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <View className="bg-white rounded-2xl p-4 mb-2.5 flex-row items-center justify-between shadow-sm shadow-black/5 border border-gray-100">
      <View className="flex-1">
        <Text className="text-lg font-bold text-primary mb-2">
          {dayMap[item.day] || item.day}
        </Text>
        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-greenDot mr-2" />
            <Text className="text-base text-textLight mr-1">On</Text>
            <Text className="text-base font-semibold text-text">
              {item.onTime}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-redDot mr-2" />
            <Text className="text-base text-textLight mr-1">Off</Text>
            <Text className="text-base font-semibold text-text">
              {item.offTime}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleStartEdit(item)}
        className="pl-4 p-1"
        disabled={isCurrentDeviceAuto}
      >
        <Ionicons
          name="create-outline"
          size={20}
          color={isCurrentDeviceAuto ? Colors.textLight : Colors.primary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderHiddenItem = (data: any, rowMap: any) => (
    <View className="items-center bg-redDot flex-1 flex-row justify-end mb-2.5 rounded-2xl">
      <TouchableOpacity
        className="items-center justify-center absolute top-0 bottom-0 w-[90px] right-0"
        onPress={() => {
          rowMap[data.item.id].closeRow();
          handleDelete(data.item.day);
        }}
        disabled={isCurrentDeviceAuto}
      >
        <Ionicons name="trash-outline" size={22} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = useCallback(
    () => (
      <>
        {/* Header Profil dari UI Anda */}
        <View className="items-center my-5">
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../../assets/images/pp.svg")
            }
            className="w-36 h-36 rounded-full border-4 border-white"
          />
          <Text className="text-xl font-bold text-text mt-3">TimRisetCPS</Text>
          <Text className="text-base text-textLight">
            TimRisetCPS@gmail.com
          </Text>
          <TouchableOpacity
            className="mt-4 bg-white/80 py-2 px-5 rounded-full"
            onPress={() => router.push("/account-settings")}
          >
            <Text className="text-base text-primary font-semibold">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Toggle dari UI Anda */}
        <View className="flex-row bg-white/70 rounded-full p-0.5 mb-5">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${
              selectedDeviceType === "lamp" ? "bg-white shadow" : ""
            }`}
            onPress={() => handleDeviceChange("lamp")}
          >
            <Text
              className={`text-center text-lg font-semibold ${
                selectedDeviceType === "lamp"
                  ? "text-primary"
                  : "text-textLight"
              }`}
            >
              Lamp
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-full ${
              selectedDeviceType === "fan" ? "bg-white shadow" : ""
            }`}
            onPress={() => handleDeviceChange("fan")}
          >
            <Text
              className={`text-center text-lg font-semibold ${
                selectedDeviceType === "fan" ? "text-primary" : "text-textLight"
              }`}
            >
              Fan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form dengan Overlay Otomatis dari UI Anda */}
        <View>
          <ScheduleForm
            selectedDevice={selectedDeviceType}
            schedulesForDevice={deviceSettings?.schedules || []}
            onSubmit={handleSubmitNewSchedule}
          />
          {isCurrentDeviceAuto && <AutoModeOverlay />}
        </View>

        <View className="mt-3">
          <Text className="text-xl mb-3 font-bold text-text">
            Saved Schedules
          </Text>
        </View>
      </>
    ),
    [
      profileImage,
      selectedDeviceType,
      deviceSettings,
      isCurrentDeviceAuto,
      handleDeviceChange,
      handleSubmitNewSchedule,
    ]
  );

  // --- JSX Utama ---
  return (
    <SafeAreaView
      className="flex-1 bg-secondary"
      edges={["top", "left", "right", "bottom"]}
    >
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        {/* [INTEGRASI] Logika Loading dan Error */}
        {isDevicesLoading || isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !activeDevice ? (
          <View className="flex-1 justify-center items-center p-5">
            <Ionicons name="sad-outline" size={60} color={Colors.textLight} />
            <Text className="font-bold text-xl text-text mt-4 text-center">
              Device Not Found
            </Text>
            <Text className="text-base text-textLight mt-1 text-center">
              The '{selectedDeviceType}' is not available in your account.
            </Text>
          </View>
        ) : (
          <SwipeListView
            style={{ flex: 1 }}
            data={deviceSettings?.schedules || []}
            renderItem={renderScheduleItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-90}
            disableRightSwipe={isCurrentDeviceAuto}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 150,
              paddingTop: 50,
            }}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-10">
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={Colors.textLight}
                />
                <Text className="font-medium text-base text-textLight mt-4">
                  No schedules added yet.
                </Text>
                <Text className="text-sm text-textLight/70 mt-1">
                  Use the form above to add one.
                </Text>
              </View>
            )}
          />
        )}
      </Pressable>

      {/* Modal Edit dari UI Anda */}
      {editingSchedule && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <Pressable
            className="flex-1 justify-center bg-black/50 p-5"
            onPress={() => setIsEditModalVisible(false)}
          >
            <Pressable className="bg-white rounded-2xl p-6 w-full self-center shadow-lg">
              <Text className="text-lg font-bold text-center mb-2">
                Edit Schedule
              </Text>
              <Text className="text-base text-center text-textLight mb-5">
                Editing for{" "}
                <Text className="font-bold">
                  {" "}
                  {dayMap[editingSchedule.day] || editingSchedule.day}
                </Text>
              </Text>

              <View>
                <View className="flex-row items-center bg-background rounded-xl px-4 mb-2.5">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Colors.textLight}
                  />
                  <Text className="text-lg text-text mx-2.5">On Time</Text>
                  <TextInput
                    className="flex-1 py-4 h-19 text-base text-right"
                    style={{ lineHeight: 20 }}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                    maxLength={5}
                    value={editOnTime}
                    onChangeText={(text) =>
                      handleEditTimeChange(text, setEditOnTime)
                    }
                  />
                </View>
                <View className="flex-row items-center bg-background rounded-xl px-4">
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Colors.textLight}
                  />
                  <Text className="text-lg text-text mx-2.5">Off Time</Text>
                  <TextInput
                    className="flex-1 py-4 h-19 text-base text-right"
                    style={{ lineHeight: 20 }}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                    maxLength={5}
                    value={editOffTime}
                    onChangeText={(text) =>
                      handleEditTimeChange(text, setEditOffTime)
                    }
                  />
                </View>
              </View>

              {editError && (
                <Text className="text-redDot text-sm text-center mt-4 font-medium">
                  {editError}
                </Text>
              )}

              <TouchableOpacity
                className="bg-primary rounded-2xl py-4 items-center mt-5"
                onPress={handleUpdateSchedule}
              >
                <Text className="text-base font-bold text-white">
                  Save Changes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-transparent border border-textLight rounded-2xl py-4 items-center mt-2.5"
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text className="text-base font-bold text-textLight">
                  Cancel
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Notifikasi Toast dari UI Anda */}
      {deleteMessage && (
        <Animated.View
          className="absolute bottom-32 self-center bg-black/80 py-3 px-5 rounded-full flex-row items-center z-50"
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={Colors.white}
            style={{ marginRight: 10 }}
          />
          <Text className="text-white text-sm font-semibold">
            {deleteMessage}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
