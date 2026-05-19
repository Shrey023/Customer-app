import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../api/client";

export default function OTPScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------
  // SEND OTP (BACKEND)
  // --------------------
  const sendOtp = async () => {
    try {
      const digits = phone.replace(/\D/g, "");

      if (digits.length !== 10) {
        return Alert.alert("Error", "Enter a valid 10-digit phone number");
      }

      setLoading(true);

      await API.post("/auth/customer/send-otp", {
        phone: digits,
      });

      setOtpSent(true);
      setLoading(false);

      Alert.alert("Success", "OTP sent to your phone");
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Failed to send OTP"
      );
    }
  };

  // --------------------
  // VERIFY OTP (BACKEND)
  // --------------------
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      return Alert.alert("Error", "Enter 6-digit OTP");
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/customer/verify-otp", {
        phone: phone.replace(/\D/g, ""),
        otp,
      });

      const { _id, token, isNew } = res.data;

      if (_id) {
        await AsyncStorage.setItem("customerId", _id);
      }
      if (token) {
        await AsyncStorage.setItem("token", token);
      }

      setLoading(false);

      if (isNew) {
        navigation.replace("CompleteProfile", {
          token,
          customerId: _id,
          phone: phone.replace(/\D/g, ""),
        });
      } else {
        navigation.replace("Tabs");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "OTP verification failed"
      );
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
            {!otpSent ? (
              <>
                <Text style={styles.header}>Enter your mobile number</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Mobile number"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={sendOtp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.header}>Enter code</Text>
                <Text style={styles.subText}>
                  We sent a code to {phone.replace(/\D/g, "")}
                </Text>

                <View style={styles.otpContainer}>
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <TextInput
                        key={i}
                        style={styles.otpBox}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={otp[i] || ""}
                        onChangeText={(value) => {
                          const newOtp = otp.split("");
                          newOtp[i] = value;
                          setOtp(newOtp.join(""));
                        }}
                      />
                    ))}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={verifyOtp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Verifying..." : "Next"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={sendOtp}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
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
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f2f2f2",
    color: "#000",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#f9a825",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  otpBox: {
    width: "14%",
    minWidth: 38,
    height: 55,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    color: "#000",
    fontSize: 20,
    textAlign: "center",
  },
  resendButton: {
    marginTop: 15,
    alignItems: "center",
  },
  resendText: {
    color: "#f9a825",
    fontWeight: "600",
  },
});
