import "./style.css";
import { initializeMap, map } from "./leaflet-module.js";
import learnCesium from "./cesium-module.js";
import routing from "./routing-algoi.js";
import downsampledData from "./3dtiles/compressed_polygons.js";

// Function to get a list of unique clusters from GeoJSON data
function getUniqueClusters(geojsonData) {
  const clusters = geojsonData.features.map(
    (feature) => feature.properties.cluster
  );
  const uniqueClusters = [...new Set(clusters)];
  return uniqueClusters;
}

// Usage: Get unique clusters from GeoJSON data
const uniqueClusters = getUniqueClusters(downsampledData);

// Sample graph for routing
const graph = {
  1: { 5: 1, 9: 1, 6: 1 }, // Node 1 connects to Nodes 5, 9, and 6
  2: { 9: 1, 8: 1 }, // Node 2 connects to Nodes 9 and 8
  3: { 9: 1 }, // Node 3 connects to Node 9
  4: { 8: 1 }, // Node 4 connects to Node 8
  5: { 1: 1 }, // Node 5 connects to Node 1
  6: { 1: 1 }, // Node 6 connects to Node 1
  8: { 2: 1, 4: 1 }, // Node 8 connects to Nodes 2 and 4
  9: { 1: 1, 2: 1, 3: 1 }, // Node 9 connects to Nodes 1, 2, and 3
};

// Sample rooms by floor
const roomsByFloor = {
  3: Object.keys(graph),
};

// Update the headers of the selected room and floor

function updateRoomViews(startRoomName, endRoomName) {
  const startRoomContainer = document.getElementById("startRoomContainer");
  const endRoomContainer = document.getElementById("endRoomContainer");

  // Update headings based on the selected rooms
  startRoomContainer.querySelector(
    "h3"
  ).textContent = `Start Room View: ${startRoomName}`;
  endRoomContainer.querySelector(
    "h3"
  ).textContent = `End Room View: ${endRoomName}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const buildingSelect = document.getElementById("buildingSelect");
  const floorSelect = document.getElementById("floorSelect");
  const startRoomSelect = document.getElementById("startRoomSelect");
  const endRoomSelect = document.getElementById("endRoomSelect");
  const routeButton = document.getElementById("routeButton");

  // Function to populate rooms based on building and floor
  function populateRooms() {
    const selectedFloor = floorSelect.value;
    const rooms = roomsByFloor[selectedFloor] || [];
    startRoomSelect.innerHTML = rooms
      .map((room) => `<option value="${room}">${room}</option>`)
      .join("");
    endRoomSelect.innerHTML = startRoomSelect.innerHTML; // Copy start rooms to end rooms
  }

  // Initial population of rooms
  populateRooms();

  // Update rooms when building or floor selection changes
  buildingSelect.addEventListener("change", populateRooms);
  floorSelect.addEventListener("change", populateRooms);

  let startRoom;
  let endRoom;

  async function findRoute() {
    let startRoom = startRoomSelect.value;
    let endRoom = endRoomSelect.value;

    let route = await routing(graph, startRoom, endRoom);
    console.log(route);

    if (route && route.length > 1) {
      updateMapWithRoute(map, route); // Update the map with the new route
      await learnCesium(startRoom, endRoom); // Update Cesium on finding a route
      document.getElementById("roomViews").style.display = "flex";

      // Update room view titles based on the selected rooms
      document
        .getElementById("startRoomContainer")
        .querySelector("h3").textContent = `Start Room: ${startRoom}`;
      document
        .getElementById("endRoomContainer")
        .querySelector("h3").textContent = `End Room: ${endRoom}`;
    } else {
      document.getElementById("roomViews").style.display = "none";
    }
  }

  async function initialize() {
    await initializeMap(); // Initialize the map without a specific route
    await learnCesium(); // Call learnCesium on first load without specific route parameters
  }

  initialize();

  routeButton.addEventListener("click", findRoute);
});

// Add and update route on the map
let currentRouteLayer = null;

function updateMapWithRoute(map, route) {
  if (currentRouteLayer) {
    map.removeLayer(currentRouteLayer);
  }

  let routeLayer = L.layerGroup();

  route.forEach((clusterId, index) => {
    const clusterFeature = downsampledData.features.find(
      (feature) =>
        feature.properties.cluster.toString() === clusterId.toString()
    );

    if (clusterFeature) {
      // Calculate centroid for the polygon feature
      const centroid = L.geoJSON(clusterFeature.geometry)
        .getBounds()
        .getCenter();

      // Add marker at the centroid
      L.marker(centroid).addTo(routeLayer).bindPopup(`Room: ${clusterId}`);

      // Draw line to the next cluster if it's not the last one in the route
      if (index < route.length - 1) {
        const nextClusterId = route[index + 1].toString();
        const nextClusterFeature = downsampledData.features.find(
          (feature) => feature.properties.cluster.toString() === nextClusterId
        );

        if (nextClusterFeature) {
          const nextCentroid = L.geoJSON(nextClusterFeature.geometry)
            .getBounds()
            .getCenter();

          // Draw a line between current centroid and the next centroid
          L.polyline([centroid, nextCentroid], {
            color: "blue",
            weight: 4,
          }).addTo(routeLayer);
        }
      }
    }
  });

  routeLayer.addTo(map);
  currentRouteLayer = routeLayer; // Keep the current route layer for future updates
}
