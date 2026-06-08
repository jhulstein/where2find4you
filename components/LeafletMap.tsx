"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { PlaceMapProps } from "@/components/PlaceMap";

export default function LeafletMap({ city, places, scores }: PlaceMapProps) {
  const scoreByPlaceId = scores.reduce<Record<string, number>>(
    (accumulator, score) => {
      accumulator[score.placeId] = score.totalScore;
      return accumulator;
    },
    {},
  );

  const center: [number, number] =
    places.length > 0
      ? [places[0].latitude, places[0].longitude]
      : [city.latitude, city.longitude];

  const markerIcon = L.divIcon({
    className: "",
    html: '<span class="scout-marker">W2</span>',
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    popupAnchor: [0, -12],
  });

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((place) => (
        <Marker
          key={place.id}
          icon={markerIcon}
          position={[place.latitude, place.longitude]}
        >
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold">{place.name}</p>
              <p className="text-sm">{place.category}</p>
              <p className="mt-1 text-sm">Score {scoreByPlaceId[place.id]}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
