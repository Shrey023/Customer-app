import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
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

      await API.post("/customer/send-otp", {
        phone: digits,
      });

      setOtpSent(true);
      setLoading(false);

      Alert.alert("Success", "OTP sent to your phone");
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to send OTP"
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

      const res = await API.post("/customer/verify-otp", {
        phone: phone.replace(/\D/g, ""),
        otp,
      });

      const { token, _id, isNew } = res.data;

      setLoading(false);

      if (isNew) {
        navigation.replace("RegistrationDetails", {
          token,
          customerId: _id,
        });
      } else {
        navigation.replace("Home", {
          token,
          customerId: _id,
        });
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "OTP verification failed"
      );
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    backgroundColor: "#fff",
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
    marginBottom: 20,
  },
  otpBox: {
    width: 45,
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
