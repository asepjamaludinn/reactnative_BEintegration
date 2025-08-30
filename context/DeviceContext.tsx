import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as DeviceApi from "../api/device";
import { getSocket, initializeSocket } from "../utils/socket";

interface Device {
  id: string;
  deviceName: string;
  deviceTypes: ("lamp" | "fan")[];
  status: "online" | "offline";
  setting: {
    autoModeEnabled: boolean;
    scheduleEnabled: boolean;
  };
  operationalStatus?: "on" | "off";
}

interface DeviceContextType {
  devices: Device[];
  isLoading: boolean;
  getDeviceById: (deviceId: string) => Device | undefined;
  initializeSession: () => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initializeSession = useCallback(async () => {
    setIsLoading(true);

    const response = await DeviceApi.getDevices();
    if (response && response.devices) {
      setDevices(response.devices);
    }

    let socket = getSocket();
    if (!socket) {
      socket = await initializeSocket();
    }

    if (socket) {
      socket.off("devices_updated");
      socket.off("device_added");
      socket.off("settings_updated");
      socket.off("device_operational_status_updated");

      socket.on("devices_updated", (updatedDevices: Device[]) => {
        setDevices((prevDevices) => {
          const updatedDevicesMap = new Map(
            updatedDevices.map((d) => [d.id, d])
          );
          return prevDevices.map(
            (device) => updatedDevicesMap.get(device.id) || device
          );
        });
      });
      socket.on("device_added", (newDevice: Device) => {
        setDevices((prev) => [...prev, newDevice]);
      });
      socket.on("settings_updated", (updatedSettings: any) => {
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device.id === updatedSettings.deviceId
              ? { ...device, setting: updatedSettings }
              : device
          )
        );
      });
      socket.on("device_operational_status_updated", (data: any) => {
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device.id === data.deviceId
              ? { ...device, operationalStatus: data.operationalStatus }
              : device
          )
        );
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkForExistingSession = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        initializeSession();
      } else {
        setIsLoading(false);
      }
    };

    checkForExistingSession();
  }, [initializeSession]);

  const getDeviceById = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId);
  };

  return (
    <DeviceContext.Provider
      value={{ devices, isLoading, getDeviceById, initializeSession }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = () => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevices must be used within a DeviceProvider");
  }
  return context;
};
