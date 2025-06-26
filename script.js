window.onload = () => {
  const notificationBanner = document.getElementById("notification-banner");

  // Detect iOS Safari (not Chrome or Firefox)
  function isIosSafari() {
    return /iP(ad|hone|od)/.test(navigator.userAgent) &&
      /Safari/.test(navigator.userAgent) &&
      !/CriOS|FxiOS/.test(navigator.userAgent);
  }

  // Check if app is running standalone (added to home screen)
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

  function loadMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();

    savedLocations.forEach(pin => {
      L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
    });

    map.on('click', e => {
      const pin = { lat: e.latlng.lat, lng: e.latlng.lng };
      L.marker([pin.lat, pin.lng]).addTo(map).bindPopup("Saved Location");
      savedLocations.push(pin);
      localStorage.setItem("savedPins", JSON.stringify(savedLocations));
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
          loadMap(51.505, -0.09); // London fallback
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation not supported, loading fallback.");
      loadMap(51.505, -0.09); // fallback
    }
  }

  initApp();
};
