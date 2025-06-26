let map;
let savedLocations = JSON.parse(localStorage.getItem("savedPins")) || [];

function loadMap(lat, lng) {
  console.log("Initializing map at:", lat, lng);
  map = L.map('map').setView([lat, lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();

  map.on('click', (e) => {
    const pin = { lat: e.latlng.lat, lng: e.latlng.lng };
    L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
    savedLocations.push(pin);
    localStorage.setItem("savedPins", JSON.stringify(savedLocations));
  });

  savedLocations.forEach(pin => {
    L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
  });

  startTracking();
}

function startTracking() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude } = pos.coords;

    savedLocations.forEach(pin => {
      const distance = getDistanceInMeters(latitude, longitude, pin.lat, pin.lng);
      if (distance < 100) {
        notifyUser("You're within 100m of a saved location!");
      }
    });
  }, err => {
    console.warn("Tracking error:", err);
  });
}

function notifyUser(message) {
  if (Notification.permission === 'granted') {
    new Notification(message);
  }
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function initApp() {
  if (!("Notification" in window)) {
    alert("Notifications not supported.");
    return;
  }

  Notification.requestPermission();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => loadMap(pos.coords.latitude, pos.coords.longitude),
      err => {
        console.warn("Location denied, using fallback");
        loadMap(51.505, -0.09); // London fallback
      }
    );
  } else {
    alert("Geolocation not supported.");
    loadMap(51.505, -0.09); // fallback
  }
}

initApp();
