// console.log("Hello from client side map_leaflet.js");

export const renderMap = (locations) => {
  var map = L.map('map', { zoomControl: false });

  // set CROSS ORIGIN here
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap',
    crossOrigin: true
  }).addTo(map);

  const points = [];

  // set CROSS ORIGIN HERE
  L.Icon.Default.prototype.options.crossOrigin = true;

  locations.forEach((loc) => {
    points.push([loc.coordinates[1], loc.coordinates[0]]);
    L.marker([loc.coordinates[1], loc.coordinates[0]])
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, { autoClose: false })
      .openPopup();
  });
  
  const bounds = L.latLngBounds(points).pad(0.5);
  map.fitBounds(bounds);
};