import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

document.addEventListener("DOMContentLoaded", () => {
    main();
});

let loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = function () {
    console.log("All assets loaded!");
    document.getElementById('loading-screen').style.display = 'none';
};

let scene, camera, renderer, controls;
let raycaster, mouse;
let modelGroup = new THREE.Group();

let meshy, line;

let lineGeo;

let isDragging = false;
let mouseDownPosition = new THREE.Vector2();
const dragThreshold = 5;

const selectedObjects = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 'black' );

    const canvas = document.querySelector( '#c' );
    renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.set( 0, 5, 20 );


    controls = new OrbitControls( camera, renderer.domElement);
    controls.target.set( 0, 5, 0 );
    controls.enableZoom = true;  // Allow zooming
    controls.enablePan = true;   // Allow panning
    controls.enableRotate = true;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

}

function addObjects() {
    const planeWidth = 20;
    const planeHeight = 15;

    const loader1 = new THREE.TextureLoader();
    const texture = loader1.load( 'resources/checker.png' );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeWidth / 2;
    texture.repeat.set( repeats, repeats );

    const planeGeo = new THREE.PlaneGeometry( planeWidth, planeHeight );
    const planeMat = new THREE.MeshPhongMaterial( {
        map: texture,
        side: THREE.DoubleSide,
    } );
    const mesh = new THREE.Mesh( planeGeo, planeMat );
    mesh.rotation.x = Math.PI * - .5;
    scene.add( mesh );

    const loader2 = new GLTFLoader(loadingManager);

    loader2.load( 'resources/fender_electric_guitar_gltf/scene.gltf', function ( gltf ) {
        modelGroup = gltf.scene
        modelGroup.scale.set(5, 5, 5);
        modelGroup.position.set(0, 5, 0);
        modelGroup.rotation.set(Math.PI / 2, 0, 0);
        modelGroup.name="guitar";
        scene.add(modelGroup);
        console.log("added successfully");
    }, undefined, function ( error ) {
        console.error( error );
    } );

    function loadWalls() {
        const wallwidths = [20, 20, 15, 15];
        const wallheight = 5;
        const wallLocations = [[0, wallheight, -7.5], [0, wallheight, 7.5], [-10, wallheight, 0], [10, wallheight, 0]];
        const wallRotations = [[0, 0, 0], [0, (Math.PI / 2) * 2, 0], [0, (Math.PI / 2), 0], [0, -(Math.PI / 2), 0]];
        for (let i = 0; i < 4; i++) {
            const width = wallwidths[i];
            const height = 10;
            const geometry = new THREE.PlaneGeometry( width, height );
            const loader = new THREE.TextureLoader();
            const texture = loader.load( 'resources/wall.jpg' );
            texture.colorSpace = THREE.SRGBColorSpace;

            const material = new THREE.MeshBasicMaterial({
                map: texture
            });
            const mesh = new THREE.Mesh( geometry, material);
            mesh.position.set( wallLocations[i][0], wallLocations[i][1], wallLocations[i][2]);
            mesh.rotation.set(wallRotations[i][0], wallRotations[i][1], wallRotations[i][2]);
            mesh.name = "wall:" + i;
            scene.add(mesh);
        }
    }

    loadWalls();

    // Light
    // const color = 0xFFFFFF;
    // const intensity = 1;
    // const light = new THREE.AmbientLight( color, intensity );
    // scene.add( light );

    // Directional Light
    const color2 = 0xFFFFFF;
    const intensity2 = 1;
    const light2 = new THREE.DirectionalLight(color2, intensity2);
    light2.position.set(5, 10, 5);
    light2.target.position.set(-5, 0, -10);
    scene.add(light2);
    scene.add(light2.target);

    // Billboard
    const billboard = new THREE.PlaneGeometry( 2, .8 );
    const loader = new THREE.TextureLoader();
    const texture1 = loader.load( 'resources/guitarPopUp.png' );
    texture1.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: texture1, side: THREE.DoubleSide });
    meshy = new THREE.Mesh( billboard, mat);
    meshy.visible = false;
    scene.add(meshy);

    // Line
    const lineMat = new THREE.LineBasicMaterial( { color: 'black' } );
    const vertices = new Float32Array([
        0, 5, 0,
        10, 10, 10
    ]);

    lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    line = new THREE.Line( lineGeo, lineMat);
    line.visible = false;
    scene.add( line );
}

function updateLine() {
    const newX = meshy.position.x;
    const newY = meshy.position.y;
    const newZ = meshy.position.z;

    // Update the position of point 2 (index 3, 4, 5 for x, y, z)
    lineGeo.attributes.position.setXYZ(1, newX, newY, newZ);

    // Indicate that the position attribute has changed
    lineGeo.attributes.position.needsUpdate = true;
}


function onMouseDown(event) {
    // Store initial mouse position
    mouseDownPosition.set(event.clientX, event.clientY);
    isDragging = false;
}

function onMouseMove(event) {
    // Check if the mouse has moved far enough to be considered a drag
    const dx = event.clientX - mouseDownPosition.x;
    const dy = event.clientY - mouseDownPosition.y;

    if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) {
        isDragging = true;  // Mark as dragging
    }
}

function onMouseUp(event) {

    // Only trigger the click if it's not a drag
    if (!isDragging) {
        // Disable OrbitControls temporarily during click event
        controls.enabled = false;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);

        // Get the list of objects intersected by the ray
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        const guitarIntersects = raycaster.intersectObject(meshy, true);

        // If there's an intersection, select the first object
        if (intersects.length > 0) {
            meshy.visible = !meshy.visible;
            line.visible = !line.visible;
        } else if (guitarIntersects.length > 0) {
            window.location.href = "ChordSite/chordSite.html";
        } else {
            meshy.visible = false;
            line.visible = false;
        }

        // Reactivate OrbitControls after selection
        setTimeout(() => {
            controls.enabled = true;
        }, 100); // Delay reactivation to ensure click event is processed
    }

    // Reset drag state after mouse up
    isDragging = false;
}

function animate(offset) {
    requestAnimationFrame(animate);

    controls.update();// Update controls (important for OrbitControls)



    if (meshy.visible) {
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        camera.getWorldDirection(cameraDirection);

        const cameraRight = new THREE.Vector3(1, 0, 0); // X-axis (right)
        camera.getWorldDirection(cameraRight);
        cameraRight.cross(camera.up);

        const cameraUp = new THREE.Vector3(0, 1, 0);
        camera.getWorldDirection(cameraUp);

        meshy.position.copy(camera.position).addScaledVector(cameraDirection, 5).addScaledVector(cameraRight, 2).addScaledVector(cameraUp, 1);

        meshy.lookAt(camera.position);
        updateLine();
    }

    renderer.render(scene, camera);
}



function main() {
    init();

    addObjects();



    function resizeRendererToDisplaySize( renderer ) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if ( needResize ) {
            renderer.setSize( width, height, false );
        }
        return needResize;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);

    const offset = new THREE.Vector3(0, 0, -5);

    animate(offset);
}

