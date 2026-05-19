import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/client"; // axios instance for backend

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    try {
      setLoading(true);
      console.log("📤 Sending login request:", { email, password });

      const res = await API.post("/auth/customer/login", { email, password });
      console.log("✅ Login success:", res.data);

      await AsyncStorage.setItem("customerId", res.data._id);
      await AsyncStorage.setItem(
        "customerData",
        JSON.stringify(res.data)
      );
      if (res.data.token) {
        await AsyncStorage.setItem("token", res.data.token);
      }

      Alert.alert("Success", "Login successful!");
      navigation.replace("Tabs");
    } catch (err) {
      console.error("❌ Login error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.container}>
            <Text style={styles.brand}>Mechze</Text>
            <Text style={styles.title}>Welcome back</Text>

            <TextInput
              style={styles.input}
              placeholder="Username or email"
              placeholderTextColor="#8a8a8a"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8a8a8a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Logging in..." : "Log in"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Or log in with</Text>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => navigation.navigate("OTP")}
              >
                <Text style={styles.socialText}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.signupText}>
                Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
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
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 16,
  },
  container: {
    alignItems: "center",
    width: "100%",
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 5,
    color: "#000",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f2ef",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#d28a41", // orange-brown shade
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  orText: {
    marginVertical: 10,
    fontSize: 14,
    color: "#8a8a8a",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    backgroundColor: "#f5f2ef",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 5,
  },
  socialText: {
    fontWeight: "600",
    color: "#000",
    fontSize: 15,
  },
  signupText: {
    fontSize: 14,
    color: "#6b4f3f",
    textAlign: "center",
  },
  signupLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
