let map;
const buses = [
  { id: 1, name: 'Bus 24 - Downtown', lat: 28.6139, lng: 77.2090 },
  { id: 2, name: 'Bus 12 - Airport', lat: 28.6200, lng: 77.2150 },
  { id: 3, name: 'Bus 7 - City Center', lat: 28.6180, lng: 77.2020 }
];
const markers = {};

function initMap() {
  // Center the map
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 13
  });

  // Add markers for each bus
  buses.forEach(bus => {
    const marker = new google.maps.Marker({
      position: { lat: bus.lat, lng: bus.lng },
      map: map,
      title: bus.name,
      icon: 'https://maps.google.com/mapfiles/ms/icons/bus.png'
    });
    markers[bus.id] = marker;
  });

  // Start simulation (updates every 3 seconds)
  setInterval(simulateBusMovement, 3000);
}

// Simulate bus movement
function simulateBusMovement() {
  buses.forEach(bus => {
    // Move bus randomly
    bus.lat += (Math.random() - 0.5) * 0.002;
    bus.lng += (Math.random() - 0.5) * 0.002;

    // Update marker position
    markers[bus.id].setPosition({ lat: bus.lat, lng: bus.lng });
  });
}

// Initialize map after page load
window.onload = initMap;
