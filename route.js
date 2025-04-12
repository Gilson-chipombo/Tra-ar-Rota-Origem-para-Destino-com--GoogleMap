import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const destination = {
  latitude: -8.839988, // exemplo: coordenadas de um ponto qualquer
  longitude: 13.289437,
};

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissão negada para acessar localização');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      // Obter a rota do Google Directions API
      fetchRoute(loc.coords, destination);
    })();
  }, []);

  const fetchRoute = async (origin, dest) => {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${dest.latitude},${dest.longitude}`;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=SUA_CHAVE_GOOGLE`
    );

    if (response.data.routes.length) {
      const points = decodePolyline(
        response.data.routes[0].overview_polyline.points
      );
      setRouteCoords(points);
    }
  };

  // Função para decodificar o polyline
  function decodePolyline(encoded) {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : result >> 1);
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title="Você" />
          <Marker coordinate={destination} title="Destino" />
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
});

