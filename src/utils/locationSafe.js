// Utilitário seguro de geolocalização — SEM API exposta no frontend

export async function getCurrentGPS(timeout = 10000) {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve({ ok: false, reason: 'GPS indisponível' });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ ok: false, reason: 'GPS timeout' });
    }, timeout);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (error) => {
        clearTimeout(timer);
        resolve({
          ok: false,
          reason: error?.message || 'Permissão negada',
        });
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 300000, // 5 min
      }
    );
  });
}

export function normalizeCityName(city) {
  if (!city) return '';
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function buildGoogleMapsRouteUrl(origin, destination) {
  const safeDestination = encodeURIComponent(destination || '');
  
  let safeOrigin = '';
  if (origin?.lat && origin?.lng) {
    safeOrigin = `${origin.lat},${origin.lng}`;
  } else if (origin?.city) {
    safeOrigin = encodeURIComponent(origin.city);
  } else {
    safeOrigin = 'Marília,SP';
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${safeOrigin}&destination=${safeDestination}&travelmode=driving`;
}

export function buildGoogleMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Marília, SP')}`;
}

export function openSafeMaps(origin, destination) {
  const url = destination
    ? buildGoogleMapsRouteUrl(origin, destination)
    : buildGoogleMapsSearchUrl(origin?.city || 'Marília, SP');

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function safeLocationFallback(error) {
  console.warn('📍 Location fallback:', error);
  return {
    ok: false,
    fallback: true,
    message: 'Modo seguro ativado. Usando Google Maps sem GPS.',
  };
}