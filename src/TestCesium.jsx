import React from "react";
import {
  Viewer,
  Entity,
  PointGraphics,
  EntityDescription,
  Cesium3DTileset,
} from "resium";
import { Cartesian3, createWorldTerrainAsync, IonResource, Ion } from "cesium";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkMWQ5YjIyMy03NzNlLTQxMDctYTAyZi1iYjUxNzVhMzJhYTciLCJpZCI6MjAzMTIxLCJpYXQiOjE3MTA4ODE4Njl9.X2zImhAc6KF1bpekSv6Y-VxWt6lwOR6W3xZMrjgh16A";
const terrainProvider = createWorldTerrainAsync();
const position = Cartesian3.fromDegrees(-74.0707383, 40.7117244, 100);

const TestCesium = () => {
  let viewer; // This will be raw Cesium's Viewer object.

  const handleReady = (tileset) => {
    if (viewer) {
      viewer.zoomTo(tileset);
    }
  };

  return (
    <Viewer
      full
      ref={(e) => {
        viewer = e && e.cesiumElement;
      }}
    >
      <Cesium3DTileset
        url={IonResource.fromAssetId(2508679)}
        onReady={handleReady}
      />
    </Viewer>
  );
};

export default TestCesium;
