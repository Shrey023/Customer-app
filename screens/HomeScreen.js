// HomeScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import api from "../api/client"; // axios instance with baseURL

const STATUS_ORDER = { available: 0, busy: 1, offline: 2 };

export default function HomeScreen({ navigation }) {
  const [availableMechanics, setAvailableMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("top");

  const fetchDashboardData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) throw new Error("No customerId in storage");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location permission denied");
      const loc = await Location.getCurrentPositionAsync({});
      const { longitude, latitude } = loc.coords;

      const { data } = await api.get("/mechanics/nearby", {
        params: { lng: longitude, lat: latitude, radius: 5000 },
      });

      const list = data.map((m) => ({
        ...m,
        rating: Number(m.rating || 0),
        distance: m.distance ?? null,
      }));
      setAvailableMechanics(list);
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const sortedMechanics = useMemo(() => {
    const arr = [...availableMechanics];
    arr.sort((a, b) => {
      const sa = STATUS_ORDER[(a.currentStatus || "").toLowerCase()] ?? 99;
      const sb = STATUS_ORDER[(b.currentStatus || "").toLowerCase()] ?? 99;
      if (sa !== sb) return sa - sb;

      if (selectedFilter === "top") return (b.rating || 0) - (a.rating || 0);
      if (selectedFilter === "near") {
        const da = a.distance ?? Number.POSITIVE_INFINITY;
        const db = b.distance ?? Number.POSITIVE_INFINITY;
        return da - db;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
    return arr.filter(
      (m) => (m.currentStatus || "").toLowerCase() === "available"
    );
  }, [availableMechanics, selectedFilter]);

  const handleBookMechanic = (mechanic) => {
    navigation.navigate("BookingScreen", { mechanicId: mechanic._id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadText}>Loading Dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.heroWrap}>
              <ImageBackground
                style={styles.hero}
                source={{ uri: "https://i.ibb.co/CW1wq5y/car-bg.png" }}
                backgroundColor="#F2EADF"
              >
                <View style={styles.heroOverlay} />
                <Text style={styles.heroTitle}>
                  Need Help? Find a{"\n"}Mechanic Now!
                </Text>
                <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate("NearbyMechanics")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.ctaText}>🔧 Find Nearest Mechanic</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>

            {/* Filter Chips */}
            <View style={styles.chipsRow}>
              <Chip
                label="⭐ Top Rated"
                active={selectedFilter === "top"}
                onPress={() => setSelectedFilter("top")}
              />
              <Chip
                label="Nearest"
                active={selectedFilter === "near"}
                onPress={() => setSelectedFilter("near")}
              />
              <Chip
                label="Fastest Arrival"
                active={selectedFilter === "fast"}
                onPress={() => setSelectedFilter("fast")}
              />
            </View>

            <Text style={styles.sectionTitle}>Available Mechanics</Text>
          </>
        }
        data={sortedMechanics}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MechanicRow mechanic={item} onPress={() => handleBookMechanic(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No mechanics available right now.</Text>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MechanicRow({ mechanic, onPress }) {
  const status = (mechanic.currentStatus || "").toLowerCase();
  const statusDot =
    status === "available" ? "🟢" : status === "busy" ? "🟠" : "⚪";

  return (
    <TouchableOpacity
      style={styles.mechanicRow}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatar} />
      <View style={styles.mechanicInfo}>
        <Text style={styles.mechanicName}>{mechanic.name || "Unknown"}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            ⭐ {Number(mechanic.rating || 0).toFixed(1)}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>
            {statusDot} {capitalize(status || "unknown")}
          </Text>
          {typeof mechanic.distance === "number" && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>
                {mechanic.distance.toFixed(1)} mi
              </Text>
            </>
          )}
        </View>
      </View>
      <Text style={styles.rowCta}>Book</Text>
    </TouchableOpacity>
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadText: { marginTop: 8, color: "#555" },
  heroWrap: { paddingHorizontal: 16, paddingTop: 8 },
  hero: {
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "#F2EADF",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginBottom: 10,
  },
  ctaButton: {
    backgroundColor: "#C98A52",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F3F2F1",
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { backgroundColor: "#1E1E1E" },
  chipText: { color: "#333", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  listContent: { paddingBottom: 24 },
  mechanicRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFEFEF",
    marginRight: 12,
  },
  mechanicInfo: { flex: 1 },
  mechanicName: { fontSize: 16, fontWeight: "700", color: "#121212" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  metaText: { color: "#6B6B6B", fontSize: 13, fontWeight: "600" },
  dot: { marginHorizontal: 6, color: "#C0C0C0", fontSize: 13 },
  rowCta: { color: "#C98A52", fontWeight: "800" },

});
