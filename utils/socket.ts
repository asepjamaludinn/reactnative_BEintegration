import AsyncStorage from "@react-native-async-storage/async-storage";
import io, { Socket } from "socket.io-client";
import { API_URL } from "../api/client";

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.log("No token found, socket connection aborted.");
      return null;
    }

    socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Global Socket.IO connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Global Socket.IO disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return socket;
  } catch (e) {
    console.error("Failed to initialize socket:", e);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
    console.log("Global Socket.IO connection closed.");
  }
};
