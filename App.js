import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api/client";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import OTPScreen from "./screens/OTPScreen";
import HomeScreen from "./screens/HomeScreen";
import CompleteProfile from "./screens/CompleteProfile";
import RegistrationDetailsScreen from "./screens/RegistrationDetailsScreen";
import NearbyMechanics from "./screens/NearbyMechanics";
import BookingScreen from "./screens/BookingScreen";
import BookingDetails from "./screens/BookingDetails";
import ProfileScreen from "./screens/ProfileScreen";
import BookingsScreen from "./screens/BookingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function base64UrlDecode(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const base64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let bc = 0;
  let bs;
  let buffer;

  for (let idx = 0; idx < base64.length; idx++) {
    buffer = chars.indexOf(base64.charAt(idx));
    if (~buffer) {
      bs = bc % 4 ? bs * 64 + buffer : buffer;
      bc++;
      if (bc % 4) {
        const charCode = 255 & (bs >> ((-2 * bc) & 6));
        output += String.fromCharCode(charCode);
      }
    }
  }

  return output;
}

function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch (_) {
    return null;
  }
}

function hasValidToken(token) {
  if (!token) return false;

  const payload = decodeJwt(token);
  if (!payload) {
    return true;
  }

  if (!payload.exp) {
    return true;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp > nowSec - 60;
}

function Tabs({ navigation }) {
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const customerId = await AsyncStorage.getItem("customerId");
        if (!customerId) return;

        const res = await api.get(`/bookings/customer/${customerId}`);
        const ongoing = res.data.find(
          (b) =>
            ["pending", "accepted", "in-progress"].includes(
              b.status?.toLowerCase()
            )
        );
        setActiveBooking(ongoing || null);
      } catch (err) {
        console.error("❌ Error fetching active booking:", err.message);
      }
    };

    fetchActiveBooking();
    const interval = setInterval(fetchActiveBooking, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#C98A52",
          tabBarInactiveTintColor: "gray",
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Home") iconName = "home";
            else if (route.name === "Bookings") iconName = "list";
            else if (route.name === "Profile") iconName = "person";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Bookings" component={BookingsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      {activeBooking && (
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() =>
            navigation.navigate("BookingDetails", {
              bookingId: activeBooking._id,
            })
          }
        >
          <Text style={styles.floatingText}>🔧 View Current Booking</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Login");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const rehydrateSession = async () => {
      try {
        const [customerId, token] = await Promise.all([
          AsyncStorage.getItem("customerId"),
          AsyncStorage.getItem("token"),
        ]);

        if (customerId && hasValidToken(token)) {
          setInitialRoute("Tabs");
        } else {
          await AsyncStorage.multiRemove(["customerId", "customerData", "token"]);
          setInitialRoute("Login");
        }
      } catch (error) {
        console.error("Session rehydrate error:", error);
        setInitialRoute("Login");
      } finally {
        setAuthLoading(false);
      }
    };

    rehydrateSession();
  }, []);

  if (authLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#C98A52" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
        <Stack.Screen
          name="RegistrationDetails"
          component={RegistrationDetailsScreen}
        />
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="NearbyMechanics" component={NearbyMechanics} />
        <Stack.Screen name="BookingScreen" component={BookingScreen} />
        <Stack.Screen name="BookingDetails" component={BookingDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: "#C98A52",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  floatingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
