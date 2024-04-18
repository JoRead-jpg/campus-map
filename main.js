// Import necessary modules and styles
import "./style.css";
import { initializeMap, map, LoadGeoJSON } from "./leaflet-module.js";
import initCesium, { setupRouteSlider } from "./cesium-module.js";
import routing from "./routing.js";

// Function to fetch data from a GeoJSON file
const fetchGeoJson = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching the GeoJSON data:", error);
  }
};

// URL to the GeoJSON file
const geojsonUrl =
  "https://gist.githubusercontent.com/denniesbor/f8ee9d1e675ff1652478de508ad5b000/raw/5b804b3d7e3067fd606a68e0b797a19b8768e637/exploratory_hall.geojson";

// Variable to hold the current route layer
export let currentRouteLayer = null;

// Function to update the map with the route between two rooms
async function updateMapWithRoute(
  startRoomValue,
  endRoomValue,
  startRoomName,
  endRoomName,
  currentFloor
) {
  let routeCoordinates = await routing(
    startRoomValue,
    endRoomValue,
    currentFloor
  );

  if (routeCoordinates) {
    if (currentRouteLayer) {
      map.removeLayer(currentRouteLayer); // Remove the previous layer
    }

    let routeLayer = L.layerGroup();
    let delay = 200; // Delay in milliseconds between each polyline segment

    routeCoordinates.forEach((coordinates, index) => {
      if (coordinates && index < routeCoordinates.length - 1) {
        setTimeout(() => {
          let latLng = [coordinates[1], coordinates[0]];
          let nextLatLng = [
            routeCoordinates[index + 1][1],
            routeCoordinates[index + 1][0],
          ];

          L.polyline([latLng, nextLatLng], {
            color: "red",
            weight: 4,
            dashArray: "10, 10", // Dotted line pattern
            lineJoin: "round",
          }).addTo(routeLayer);

          if (index === 0) {
            routeLayer.addTo(map);
          }
        }, delay * index);
      }
    });

    currentRouteLayer = routeLayer;
    setupRouteSlider(
      routeCoordinates,
      startRoomName,
      endRoomName,
      currentFloor
    );
    console.log("Route updated on map");
  }
}

// Event listener for when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const buildingSelect = document.getElementById("buildingSelect");
  const startRoomSelect = document.getElementById("startRoomSelect");
  const endRoomSelect = document.getElementById("endRoomSelect");
  const routeButton = document.getElementById("routeButton");
  const floorBanner = document.getElementById("floorBanner");
  const sliderContainer = document.querySelector(".slider");

  const latitudeElement = document.getElementById("latitude");
  const longitudeElement = document.getElementById("longitude");
  const elevationElement = document.getElementById("elevation");
  const data = await fetchGeoJson(geojsonUrl);

  let currentFloor = "0";
  populateFloorBanner(data);
  initializeFloor(currentFloor);

  function populateFloorBanner(data) {
    const floors = new Set();
    data.features.forEach((feature) => {
      if (feature.properties && feature.properties.level_name) {
        floors.add(feature.properties.level_name);
      }
    });

    const floorBanner = document.getElementById("floorBanner");
    floorBanner.innerHTML = "";
    let defaultFloorButton = null;

    floors.forEach((level) => {
      const button = document.createElement("button");
      button.textContent = `Floor ${level}`;
      button.onclick = async () => {
        if (currentRouteLayer) {
          map.removeLayer(currentRouteLayer);
          sliderContainer.style.display = "none";
        }
        currentFloor = level;
        const filteredData = filterDataByFloor(data, level);
        await initialize(filteredData);
        button.classList.add("active");

        const allButtons = floorBanner.querySelectorAll("button");
        allButtons.forEach((btn) => {
          if (btn !== button) {
            btn.classList.remove("active");
          }
        });
      };

      floorBanner.appendChild(button);
      if (level === "0") {
        defaultFloorButton = button;
      }
    });

    if (defaultFloorButton) {
      defaultFloorButton.click();
    }
  }

  async function initializeFloor(floorLevel) {
    const filteredData = filterDataByFloor(data, floorLevel);
    await initialize(filteredData);
  }

  function filterDataByFloor(data, floorLevel) {
    populateRoomSelects(data, floorLevel);
    return {
      type: "FeatureCollection",
      features: data.features.filter(
        (feature) => feature.properties.level_name === floorLevel
      ),
    };
  }

  routeButton.addEventListener("click", () => {
    const startRoomValue = startRoomSelect.value;
    const endRoomValue = endRoomSelect.value;
    const startRoomName =
      startRoomSelect.options[startRoomSelect.selectedIndex].text;
    const endRoomName = endRoomSelect.options[endRoomSelect.selectedIndex].text;

    updateMapWithRoute(
      startRoomValue,
      endRoomValue,
      startRoomName,
      endRoomName,
      currentFloor
    );
  });

  async function initialize(filteredData) {
    await initializeMap(filteredData);
  }
  await initCesium();
});

function populateRoomSelects(data, floorLevel) {
  const roomNames = new Set();
  data.features.forEach((feature) => {
    if (
      feature.properties &&
      feature.properties.unique_name &&
      feature.properties.level_name === floorLevel
    ) {
      roomNames.add({
        name: feature.properties.unique_name,
        id: feature.properties.id,
      });
    }
  });

  startRoomSelect.innerHTML = "";
  endRoomSelect.innerHTML = "";

  roomNames.forEach((item) => {
    const optionStart = document.createElement("option");
    optionStart.value = item.id;
    optionStart.text = item.name;
    startRoomSelect.appendChild(optionStart);

    const optionEnd = document.createElement("option");
    optionEnd.value = item.id;
    optionEnd.text = item.name;
    endRoomSelect.appendChild(optionEnd);
  });
}
