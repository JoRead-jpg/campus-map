import { currentRouteLayer } from "./main";
import { map } from "./leaflet-module";

// Floor elevations in meters
const floorElevations = {
  0: 1, // Ground floor elevation in meters
  1: 1.8, // First floor elevation in meters
  2: 5.3, // Second floor elevation in meters
  3: 7, // Third floor elevation in meters
  4: 10.42, // Fourth floor elevation in meters
};

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMWQ5YjIyMy03NzNlLTQxMDctYTAyZi1iYjUxNzVhMzJhYTciLCJpZCI6MjAzMTIxLCJpYXQiOjE3MTA4ODE4Njl9.X2zImhAc6KF1bpekSv6Y-VxWt6lwOR6W3xZMrjgh16A";

// Ceisum latitude and longitude elements
const latitudeElement = document.getElementById("latitude");
const longitudeElement = document.getElementById("longitude");
const elevationElement = document.getElementById("elevation");
const cesiumContainer = document.getElementById("cesiumContainer");
const floorElement = document.getElementById("floor");

// Add a click event to focus the container when clicked
cesiumContainer.addEventListener("click", function () {
  this.focus();
});

// Initialize the Cesium Viewer in the 'cesiumContainer' DOM element
async function initCesium() {
  if (!window.mainViewer) {
    window.mainViewer = new Cesium.Viewer("cesiumContainer", {
      // Additional Cesium Viewer options can be configured here
      terrainProvider: Cesium.createWorldTerrain(), // Assuming you have terrain data
    });
  }

  // Clear existing entities from the viewer
  const mainViewer = window.mainViewer;
  mainViewer.entities.removeAll();

  // Load a 3D tileset and adjust its elevation
  try {
    const mainTileset = await Cesium.Cesium3DTileset.fromIonAssetId(2532045);
    mainViewer.scene.primitives.add(mainTileset);

    await mainTileset.readyPromise;
    const boundingSphere = mainTileset.boundingSphere;
    const cartographic = Cesium.Cartographic.fromCartesian(
      boundingSphere.center
    );
    const surface = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      0
    );

    // Adjusting for tileset's negative base height
    const heightOffset = 2; // Set this to ensure point cloud is above floors
    const offset = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height + heightOffset
    );

    const translation = Cesium.Cartesian3.subtract(
      surface,
      offset,
      new Cesium.Cartesian3()
    );
    mainTileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

    // Set point cloud size
    mainTileset.style = new Cesium.Cesium3DTileStyle({
      pointSize: 5,
    });

    await mainViewer.zoomTo(mainTileset);

    // Enable keyboard navigation and coordinates display
    enableKeyboardNavigation(mainViewer);
    await updateCoordinatesOnCameraMove(mainViewer);
    await syncCesiumWithLeaflet(map, mainViewer);
  } catch (error) {
    console.error("Failed to load tileset:", error);
  }
}


// Enable keyboard navigation for the Cesium viewer
function enableKeyboardNavigation(viewer) {
  const ellipsoid = viewer.scene.globe.ellipsoid;
  const flags = {
    moveForward: false,
    moveBackward: false,
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false,
    lookUp: false,
    lookDown: false,
    lookLeft: false,
    lookRight: false,
  };

  // Adjust keyboard event listeners
  document.addEventListener(
    "keydown",
    function (e) {
      if (document.activeElement === cesiumContainer) {
        const flagName = getFlagForKeyCode(e.code);
        if (flagName && flags.hasOwnProperty(flagName)) {
          flags[flagName] = true;
          e.preventDefault(); // Prevents default key actions when inside the cesiumContainer
        }
      }
    },
    false
  );

  // Adjust keyboard event listeners
  document.addEventListener(
    "keyup",
    function (e) {
      if (document.activeElement === cesiumContainer) {
        const flagName = getFlagForKeyCode(e.code);
        if (flagName && flags.hasOwnProperty(flagName)) {
          flags[flagName] = false;
          e.preventDefault(); // Prevents default key actions when inside the cesiumContainer
        }
      }
    },
    false
  );

  // Update the camera position based on the flags
  viewer.clock.onTick.addEventListener(function (clock) {
    const camera = viewer.camera;
    const moveRate = 0.1;
    const lookRate = 0.01;

    if (flags.moveForward) {
      camera.moveForward(moveRate);
    }
    if (flags.moveBackward) {
      camera.moveBackward(moveRate);
    }
    if (flags.moveUp) {
      camera.moveUp(moveRate);
    }
    if (flags.moveDown) {
      camera.moveDown(moveRate);
    }
    if (flags.moveLeft) {
      camera.moveLeft(moveRate);
    }
    if (flags.moveRight) {
      camera.moveRight(moveRate);
    }
    if (flags.lookUp) {
      camera.lookUp(lookRate);
    }
    if (flags.lookDown) {
      camera.lookDown(lookRate);
    }
    if (flags.lookLeft) {
      camera.lookLeft(lookRate);
    }
    if (flags.lookRight) {
      camera.lookRight(lookRate);
    }
  });
}

// Function to approximate the floor based on elevationFloors json
function whichFloor(currentElevation) {
  // Dynamically determine the bounds
  const lowerBound = floorElevations[0] - 0.5;
  const upperBound = floorElevations[4] + 1.58; // Adjusting so upperBound is 12

  if (currentElevation < lowerBound || currentElevation > upperBound) {
    return "Out of bounds";
  }

  // Specify the ranges for each floor level
  if (
    currentElevation >= floorElevations[0] - 0.5 &&
    currentElevation < floorElevations[1]
  ) {
    return 0;
  } else if (
    currentElevation >= floorElevations[1] &&
    currentElevation < floorElevations[2]
  ) {
    return 1;
  } else if (
    currentElevation >= floorElevations[2] &&
    currentElevation < floorElevations[3]
  ) {
    return 2;
  } else if (
    currentElevation >= floorElevations[3] &&
    currentElevation < floorElevations[4]
  ) {
    return 3;
  } else if (
    currentElevation >= floorElevations[4] &&
    currentElevation <= upperBound
  ) {
    return 4;
  }

  return "Out of bounds"; // Fallback in case none of the ranges match
}

// Find button element by text content
function findButtonByText(text) {
  const buttons = Array.from(document.querySelectorAll("button"));
  return buttons.find(
    (button) =>
      button.textContent.includes(text) && !button.classList.contains("active")
  );
}

// Update the latitude, longitude, and elevation on camera move
async function updateCoordinatesOnCameraMove(viewer) {
  viewer.scene.camera.moveEnd.addEventListener(function () {
    const positionCartographic = viewer.scene.camera.positionCartographic;
    if (positionCartographic) {
      const latitude = Cesium.Math.toDegrees(
        positionCartographic.latitude
      ).toFixed(6);
      const longitude = Cesium.Math.toDegrees(
        positionCartographic.longitude
      ).toFixed(6);
      const elevation = positionCartographic.height.toFixed(2);

      // Ensure elements are not null before setting textContent
      if (latitudeElement && longitudeElement && elevationElement) {
        latitudeElement.textContent = `Latitude: ${latitude}°`;
        longitudeElement.textContent = `Longitude: ${longitude}°`;
        elevationElement.textContent = `Elevation: ${elevation} meters`;
        floorElement.textContent = `Approx Floor: ${whichFloor(elevation)}`;
      } else {
        console.error("Coordinate display elements are missing.");
      }
      // Determine the current floor based on elevation
      const newFloor = whichFloor(elevation);
      if (newFloor !== "Out of bounds") {
        // Find and click the corresponding floor button if the floor has changed
        const floorButton = findButtonByText(`Floor ${newFloor}`);
        if (floorButton) {
          floorButton.click();
        }
      }
    }
  });
}

// Helper function to get the flag name based on the key code
function getFlagForKeyCode(code) {
  switch (code) {
    case "KeyW":
      return "moveForward";
    case "KeyS":
      return "moveBackward";
    case "KeyQ":
      return "moveUp";
    case "KeyE":
      return "moveDown";
    case "KeyA":
      return "moveLeft";
    case "KeyD":
      return "moveRight";
    case "ArrowUp":
      return "lookUp";
    case "ArrowDown":
      return "lookDown";
    case "ArrowLeft":
      return "lookLeft";
    case "ArrowRight":
      return "lookRight";
    default:
      return undefined;
  }
}

// Function to apply an offset to the left by 1 meter
function offsetPosition(longitude, latitude, offsetMeters) {
  const position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
  const localFrame = Cesium.Transforms.eastNorthUpToFixedFrame(position);

  // Negative on the east axis for leftward offset
  const translation = new Cesium.Cartesian3(-offsetMeters, 0, 0);
  const offsetPosition = Cesium.Matrix4.multiplyByPoint(
    localFrame,
    translation,
    new Cesium.Cartesian3()
  );
  const cartographicPosition =
    Cesium.Cartographic.fromCartesian(offsetPosition);
  const offsetLongitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
  const offsetLatitude = Cesium.Math.toDegrees(cartographicPosition.latitude);

  return {
    latitude: offsetLatitude,
    longitude: offsetLongitude,
  };
}

// Function to handle clicks from Leaflet, adjusting the Cesium camera
export function handleClickInCesium(label_id, center, level_name) {
  level_name = String(level_name);
  const offsetCenter = offsetPosition(center.lng, center.lat, 2);
  const latitude = offsetCenter.latitude;
  const longitude = offsetCenter.longitude;
  let height = floorElevations[level_name]; // Set a default height or adjust based on additional data

  zoomToPathInCesium([longitude, latitude], height);
}

// Sync the Cesium camera view with the Leaflet map
async function syncCesiumWithLeaflet(leafletMap, cesiumViewer) {
  if (!cesiumViewer || !cesiumViewer.camera) {
    return; // Exit the function if the viewer or camera isn't ready
  }

  // Define leafletMarker outside the event listener to maintain its scope
  let leafletMarker = null;

  // Adding an event listener doesn't need to be awaited
  cesiumViewer.camera.moveEnd.addEventListener(function () {
    const cesiumPosition = cesiumViewer.camera.positionCartographic;
    const latitude = Cesium.Math.toDegrees(cesiumPosition.latitude);
    const longitude = Cesium.Math.toDegrees(cesiumPosition.longitude);

    // Ensure valid coordinates before proceeding
    if (!isNaN(latitude) && !isNaN(longitude)) {
      if (leafletMarker) {
        // Update the existing marker's position
        leafletMarker.setLatLng([latitude, longitude]);
      } else {
        // Create a new marker and add it to the map
        leafletMarker = L.marker([latitude, longitude], {
          title: "You are here",
        })
          .addTo(leafletMap)
          .bindPopup("You are currently viewing this location.")
          .openPopup();
      }
    }
  });
}

// Set up a zoom slider for viewing routes
export function setupRouteSlider(
  routeCoordinates,
  startRoomName,
  endRoomName,
  currentFloor
) {
  const sliderContainer = document.querySelector(".slider"); // Get the slider container
  const slider = document.getElementById("routeSlider");
  const startPoint = document.getElementById("startPoint");
  const endPoint = document.getElementById("endPoint");

  const level = currentFloor;
  let height = floorElevations[level]; // Set a default height or adjust based on additional data

  // Update start and end points names
  startPoint.textContent = startRoomName;
  endPoint.textContent = endRoomName;

  // Check if routeCoordinates is valid and has at least one point
  if (routeCoordinates && routeCoordinates.length > 0) {
    sliderContainer.style.display = "block"; // Make the entire slider visible
    slider.max = routeCoordinates.length - 1; // Adjust the slider max value based on the route
    slider.value = 0; // Reset the slider to the start of the route

    // Update the map immediately to the start of the route
    const coordinates = routeCoordinates[0];
    if (coordinates) {
      zoomToPathInCesium(coordinates, height);
    }

    slider.oninput = function () {
      const index = parseInt(this.value, 10);
      const coordinates = routeCoordinates[index];
      if (coordinates) {
        zoomToPathInCesium(coordinates, height);
      }
    };
  } else {
    sliderContainer.style.display = "none"; // Hide the entire slider if no route is available
  }
}

// Zoom to a specific path in Cesium with 360-degree rotation
function zoomToPathInCesium(coordinates, height) {
  const [lng, lat] = coordinates; // [longitude, latitude]
  const offsetCenter = offsetPosition(lng, lat, 2);
  const latitude = offsetCenter.latitude;
  const longitude = offsetCenter.longitude;

  // Adjust the camera view
  window.mainViewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-30), // Slightly tilt the camera downwards
      roll: 0.0,
    },
    duration: 2.0,
  });
}

// Function to rotate the camera 360 degrees around the target point
function rotateCamera360(viewer) {
  const startHeading = viewer.camera.heading;
  const rotationPeriod = 5000; // Rotate 360 degrees in 15 seconds

  let lastTime = Date.now();
  const onTickHandler = function () {
    const now = Date.now();
    const elapsedMilliseconds = now - lastTime; // Calculate elapsed time in milliseconds
    if (elapsedMilliseconds < rotationPeriod) {
      const heading =
        startHeading + (2 * Math.PI * elapsedMilliseconds) / rotationPeriod;
      viewer.camera.setView({
        orientation: {
          heading: heading % (2 * Math.PI), // Normalize the heading
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll,
        },
      });
    } else {
      viewer.clock.onTick.removeEventListener(onTickHandler); // Stop the rotation using the handler reference
    }
  };

  viewer.clock.onTick.addEventListener(onTickHandler); // Add the event listener with the defined handler
}

// Export the initCesium function
export default initCesium;
