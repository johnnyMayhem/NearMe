let map;
let savedLocations = JSON.parse(localStorage.getItem("savedPins")) || [];

function initMap(position) {
  const { latitude, longitude } = position.coords;
  map = L.map('map').setView([latitude, longitude], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([latitude, longitude])
    .addTo(map)
    .bindPopup("You are here")
    .openPopup();

  map.on('click', (e) => {
    const pin = { lat: e.latlng.lat, lng: e.latlng.lng };
    L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
    savedLocations.push(pin);
    localStorage.setItem("savedPins", JSON.stringify(savedLocations));
  });

  // Restore previous pins
  savedLocations.forEach(pin => {
    L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
  });

  startTracking();
}

function startTracking() {
  navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude } = pos.coords;
    savedLocations.forEach(pin => {
      const distance = getDistanceFromLatLonInMeters(latitude, longitude, pin.lat, pin.lng);
      if (distance < 100) { // 100 meters
        notifyUser(`You're within 100m of a saved location!`);
      }
    });
  });
}

function notifyUser(msg) {
  if (Notification.permission === 'granted') {
    new Notification(msg);
  }
}

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = angle => angle * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function requestPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      if (permission !== "granted") {
        alert("Enable notifications to get alerts near saved locations.");
      }
    });
  }
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(initMap);
  requestPermission();
} else {
  alert("Geolocation not supported");
}
