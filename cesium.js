// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYzA2NjMwYi1jZmUwLTRhMTAtYmZmOS1iMTUzNjE5ZWFmNWYiLCJpZCI6MjAzMTIwLCJpYXQiOjE3MTA4ODE4NDh9.2TILe8aJ-iAjA-pEioJKHpiipgkn1-ytHF_CJmxB22E";
const viewer = new Cesium.Viewer("cesiumContainer");

  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2508654);
  viewer.scene.primitives.add(tileset);
 await viewer.zoomTo(tileset);

    Apply the default style if it exists
  const extras = tileset.asset.extras;
if (
   Cesium.defined(extras) &&
   Cesium.defined(extras.ion) &&
    Cesium.defined(extras.ion.defaultStyle)
  ) {
    tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
  }
} catch (error) {
  console.log(error);
}
