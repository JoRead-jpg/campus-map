Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMWQ5YjIyMy03NzNlLTQxMDctYTAyZi1iYjUxNzVhMzJhYTciLCJpZCI6MjAzMTIxLCJpYXQiOjE3MTA4ODE4Njl9.X2zImhAc6KF1bpekSv6Y-VxWt6lwOR6W3xZMrjgh16A";


async function learnCesium(startRoom, endRoom) {
  if (!window.mainViewer) {
    window.mainViewer = new Cesium.Viewer("cesiumContainer");
  }

  const mainViewer = window.mainViewer;
  mainViewer.entities.removeAll();

  // Load main scene
  try {
    const mainTileset = await Cesium.Cesium3DTileset.fromIonAssetId(2522649);
    mainViewer.scene.primitives.add(mainTileset);
    await mainViewer.zoomTo(mainTileset);
  } catch (error) {
    console.log(error);
  }

  // Initialize and display start room viewer if specified
  if (startRoom) {
    if (!window.startRoomViewer) {
      window.startRoomViewer = new Cesium.Viewer("startRoomContainer");
    }
    const startRoomViewer = window.startRoomViewer;

    document.getElementById("startRoomContainer").style.display = "block";

    try {
      const resource = await Cesium.IonResource.fromAssetId(2523468);
      const entity = startRoomViewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, 100),
        model: {
          uri: resource,
        },
      });
      startRoomViewer.trackedEntity = entity;
    } catch (error) {
      console.log(error);
    }
  } else {
    document.getElementById("startRoomContainer").style.display = "none";
  }

  // Initialize and display end room viewer if specified
  if (endRoom) {
    if (!window.endRoomViewer) {
      window.endRoomViewer = new Cesium.Viewer("endRoomContainer");
    }

    const endRoomViewer = window.endRoomViewer;

    document.getElementById("endRoomContainer").style.display = "block";
    try {
      const resource = await Cesium.IonResource.fromAssetId(2523468);
      const entity = endRoomViewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(0, 0, 100),
        model: {
          uri: resource,
        },
      });
      endRoomViewer.trackedEntity = entity;
    } catch (error) {
      console.log("End room error:", error);
    }
  } else {
    document.getElementById("endRoomContainer").style.display = "none";
  }
}

export default learnCesium;
