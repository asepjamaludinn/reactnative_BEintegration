import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as NotificationApi from "../api/notification";
import { getSocket, initializeSocket } from "../utils/socket";

interface NotificationContextType {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const response = await NotificationApi.getUnreadCount();
    if (response && typeof response.unreadCount === "number") {
      setUnreadCount(response.unreadCount);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await NotificationApi.markAllAsRead();
    if (response) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const setupSocketListener = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      fetchUnreadCount();

      let socket = getSocket();
      if (!socket) {
        socket = await initializeSocket();
      }

      if (socket) {
        socket.off("new_notification");
        socket.on("new_notification", () => {
          console.log("Received new_notification event, incrementing count.");
          setUnreadCount((prevCount) => prevCount + 1);
        });
      }
    };

    setupSocketListener();

    return () => {
      const socket = getSocket();
      socket?.off("new_notification");
    };
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, fetchUnreadCount, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
