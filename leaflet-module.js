import { handleClickInCesium } from "./cesium-module.js";

let map;

// Initialize the Leaflet map
async function initializeMap(data) {
  if (!map) {
    map = L.map("leafletContainer").setView([51.505, -0.09], 21);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 25,
    }).addTo(map);

    if (data) {
      // console.log(data);
      // Add the GeoJSON layers with control to the map
      LoadGeoJSON(map, data);
    }
  } else {
    LoadGeoJSON(map, data);
  }

  return map;
}

// Load GeoJSON data to the map
function LoadGeoJSON(map, data) {
  // Clear existing GeoJSON layers from the map
  map.eachLayer((layer) => {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  // Add new GeoJSON layer to the map
  const geoJsonLayer = L.geoJSON(data, {
    onEachFeature: (feature, layer) => {
      // Create a new tooltip instance for each feature
      const tooltip = L.tooltip({
        direction: "center",
        permanent: true,
        interactive: true,
        noWrap: true,
        opacity: 0.8,
        className: "feature-label",
      });

      layer.on("click", () => {
        // console.log("Label clicked:", feature.properties.id);
        let level_name = feature.properties.level_name;
        handleClickInCesium(
          feature.properties.id,
          layer.getBounds().getCenter(),
          level_name
        );
      });

      layer.bindTooltip(tooltip);

      // Handle zoomend outside of the onEachFeature to avoid multiple bindings
      map.on("zoomend", () => {
        const zoomLevel = map.getZoom();
        let label = feature.properties.unique_name;

        // Process label for line breaks
        if (label) {
          const words = label.split(" ");
          if (words.length === 2 || words.length === 3) {
            label = words[0] + "<br>" + words.slice(1).join(" ");
          } else if (words.length > 3) {
            const lines = [];
            for (let i = 0; i < words.length; i += 3) {
              lines.push(
                words.slice(i, Math.min(i + 3, words.length)).join(" ")
              );
            }
            label = lines.join("<br>");
          }
        }

        if (zoomLevel > 19 && label) {
          // Update the tooltip content and location
          tooltip.setContent(label);
          // Bind the tooltip to the layer and open it
          layer.bindTooltip(tooltip).openTooltip(layer.getBounds().getCenter());
        } else {
          // Unbind tooltip if zoom level is not suitable
          layer.unbindTooltip();
        }
      });
    },
  }).addTo(map);

  // Optionally fit the map bounds to the new layer
  if (geoJsonLayer.getLayers().length > 0) {
    map.fitBounds(geoJsonLayer.getBounds());
  }
}

// Export the functions
export { initializeMap, map, LoadGeoJSON };
