import { DEBUG } from "./config.js";

// Switzerland
let north = 45.88465;
let west = 7.13725;
let south = 45.88105;
let east = 7.14634;
const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

// Cesium viewer
const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  baseLayerPicker: true,
  geocoder: false,
  homeButton: false,
  imageryLayers: true,
  infoBox: false,
  navigationHelpButton: false,
  projectionPicker: false,
  sceneModePicker: false,
  timeline: false,

  imageryProvider: new Cesium.UrlTemplateImageryProvider({
    url:
      "https://wmts{s}.geo.admin.ch/1.0.0/ch.swisstopo.swissimage-product/default/current/4326/{z}/{x}/{y}.jpeg",
    subdomains: "56789",
    availableLevels: [8, 10, 12, 14, 15, 16, 17, 18],
    minimumRetrievingLevel: 8,
    maximumLevel: 17,
    tilingScheme: new Cesium.GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1,
    }),
  }),

  terrainProvider: new Cesium.CesiumTerrainProvider({
    //url: `https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=${MAPTILER_TOKEN}`,
    url:
      "//3d.geo.admin.ch/1.0.0/ch.swisstopo.terrain.3d/default/20200520/4326/",
    //url: `${AUSTRIA_TERRAIN_URL}`,
    availableLevels: [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      18,
      19,
    ],
    rectangle: rectangle, // Doesn't work without
  }),
});

//viewer.extend(Cesium.viewerCesiumInspectorMixin);
//viewer.scene.primitives.add(Cesium.createOsmBuildings());

// Globally scoped constants about the environment
const scene = viewer.scene;
const canvas = viewer.canvas;
const globe = scene.globe;
const camera = scene.camera;
const ellipsoid = globe.ellipsoid;
const sscc = scene.screenSpaceCameraController;
console.log("ellipsoid: ", ellipsoid);

/*
Set Field of View, you may want to adapt the multiplication factor depending on
the focal of the image
*/
camera.frustum.fov = 0.9 * Cesium.Math.PI_OVER_THREE;
globe.depthTestAgainstTerrain = true;

canvas.setAttribute("tabindex", "0"); // needed to put focus on the canvas
canvas.onclick = function () {
  canvas.focus();
};

let trig_sscc = false; // lock camera, sscc is the instance of the scene.screenSpaceCameraController object;
sscc.enableRotate = trig_sscc;
sscc.enableTranslate = trig_sscc;
sscc.enableZoom = trig_sscc;
sscc.enableTilt = trig_sscc;
sscc.enableLook = trig_sscc;

// Disable the default event handlers
// Set lock/unlock button function
console.log("doc:", document.getElementById("btn-lockCam").innerHTM);
const lockCam = () => {
  if (
    document.getElementById("btn-lockCam").innerHTML.includes("&nbsp;LockCam")
  ) {
    trig_sscc = false; // lock camera
    sscc.enableRotate = trig_sscc;
    sscc.enableTranslate = trig_sscc;
    sscc.enableZoom = trig_sscc;
    sscc.enableTilt = trig_sscc;
    sscc.enableLook = trig_sscc;
    document.getElementById("btn-lockCam").innerHTML =
      '<i class="fas fa-unlock"></i>&nbsp;UnlockCam';
  } else if (
    document.getElementById("btn-lockCam").innerHTML.includes("&nbsp;UnlockCam")
  ) {
    trig_sscc = true; // unlock camera
    sscc.enableRotate = trig_sscc;
    sscc.enableTranslate = trig_sscc;
    sscc.enableZoom = trig_sscc;
    sscc.enableTilt = trig_sscc;
    sscc.enableLook = trig_sscc;
    document.getElementById("btn-lockCam").innerHTML =
      '<i class="fas fa-lock"></i>&nbsp;LockCam';
  }
};

// Set show image button
const showimage = () => {
  console.log("infunction: ");
  for (i = 0, len = modelList.length; i < len; i++) {
    model = modelList[i];
    modelshow = model.show;
    modelshow ^= true;
    model.show = modelshow;
  }
};

// These variables are needed in the main function:
let startMousePosition;
let mousePosition;

const flags = {
  looking: false,
  moveForward: false,
  moveBackward: false,
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,
};

// Load GEOJSON feature of the image frame from a GEOJSON file
const feat_file = "./static/geojson/25443.geojson";

// Convenience functions:
// Convert point array to Cartesian3
const transform2DPointArrayToCartesian = (pointArray) => {
  return new Cesium.Cartesian3.fromDegrees(...pointArray);
};

const transform3DPointArrayToCartesian = (pointArray1, pointArray2) => {
  return new Cesium.Cartesian3.fromDegreesArrayHeights([
    ...pointArray1.concat(pointArray2),
  ]);
};

// Fetch the image frame from the GEOJSON file
const fetchFile = async () => {
  let res = await fetch(feat_file);
  let feat = await res.json();
  return feat;
};

// Call of the main() function only once the GEOJSON file has been loaded
fetchFile().then((feat) => {
  main(feat);
});

const goToModel = (geopose) => {
  camera.setView({
    destination: geopose.camPos, // Cartesian3
    orientation: {
      heading: Cesium.Math.toRadians(-1 * geopose.yaw), // heading
      pitch: Cesium.Math.toRadians(1 * geopose.pitch), // pitch
      roll: Cesium.Math.toRadians(0 * geopose.roll), // roll
    },
  });
};

const flyToModel = (geopose) => {
  camera.flyTo({
    destination: geopose.camPos, // Cartesian3
    orientation: {
      heading: Cesium.Math.toRadians(-1 * geopose.yaw), // heading
      pitch: Cesium.Math.toRadians(1 * geopose.pitch), // pitch
      roll: Cesium.Math.toRadians(0 * geopose.roll), // roll
    },
  });
};

/* GeoPose class is used to store the camera position, the image center position
and the 3 orientation angles. Positions are either given as an Array or a Cartesian3
*/
class GeoPose {
  constructor(feat) {
    // This is the physical image center; it comes from the feature properties
    this.imagePhysicalCenterArray = feat.features[0].properties.imageCenter.split(
      ","
    );
    this.imagePhysicalCenter = transform2DPointArrayToCartesian(
      this.imagePhysicalCenterArray
    ); // Cartesian3
    // This is the camera position, it's not equal to the physical image center
    this.camPosArray = feat.features[0].properties.camPos.split(",");
    this.camPos = transform2DPointArrayToCartesian(this.camPosArray); // Cartesian3
    // orientation angles
    this.yaw = feat.features[0].properties.yaw;
    this.pitch = feat.features[0].properties.pitch;
    this.roll = feat.features[0].properties.roll;
  }
}

/* GlobeIntersection is a class to describe the intersection between a line
defined by two points, p0 and p1, and the globe. p0 is for example defining the
camera position.
*/
class GlobeIntersection {
  // the globe comes from the outer scope
  constructor(globe, p0, p1) {
    // To be run only once all tiles are loaded
    if (globe.tilesLoaded) {
      this.p0 = p0;
      this.p1 = p1;
      // All positions are given in Cartesian3
      this.direction = new Cesium.Cartesian3();
      this.normal = new Cesium.Cartesian3();
      Cesium.Cartesian3.subtract(
        this.p1,
        this.p0,
        this.direction // result
      );
      Cesium.Cartesian3.normalize(
        this.direction,
        this.normal // result
      );

      this.ray = new Cesium.Ray(this.p0, this.normal);
      this.hitPos = globe.pick(this.ray, scene);

      if (this.hitPos !== undefined && this.hitPos !== null) {
        console.log("hitPos: ", this.hitPos);
      } else {
        console.log("hitPos is null!");
      }

      this.start_rad = new Cesium.Cartographic(); // in radians
      this.hitPosWGS84_rad = new Cesium.Cartographic(); // in radians

      Cesium.Cartographic.fromCartesian(
        this.hitPos,
        Cesium.Ellipsoid.WGS84,
        this.hitPosWGS84_rad // result
      );

      Cesium.Cartographic.fromCartesian(
        this.p0,
        Cesium.Ellipsoid.WGS84,
        this.start_rad // result
      );

      // The hit position with the ground, given in WGS84
      this.hitPosWGS84 = new Cesium.Cartographic(
        Cesium.Math.toDegrees(this.hitPosWGS84_rad.longitude),
        Cesium.Math.toDegrees(this.hitPosWGS84_rad.latitude),
        this.hitPosWGS84_rad.height
      );

      if (DEBUG === true) {
        console.log("hitPosWGS84: ", this.hitPosWGS84);
      }

      /*
        build arrays for storing the coordinates of the two points.
        This is for convenience; so that it's simpler to concatenate them
        hereafter.
      */
      this.pZero = [
        Cesium.Math.toDegrees(this.start_rad.longitude),
        Cesium.Math.toDegrees(this.start_rad.latitude),
        this.start_rad.height,
      ];
      this.pt = [
        this.hitPosWGS84.longitude,
        this.hitPosWGS84.latitude,
        this.hitPosWGS84.height,
      ];

      // The ground point as a Cartesian3
      this.ptgrnd = new Cesium.Cartesian3.fromDegrees(...this.pt);

      // Display points on the terrain
      this.p_terrain_intersect = viewer.entities.add({
        name: "pt",
        position: this.ptgrnd,
        point: {
          pixelSize: 10,
          color: Cesium.Color.YELLOW,
        },
      });

      // Display the rays
      this.polyLine = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            ...this.pZero.concat(this.pt),
          ]),
          width: 4,
          granularity: Cesium.Math.toRadians(0.05),
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.1,
            color: Cesium.Color.CHARTREUSE,
          }),
        },
      });
    } else {
      console.log("Tiles not completely loaded yet... please wait.");
    }
  }
}

// main function, the one that is executed when the GEOJSON file has been successfully loaded:
const main = (feat) => {
  document.querySelector("#btn-lockCam").addEventListener("click", lockCam);

  const geopose = new GeoPose(feat);

  console.log("Document: ", document.querySelector("#btn-goToModel"));
  document.querySelector("#btn-goToModel").addEventListener("click", () => {
    goToModel(geopose);
  });
  document.querySelector("#btn-flyToModel").addEventListener("click", () => {
    flyToModel(geopose);
  });
  document
    .querySelector("#btn-goToHeadingPitchRoll")
    .addEventListener("click", () => {
      goToHeadingPitchRoll();
    });

  // Set initial camera view
  camera.setView({
    destination: geopose.camPos, // your own position as a Cartesian3
    orientation: {
      heading: Cesium.Math.toRadians(-1 * geopose.yaw), // heading
      pitch: Cesium.Math.toRadians(1 * geopose.pitch), // pitch
      roll: Cesium.Math.toRadians(0 * geopose.roll), // roll; set to 0
    },
  });

  // Build promise to load the image from the GEOJSON
  const GeoJSONPromise = async () => {
    try {
      const dataSource = await Cesium.GeoJsonDataSource.load(feat, {
        stroke: Cesium.Color.HOTPINK,
        fill: new Cesium.Color(1, 0.6, 1, 0.2),
        strokeWidth: 3,
      });
      console.log("feat:", feat);
      const photoFramePromise = async () => {
        try {
          const photoFrame = await viewer.dataSources.add(dataSource);
          const entities = photoFrame.entities.values;
          for (let i = 0; i < entities.length; i++) {
            console.log("i: ", i);
            const entity = entities[i];
            if (true === true) {
              entity.polygon.material = new Cesium.ImageMaterialProperty({
                // this contains the path to the image file inside a property of the loaded GEOJSON:
                image: feat.features[0].properties.imagePath,
                alpha: 0.5,
              });
              entity.polygon.outline = true;
              // Set the color of the GEOJSON feature, namely the frame of the image:
              entity.polygon.outlineColor = Cesium.Color.ORANGE;
            }
            if (DEBUG === true) {
              console.log("entity keys:", Object.keys(entity));
              console.log("entity:", entity);
              console.log("entity polygon:", entity.polygon);
            }
          }
        } catch (err) {
          console.log("Error: ", err);
        }
      };
      photoFramePromise();
    } catch (e) {
      console.log("Error:", e);
    }
  };
  GeoJSONPromise(); // run it!

  const leftClickHandler = new Cesium.ScreenSpaceEventHandler(canvas);

  // Initialize arrays
  let terrainPoints = [];
  let polylineEntities = [];
  let imagePoints = [];
  let polylineImageEntities = [];

  leftClickHandler.setInputAction((movement) => {
    flags.looking = true;
    mousePosition = startMousePosition = Cesium.Cartesian3.clone(
      movement.position
    );
    const clickedObject = scene.drillPick(movement.position);
    if (
      clickedObject[0] === null ||
      typeof clickedObject[0] === "undefined" ||
      1 <= 0
    ) {
      console.log("Point clicked does not pass through the image frame.");
    } else {
      const ray = camera.getPickRay(movement.position);
      const TerrainPosition = globe.pick(ray, scene);

      if (DEBUG === true) {
        console.log("ray: ", ray);
        console.log("mousePosition: ", mousePosition);
        console.log("clickedObject keys: ", Object.keys(clickedObject[0]));
        console.log(
          "clickedObject prim keys: ",
          Object.keys(clickedObject[0].primitive)
        );
        console.log(
          "clickedObject id keys: ",
          Object.keys(clickedObject[0].id)
        );
        console.log("clickedObject prim: ", clickedObject[0].primitive);
        console.log("clickedObject id polygon: ", clickedObject[0].id.polygon);
        console.log("clickedObject id: ", clickedObject[0].id);
        console.log("TerrainPosition: ", TerrainPosition);
      }

      const intersectionWithImagePhysicalCenter = new GlobeIntersection(
        globe,
        geopose.camPos,
        geopose.imagePhysicalCenter
      );

      const ImagePlane = Cesium.Plane.fromPointNormal(
        geopose.imagePhysicalCenter,
        intersectionWithImagePhysicalCenter.direction
      );

      if (TerrainPosition != null || typeof TerrainPosition != "undefined") {
        const intersection = new GlobeIntersection(
          globe,
          geopose.camPos,
          TerrainPosition
        );
        const pointInImageSpace = Cesium.IntersectionTests.rayPlane(
          intersection.ray,
          ImagePlane
        );

        // To visualize the clicked point on the image, it's sometimes a bit buggy
        viewer.entities.add({
          name: "pt",
          position: pointInImageSpace,
          point: {
            pixelSize: 8,
            color: Cesium.Color.GREENYELLOW,
          },
        });

        // Fill arrays with the clicked points on the image and their ground projection points:
        imagePoints.push(pointInImageSpace);
        terrainPoints.push(TerrainPosition);

        // The last clicked point on the image and its ground projection are stored here:
        let lastImagePoint_ = imagePoints[imagePoints.length - 1];
        let lastTerrainPoint_ = terrainPoints[terrainPoints.length - 1];
        let lastImagePoint = Cesium.Cartographic.fromCartesian(lastImagePoint_);
        let lastTerrainPoint = Cesium.Cartographic.fromCartesian(
          lastTerrainPoint_
        );

        /*
          Build an array for the last clicked image point and its ground projection.
          TODO: use them to give the user the possibility to deleted them using e.g. a right click.
        */
        lastImagePointArray = [
          Cesium.Math.toDegrees(lastImagePoint.longitude),
          Cesium.Math.toDegrees(lastImagePoint.latitude),
        ];
        lastTerrainPointArray = [
          Cesium.Math.toDegrees(lastTerrainPoint.longitude),
          Cesium.Math.toDegrees(lastTerrainPoint.latitude),
        ];

        // Concatenate consecutive clicked image points into an array starting from the 2nd clicked point:
        if (imagePoints.length >= 2) {
          let previousImagePoint_ = imagePoints[imagePoints.length - 2];
          let previousImagePoint = Cesium.Cartographic.fromCartesian(
            previousImagePoint_
          );
          previousImagePointArray = [
            Cesium.Math.toDegrees(previousImagePoint.longitude),
            Cesium.Math.toDegrees(previousImagePoint.latitude),
          ];

          let imagePointsArray = [
            ...previousImagePointArray.concat(lastTerrainPointArray),
          ];

          // Draw a polyline with the image points of the array (not working?):
          polylineImageEntities.push(
            viewer.entities.add({
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(imagePointsArray),
                width: 2.0,
                material: Cesium.Color.LIME,
                clampToGround: false,
              },
            })
          );
        }

        // Concatenate consecutive ground points into an array starting from the 2nd clicked point:
        if (terrainPoints.length >= 2) {
          let previousTerrainPoint_ = terrainPoints[terrainPoints.length - 2];
          let previousTerrainPoint = Cesium.Cartographic.fromCartesian(
            previousTerrainPoint_
          );
          previousTerrainPointArray = [
            Cesium.Math.toDegrees(previousTerrainPoint.longitude),
            Cesium.Math.toDegrees(previousTerrainPoint.latitude),
          ];

          let terrainPointsArray = [
            ...previousTerrainPoint.concat(lastTerrainPointArray),
          ];

          // Draw a polyline with the ground points of the array:
          polylineEntities.push(
            viewer.entities.add({
              polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(
                  terrainPointsArray
                ),
                width: 4.0,
                material: Cesium.Color.AQUAMARINE,
                clampToGround: true,
              },
            })
          );
        }
      } else {
        console.log("Error, no terrain here.");
      }
    }
    if (DEBUG === true) {
      console.log("TerrainPoints are: ", terrainPoints);
      console.log("ImagePoints are: ", imagePoints);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  /**/
};
