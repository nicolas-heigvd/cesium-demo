

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
        url : '//3d.geo.admin.ch/1.0.0/ch.swisstopo.terrain.3d/default/20200520/4326/',
        availableLevels: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19],
        rectangle: rectangle // Doesn't work without
    }),

});
//viewer.extend(Cesium.viewerCesiumInspectorMixin);

const scene = viewer.scene;
const canvas = viewer.canvas;
const globe = scene.globe;
const camera = scene.camera;
const ellipsoid = globe.ellipsoid;
const sscc = scene.screenSpaceCameraController;
console.log("ellipsoid: ",ellipsoid);

//Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
//Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

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

trig_sscc = false; // lock
sscc.enableRotate = trig_sscc;
sscc.enableTranslate = trig_sscc;
sscc.enableZoom = trig_sscc;
sscc.enableTilt = trig_sscc;
sscc.enableLook = trig_sscc;

// disable the default event handlers
console.log("doc:", document.getElementById('btn-lockCam').innerHTM);
const lockCam = () => {
    if (document.getElementById('btn-lockCam').innerHTML.includes('&nbsp;LockCam')) {
        trig_sscc = false; // lock
        sscc.enableRotate = trig_sscc;
        sscc.enableTranslate = trig_sscc;
        sscc.enableZoom = trig_sscc;
        sscc.enableTilt = trig_sscc;
        sscc.enableLook = trig_sscc;
        document.getElementById('btn-lockCam').innerHTML = '<i class="fas fa-unlock"></i>&nbsp;UnlockCam';
    } else if (document.getElementById('btn-lockCam').innerHTML.includes('&nbsp;UnlockCam')) {
        trig_sscc = true; // unlock
        sscc.enableRotate = trig_sscc;
        sscc.enableTranslate = trig_sscc;
        sscc.enableZoom = trig_sscc;
        sscc.enableTilt = trig_sscc;
        sscc.enableLook = trig_sscc;
        document.getElementById('btn-lockCam').innerHTML = '<i class="fas fa-lock"></i>&nbsp;LockCam';
    }
}

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

const feat_file = './geojson/25443.geojson';

const fetchFile = async () => {
    let res = await fetch(feat_file);
    let feat = await res.json();
    return feat;
}


fetchFile().then(feat => {
    document.querySelector('#btn-lockCam').addEventListener('click', lockCam);
    const p0     = [7.14267, 45.88358, 2528.0];
    //const p1     = [7.13963, 45.88325, 2515];
    ////const p1     = [7.1409409,   45.8830364, 2523.2039282]; // physical image center
    const p1     = feat.features[0].properties.imageCenter.split(',');;
    const p2     = [7.09289, 45.88267, 2474.8];
    const point0 = new Cesium.Cartesian3.fromDegrees(...p0);
    const imagePhysicalCenter = new Cesium.Cartesian3.fromDegrees(...p1);
    //const campos0 = [ 7.14320, 45.88369, 2535 ];
    //const campos0 =  [ 7.1424558,   45.8836527, 2519.3311016];
    //const campos0 = [west, north, 100]; // brazil
    const campos0 = feat.features[0].properties.camPos.split(',');
    const campos = new Cesium.Cartesian3.fromDegrees(...campos0);
    const campos_rad = new Cesium.Cartographic.fromDegrees(...campos0);

    const goToModel = () => {
        camera.setView({
            destination: campos, // Cartesian3
            orientation: {
                heading: Cesium.Math.toRadians(-1*feat.features[0].properties.yaw),  // heading
                pitch: Cesium.Math.toRadians(1*feat.features[0].properties.pitch),    // pitch -6
                roll: Cesium.Math.toRadians(0*feat.features[0].properties.roll) //).585)      // roll
            }
        });
    };
    console.log("Doucment: ", document.querySelector('#btn-goToModel'));
    document.querySelector('#btn-goToModel').addEventListener('click', goToModel);

    const flyToModel = () => {
        camera.flyTo({
            destination: campos, // Cartesian3
            orientation: {
                heading: Cesium.Math.toRadians(-1*feat.features[0].properties.yaw),  // heading
                pitch: Cesium.Math.toRadians(1*feat.features[0].properties.pitch),    // pitch -6
                roll: Cesium.Math.toRadians(0*feat.features[0].properties.roll) //).585)      // roll
            }
        });
    };
    document.querySelector('#btn-flyToModel').addEventListener('click', flyToModel);

    camera.setView({
        destination: campos, // your own position as a cartesian3
        orientation: {
            heading : Cesium.Math.toRadians(-1*feat.features[0].properties.yaw),   // heading
            pitch   : Cesium.Math.toRadians(1*feat.features[0].properties.pitch),    // pitch -6
            roll    : Cesium.Math.toRadians(0*feat.features[0].properties.roll) //).585)      // roll
        }
    });

    console.log("camPos: ", feat.features[0].properties.camPos);
    console.log("yaw: ", feat.features[0].properties.yaw);
    console.log("pitch: ", feat.features[0].properties.pitch);
    console.log("roll: ", feat.features[0].properties.roll);

    /*
    const corridor = viewer.entities.add({
        id: 'myCorridor',
        name: "my corridor",
        corridor: {
            positions: Cesium.Cartesian3.fromDegreesArray([
                ...(campos0.slice(0,2).concat(p2.slice(0,2)))
            ]),
            width: 2,
            material: Cesium.Color.AQUA
        }
    });
    console.log("corridor: ",corridor.corridor.positions);
    /**/
        if (true === false) {
        let polylineEntities = [];
        polylineEntities.push(viewer.entities.add({
            polyline : {
                positions : Cesium.Cartesian3.fromDegreesArray([
                    ...(campos0.slice(0,2).concat(p2.slice(0,2)))
                ]),
                width : 4.0,
                material : Cesium.Color.AQUAMARINE,
                clampToGround : true
            }
        }));
    }
    /*
    let corridorEntities = [];
    corridorEntities.push(viewer.entities.add({
        corridor : {
            positions : Cesium.Cartesian3.fromDegreesArray([
                ...(campos0.slice(0,2).concat(p2.slice(0,2)))
            ]),
            width : 3.0,
            material : new Cesium.Color(0, 1, 0, 0.5),
            //cornerType: Cesium.CornerType.MITERED,
            //classificationType : Cesium.ClassificationType.TERRAIN
        }
    }));
    /**/



    const computeImagePosition = (viewer, campos, imagePhysicalCenter) => {
        const focalDirection = new Cesium.Cartesian3();
        const imagePlaneNormal = new Cesium.Cartesian3();
        const imagePosition = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(imagePhysicalCenter, campos, focalDirection);
        const focalRay = new Cesium.Ray(campos, focalDirection);
        Cesium.Cartesian3.normalize(focalDirection, imagePlaneNormal);
        const imagePlane = new Cesium.Plane.fromPointNormal(imagePhysicalCenter, imagePlaneNormal);
        Cesium.IntersectionTests.rayPlane(focalRay, imagePlane, imagePosition);
        if (true === false) {
            console.log("focalDirection:", focalDirection);
            console.log("ImagePlaneNormal:", imagePlaneNormal);
            console.log("focalRay:", focalRay);
            console.log("imagePlane:", imagePlane);
            console.log("imagePosition:", imagePosition);
            /**/
        }
        const line_start = viewer.entities.add({
            name : 'p0',
            position : campos,
            point : {
                pixelSize : 10,
                color : Cesium.Color.YELLOW
            }
        });

        if (true === false) {
            const line_end = viewer.entities.add({
                name : 'p1',
                position : imagePhysicalCenter,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.RED
                }
            });
        } else {
            const image_center = viewer.entities.add({
                name : 'image_center',
                position : imagePosition,
                point : {
                    pixelSize : 10,
                    color : Cesium.Color.AQUA
                }
            });
        }

        if (true === false) {
            const lineOfSight = viewer.entities.add({
                polyline : {
                    positions : Cesium.Cartesian3.fromDegreesArrayHeights([
                        ...(campos0.concat(p1))
                    ]),
                    width : 4,
                    material : new Cesium.PolylineGlowMaterialProperty({
                        glowPower : 0.5,
                        color : Cesium.Color.LIGHTGREEN
                    })
                }
            });
        }
        return imagePosition;
    }

    const computeImagePositionPromise = async () => {
        const imagePosition = await computeImagePosition(viewer, campos, imagePhysicalCenter);
        try {
            console.log("ImPos: ", imagePosition);
        } catch (e) {
            console.log("Error: ", e);
        }
    };

    computeImagePositionPromise();


    /*
    const picture = viewer.entities.add({
        name: 'photo',
        polygon : {
            hierarchy: Cesium.Cartesian3.fromDegreesArrayHeights([
                7.0665543, 45.9754425, 2650.1965260,
                7.0658164, 45.9771583, 2668.8373657,
                7.0657976, 45.9770379, 2801.3547926,
                7.0665355, 45.9753221, 2782.7139534,
                7.0665543, 45.9754425, 2650.1965265
            ]),
            material : new Cesium.ImageMaterialProperty({
                image: feat.features[0].properties.imagePath,
                alpha: 0.5
            }),
            outline: true,
            outlineColor: Cesium.Color.ORANGE,
        }
    });
    /**/

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
            campos
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
            campos
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
            tiles => computeIntersectionWithGlobe(campos, imagePhysicalCenter, tiles)
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
        if (clickedObject[0] === null || typeof(clickedObject[0]) === 'undefined') {
            console.log("Point clicked does not pass throxugh the image frame.")
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
            const retval = computeIntersectionWithGlobe(campos, imagePhysicalCenter);
            console.log("retval: ", retval);
            const ImagePlane = Cesium.Plane.fromPointNormal(imagePhysicalCenter, retval.ray.direction);
            console.log("ImagePlane: ", ImagePlane);
            if (TerrainPosition != null || typeof(TerrainPosition) != 'undefined') {
                const intersection = computeIntersectionWithGlobe(campos, TerrainPosition);
                const imagePosition = Cesium.IntersectionTests.rayPlane(intersection.ray, ImagePlane);
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
});
