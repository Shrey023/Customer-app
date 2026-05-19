import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import axios from "axios";
import api from "../api/client";

export default function BookingDetails({ route, navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polylineCoords, setPolylineCoords] = useState([]);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const mapRef = useRef(null);

  const fetchBooking = async () => {
    try {
      const { data } = await api.get(`/bookings/${bookingId}`);
      setBooking(data);

      if (
        data?.mechanic?.location?.coordinates &&
        data?.location?.coordinates
      ) {
        const mechCoords = [
          Number(data.mechanic.location.coordinates[0]?.$numberDecimal ?? data.mechanic.location.coordinates[0]),
          Number(data.mechanic.location.coordinates[1]?.$numberDecimal ?? data.mechanic.location.coordinates[1]),
        ];
        const custCoords = [
          Number(data.location.coordinates[0]?.$numberDecimal ?? data.location.coordinates[0]),
          Number(data.location.coordinates[1]?.$numberDecimal ?? data.location.coordinates[1]),
        ];
        fetchRoute(mechCoords[1], mechCoords[0], custCoords[1], custCoords[0]);
      }
    } catch (err) {
      console.error("❌ Booking fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${apiKey}`
      );

      const route = res.data?.routes?.[0];
      if (route) {
        const points = route.overview_polyline?.points;
        if (points) setPolylineCoords(decodePolyline(points));

        // ETA & Distance
        const leg = route.legs?.[0];
        if (leg) {
          setEta(leg.duration.text);
          setDistance(leg.distance.text);
        }

        // Fit map to route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            decodePolyline(route.overview_polyline.points),
            {
              edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
              animated: true,
            }
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch route.");
    }
  };

  function decodePolyline(encoded) {
    if (!encoded) return [];
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading booking…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  const mechRaw = booking?.mechanic?.location?.coordinates;
  const custRaw = booking?.location?.coordinates;
  const mechanicCoords =
    Array.isArray(mechRaw) && mechRaw.length === 2
      ? {
          latitude: Number(mechRaw[1]?.$numberDecimal ?? mechRaw[1]),
          longitude: Number(mechRaw[0]?.$numberDecimal ?? mechRaw[0]),
        }
      : null;
  const customerCoords =
    Array.isArray(custRaw) && custRaw.length === 2
      ? {
          latitude: Number(custRaw[1]?.$numberDecimal ?? custRaw[1]),
          longitude: Number(custRaw[0]?.$numberDecimal ?? custRaw[0]),
        }
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mechanic Status</Text>
        </View>

        {/* Mechanic Card */}
        <View style={styles.mechanicCard}>
          <Image
            source={{
              uri:
                booking.mechanic?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/219/219970.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.mechanicName}>
              {booking.mechanic?.name || "Unknown"}
            </Text>
            <Text style={styles.mechanicRole}>Mechanic</Text>
          </View>
        </View>

        {/* Map with route */}
        {mechanicCoords && customerCoords && (
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              style={styles.map}
              showsUserLocation={true}
              loadingEnabled={true}
              customMapStyle={mapStyle} // custom theme
            >
              <Marker
                coordinate={mechanicCoords}
                title="Mechanic"
                description="Mechanic’s live location"
                image={require("../assets/mechanic-pin.png")}
              />
              <Marker
                coordinate={customerCoords}
                title="You"
                description="Your location"
                image={require("../assets/customer-pin.png")}
              />
              {polylineCoords.length > 0 && (
                <Polyline
                  coordinates={polylineCoords}
                  strokeWidth={5}
                  strokeColor="#007BFF"
                />
              )}
            </MapView>

            {/* ETA + Distance Banner */}
            {(eta || distance) && (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  {distance ? `${distance} • ` : ""}{eta ? `ETA ${eta}` : ""}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Booking Info */}
        <Text style={styles.sectionTitle}>Booking Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Scheduled Time</Text>
            <Text style={styles.value}>
              {booking.scheduledTime
                ? new Date(booking.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "ASAP"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>
              {booking.status?.replace("-", " ") || "-"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Requested</Text>
            <Text style={styles.value}>{booking.serviceType || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status</Text>
            <Text style={styles.value}>{booking.payment?.status || "-"}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  scrollContent: { paddingBottom: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  back: { fontSize: 20, marginRight: 10 },
  title: { fontSize: 18, fontWeight: "700", color: "#000" },

  mechanicCard: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  mechanicName: { fontSize: 16, fontWeight: "700", color: "#000" },
  mechanicRole: { fontSize: 14, color: "#888" },

  mapWrap: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  map: { flex: 1 },

  banner: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    backgroundColor: "#000000aa",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bannerText: { color: "#fff", fontWeight: "600" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 16,
  },

  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 14, color: "#555" },
  value: { fontSize: 14, fontWeight: "600", color: "#000" },
});

const mapStyle = []; // 🔥 You can paste a JSON style from https://mapstyle.withgoogle.com/
