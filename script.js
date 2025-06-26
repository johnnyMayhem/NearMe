window.onload = () => {
  const notificationBanner = document.getElementById("notification-banner");

  function isIosSafari() {
    return /iP(ad|hone|od)/.test(navigator.userAgent) &&
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS/.test(navigator.userAgent);
  }

  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  if (isIosSafari() && !isInStandaloneMode()) {
    notificationBanner.style.display = 'block';
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
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  let map;
  let savedLocations = JSON.parse(localStorage.getItem("savedPins")) || [];
  let currentPosition = null;
  let markers = [];

  // Remove pin by index
  function removePin(index) {
    // Remove from map
    map.removeLayer(markers[index].marker);
    // Remove from arrays and localStorage
    markers.splice(index, 1);
    savedLocations.splice(index, 1);
    localStorage.setItem("savedPins", JSON.stringify(savedLocations));
  }

  function createTooltipContent(pin, index, distanceStr) {
    return `
      <div style="font-size: 14px;">
        <b>Lat:</b> ${pin.lat.toFixed(5)}, <b>Lng:</b> ${pin.lng.toFixed(5)}<br>
        <b>Distance:</b> ${distanceStr}<br>
        <button onclick="window.removePinFromTooltip(${index})" style="margin-top:5px;padding:3px 6px;cursor:pointer;">Remove Pin</button>
      </div>
    `;
  }

  // Expose removePin globally for onclick inside tooltip button
  window.removePinFromTooltip = function(index) {
    removePin(index);
  };

  function updateTooltips() {
    if (!currentPosition) return;
    markers.forEach(({ marker, pin }, index) => {
      const distance = getDistanceInMeters(
        currentPosition.lat, currentPosition.lng, pin.lat, pin.lng
      );
      const distanceStr = (distance > 1000) ?
        `${(distance / 1000).toFixed(2)} km` :
        `${Math.round(distance)} m`;
      const content = createTooltipContent(pin, index, distanceStr);
      marker.setTooltipContent(content);
    });
  }

  function loadMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();

    savedLocations.forEach((pin, index) => {
      const marker = L.marker([pin.lat, pin.lng]).addTo(map);
      const distanceStr = '...';
      marker.bindTooltip(createTooltipContent(pin, index, distanceStr), { permanent: true, direction: 'top', className: 'custom-tooltip' });
      markers.push({ marker, pin });
    });

    map.on('click', e => {
      const pin = { lat: e.latlng.lat, lng: e.latlng.lng };
      savedLocations.push(pin);
      localStorage.setItem("savedPins", JSON.stringify(savedLocations));
      const index = savedLocations.length - 1;
      const marker = L.marker([pin.lat, pin.lng]).addTo(map);
      marker.bindTooltip(createTooltipContent(pin, index, '...'), { permanent: true, direction: 'top', className: 'custom-tooltip' });
      markers.push({ marker, pin });
      updateTooltips();
    });

    startTracking();
  }

  function startTracking() {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      currentPosition = { lat: latitude, lng: longitude };

      updateTooltips();

      savedLocations.forEach(pin => {
        const distance = getDistanceInMeters(latitude, longitude, pin.lat, pin.lng);
        if (distance < 100) {
          notifyUser("You're within 100m of a saved location!");
        }
      });
    }, err => {
      console.warn("Geolocation watch error:", err.message);
    });
  }

  function initNotifications() {
    if (!("Notification" in window)) {
      console.log("Notifications not supported.");
      return false;
    }
    Notification.requestPermission().then(permission => {
      if (permission !== "granted") {
        console.log("Notification permission denied.");
      }
    });
    return true;
  }

  function initApp() {
    initNotifications();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => loadMap(pos.coords.latitude, pos.coords.longitude),
        err => {
          console.warn("Location denied or unavailable, loading fallback.", err.message);
          loadMap(51.505, -0.09);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation not supported, loading fallback.");
      loadMap(51.505, -0.09);
    }
  }

  initApp();
};
