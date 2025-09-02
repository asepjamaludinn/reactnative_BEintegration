import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { SwipeListView } from "react-native-swipe-list-view";
import { getProfile } from "../api/auth";
import { deleteNotification, getNotifications } from "../api/notification";
import { Colors } from "../constants/Colors";
import { useNotifications } from "../context/NotificationContext";
import { getSocket, initializeSocket } from "../utils/socket";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NotificationEntry = {
  id: string;
  isRead: boolean;
  notification: {
    id: string;
    title: string;
    message: string;
    sentAt: string;
    type: "motion_detected" | "device_status_change" | "scheduled_reminder";
    device: { deviceName: string };
  };
};

type RawNotificationPayload = {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  type: "motion_detected" | "device_status_change" | "scheduled_reminder";
  device: { deviceName: string };
};

const notificationConfig = {
  motion_detected: { icon: "walk-outline" as const, filterType: "motion" },
  device_status_change: {
    icon: "toggle-outline" as const,
    filterType: "automatic",
  },
  scheduled_reminder: { icon: "time-outline" as const, filterType: "schedule" },
};

export default function NotificationsScreen() {
  const [allNotifications, setAllNotifications] = useState<NotificationEntry[]>(
    []
  );
  const [isLoading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const router = useRouter();

  const { unreadCount, markAllAsRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      if (unreadCount > 0) {
        console.log("Notification screen focused, marking all as read.");
        markAllAsRead();
      }
    }, [unreadCount, markAllAsRead])
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const profilePromise = getProfile();
      const notificationsPromise = getNotifications();

      const [profileResponse, notificationsResponse] = await Promise.all([
        profilePromise,
        notificationsPromise,
      ]);

      if (profileResponse && profileResponse.user) {
        setUserName(profileResponse.user.username);
      }
      if (notificationsResponse && notificationsResponse.data) {
        setAllNotifications(notificationsResponse.data);
      }
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const setupSocketListener = async () => {
      let socket = getSocket();
      if (!socket) {
        socket = await initializeSocket();
      }

      if (socket) {
        socket.off("new_notification");
        socket.on("new_notification", (payload: RawNotificationPayload) => {
          console.log("Received new_notification event:", payload);
          const formattedNotification: NotificationEntry = {
            id: `${payload.id}-${Date.now()}`,
            isRead: false,
            notification: {
              id: payload.id,
              title: payload.title,
              message: payload.message,
              sentAt: payload.sentAt,
              type: payload.type,
              device: payload.device,
            },
          };
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setAllNotifications((prev) => [formattedNotification, ...prev]);
        });
      }
    };

    setupSocketListener();
    return () => {
      const socket = getSocket();
      socket?.off("new_notification");
    };
  }, []);

  const handleDeleteNotification = async (notificationReadId: string) => {
    const response = await deleteNotification(notificationReadId);
    if (response) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAllNotifications((prev) =>
        prev.filter((item) => item.id !== notificationReadId)
      );
    }
  };
  const handleNotificationPress = (notification: NotificationEntry) => {
    const config = notificationConfig[notification.notification.type];
    router.push({
      pathname: "/(tabs)/history",
      params: { filter: config.filterType },
    });
  };
  const formatSentAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const renderItem = (data: { item: NotificationEntry }) => {
    const config = notificationConfig[data.item.notification.type];
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleNotificationPress(data.item)}
      >
        <View className="bg-primary rounded-xl p-4 flex-row items-center mb-3 shadow shadow-black/5 border border-gray-100">
          <View
            className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${
              data.item.isRead ? "bg-gray-100" : "bg-white"
            }`}
          >
            <Ionicons
              name={config.icon}
              size={24}
              color={data.item.isRead ? Colors.textLight : Colors.primary}
            />
          </View>
          <View className="flex-1">
            <Text
              className={`text-base leading-5 font-poppins-semibold ${
                data.item.isRead ? "text-white" : "text-white"
              }`}
            >
              {data.item.notification.title}
            </Text>
            <Text
              className={`text-sm leading-5 font-roboto-regular mt-0.5 ${
                data.item.isRead ? "text-white" : "text-white"
              }`}
              numberOfLines={2}
            >
              {data.item.notification.message}
            </Text>
            <Text
              className={`text-xs mt-1.5 font-roboto-regular ${
                data.item.isRead ? "text-white" : "text-white"
              }`}
            >
              {formatSentAt(data.item.notification.sentAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const renderHiddenItem = (data: { item: NotificationEntry }) => (
    <View className="items-center flex-1 flex-row justify-end mb-3">
      <TouchableOpacity
        className="bg-redDot justify-center items-center absolute top-0 bottom-0 right-0 w-20 rounded-xl"
        onPress={() => handleDeleteNotification(data.item.id)}
      >
        <Ionicons name="trash-outline" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        className="flex-1 bg-background"
        edges={["top", "left", "right"]}
      >
        <View className="px-5 pt-16 mb-5">
          <Text className="font-poppins-regular text-lg text-text mt-2.5">
            Activity Log
          </Text>
          <Text
            className="font-poppins-bold text-3xl text-text mt-0.5"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.1)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 6,
            }}
          >
            Hello, {userName}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            className="mt-16"
          />
        ) : allNotifications.length > 0 ? (
          <SwipeListView
            data={allNotifications}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            keyExtractor={(item) => item.id}
            rightOpenValue={-80}
            disableRightSwipe
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center pb-16">
            <Ionicons
              name="notifications-off-outline"
              size={60}
              color={Colors.textLight}
            />
            <Text className="font-poppins-semibold text-lg text-text mt-5">
              No New Notifications
            </Text>
            <Text className="font-roboto-regular text-sm text-textLight mt-1">
              You are all caught up!
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
