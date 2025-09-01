import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getHistory } from "../../api/device";
import {
  FilterGroup,
  FilterModal,
  FilterType,
} from "../../components/modal/filter";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ... (Konstanta API_PARAMS dan Tipe Data tidak berubah)
const API_PARAMS = {
    TRIGGER_TYPE: {
        MOTION: "motion_detected",
        MANUAL: "manual",
        SCHEDULED: "scheduled",
    },
    LIGHT_ACTION: {
        ON: "turned_on",
        OFF: "turned_off",
    },
    FAN_ACTION: {
        ON: "turned_on",
        OFF: "turned_off",
    },
} as const;

type HistoryLogFromAPI = {
    id: string;
    createdAt: string;
    triggerType: "motion_detected" | "manual" | "scheduled";
    lightAction: "turned_on" | "turned_off";
    fanAction: "turned_on" | "turned_off";
    device: {
        deviceName: string;
    };
};

type LogItemData = {
    type:
    | "motion"
    | "lamp-on"
    | "lamp-off"
    | "fan-on"
    | "fan-off"
    | "schedule"
    | "manual";
    message: string;
    time: string;
};

const logStyleConfig: Record<
    LogItemData["type"],
    {
        title: string;
        containerClasses: string;
        dotClasses: string;
        textClasses: string;
    }
> = {
    motion: {
        title: "Motion Detected",
        containerClasses: "bg-secondary border-primary",
        dotClasses: "bg-primary",
        textClasses: "text-primary",
    },
    "lamp-on": {
        title: "Lamp ON",
        containerClasses: "bg-success border-greenDot",
        dotClasses: "bg-greenDot",
        textClasses: "text-greenDot",
    },
    "lamp-off": {
        title: "Lamp OFF",
        containerClasses: "bg-error border-redDot",
        dotClasses: "bg-redDot",
        textClasses: "text-redDot",
    },
    "fan-on": {
        title: "Fan ON",
        containerClasses: "bg-fanOnBg border-fanOnColor",
        dotClasses: "bg-fanOnColor",
        textClasses: "text-fanOnColor",
    },
    "fan-off": {
        title: "Fan OFF",
        containerClasses: "bg-fanOffBg border-fanOffColor",
        dotClasses: "bg-fanOffColor",
        textClasses: "text-fanOffColor",
    },
    schedule: {
        title: "Schedule",
        containerClasses: "bg-[#FFF8E1] border-[#FFC107]",
        dotClasses: "bg-[#FFC107]",
        textClasses: "text-[#FFC107]",
    },
    manual: {
        title: "Manual Control",
        containerClasses: "bg-[#F3E5F5] border-[#9C27B0]",
        dotClasses: "bg-[#9C27B0]",
        textClasses: "text-[#9C27B0]",
    },
};


const LogItem: React.FC<LogItemData> = ({ type, message, time }) => {
  const style = logStyleConfig[type];
  if (!style) return null;

  return (
    <View
      className={`flex-row items-center rounded-2xl p-3 mb-2.5 border-l-4 ${style.containerClasses}`}
    >
      <View className={`w-3 h-3 rounded-full mr-4 ml-1 ${style.dotClasses}`} />
      <View className="flex-1 flex-row justify-between items-start">
        <View className="flex-1">
          <Text
            className={`font-roboto-bold text-[15px] mb-0.5 ${style.textClasses}`}
          >
            {style.title}
          </Text>
          <Text className="font-roboto-regular text-[13px] text-text">
            {message}
          </Text>
        </View>
        <Text className="font-roboto-regular text-[13px] text-textLight">
          {time}
        </Text>
      </View>
    </View>
  );
};

const SkeletonItem = () => (
  <View className="bg-[#E0E0E0] rounded-2xl h-[70px] mb-2.5" />
);

// 2. PERBAIKAN: Komponen HistoryCard dan useMemo groupedLogs tidak lagi diperlukan
// const HistoryCard = ... (dihapus)

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [logs, setLogs] = useState<HistoryLogFromAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });

  // ... (Hooks useEffect, useCallback, dan handler lainnya tidak berubah)
    useEffect(() => {
        if (params.filter && typeof params.filter === "string") {
            setActiveFilter(params.filter as FilterType);
        }
    }, [params]);

    const filterGroups: FilterGroup[] = [
        {
            title: "General",
            options: [
                { label: "All", type: "All", icon: "apps" },
                { label: "Motion", type: "motion", icon: "walk" },
                { label: "Schedule", type: "schedule", icon: "calendar" },
                { label: "Manual", type: "manual", icon: "hand-left" },
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
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchHistoryData = useCallback(
        async (pageToFetch: number) => {
            if (pageToFetch === 1 && !isRefreshing) {
                setIsLoading(true);
            }
            if (pageToFetch > 1) {
                setIsFetchingMore(true);
            }
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: String(pageToFetch),
                    limit: String(pagination.limit),
                    sortBy: "createdAt",
                    sortOrder: "desc",
                });

                if (activeFilter === "motion")
                    params.append("triggerType", API_PARAMS.TRIGGER_TYPE.MOTION);
                if (activeFilter === "schedule")
                    params.append("triggerType", API_PARAMS.TRIGGER_TYPE.SCHEDULED);
                if (activeFilter === "manual")
                    params.append("triggerType", API_PARAMS.TRIGGER_TYPE.MANUAL);
                if (activeFilter === "lamp-on")
                    params.append("lightAction", API_PARAMS.LIGHT_ACTION.ON);
                if (activeFilter === "lamp-off")
                    params.append("lightAction", API_PARAMS.LIGHT_ACTION.OFF);
                if (activeFilter === "fan-on")
                    params.append("fanAction", API_PARAMS.FAN_ACTION.ON);
                if (activeFilter === "fan-off")
                    params.append("fanAction", API_PARAMS.FAN_ACTION.OFF);

                if (debouncedSearchQuery) {
                    params.append("search", debouncedSearchQuery);
                }

                const response = await getHistory(params);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                if (response && response.data) {
                    setLogs((prevLogs) =>
                        pageToFetch === 1 ? response.data : [...prevLogs, ...response.data]
                    );
                    setPagination({
                        page: response.page,
                        total: response.total,
                        limit: response.limit,
                    });
                } else {
                    if (pageToFetch === 1) setLogs([]);
                }
            } catch (e) {
                const errorMessage =
                    e instanceof Error ? e.message : "An unknown error occurred.";
                setError(errorMessage);
                if (pageToFetch === 1) setLogs([]);
            } finally {
                setIsLoading(false);
                setIsFetchingMore(false);
                setIsRefreshing(false);
            }
        },
        [pagination.limit, activeFilter, debouncedSearchQuery, isRefreshing]
    );

    useEffect(() => {
        setLogs([]);
        setPagination((p) => ({ ...p, page: 1, total: 0 }));
        fetchHistoryData(1);
    }, [fetchHistoryData]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchHistoryData(1);
    }, [fetchHistoryData]);

    const handleSelectFilter = (filter: FilterType) => {
        setActiveFilter(filter);
    };

    const handleLoadMore = () => {
        if (!isFetchingMore && logs.length < pagination.total) {
            const nextPage = pagination.page + 1;
            fetchHistoryData(nextPage);
        }
    };


  // const groupedLogs = useMemo(...) // Dihapus

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="px-5 pt-5">
          {[...Array(5)].map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </View>
      );
    }

    if (error) {
        // ... (Error state tidak berubah)
        return (
            <View className="flex-1 justify-center items-center pb-20 px-5">
                <Ionicons
                    name="cloud-offline-outline"
                    size={60}
                    className="text-textLight"
                />
                <Text className="font-poppins-semibold text-lg text-text mt-4 text-center">
                    Failed to Load History
                </Text>
                <Text className="font-roboto-regular text-sm text-textLight mt-1 text-center">
                    {error}
                </Text>
                <TouchableOpacity
                    onPress={handleRefresh}
                    className="mt-4 bg-primary/20 px-4 py-2 rounded-lg"
                >
                    <Text className="font-roboto-bold text-primary">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (logs.length === 0) {
        // ... (Empty state tidak berubah, hanya memeriksa 'logs' bukan 'groupedLogs')
        return (
            <View className="flex-1 justify-center items-center pb-20">
                <Ionicons name="archive-outline" size={60} className="text-textLight" />
                <Text className="font-poppins-semibold text-lg text-text mt-4">
                    No History Found
                </Text>
                <Text className="font-roboto-regular text-sm text-textLight mt-1">
                    Try a different search or filter.
                </Text>
            </View>
        );
    }

    // 3. PERBAIKAN: Gunakan FlatList langsung dengan data 'logs'
    return (
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Logika untuk menampilkan header tanggal jika tanggalnya berbeda dari item sebelumnya
          const currentDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
          });
          
          const prevDate = index > 0 ? new Date(logs[index - 1].createdAt).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
          }) : null;

          const showDateHeader = index === 0 || currentDate !== prevDate;
          
          const isLamp = item.device.deviceName.toLowerCase().includes("lamp");
          let type: LogItemData["type"] | null = null;
          let message = "";

          if (item.triggerType === "motion_detected") {
            type = "motion";
            message = `Motion detected near ${item.device.deviceName}`;
          } else if (item.triggerType === "scheduled") {
            type = "schedule";
            message = `Schedule activated for ${item.device.deviceName}`;
          } else if (item.triggerType === "manual") {
            type = "manual";
            message = `${item.device.deviceName} controlled manually`;
          }

          if (isLamp) {
            if (item.lightAction === "turned_on") type = "lamp-on";
            if (item.lightAction === "turned_off") type = "lamp-off";
          } else {
            if (item.fanAction === "turned_on") type = "fan-on";
            if (item.fanAction === "turned_off") type = "fan-off";
          }

          if (!message && type) {
            const actionText = (isLamp ? item.lightAction : item.fanAction).replace("_", " ");
            message = `${item.device.deviceName} was ${actionText}`;
          }

          const time = new Date(item.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (!type) return null;

          return (
            <View>
              {showDateHeader && (
                <Text className="font-poppins-bold text-lg text-text mb-4 mt-4 px-1">
                  {currentDate}
                </Text>
              )}
              <LogItem type={type} message={message} time={time} />
            </View>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingMore ? (
            <ActivityIndicator size="small" className="text-primary my-4" />
          ) : null
        }
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
      />
    );
  };

  return (
    <View className="flex-1 bg-background">
        <View
            className="px-5 pb-4 bg-background"
            style={{ paddingTop: insets.top }}
        >
            <Text
                className="font-poppins-medium text-3xl text-text mt-20 mb-6"
                style={{
                    textShadowColor: "rgba(0, 0, 0, 0.25)",
                    textShadowOffset: { width: 1, height: 2 },
                    textShadowRadius: 3,
                }}
            >
                History
            </Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 h-14 shadow-md shadow-black/10">
                <Ionicons name="search-outline" size={22} className="text-textLight" />
                <TextInput
                    className="flex-1 font-roboto-regular h-12 text-lg text-text ml-2.5"
                    placeholder="Search activity..."
                    placeholderTextColor="#777777"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                    className="pl-2.5"
                    onPress={() => setFilterVisible(true)}
                >
                    <Ionicons name="options-outline" size={24} className="text-primary" />
                </TouchableOpacity>
            </View>
        </View>

        {renderContent()}

        <FilterModal
            visible={isFilterVisible}
            onClose={() => setFilterVisible(false)}
            filterGroups={filterGroups}
            currentFilter={activeFilter}
            onSelectFilter={handleSelectFilter}
        />
    </View>
  );
}