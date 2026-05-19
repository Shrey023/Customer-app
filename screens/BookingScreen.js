// BookingScreen.js
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, SafeAreaView, Platform,
  ScrollView, KeyboardAvoidingView, StatusBar
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api/client";

export default function BookingScreen({ route, navigation }) {
  const { mechanicId } = route.params;
  const [vehicleType, setVehicleType] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [scheduledTime, setScheduledTime] = useState(new Date()); // default → now
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  // ✅ Android-specific: Track if we're showing date or time picker
  const [pickerMode, setPickerMode] = useState("date"); // "date" or "time" for Android

  // ✅ Helper: Request location permission with explicit error handling
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied. Cannot proceed with booking without location access.");
      }
      return true;
    } catch (err) {
      throw new Error(err.message || "Unable to request location permission");
    }
  };

  // ✅ Helper: Get location with timeout and accuracy options
  const getLocationWithOptions = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 10000, // 10 second timeout
        maximumAge: 5000, // Cache location for 5 seconds
      });
      
      if (!loc?.coords?.longitude || !loc?.coords?.latitude) {
        throw new Error("Unable to retrieve your location coordinates");
      }
      
      return loc.coords;
    } catch (err) {
      if (err.message.includes("timeout")) {
        throw new Error("Location request timed out. Please ensure GPS is enabled and try again.");
      }
      if (err.message.includes("not available")) {
        throw new Error("GPS is not available. Please enable location services.");
      }
      throw new Error(err.message || "Unable to get your location. Please try again.");
    }
  };

  const handleBooking = async () => {
    // ✅ Validate ALL required fields before submission
    if (!vehicleType.trim()) {
      Alert.alert("Error", "Please enter vehicle type (e.g., Car, Bike, Truck)");
      return;
    }
    if (!serviceType.trim()) {
      Alert.alert("Error", "Please enter service type");
      return;
    }
    if (!problemDescription.trim()) {
      Alert.alert("Error", "Please describe the problem");
      return;
    }

    // ✅ Validate scheduled time is not in the past
    const now = new Date();
    if (scheduledTime <= now) {
      Alert.alert("Error", "Please select a time in the future");
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Step 1: Check authentication
      const customerId = await AsyncStorage.getItem("customerId");
      if (!customerId) throw new Error("Not logged in. Please log in to proceed.");

      // ✅ Step 2: Request location permission (explicit check)
      await requestLocationPermission();

      // ✅ Step 3: Get location with timeout and error handling
      const coords = await getLocationWithOptions();
      const { longitude, latitude } = coords;

      // ✅ Step 4: Create booking with all required fields
      const response = await api.post("/bookings", {
        customerId,
        mechanicId,
        vehicleType,
        serviceType,
        issueDescription: problemDescription,
        scheduledTime: scheduledTime,
        location: { type: "Point", coordinates: [longitude, latitude] },
        payment: { mode: "cash", status: "pending", amount: 0 },
      });

      // ✅ Step 5: Validate response and booking ID before proceeding
      if (!response?.data?._id) {
        throw new Error("Booking creation failed: Invalid response from server");
      }

      const bookingId = response.data._id;
      
      // ✅ CRITICAL: Set loading false BEFORE navigation to prevent state update on unmounted component
      setLoading(false);

      // ✅ Step 6: Navigate to booking details (only after loading is set)
      Alert.alert("✅ Success", "Booking created successfully!", [
        {
          text: "OK",
          onPress: () => {
            // ✅ Guard against undefined navigation or bookingId
            if (navigation?.replace && bookingId) {
              navigation.replace("BookingDetails", { bookingId });
            } else {
              console.error("❌ Navigation error: navigation object or bookingId is invalid");
              Alert.alert("Error", "Navigation failed. Please go back and try again.");
            }
          }
        }
      ]);
    } catch (err) {
      setLoading(false);
      const errorMessage = err?.response?.data?.message || err?.message || "Unknown error occurred";
      console.error("❌ Booking error:", errorMessage);
      Alert.alert("Error", `Failed to create booking: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text>Creating booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Book Mechanic</Text>

          <TextInput
            style={styles.input}
            placeholder="Vehicle Type (e.g. Car, Bike, Truck)"
            value={vehicleType}
            onChangeText={setVehicleType}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Service Type (e.g. Tire Change)"
            value={serviceType}
            onChangeText={setServiceType}
            placeholderTextColor="#999"
          />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Describe the problem"
            value={problemDescription}
            onChangeText={setProblemDescription}
            multiline
            placeholderTextColor="#999"
          />

          {/* ✅ Time Picker - Platform Specific */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setShowPicker(true);
              // ✅ Android: Start with date picker
              if (Platform.OS === "android") {
                setPickerMode("date");
              }
            }}
          >
            <Text>
              Scheduled Time: {scheduledTime.toLocaleString()}
            </Text>
          </TouchableOpacity>

      {/* ✅ iOS: Single datetime spinner picker */}
      {showPicker && Platform.OS === "ios" && (
        <DateTimePicker
          value={scheduledTime}
          mode="datetime"
          is24Hour={true}
          display="spinner"
          onChange={(event, selectedDate) => {
            if (event.type === "dismissed") {
              setShowPicker(false);
              return;
            }
            
            setShowPicker(false);
            if (selectedDate) {
              setScheduledTime(selectedDate);
            }
          }}
        />
      )}

      {/* ✅ Android: Two-step picker (date first, then time) */}
      {showPicker && Platform.OS === "android" && pickerMode === "date" && (
        <DateTimePicker
          value={scheduledTime}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === "dismissed") {
              setShowPicker(false);
              setPickerMode("date");
              return;
            }
            
            // ✅ Date selected, transition to time picker
            if (selectedDate) {
              setScheduledTime(selectedDate);
              setPickerMode("time"); // Move to time picker
            }
          }}
        />
      )}

      {/* ✅ Android: Time picker (second step) */}
      {showPicker && Platform.OS === "android" && pickerMode === "time" && (
        <DateTimePicker
          value={scheduledTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedTime) => {
            if (event.type === "dismissed") {
              setShowPicker(false);
              setPickerMode("date");
              return;
            }
            
            // ✅ Time selected, close pickers and update state
            if (selectedTime) {
              setScheduledTime(selectedTime);
            }
            setShowPicker(false);
            setPickerMode("date"); // Reset for next time
          }}
        />
      )}

          <TouchableOpacity style={styles.btn} onPress={handleBooking}>
            <Text style={styles.btnText}>Confirm Booking</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  keyboardWrap: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
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
