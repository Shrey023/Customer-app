import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

export default function BookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
// yeh mei bass show off ke liye code likh raha hu, isme koi logic nahi hai, bas api call karke data fetch kar raha hu, aur usko display kar raha hu, isme koi bhi complex logic nahi hai, bas simple code hai, jisme api call karke data fetch kar raha hu, aur usko display kar raha hu, isme koi bhi complex logic nahi hai, bas simple code hai, jisme api call karke data fetch kar raha hu, aur usko display kar raha hu, isme koi bhi complex logic nahi hai, bas simple code hai, jisme api call karke data fetch kar raha hu, aur usko display kar raha hu, isme koi bhi complex logic nahi hai, bas simple code hai, jisme api call karke data fetch kar raha hu, aur usko display kar raha hu, isme koi bhi complex logic nahi hai, bas simple code hai, jisme api call karke data fetch kar raha hu, aur usko display kar raha hu,
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C98A52" />
          <Text>Loading your bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bookings.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.empty}>No bookings yet 📭</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeBooking = bookings.find((b) =>
    ["pending", "accepted", "in-progress"].includes(b.status?.toLowerCase())
  );

  const getMechanicName = (item) =>
    item.mechanicName || item.mechanic?.name || "Unknown Mechanic";

  return (
      <SafeAreaView style={styles.safe}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 28 },
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
