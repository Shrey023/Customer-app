import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/client";

export default function CompleteProfile({ route, navigation }) {
  const { phone, token, customerId } = route.params;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const createCustomer = async () => {
    if (!name.trim()) {
      return Alert.alert("Error", "Name is required");
    }

    try {
      setLoading(true);

      await API.put(
        `/customers/${customerId}`,
        {
          name: name.trim(),
          email: email.trim() || `${phone}@customer.local`,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      await AsyncStorage.setItem("customerId", customerId);

      Alert.alert("Success", "Profile updated!");
      navigation.replace("Tabs", { customerId });
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to create profile");
    }
  };

  const skip = async () => {
    try {
      setLoading(true);

      await AsyncStorage.setItem("customerId", customerId);
      navigation.replace("Tabs", { customerId });
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err?.response?.data?.message || err?.message || "Failed to create profile");
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
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Help us know more about you</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            {loading && <ActivityIndicator size="large" color="#C98A52" style={{ marginVertical: 20 }} />}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={createCustomer}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating..." : "Save & Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={skip} disabled={loading}>
              <Text style={styles.skipText}>Skip</Text>
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
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#C98A52",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  skipButton: {
    alignItems: "center",
    marginTop: 15,
  },
  skipText: {
    color: "#C98A52",
    fontWeight: "600",
    fontSize: 14,
  },
});
