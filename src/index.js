import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
let loadingManager = new THREE.LoadingManager();

const loadingBar = document.getElementById("loading-bar");
const loadingText = document.getElementById("loading-text");
const loadingContainer = document.getElementById("loading-container");
const initialText = document.getElementById("initial-text");

let scene, camera, renderer, controls;
let guitarGroup = new THREE.Group();

let assets_loaded = false;


const highQualityUrl = 'https://d30iaq9iwb0kwc.cloudfront.net/public/resources/HighQuality/gibson_sg_guitar.glb';
const lowQualityUrl = 'https://d30iaq9iwb0kwc.cloudfront.net/public/resources/LowQuality/outputs/LowQualityGuitar.glb';

document.addEventListener("DOMContentLoaded", () => {
    index();
});

window.onload = function() {
    document.getElementById("loading-bar").hidden = true;
    document.getElementById("loading-text").hidden = true;
}


loadingManager.onProgress = function (url, loaded, total) {
    initialText.hidden = true;
    loadingBar.hidden = false;
    loadingText.hidden = false;

    let progress = (loaded / total) * 100;
    loadingBar.style.width = progress + "%";
    loadingText.textContent = Math.round(progress) + "%";
};

loadingManager.onLoad = function () {
    console.log("All assets loaded!");
    loadingContainer.style.display = "none";
    assets_loaded = true;
};

const loadModel = async () => {
    const controller = new AbortController();
    const timeoutMs = 2000;

    const timeout = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    const t0 = performance.now();

    try {
        const response = await fetch(highQualityUrl, { signal: controller.signal });
        const blob = await response.blob();
        const t1 = performance.now();
        clearTimeout(timeout);

        console.log(`High quality model loaded in ${(t1 - t0).toFixed(2)} ms`);

        await loadIntoThreeJS(blob, 0);

    } catch (err) {
        console.warn('High quality load failed or timed out. Loading fallback.');

        const t2 = performance.now();

        const lowQualityResponse = await fetch(lowQualityUrl);
        const lowQualityBlob = await lowQualityResponse.blob();
        const t3 = performance.now();

        console.log(`Low quality model loaded in ${(t3 - t2).toFixed(2)} ms`);
        await loadIntoThreeJS(lowQualityBlob, 1);

    }
}

async function loadIntoThreeJS(blob, modelType) {
    const url = URL.createObjectURL(blob);
    const { GLTFLoader } = await import("three/addons");
    const loader = new GLTFLoader(loadingManager);
    loader.load(url, function (gltf) {
        if (modelType === 0) {
            guitarGroup = gltf.scene;
            guitarGroup.scale.set(15, 15, 15);
            guitarGroup.position.set(0, 1, 0);
            guitarGroup.name = "guitar";

            scene.add(guitarGroup);

            console.log("Added successfully");
        } else {
            guitarGroup = gltf.scene;
            guitarGroup.scale.set(2.5, 2.5, 2.5);
            guitarGroup.name = "guitar";

            scene.add(guitarGroup);

            console.log("Added successfully");
        }
    }, undefined, function ( error ) {
        console.error( error );
    });
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( '#F2E9DC' );

    const canvas = document.querySelector( '#c' );
    renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.set( 0, 5, 20 );

    // Light
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.AmbientLight( color, intensity );
    scene.add( light );

    // Directional Light
    const color2 = 0xFFFFFF;
    const intensity2 = 1;
    const light2 = new THREE.DirectionalLight(color2, intensity2);
    light2.position.set(2, 0, 20);
    light2.target.position.set(-2, 10, -10);
    scene.add(light2);
    scene.add(light2.target);

    //Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set( 0, 5, 0 );
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}

async function index() {
    init();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    await loadModel();

    animate();
}

