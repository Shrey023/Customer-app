import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import {
  getAuth,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { app, firebaseConfig } from "../config/firebase";
import API from "../api/client";

const auth = getAuth(app);

export default function OTPScreen({ navigation }) {
  const recaptchaVerifier = useRef(null);

  const [phone, setPhone] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Send OTP
  const sendOtp = async () => {
    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) {
        return Alert.alert("Error", "Enter a valid phone number");
      }

      const e164 = phone.startsWith("+") ? phone : `+91${digits.slice(-10)}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        e164,
        recaptchaVerifier.current
      );

      setVerificationId(confirmation.verificationId);
      Alert.alert("Success", "OTP sent to " + e164);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!verificationId) return Alert.alert("Error", "Please request OTP first");
    if (otp.length < 6) return Alert.alert("Error", "Enter 6-digit OTP");

    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);

      const user = auth.currentUser;
      if (!user) throw new Error("No Firebase user after OTP verification");

      const idToken = await user.getIdToken();
      const res = await API.post("/customers/verify-otp", { idToken });

      const { token, _id, isNew } = res.data;
      Alert.alert("Success", "OTP verified successfully!");
      setLoading(false);

      if (isNew) {
        navigation.replace("RegistrationDetails", { token, customerId: _id });
      } else {
        navigation.replace("Home", { token, customerId: _id });
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.message || "OTP verification failed");
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        style={{ opacity: 0 }}
      />

      {!verificationId ? (
        <>
          {/* Phone Number Input Screen */}
          <Text style={styles.header}>Enter your mobile number</Text>

          <TextInput
            style={styles.input}
            placeholder="Mobile number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity style={styles.button} onPress={sendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* OTP Verification Screen */}
          <Text style={styles.header}>Enter code</Text>
          <Text style={styles.subText}>We sent a code to {phone}</Text>

          <View style={styles.otpContainer}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <TextInput
                  key={i}
                  style={styles.otpBox}
                  maxLength={1}
                  keyboardType="number-pad"
                  onChangeText={(value) => {
                    let newOtp = otp.split("");
                    newOtp[i] = value;
                    setOtp(newOtp.join(""));
                  }}
                  value={otp[i] || ""}
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

          <TouchableOpacity style={styles.resendButton} onPress={sendOtp}>
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
    backgroundColor: "#fff", // Light theme background
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
    backgroundColor: "#f9a825", // orange
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
