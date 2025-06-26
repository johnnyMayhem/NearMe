let map;
let userMarker;
let userCoords;
const pins = [];

const notificationBanner = document.getElementById('notification-banner');

function checkNotificationSupport() {
  if (!('Notification' in window)) {
    notificationBanner.style.display = 'block';
    notificationBanner.textContent = "This browser does not support notifications.";
  } else if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function distanceInMeters(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const R = 6371000; // meters
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createPopupContent(lat, lng, dist, index) {
  return `
    <div>
      <b>Pin #${index + 1}</b><br/>
      Lat: ${lat.toFixed(5)}<br/>
      Lng: ${lng.toFixed(5)}<br/>
      Distance: ${dist.toFixed(1)} m<br/>
      <button class="close-popup" data-index="${index}">Close</button>
      <button class="remove-pin" data-index="${index}">Remove pin</button>
    </div>
  `;
}

function addPin(latlng) {
  const dist = distanceInMeters(userCoords.lat, userCoords.lng, latlng.lat, latlng.lng);

  const marker = L.marker(latlng).addTo(map);

  const index = pins.length;
  marker.bindPopup(createPopupContent(latlng.lat, latlng.lng, dist, index));

  marker.on('popupopen', () => {
    // Remove pin button
    const removeBtn = document.querySelector('.remove-pin');
    removeBtn.addEventListener('click', () => {
      map.removeLayer(marker);
      pins.splice(index, 1);
      refreshAllPopups();
    });

    // Close popup button
    const closeBtn = document.querySelector('.close-popup');
    closeBtn.addEventListener('click', () => {
      marker.closePopup();
    });
  });

  pins.push(marker);
}

function refreshAllPopups() {
  pins.forEach((marker, i) => {
    const latlng = marker.getLatLng();
    const dist = distanceInMeters(userCoords.lat, userCoords.lng, latlng.lat, latlng.lng);
    marker.setPopupContent(createPopupContent(latlng.lat, latlng.lng, dist, i));
  });
}

function initMap(position) {
  userCoords = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };

  map = L.map('map').setView([userCoords.lat, userCoords.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  userMarker = L.marker([userCoords.lat, userCoords.lng], {title: "You are here"}).addTo(map);

  map.on('click', e => {
    addPin(e.latlng);
  });

  // Watch user position to update distances in popups
  navigator.geolocation.watchPosition(pos => {
    userCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    userMarker.setLatLng([userCoords.lat, userCoords.lng]);
    refreshAllPopups();
    checkProximity();
  }, err => {
    console.warn('Error watching position:', err);
  }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });
}

function checkProximity() {
  pins.forEach((marker, i) => {
    const latlng = marker.getLatLng();
    const dist = distanceInMeters(userCoords.lat, userCoords.lng, latlng.lat, latlng.lng);
    if (dist < 50) { // 50 meters proximity
      if (Notification.permission === "granted") {
        new Notification(`You are within ${dist.toFixed(1)} meters of pin #${i + 1}!`);
      }
    }
  });
}

window.onload = () => {
  checkNotificationSupport();

  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      initMap(position);
    },
    err => {
      alert('Unable to retrieve your location');
      console.error(err);
    },
    { enableHighAccuracy: true }
  );
};
