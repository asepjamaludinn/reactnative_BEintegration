import { apiRequest } from "./client";

export const getDevices = () => {
  return apiRequest(`/device`, "GET");
};

export const getDeviceSettings = (deviceId: string) => {
  return apiRequest(`/settings/${deviceId}`, "GET");
};

export const getLatestDeviceStatus = (deviceId: string) => {
  const endpoint = `/sensorHistory?deviceId=${deviceId}&limit=1&sortBy=createdAt&sortOrder=desc`;
  return apiRequest(endpoint, "GET");
};

export const controlDevice = (
  deviceId: string,
  action: "turn_on" | "turn_off"
) => {
  return apiRequest(`/device/${deviceId}/action`, "POST", { action });
};

export const updateDeviceSettings = (
  deviceId: string,
  settings: { autoModeEnabled?: boolean; scheduleEnabled?: boolean }
) => {
  return apiRequest(`/settings/${deviceId}`, "PATCH", settings);
};

export const getHistory = (params: URLSearchParams) => {
  return apiRequest(`/sensorHistory?${params.toString()}`, "GET");
};

export const addOrUpdateSchedule = (
  deviceId: string,
  scheduleData: { day: string; onTime: string; offTime: string }
) => {
  const formattedScheduleData = {
    ...scheduleData,
    day: scheduleData.day.substring(0, 3),
  };
  return apiRequest(
    `/settings/${deviceId}/schedules`,
    "POST",
    formattedScheduleData
  );
};

export const deleteSchedule = (deviceId: string, day: string) => {
  const shortDay = day.substring(0, 3);
  return apiRequest(`/settings/${deviceId}/schedules/${shortDay}`, "DELETE");
};