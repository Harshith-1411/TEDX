import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CampusMap.css';

// BIET coordinates in Ibrahimpatnam, Hyderabad
const BIET_COORDS = [17.1973, 78.6471];

export default function CampusMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: BIET_COORDS,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Use reliable OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom pulsing TEDx pin icon
      const customIcon = L.divIcon({
        className: 'tedx-leaflet-marker',
        html: `
          <div class="tedx-map-pin">
            <span class="tedx-pin-pulse"></span>
            <span class="tedx-pin-core"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -14],
      });

      const marker = L.marker(BIET_COORDS, { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div class="tedx-map-popup">
          <strong style="color:#e62b1e;font-size:13px;letter-spacing:0.04em;">TEDxBIET 2026</strong>
          <div style="font-size:11px;color:#333;margin:4px 0 8px;">Bharat Institute of Engineering & Technology<br/>Ibrahimpatnam, Hyderabad</div>
          <a href="https://www.google.com/maps/dir/?api=1&destination=Bharat+Institute+of+Engineering+and+Technology+Ibrahimpatnam+Hyderabad" 
             target="_blank" 
             rel="noopener noreferrer" 
             style="display:inline-block;padding:4px 10px;background:#e62b1e;color:#fff;border-radius:4px;font-size:11px;text-decoration:none;font-weight:600;">
            Directions &#8599;
          </a>
        </div>
      `);

      mapInstanceRef.current = map;

      // Invalidate size after container settles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    } catch (err) {
      console.warn('Leaflet initialization warning:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="campus-map-wrapper">
      <div ref={mapContainerRef} className="campus-leaflet-container" />
      <div className="campus-map-bar mono">
        <span>BIET Campus, Ibrahimpatnam</span>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Bharat+Institute+of+Engineering+and+Technology+Ibrahimpatnam+Hyderabad"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Maps &#8599;
        </a>
      </div>
    </div>
  );
}
