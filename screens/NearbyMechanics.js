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

export default function NearbyMechanics({ navigation }) {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNearby = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location denied");
      const loc = await Location.getCurrentPositionAsync({});
      const { longitude, latitude } = loc.coords;

      const { data } = await api.get("/mechanics/nearby", {
        params: { lng: longitude, lat: latitude, radius: 5000 },
      });

      setMechanics(data || []);
    } catch (err) {
      console.error("❌ Nearby fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadText}>Finding nearby mechanics…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Nearest Mechanics</Text>
      <FlatList
        data={mechanics}
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
          {(mechanic.distance || 0).toFixed(1)} mi
        </Text>
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
  book: { color: "#C98A52", fontWeight: "800" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#777" },
});
