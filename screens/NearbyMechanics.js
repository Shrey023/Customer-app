// NearbyMechanics.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import api from "../api/client";

// ✅ Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function NearbyMechanics({ navigation }) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [sortBy, setSortBy] = useState("distance"); // 'distance' or 'fare'

  const fetchNearby = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location denied");
      const loc = await Location.getCurrentPositionAsync({});
      const { longitude, latitude } = loc.coords;

      setCustomerLocation({ latitude, longitude });

      const { data } = await api.get("/mechanics/nearby", {
        params: { lng: longitude, lat: latitude, radius: 5000 },
      });

      // ✅ Initialize mechanics with loading state for fares
      const mechanicsWithDistance = (data || []).map((mechanic) => {
        const mechLat = mechanic.location?.coordinates?.[1];
        const mechLng = mechanic.location?.coordinates?.[0];
        const distance = mechLat && mechLng
          ? calculateDistance(latitude, longitude, mechLat, mechLng)
          : null;

        return {
          ...mechanic,
          distance,
          visitingCharge: null, // Will be populated
          fareLoading: true,
        };
      });

      setMechanics(mechanicsWithDistance);

      // ✅ Fetch visiting charges in parallel (non-blocking)
      fetchVisitingCharges(mechanicsWithDistance);
    } catch (err) {
      console.error("❌ Nearby fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisitingCharges = async (mechanicsList) => {
    try {
      // ✅ Call fare API for all mechanics in parallel
      const farePromises = mechanicsList.map(async (mechanic) => {
        if (!mechanic.distance) return { ...mechanic, fareLoading: false };

        try {
          const { data } = await api.post(
            `/mechanics/${mechanic._id}/calculate-fare`,
            { distanceKm: mechanic.distance }
          );
          return {
            ...mechanic,
            visitingCharge: data.visitingCharge,
            fareLoading: false,
          };
        } catch (err) {
          console.error(`❌ Fare calc failed for ${mechanic._id}:`, err.message);
          return { ...mechanic, visitingCharge: null, fareLoading: false };
        }
      });

      const updatedMechanics = await Promise.all(farePromises);
      setMechanics(updatedMechanics);
    } catch (err) {
      console.error("❌ Visiting charge fetch error:", err.message);
    }
  };

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // ✅ Sort mechanics based on selected criteria
  const getSortedMechanics = () => {
    const sorted = [...mechanics];
    if (sortBy === "distance") {
      return sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (sortBy === "fare") {
      return sorted.sort(
        (a, b) =>
          (a.visitingCharge || 999999) - (b.visitingCharge || 999999)
      );
    }
    return sorted;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadText}>Finding nearby mechanics…</Text>
      </View>
    );
  }

  const sortedMechanics = getSortedMechanics();

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Nearest Mechanics</Text>

      {/* ✅ Sort Buttons */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortBtn, sortBy === "distance" && styles.sortBtnActive]}
          onPress={() => setSortBy("distance")}
        >
          <Text
            style={[
              styles.sortText,
              sortBy === "distance" && styles.sortTextActive,
            ]}
          >
            Nearest First
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, sortBy === "fare" && styles.sortBtnActive]}
          onPress={() => setSortBy("fare")}
        >
          <Text
            style={[
              styles.sortText,
              sortBy === "fare" && styles.sortTextActive,
            ]}
          >
            Lowest Fare
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedMechanics}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MechanicRow
            mechanic={item}
            onPress={() =>
              navigation.navigate("BookingScreen", { mechanicId: item._id })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No mechanics nearby right now.</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function MechanicRow({ mechanic, onPress }) {
  // ✅ Format visiting charge display
  let visitingText = "—";
  if (mechanic.fareLoading) {
    visitingText = "calculating...";
  } else if (mechanic.visitingCharge !== null && mechanic.visitingCharge !== undefined) {
    visitingText = `₹${mechanic.visitingCharge}`;
  }

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{mechanic.name}</Text>
        <Text style={styles.meta}>
          ⭐ {Number(mechanic.rating || 0).toFixed(1)} •{" "}
          {(mechanic.distance || 0).toFixed(1)} km
        </Text>
        <Text style={styles.fare}>Visiting: {visitingText}</Text>
      </View>
      <Text style={styles.book}>Book</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadText: { marginTop: 8, color: "#555" },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 16,
    color: "#111",
  },
  sortRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  sortBtnActive: {
    backgroundColor: "#C98A52",
  },
  sortText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  sortTextActive: {
    color: "#fff",
  },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#121212" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
  fare: { fontSize: 13, color: "#C98A52", marginTop: 3, fontWeight: "600" },
  book: { color: "#C98A52", fontWeight: "800" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#777" },
});
