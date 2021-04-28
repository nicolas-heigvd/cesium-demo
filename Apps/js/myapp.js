import { MAPTILER_TOKEN, MAPBOX_TOKEN, CESIUMION_TOKEN } from './config.js';

const debug = true;

//Austria
var north = 47.24387
var west = 9.87892
var south = 47.20387
var east = 9.89892

//Rio
var north = -22.9101
var west = -43.3407
var south = -22.9301
var east = -43.3207
/**/

// Switzerland
var north = 45.88465
var west = 7.13725
var south = 45.88105
var east = 7.14634
/**/
//console.log("east: ", east);
const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

// Cesium viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
    animation: false,
    baseLayerPicker: true,
    geocoder: false,
    homeButton: false,
    imageryLayers: true,
    infoBox : false,
    navigationHelpButton: false,
    projectionPicker: false,
    sceneModePicker: false,
    timeline: false,

    imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'https://wmts{s}.geo.admin.ch/1.0.0/ch.swisstopo.swissimage-product/default/current/4326/{z}/{x}/{y}.jpeg',
        subdomains: '56789',
        availableLevels: [8, 10, 12, 14, 15, 16, 17, 18],
        minimumRetrievingLevel: 8,
        maximumLevel: 17,
        tilingScheme: new Cesium.GeographicTilingScheme({
          numberOfLevelZeroTilesX: 2,
          numberOfLevelZeroTilesY: 1
        })
    }),

    terrainProvider: new Cesium.CesiumTerrainProvider({
        //url: `https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=${MAPTILER_TOKEN}`,
        url : '//3d.geo.admin.ch/1.0.0/ch.swisstopo.terrain.3d/default/20200520/4326/',
        //url: `${AUSTRIA_TERRAIN_URL}`,
        availableLevels: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19],
        rectangle: rectangle // Doesn't work without
    }),

});

//viewer.extend(Cesium.viewerCesiumInspectorMixin);
//viewer.scene.primitives.add(Cesium.createOsmBuildings());

// This is used to display swisstlm3D features (such as buildings or trees)
const TLMFeatures = false;
if (TLMFeatures) {
    let swisstlm3d = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url : 'https://vectortiles0.geo.admin.ch/3d-tiles/ch.swisstopo.swisstlm3d.3d/20201020/tileset.json'
    }));

    let swissnames3d = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: 'https://vectortiles0.geo.admin.ch/3d-tiles/ch.swisstopo.swissnames3d.3d/20180716/tileset.json'
    }));

    let vegetation3d = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url : 'https://vectortiles0.geo.admin.ch/3d-tiles/ch.swisstopo.vegetation.3d/20190313/tileset.json'
    }));
}

// Globally scoped constants about the environment
const scene = viewer.scene;
const canvas = viewer.canvas;
const globe = scene.globe;
const camera = scene.camera;
const ellipsoid = globe.ellipsoid;
const sscc = scene.screenSpaceCameraController;
console.log("ellipsoid: ",ellipsoid);

//Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
//Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

/*
Set Field of View, you may want to adapt the multiplication factor depending on
the focal of the image
*/
camera.frustum.fov = 0.9*Cesium.Math.PI_OVER_THREE
globe.depthTestAgainstTerrain = true;

/*
globe._surface._debug.wireframe = true;
new Cesium.CesiumInspectorViewModel(scene);
/**/


canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
canvas.onclick = function() {
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
console.log("doc:", document.getElementById('btn-lockCam').innerHTM);
const lockCam = () => {
    if (document.getElementById('btn-lockCam').innerHTML.includes('&nbsp;LockCam')) {
        trig_sscc = false; // lock camera
        sscc.enableRotate = trig_sscc;
        sscc.enableTranslate = trig_sscc;
        sscc.enableZoom = trig_sscc;
        sscc.enableTilt = trig_sscc;
        sscc.enableLook = trig_sscc;
        document.getElementById('btn-lockCam').innerHTML = '<i class="fas fa-unlock"></i>&nbsp;UnlockCam';
    } else if (document.getElementById('btn-lockCam').innerHTML.includes('&nbsp;UnlockCam')) {
        trig_sscc = true; // unlock camera
        sscc.enableRotate = trig_sscc;
        sscc.enableTranslate = trig_sscc;
        sscc.enableZoom = trig_sscc;
        sscc.enableTilt = trig_sscc;
        sscc.enableLook = trig_sscc;
        document.getElementById('btn-lockCam').innerHTML = '<i class="fas fa-lock"></i>&nbsp;LockCam';
    }
}

// Set show image button
const showimage = () => {
    console.log("infunction: ")
    for (i = 0, len = modelList.length; i < len; i++) {
        model = modelList[i]
        modelshow = model.show
        modelshow ^= true;
        model.show = modelshow
    }
};


var startMousePosition;
var mousePosition;
const flags = {
    looking: false,
    moveForward: false,
    moveBackward: false,
    moveUp: false,
    moveDown: false,
    moveLeft: false,
    moveRight: false
};

// Load GEOJSON feature of the image frame from a GEOJSON file
const feat_file = './geojson/25443.geojson';

// Convenience functions:
// Convert point array to Cartesian3
const transform2DPointArrayToCartesian = (pointArray) => {
    return new Cesium.Cartesian3.fromDegrees(...pointArray);
}

const transform3DPointArrayToCartesian = (pointArray1, pointArray2) => {
     return new Cesium.Cartesian3.fromDegreesArrayHeights([
        ...(pointArray1.concat(pointArray2))
    ])
}

// Fetch the image frame from the GEOJSON file
const fetchFile = async () => {
    let res = await fetch(feat_file);
    let feat = await res.json();
    return feat;
}


// Call of the main() function only once the GEOJSON file has been loaded
fetchFile().then(feat =>  {
    main(feat)
});

/* GeoPose class is used to store the camera position, the image center position
and the 3 orientation angles. Positions are either given as an Array or a Cartesian3
*/
class GeoPose {
    constructor(feat) {
        // This is the physical image center; it comes from the feature properties
        this.imagePhysicalCenterArray = feat.features[0].properties.imageCenter.split(',');
        this.imagePhysicalCenter = transform2DPointArrayToCartesian(this.imagePhysicalCenterArray); // Cartesian3
        // This is the camera position, it's not equal to the physical image center
        this.camPosArray = feat.features[0].properties.camPos.split(',');
        this.camPos = transform2DPointArrayToCartesian(this.camPosArray); // Cartesian3
        // orientation angles
        this.yaw = feat.features[0].properties.yaw;
        this.pitch = feat.features[0].properties.pitch;
        this.roll = feat.features[0].properties.roll;
    }
}


const goToModel = (geopose) => {
    camera.setView({
        destination: geopose.camPos, // Cartesian3
        orientation: {
            heading: Cesium.Math.toRadians(-1*geopose.yaw),  // heading
            pitch: Cesium.Math.toRadians(1*geopose.pitch),   // pitch
            roll: Cesium.Math.toRadians(0*geopose.roll)      // roll
        }
    });
};


const goToHeadingPitchRoll = () => {
  camera.frustum.fov = 1*Cesium.Math.PI_OVER_TWO;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
       	9.54341, 47.28139, 540.0
    ),
    orientation: {
      heading: Cesium.Math.toRadians(94.0),
      pitch: Cesium.Math.toRadians(-40.0),
      roll: Cesium.Math.toRadians(0.0),
    },
  });
}

const flyToModel = (geopose) => {
    camera.flyTo({
        destination: geopose.camPos, // Cartesian3
        orientation: {
            heading: Cesium.Math.toRadians(-1*geopose.yaw),  // heading
            pitch: Cesium.Math.toRadians(1*geopose.pitch),   // pitch
            roll: Cesium.Math.toRadians(0*geopose.roll)      // roll
        }
    });
};


/* ImagePlaneGeometry is a class to describe the geometry of the plane containing
the image. Therefore, it makes use of a geopose instance for a given image.
This contains the focalDirection and the focalRay, along with the
imagePlane and its normal vector, the imagePlaneNormal.*/
class ImagePlaneGeometry {
    constructor(geopose) {
        this.geopose = geopose;
        // Declare constants
        this.focalDirection = new Cesium.Cartesian3();
        this.imagePlaneNormal = new Cesium.Cartesian3();
        this.imagePosition = new Cesium.Cartesian3();

        Cesium.Cartesian3.subtract(
            this.geopose.imagePhysicalCenter, // Cartesian3
            this.geopose.camPos, // Cartesian3
            this.focalDirection // result
        );
        // Compute the focal ray
        this.focalRay = new Cesium.Ray(
            this.geopose.camPos,
            this.focalDirection
        );
        // Get the norm of the focalRay
        Cesium.Cartesian3.normalize(
            this.focalDirection,
            this.imagePlaneNormal // result
        );
        // Compute the image plane
        this.imagePlane = new Cesium.Plane.fromPointNormal(
            this.geopose.imagePhysicalCenter,
            this.imagePlaneNormal
        );
        // Compute the intersection of the ray with the image plane
        Cesium.IntersectionTests.rayPlane(
            this.focalRay,
            this.imagePlane,
            this.imagePosition // result
        );

        if (debug === true) {
            console.log("focalDirection:", this.focalDirection);
            console.log("ImagePlaneNormal:", this.imagePlaneNormal);
            console.log("focalRay:", this.focalRay);
            console.log("imagePlane:", this.imagePlane);
            console.log("imagePosition:", this.imagePosition);
        }
        const line_start = viewer.entities.add({
            name : 'p0',
            position : this.geopose.camPos,
            point : {
                pixelSize : 10,
                color : Cesium.Color.YELLOW
            }
        });
        if (debug === true) {
            const line_end = viewer.entities.add({
                name : 'p1',
                position : this.imagePhysicalCenter,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.RED
                }
            });
        } else {
            const image_center = viewer.entities.add({
                name : 'image_center',
                position : this.imagePosition,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.AQUA
                }
            });
        }
        if (debug === false) {
            const lineOfSight = viewer.entities.add({
                polyline : {
                    positions : transform3DPointArrayToCartesian(
                        this.geopose.camPosArray.concat(this.geopose.imagePhysicalCenterArray)
                    ),
                    width : 4,
                    material : new Cesium.PolylineGlowMaterialProperty({
                        glowPower : 7.5,
                        color : Cesium.Color.LIGHTGREEN
                    })
                }
            });
        }
    }
}

const computeImagePosition = (geopose) => {
    return new ImagePlaneGeometry(geopose);
}


const main = (feat) => {
    document.querySelector('#btn-lockCam').addEventListener('click', lockCam);

    const geopose = new GeoPose(feat);

    console.log("Document: ", document.querySelector('#btn-goToModel'));
    document.querySelector('#btn-goToModel').addEventListener('click', () => {goToModel(geopose)});
    document.querySelector('#btn-flyToModel').addEventListener('click', () => {flyToModel(geopose)});
    document.querySelector('#btn-goToHeadingPitchRoll').addEventListener('click', () => {goToHeadingPitchRoll()});

    // Set initial camera view
    camera.setView({
        destination: geopose.camPos, // your own position as a cartesian3
        orientation: {
            heading : Cesium.Math.toRadians(-1*geopose.yaw),   // heading
            pitch   : Cesium.Math.toRadians(1*geopose.pitch),  // pitch
            roll    : Cesium.Math.toRadians(0*geopose.roll)    // roll
        }
    });

    console.log("camPos: ", geopose.camPos);
    console.log("yaw: ", geopose.yaw);
    console.log("pitch: ", geopose.pitch);
    console.log("roll: ", geopose.roll);

    const imagePosition = computeImagePosition(geopose);
    console.log("ImPos: ", imagePosition);

    const GeoJSONPromise = async () => {
        try {
            const dataSource = await Cesium.GeoJsonDataSource.load(feat, {
                stroke: Cesium.Color.HOTPINK,
                fill: new Cesium.Color(1, 0.6, 1, 0.2),
                strokeWidth: 3
            });
            console.log("feat:", feat);
            const photoFramePromise = async () => {
                try {
                    const photoFrame = await viewer.dataSources.add(dataSource);
                    const entities = photoFrame.entities.values;
                    for (var i = 0; i < entities.length; i++) {
                        console.log("i: ", i);
                        const entity = entities[i];
                        if (true === true) {
                            entity.polygon.material = new Cesium.ImageMaterialProperty({
                                //image: './images/Cesium3DTiles.jpg',
                                image: feat.features[0].properties.imagePath,
                                alpha: 0.5
                            });
                            entity.polygon.outline = true;
                            entity.polygon.outlineColor = Cesium.Color.ORANGE;
                        }
                        /**/
                        /*
                        entity.polygon.material = new Cesium.Material({
                            fabric: {
                                uniforms: {
                                    image: feat.features[0].properties.imagePath,
                                    alpha: 0.5
                                },
                                components: {
                                    diffuse: 'texture2D(image, fract(repeat * materialInput.st)).rgb',
                                    alpha: 'texture2D(image, fract(repeat * materialInput.st)).a * alpha'
                                }
                            },
                            translucent: true
                        });
                        /**/
                        console.log("entity keys:", Object.keys(entity));
                        console.log("entity:", entity);
                        console.log("entity polygon:", entity.polygon);
                        /**/
                    }
                }
                catch (err) {
                    console.log("Error: ", err);
                }
            }
            photoFramePromise();
        }
        catch (e) {
            console.log("Error:", e);
        }
    }
    GeoJSONPromise();


    // display the gltf of the image
    if (true === false) {
        const gltf_file = './gltf/glacier1.gltf';
        // eastNorthUpToFixedFrame northEastDownToFixedFrame
        const modelMatrix = Cesium.Transforms.northEastDownToFixedFrame(
            geopose.camPos
        );
        const model = scene.primitives.add(Cesium.Model.fromGltf({
            url: gltf_file,
            modelMatrix: modelMatrix,
            scale: .1,
            color: new Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.64),
            backFaceCulling: false,
            debugWireframe: false
        }));
        console.log("gltf model: ", model);
    }

    // display a synthetic camera gltf
    if (true === false) {
        const gltf_file = './gltf/dslr_camera/scene.gltf';
        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            geopose.camPos
        );
        const model = scene.primitives.add(Cesium.Model.fromGltf({
            url : gltf_file,
            modelMatrix : modelMatrix,
            scale : .1
        }));
        var qua = new Cesium.Quaternion(
            -0.70710678118654746,
            -0,
            -0,
            0.70710678118654757
        );
        var hpr = Cesium.HeadingPitchRoll.fromQuaternion(qua);
        var nhpr = new Cesium.HeadingPitchRoll(hpr.heading, Cesium.Math.PI-0.18, hpr.roll);
        var newq = Cesium.Quaternion.fromHeadingPitchRoll(nhpr);

        console.log("qua: ", qua);
        console.log("hpr: ", hpr);
        console.log("nhpr: ", nhpr);
        console.log("newq: ", newq);
        /**/
    }


    const pickGlobeIntersection = (globe, p0, p1) => {
        //all positions are in Cartesian3
        const direction = new Cesium.Cartesian3();
        const normal = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(p1, p0, direction);
        console.log("direction: ", direction);
        //const normal = new Cesium.Cartesian3.normalize(direction);
        Cesium.Cartesian3.normalize(direction, normal);
        console.log("DirectionN:", normal);
        const ray = new Cesium.Ray(p0, normal);
        const hitPos = globe.pick(ray, scene);

        if ((hitPos !== undefined) && (hitPos !== null)) {
            console.log("hitPos: ", hitPos);
            return {
                "hitPos": hitPos,
                "normal": normal,
                "ray": ray
            };
        } else {
            console.log("hitPos is null!");
            return null;
        }
    }
    /**/
    /*
    const pickGlobeIntersection = (globe, p0, p1) => {
        //all positions are in Cartesian3
        this.direction = new Cesium.Cartesian3();
        this.normal = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(p1, p0, this.direction);
        console.log("direction: ", this.direction);
        Cesium.Cartesian3.normalize(this.direction, this.normal);
        console.log("DirectionN:", this.normal);
        this.ray = new Cesium.Ray(p0, this.normal);
        this.hitPos = globe.pick(this.ray, scene);

        if ((this.hitPos !== undefined) && (this.hitPos !== null)) {
            console.log("hitPos: ", this.hitPos);
            return this;
        } else {
        console.log("hitPos is null!");
        return null;
        }
    }
    /**/

    const computeIntersectionWithGlobe = (start, end, tiles) => {
        console.log("Inside computeIntersectionWithGlobe...");
        // points as Cartesian3 (ECEF)
        //console.log("Start: ", start);
        //console.log("End: ", end);
        if (globe.tilesLoaded) {
            console.log("Globe tiles loaded successfully!");
            if (tiles) {
                //console.log("globe.tilesLoaded: ", globe.tilesLoaded);
                console.log("tile number: ", tiles);
            } else {
                tiles = null;
            }
            const hit = pickGlobeIntersection(globe, start, end);
            const start_rad = new Cesium.Cartographic();
            const hitPosWGS84_rad = new Cesium.Cartographic();
            console.log("hit: ",hit);
            Cesium.Cartographic.fromCartesian(
                hit.hitPos,
                Cesium.Ellipsoid.WGS84,
                hitPosWGS84_rad
            );
            Cesium.Cartographic.fromCartesian(
                start,
                Cesium.Ellipsoid.WGS84,
                start_rad
            );

            const hitPosWGS84 = new Cesium.Cartographic(
                Cesium.Math.toDegrees(hitPosWGS84_rad.longitude),
                Cesium.Math.toDegrees(hitPosWGS84_rad.latitude),
                hitPosWGS84_rad.height
            );
            /*
            console.log("hitPos after all tiles are loaded: ", hitPos);
            console.log("hitPosWGS84_rad: ", hitPosWGS84_rad);
            /**/
            console.log("hitPosWGS84: ", hitPosWGS84);

            const pZero = [
                Cesium.Math.toDegrees(start_rad.longitude),
                Cesium.Math.toDegrees(start_rad.latitude),
                start_rad.height
            ];

            const pt = [
                hitPosWGS84.longitude,
                hitPosWGS84.latitude,
                hitPosWGS84.height
            ];

            const ptgrnd = new Cesium.Cartesian3.fromDegrees(...pt);
            const p_terrain_intersect = viewer.entities.add({
                name : 'pt',
                position : ptgrnd,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.YELLOW
                }
            });
            const polyLine = viewer.entities.add({
                polyline : {
                    positions : Cesium.Cartesian3.fromDegreesArrayHeights([
                        ...(pZero.concat(pt))
                    ]),
                    width: 4,
                    granularity: Cesium.Math.toRadians(0.05),
                    material : new Cesium.PolylineGlowMaterialProperty({
                        glowPower : 0.1,
                        color : Cesium.Color.CHARTREUSE
                    })
                }
            });
            console.log("Retval returned!");
            return { "pt": pt, "ptgrnd": ptgrnd, "ray": hit.ray };
        } else {
            return null;
        };
    }

    // run the actual ray intersection with the globe
    if (true == false) {
        globe.tileLoadProgressEvent.addEventListener(
            tiles => computeIntersectionWithGlobe(
                geopose.camPos,
                geopose.imagePhysicalCenter,
                tiles
            )
        );
    }

    const leftClickHandler = new Cesium.ScreenSpaceEventHandler(canvas);
    //leftClickHandler.setInputAction(this.leftClickFunction, ScreenSpaceEventType.LEFT_CLICK);

    let terrainPoints = [];
    let polylineEntities = [];
    let imagePoints = [];
    let polylineImageEntities = [];
    leftClickHandler.setInputAction(movement => {
        flags.looking = true;
        mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
        const clickedObject = scene.drillPick(movement.position);
        if (clickedObject[0] === null || typeof(clickedObject[0]) === 'undefined' || 1<=0) {
            console.log("Point clicked does not pass through the image frame.")
        } else {
            const ray = camera.getPickRay(movement.position);
            const TerrainPosition = globe.pick(ray, scene);
            console.log("ray: ", ray);

            console.log("mousePosition: ", mousePosition);
            console.log("clickedObject keys: ", Object.keys(clickedObject[0]));
            console.log("clickedObject prim keys: ", Object.keys(clickedObject[0].primitive));
            console.log("clickedObject id keys: ", Object.keys(clickedObject[0].id));
            console.log("clickedObject prim: ", (clickedObject[0].primitive));
            console.log("clickedObject id polygon: ", (clickedObject[0].id.polygon));
            console.log("clickedObject id: ", (clickedObject[0].id));
            console.log("TerrainPosition: ", TerrainPosition);

            const retval = computeIntersectionWithGlobe(
                geopose.camPos,
                geopose.imagePhysicalCenter
            );
            console.log("retval: ", retval);
            const ImagePlane = Cesium.Plane.fromPointNormal(
                geopose.imagePhysicalCenter,
                retval.ray.direction
            );
            console.log("ImagePlane: ", ImagePlane);
            if (TerrainPosition != null || typeof(TerrainPosition) != 'undefined') {
                const intersection = computeIntersectionWithGlobe(
                    geopose.camPos,
                    TerrainPosition
                );
                const imagePosition = Cesium.IntersectionTests.rayPlane(
                    intersection.ray,
                    ImagePlane
                );
                console.log("imagePosition: ", imagePosition);
                viewer.entities.add({
                    name : 'pt',
                    position : imagePosition,
                    point : {
                        pixelSize : 8,
                        color : Cesium.Color.GREENYELLOW
                    }
                });
                imagePoints.push(imagePosition);
                let lastImagePoint = imagePoints[imagePoints.length -1];
                console.log("Last lastImagePoint is: ", lastImagePoint);
                let ptpImage1 = (Cesium.Cartographic.fromCartesian(lastImagePoint));
                ptpImage1 = [Cesium.Math.toDegrees(ptpImage1.longitude),Cesium.Math.toDegrees(ptpImage1.latitude)];
                console.log("ptpImage1: ",ptpImage1);

                //terrainPoints.push(retval.ptgrnd);
                terrainPoints.push(TerrainPosition);
                let lastTerrainPoint = terrainPoints[terrainPoints.length - 1];
                console.log("Last terrainPoints is: ", lastTerrainPoint);
                let ptp1 = (Cesium.Cartographic.fromCartesian(lastTerrainPoint));
                ptp1 = [Cesium.Math.toDegrees(ptp1.longitude),Cesium.Math.toDegrees(ptp1.latitude)];
                console.log("ptp1: ",ptp1);

                if (imagePoints.length >= 2) {
                    let previousImagePoint = imagePoints[imagePoints.length -2];
                    let ptpImage0 = (Cesium.Cartographic.fromCartesian(previousImagePoint));
                    ptpImage0 = [Cesium.Math.toDegrees(ptpImage0.longitude),Cesium.Math.toDegrees(ptpImage0.latitude)];
                    console.log("ptpImage0: ",ptpImage0);
                    let arrayImagePoints = [...ptpImage0.concat(ptpImage1)];
                    console.log("arrayImagePoints: ", arrayImagePoints);
                    polylineImageEntities.push(viewer.entities.add({
                        polyline : {
                            positions : Cesium.Cartesian3.fromDegreesArray(arrayImagePoints),
                            width : 2.0,
                            material : Cesium.Color.LIME,
                            clampToGround : false
                        }
                    }));
                }
                if (terrainPoints.length >= 2) {
                    let previousTerrainPoint = terrainPoints[terrainPoints.length - 2];
                    let ptp0 = (Cesium.Cartographic.fromCartesian(previousTerrainPoint));
                    ptp0 = [Cesium.Math.toDegrees(ptp0.longitude),Cesium.Math.toDegrees(ptp0.latitude)];
                    console.log("ptp0: ",ptp0);
                    let arrayPoints = [...ptp0.concat(ptp1)];
                    console.log("arrayPoints: ", arrayPoints);
                    polylineEntities.push(viewer.entities.add({
                        polyline : {
                            positions : Cesium.Cartesian3.fromDegreesArray(arrayPoints),
                            width : 4.0,
                            material : Cesium.Color.AQUAMARINE,
                            clampToGround : true
                        }
                    }));
                }
            } else {
                console.log("Error, no terrain here.");
            }
        }
        console.log("TerrainPoints are: ", terrainPoints);
        console.log("ImagePoints are: ", imagePoints);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    /**/
};

