let map;
let savedLocations = [];

function initMap() {
  map = L.map('map').setView([51.505, -0.09], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  map.on('click', (e) => {
    const name = prompt('Enter a name for this location:');
    if (name) {
      const location = {
        name,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      savedLocations.push(location);
      updateLocationsList();
      checkProximity(location);
    }
  });
}

function updateLocationsList() {
  const list = document.getElementById('locationsList');
  list.innerHTML = '';
  savedLocations.forEach(loc => {
       li.textContent = `${loc.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`;
    list.appendChild(li);
  });
}

function checkProximity(location) {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(pos => {
      const dist = getDistance(pos.coords.latitude, pos.coords.longitude, location.lat, location.lng);
      if (dist < 100) notifyUser(location);
    });
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function notifyUser(location) {
  if (Notification.permission === 'granted') {
    new Notification(`You're near ${location.name}`);
  (permission === 'granted') {
        new Notification(`You're near ${location.name}`);
      }
    });
  }
}

document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('search').value;
  fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`)
   0];
        const location = {
          name: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        };
        savedLocations.push(location);
        updateLocationsList();
        map.setView([location.lat, location.lng], 15);
        checkProximity(location);
      }
    });
});

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
  initMap();
});
