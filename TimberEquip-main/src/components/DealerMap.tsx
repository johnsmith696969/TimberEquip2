import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Seller } from '../types';
import { buildDealerPath } from '../utils/seoRoutes';

interface DealerMapProps {
  dealers: Seller[];
}

function getDealerRole(role?: string): string {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'pro_dealer') return 'Pro Dealer';
  return 'Dealer';
}

export function DealerMap({ dealers }: DealerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when dealers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    for (const dealer of dealers) {
      if (!dealer.latitude || !dealer.longitude) continue;
      hasMarkers = true;

      const latlng = L.latLng(dealer.latitude, dealer.longitude);
      bounds.extend(latlng);

      const name = String(dealer.storefrontName || dealer.name || 'Dealer').replace(/</g, '&lt;');
      const role = getDealerRole(dealer.role);
      const loc = String(dealer.location || '').replace(/</g, '&lt;');
      const path = buildDealerPath(dealer);

      L.circleMarker(latlng, {
        radius: 7,
        fillColor: '#16a34a',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9,
      })
        .bindPopup(
          `<div style="font-family:system-ui,sans-serif;min-width:160px;line-height:1.5">
            <strong style="font-size:13px;display:block;margin-bottom:2px">${name}</strong>
            <span style="font-size:11px;color:#78716C">${role}</span><br/>
            <span style="font-size:11px;color:#78716C">${loc}</span><br/>
            <a href="${path}" style="font-size:11px;color:#16a34a;font-weight:700;text-decoration:none;margin-top:4px;display:inline-block">
              View Storefront &rarr;
            </a>
          </div>`,
          { maxWidth: 260 }
        )
        .addTo(map);
    }

    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [dealers]);

  // Resize observer to invalidate map size
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[350px] md:h-[450px] rounded-sm border border-line"
      style={{ zIndex: 0 }}
    />
  );
}
