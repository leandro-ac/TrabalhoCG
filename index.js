import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,
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

let size = {
  x: planeX/10,
  y: 1,
  z: 1,
}

// TOP BORDER
let brickGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);

for(let i = 0; i < 10; i++){
  let brick = new THREE.Mesh(brickGeometry, material);
  brick.position.set(-planeX/2 + i*size.x + size.x/2,
                     size.y/2,
                    -planeZ/2 + size.z/2);
  scene.add(brick);
}

// SIDE BORDERS
brickGeometry = new THREE.BoxGeometry(size.z, size.y, size.x);

for(let i = 0; i < 20; i++){
  let leftWall = new THREE.Mesh(brickGeometry, material);
  let rightWall = new THREE.Mesh(brickGeometry, material);
  // position the brick
  leftWall.position.set(-planeX/2 , size.y/2 , -planeZ/2 + i*size.x + size.x/2);
  rightWall.position.set(planeX/2 , size.y/2 , -planeZ/2 + i*size.x + size.x/2);

  scene.add(leftWall);
  scene.add(rightWall);
}

// BRICKS
let bricksX = (planeX-size.y)/10;
brickGeometry = new THREE.BoxGeometry(bricksX, size.y, size.x);
const edges = new THREE.EdgesGeometry(brickGeometry); 

for(let i = 0; i < 5; i++){
  for(let j = 0; j < 10; j++){
    let brick = new THREE.Mesh(brickGeometry, material);
    brick.position.set(j*bricksX - planeX/2 + bricksX/2 + size.z/2, 
                      size.y/2,
                      i*size.y -planeZ/4);
    scene.add(brick);
    // add brick border
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffff})); 
    line.position.set(j*bricksX - planeX/2 + bricksX/2 + size.z/2, 
                      size.y/2,
                      i*size.y -planeZ/4);
    scene.add(line);
  }
}

// PLAYER
let player = {
  segments: 5,
  x: 1,
  y: 1,
  z: 1
}

brickGeometry = new THREE.BoxGeometry(player.x, player.y, player.z);
let playerSegment = new Array(player.segments);

for(let i = 0; i < player.segments; i++){
  playerSegment[i] = new THREE.Mesh(brickGeometry, material);
  playerSegment[i].position.set(-2*player.x + i*player.x , player.y/2  , planeZ/2 - size.y - 3);
  scene.add(playerSegment[i]);
}

//create sphere
let sphereGeometry = new THREE.SphereGeometry(0.25, 16, 32);
let sphere = new THREE.Mesh(sphereGeometry, material);
sphere.position.set(0.0,0.2,14.25);

scene.add(sphere);

window.addEventListener('mousemove', onMouseMove);
let leftBox = new SecondaryBox("");
leftBox.changeMessage("Intersection on Layer ");
// -- Create raycaster
let raycaster = new THREE.Raycaster();

// Enable layers to raycaster and camera (layer 0 is enabled by default)
raycaster.layers.enable( 0 );
camera.layers.enable( 0 );

let raycasterPlane = createGroundPlaneXZ(planeX, planeZ);
raycasterPlane.layers.set(0);
scene.add(raycasterPlane);

function onMouseMove(event) 
{
  console.log("teste")
   let pointer = new THREE.Vector2();
   pointer.x =  (event.clientX / window.innerWidth) * 2 - 1;
   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

   raycaster.setFromCamera(pointer, camera);
   // calculate objects intersecting the picking ray
   let intersects = raycaster.intersectObject(raycasterPlane)
   // -- Find the selected objects ------------------------------
   if (intersects.length > 0) // Check if there is a intersection
   {      
      for(let i = 0; i < player.segments; i++){
        playerSegment[i].position.x += event.movementX/10;
      }
      let point = intersects[0].point; // Pick the point where interception occurrs
      showInterceptionCoords(point);
   }
};


function showInterceptionCoords(point)
{
   leftBox.changeMessage("Intersection on Layer " + "  [" +  
       point.x.toFixed(2) + ", " +
       point.y.toFixed(2) + ", " + 
       point.z.toFixed(2) + "]"); 
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