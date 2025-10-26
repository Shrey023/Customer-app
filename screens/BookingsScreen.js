import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const customerId = await AsyncStorage.getItem("customerId");
        if (!customerId) return;

        const res = await api.get(`/bookings/customer/${customerId}`);
        console.log("📥 Bookings:", res.data); // debug log
        setBookings(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C98A52" />
        <Text>Loading your bookings...</Text>
      </View>
    );
  }

  if (!bookings.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No bookings yet 📭</Text>
      </View>
    );
  }

  const activeBooking = bookings.find((b) =>
    ["pending", "accepted", "in-progress"].includes(b.status?.toLowerCase())
  );

  const getMechanicName = (item) =>
    item.mechanicName || item.mechanic?.name || "Unknown Mechanic";

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        activeBooking ? (
          <TouchableOpacity
            style={[styles.card, styles.activeCard]}
            onPress={() =>
              navigation.navigate("BookingDetails", { bookingId: activeBooking._id })
            }
          >
            <Text style={styles.activeTitle}>🔔 Current Booking</Text>
            <Text>Mechanic: {getMechanicName(activeBooking)}</Text>
            <Text>Status: {activeBooking.status}</Text>
          </TouchableOpacity>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>Booking with {getMechanicName(item)}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { fontSize: 16, color: "#777" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCard: {
    backgroundColor: "#FFF3E0",
    borderColor: "#C98A52",
    borderWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  activeTitle: { fontSize: 18, fontWeight: "800", color: "#C98A52" },
});
