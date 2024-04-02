import downsampledData from "./3dtiles/compressed_polygons.js";

let map;

function initializeMap() {
  if (!map) {
    map = L.map("leafletContainer").setView([51.505, -0.09], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    var layer = L.geoJSON(downsampledData, {
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.cluster) {
          layer.bindTooltip(`Room: ${feature.properties.cluster}`, {
            permanent: true,
            direction: "center",
          });
        }
        layer.setStyle({
          fillColor: getColor(feature.properties.cluster),
          weight: 2,
          opacity: 1,
          color: "white",
          fillOpacity: 0.7,
        });
      },
    }).addTo(map);

    map.fitBounds(layer.getBounds());
  }

  return map;
}

function getColor(cluster) {
  var colors = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#000000",
    "#FFFFFF",
    "#FF8800",
    "#88FF00",
  ];
  return colors[cluster % colors.length];
}

export { initializeMap, map };
