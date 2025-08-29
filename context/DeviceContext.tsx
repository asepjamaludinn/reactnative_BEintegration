import React, {
  createContext,
  ReactNode,
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
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const response = await DeviceApi.getDevices();
      if (response && response.devices) {
        setDevices(response.devices);
      }
      setIsLoading(false);
    };

    const setupSocketListeners = async () => {
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
          console.log("Received devices_updated event");
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
          console.log("Received device_added event");
          setDevices((prev) => [...prev, newDevice]);
        });

        socket.on("settings_updated", (updatedSettings: any) => {
          console.log("Received settings_updated event");
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.id === updatedSettings.deviceId
                ? { ...device, setting: updatedSettings }
                : device
            )
          );
        });

        socket.on("device_operational_status_updated", (data: any) => {
          console.log("Received device_operational_status_updated event");
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.id === data.deviceId
                ? { ...device, operationalStatus: data.operationalStatus }
                : device
            )
          );
        });
      }
    };

    fetchInitialData();
    setupSocketListeners();
  }, []);

  const getDeviceById = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId);
  };

  return (
    <DeviceContext.Provider value={{ devices, isLoading, getDeviceById }}>
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
