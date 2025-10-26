import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import API from "../api/client";

export default function RegistrationDetailsScreen({ route, navigation }) {
  const { token, customerId } = route.params;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const saveDetails = async () => {
    try {
      await API.put(`/customers/${customerId}`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "Details saved!");
      navigation.replace("Home", { token, customerId });
    } catch (err) {
      Alert.alert("Error", "Failed to save details");
    }
  };

  const skip = () => {
    navigation.replace("Home", { token, customerId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

      <TouchableOpacity style={styles.button} onPress={saveDetails}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 15 },
  button: { backgroundColor: "#28A745", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  skipButton: { alignItems: "center", marginTop: 10 },
  skipText: { color: "#007BFF", fontWeight: "600" },
});
