// BookingScreen.js
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api/client";

export default function BookingScreen({ route, navigation }) {
  const { mechanicId } = route.params;
  const [serviceType, setServiceType] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [scheduledTime, setScheduledTime] = useState(new Date()); // default → now
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!serviceType.trim()) {
      Alert.alert("Error", "Please enter service type");
      return;
    }
    try {
      setLoading(true);
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) throw new Error("Not logged in");

      // ✅ get customer location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") throw new Error("Location permission denied");
      const loc = await Location.getCurrentPositionAsync({});
      const { longitude, latitude } = loc.coords;

      // ✅ create booking with normalized keys
      const { data } = await api.post("/bookings", {
        customerId,
        mechanicId,
        serviceType,
        issueDescription: problemDescription,
        scheduledTime: scheduledTime.toISOString(),
        location: { type: "Point", coordinates: [longitude, latitude] },
        payment: { mode: "cash", status: "pending", amount: 0 },
      });

      setLoading(false);
      Alert.alert("✅ Success", "Booking created successfully!", [
        { text: "OK", onPress: () => navigation.replace("BookingDetails", { bookingId: data._id }) }
      ]);
    } catch (err) {
      setLoading(false);
      console.error("❌ Booking error:", err.message);
      Alert.alert("Error", "Failed to create booking. Try again.");
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Creating booking…</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Book Mechanic</Text>

      <TextInput
        style={styles.input}
        placeholder="Service Type (e.g. Tire Change)"
        value={serviceType}
        onChangeText={setServiceType}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Describe the problem"
        value={problemDescription}
        onChangeText={setProblemDescription}
        multiline
      />

      {/* ✅ Time Picker */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowPicker(true)}
      >
        <Text>
          Scheduled Time: {scheduledTime.toLocaleString()}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={scheduledTime}
          mode="datetime"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              setScheduledTime(selectedDate);
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.btn} onPress={handleBooking}>
        <Text style={styles.btnText}>Confirm Booking</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    padding: 12, marginBottom: 15, backgroundColor: "#fafafa",
  },
  btn: {
    backgroundColor: "#C98A52", padding: 15, borderRadius: 12,
    alignItems: "center", marginTop: 10,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
