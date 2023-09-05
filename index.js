import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
// camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

let orthoSize = 20; // Estimated size for orthographic projection
let w = window.innerWidth;
let h = window.innerHeight;
let aspect = w / h;
let near = 0.1;
let far = 1000;
let fov = 40;
let position = new THREE.Vector3(0,  50, 0);
let lookat   = new THREE.Vector3(0,  0,  0);
let up       = new THREE.Vector3(0,  1,  0);
let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
                                                orthoSize / 2, -orthoSize / 2,                  // top, bottom
                                                near, far);         
camera.position.copy(position);
camera.up.copy(up);
camera.lookAt(lookat); // or camera.lookAt(0, 0, 0);                    
scene.add( camera );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let planeX = 20;
let planeZ = 40;
let plane = createGroundPlaneXZ(planeX, planeZ)
scene.add(plane);


let cubeGeometry = new THREE.BoxGeometry(2, 1, 1);

for(let i = 0; i < planeX/2; i++){
  let cube = new THREE.Mesh(cubeGeometry, material);
  // position the cube
  cube.position.set(-planeX/2 + i * 2 + 1, 0.5, -planeZ/2);

  scene.add(cube);
}
cubeGeometry = new THREE.BoxGeometry(1, 1, 2);

for(let i = 0; i < planeZ/2; i++){
  let leftWall = new THREE.Mesh(cubeGeometry, material);
  let rightWall = new THREE.Mesh(cubeGeometry, material);
  // position the cube
  leftWall.position.set(-planeX/2, 0.5, -planeZ/2 + i * 2 +1);
  rightWall.position.set(planeX/2, 0.5, -planeZ/2 + i * 2 +1);

  scene.add(leftWall);
  scene.add(rightWall);
}

cubeGeometry = new THREE.BoxGeometry(2, 1, 1);

for(let i = 0; i < planeX/4; i++){
    for(let j = 0; j < planeZ/6; j++){
        let cube = new THREE.Mesh(cubeGeometry, material);

        // position the cube
        cube.position.set(j*2 + j*0.2 - planeX/3, 0.5, i*2 +i*0.2 + - planeZ/4);

        // add the cube to the scene
        scene.add(cube);
    }
}

cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

for(let i = 0; i < 5; i++){
  let player = new THREE.Mesh(cubeGeometry, material);
  player.position.set(-2 + i * 1, 0.5, planeZ/2 - 5);
  scene.add(player);
}



// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}