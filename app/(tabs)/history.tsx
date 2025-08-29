import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHistory } from "../../api/device";
import {
  FilterGroup,
  FilterModal,
  FilterType,
} from "../../components/modal/filter";
import { Colors } from "../../constants/Colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HistoryLog = {
  id: string;
  createdAt: string;
  triggerType: "motion_detected" | "manual" | "scheduled";
  lightAction: "turned_on" | "turned_off";
  fanAction: "turned_on" | "turned_off";
  device: {
    deviceName: string;
  };
};

const logStyleConfig = {
  motion_detected: {
    icon: "walk" as const,
    color: Colors.primary,
    title: "Motion Detected",
  },
  manual: {
    icon: "hand-left" as const,
    color: "#FFC107",
    title: "Manual Control",
  },
  scheduled: {
    icon: "time" as const,
    color: "#9C27B0",
    title: "Scheduled Action",
  },
};

const LogItem: React.FC<{ item: HistoryLog }> = ({ item }) => {
  const style = logStyleConfig[item.triggerType];
  const isLamp = item.device.deviceName.toLowerCase().includes("lamp");
  const action = isLamp ? item.lightAction : item.fanAction;
  const actionText = action.replace("_", " ");

  return (
    <View className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow shadow-black/5">
      <View
        className="w-12 h-12 rounded-full justify-center items-center mr-4"
        style={{ backgroundColor: `${style.color}20` }}
      >
        <Ionicons name={style.icon} size={24} color={style.color} />
      </View>
      <View className="flex-1">
        <Text className="font-poppins-semibold text-base text-text leading-5 capitalize">
          {item.device.deviceName} {actionText}
        </Text>
        <Text className="font-roboto-regular text-sm text-textLight mt-0.5">
          Triggered by: {item.triggerType.replace("_", " ")}
        </Text>
      </View>
      <Text className="font-roboto-regular text-xs text-textLight self-start">
        {new Date(item.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );
};

export default function HistoryScreen() {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });

  const filterGroups: FilterGroup[] = [
    {
      title: "General",
      options: [
        { label: "All", type: "All", icon: "apps" },
        { label: "Motion", type: "motion", icon: "walk" },
        { label: "Schedule", type: "schedule", icon: "calendar" },
        { label: "Manual", type: "automatic", icon: "hand-left" },
      ],
    },
    {
      title: "Lamp Actions",
      options: [
        { label: "Lamp On", type: "lamp-on", icon: "bulb" },
        { label: "Lamp Off", type: "lamp-off", icon: "bulb-outline" },
      ],
    },
    {
      title: "Fan Actions",
      options: [
        { label: "Fan On", type: "fan-on", icon: "sync-circle" },
        { label: "Fan Off", type: "fan-off", icon: "sync-circle-outline" },
      ],
    },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchHistoryData = useCallback(
    async (filter: FilterType, page: number, searchTerm: string) => {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (filter === "motion") params.append("triggerType", "motion_detected");
      if (filter === "schedule") params.append("triggerType", "scheduled");
      if (filter === "automatic") params.append("triggerType", "manual");
      if (filter === "lamp-on") params.append("lightAction", "turned_on");
      if (filter === "lamp-off") params.append("lightAction", "turned_off");
      if (filter === "fan-on") params.append("fanAction", "turned_on");
      if (filter === "fan-off") params.append("fanAction", "turned_off");

      if (searchTerm) {
        params.append("search", searchTerm.trim());
      }

      const response = await getHistory(params);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (response) {
        setLogs(response.data || []);
        setPagination({
          page: response.page,
          total: response.total,
          limit: response.limit,
        });
      } else {
        setLogs([]);
      }
      setIsLoading(false);
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchHistoryData(activeFilter, pagination.page, debouncedSearchQuery);
  }, [activeFilter, pagination.page, debouncedSearchQuery, fetchHistoryData]);

  const handleSelectFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilterVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-16 pb-4">
        <Text className="font-poppins-bold text-3xl text-text">History</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 shadow-md shadow-black/10 mt-4">
          <Ionicons name="search-outline" size={22} color={Colors.textLight} />
          <TextInput
            className="flex-1 font-roboto-regular h-12 text-lg text-text ml-2.5"
            placeholder="Search activity..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            className="pl-2.5"
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          className="mt-16"
        />
      ) : logs.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-20">
          <Ionicons name="archive-outline" size={60} color={Colors.textLight} />
          <Text className="font-poppins-semibold text-lg text-text mt-4">
            No History Found
          </Text>
          <Text className="font-roboto-regular text-sm text-textLight mt-1">
            Try a different search or filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={({ item }) => <LogItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        filterGroups={filterGroups}
        currentFilter={activeFilter}
        onSelectFilter={handleSelectFilter}
      />
    </SafeAreaView>
  );
}
