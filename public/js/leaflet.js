/* eslint-disable no-undef */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

const map = L.map('map', { zoomControl: false }); //to disable + - zoom,  dragging: false
// var map = L.map('map', { zoomControl: false }).setView([31.111745, -118.113491], );

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  crossOrigin: '',
}).addTo(map);

const points = [];
locations.forEach((loc) => {
  points.push([loc.coordinates[1], loc.coordinates[0]]);
  L.marker([loc.coordinates[1], loc.coordinates[0]])
    .addTo(map)
    .bindPopup(
      `<p style="font-size: 16px;">Day ${loc.day}: ${loc.description}</p>`,
      {
        autoClose: false,
      },
    )
    .openPopup();
});

const bounds = L.latLngBounds(points).pad(0.5);
map.fitBounds(bounds);

map.scrollWheelZoom.disable();
