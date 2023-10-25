import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
import { CSG } from '../libs/other/CSGMesh.js'      


let scene, renderer, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
//light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer, orthoSize)}, false );
// Moves the player
document.addEventListener('mousemove', onMouseMove);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// Create the ground plane
let planeX = 20;
let planeZ = planeX*2;
let planeColor = "rgb(0, 219, 100)";

// Camera
export let orthoSize = planeZ; // Estimated size for orthographic projection
let w = window.innerWidth;
let h = window.innerHeight;
export let aspect = w / h;
let near = 0.1;
let far = 1000;
let position = new THREE.Vector3(0,  50, 0);
let lookat   = new THREE.Vector3(0,  0,  0);
let up       = new THREE.Vector3(0,  1,  0);

/*export let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
                                                orthoSize / 2 , -orthoSize / 2,                  // top, bottom
                                                near, far); */
                                                       
const camera = new THREE.PerspectiveCamera (45, w / h, near, far);

camera.position.copy(position);
camera.up.copy(up);
camera.lookAt(lookat);
scene.add( camera );
orbit = new OrbitControls( camera, renderer.domElement );

// LIGHT
let dirLight = new THREE.DirectionalLight( 0xffffff , 0.4 );
    dirLight.position.copy(camera.position);
    dirLight.translateZ(-7)
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 256;
    dirLight.shadow.mapSize.height = 256;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = camera.position.y * 1.1
    dirLight.shadow.camera.left = -planeX/2;
    dirLight.shadow.camera.right = planeX/2
    dirLight.shadow.camera.bottom = -planeZ/2
    dirLight.shadow.camera.top = planeZ/2;

let ambientLight = new THREE.AmbientLight( 0xffffff, 0.35);

scene.add(dirLight, ambientLight);

let bricksAmount = 10;
let rowsAmount = 6;
const borderColor = "#FF3FA4";
const colors = ["bcbcbc", "d82800", "0070ec", "fc9838", "fc74B4", "80d010"];
let size = {
    x: planeX/bricksAmount,
    y: planeX/20,
    z: planeZ/40,
    positionY: 1.5,
    material: colors.map(color => new THREE.MeshLambertMaterial({color: "#" + color})),
    borderMaterial: new THREE.MeshLambertMaterial({color: borderColor})
}

// TOP BORDER
let brickGeometry = new THREE.BoxGeometry(planeX - size.z, size.y, size.z);

let topWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
}
topWall.object.position.set(0, size.positionY, -planeZ/2 + size.z/2);
topWall.bb.setFromObject(topWall.object);
topWall.object.castShadow = true;

// SIDE BORDERS
brickGeometry = new THREE.BoxGeometry(size.z, size.y , planeZ);

let leftWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
}
leftWall.object.position.set(-planeX/2, size.positionY, 0)
leftWall.bb.setFromObject(leftWall.object);
leftWall.object.castShadow = true;

let rightWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
}
rightWall.object.position.set(planeX/2, size.positionY, 0)
rightWall.bb.setFromObject(rightWall.object);
rightWall.object.castShadow = true;

scene.add(topWall.object, leftWall.object, rightWall.object);

// PLAYER
let player = {
    segments: 5, // odd and > 5
    x: size.x/2,
    y: size.y,
    z: size.z/3 + planeX/100
}

let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(planeX/2, planeX/2, planeX/2))
    cubeMesh.position.set(0, 0, 1);
    cubeMesh.matrixAutoUpdate = false;
    cubeMesh.updateMatrix();
    
let sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(planeX/4,36,36))

let sphereCSG = CSG.fromMesh(sphereMesh);
let cubeCSG = CSG.fromMesh(cubeMesh);
let csgObject = sphereCSG.subtract(cubeCSG);
    cubeMesh.position.set(0, planeX/4 + size.y/2, 0);
    cubeMesh.updateMatrix();
    cubeCSG = CSG.fromMesh(cubeMesh);
    csgObject = csgObject.subtract(cubeCSG);
    cubeMesh.position.set(0, -(planeX/4 + size.y/2), 0);
    cubeMesh.updateMatrix();
    cubeCSG = CSG.fromMesh(cubeMesh);
    csgObject = csgObject.subtract(cubeCSG);
let csgFinal = CSG.toMesh(csgObject, new THREE.Matrix4());
    csgFinal.material = new THREE.MeshPhongMaterial({color: 'red'});
    csgFinal.position.set(0, size.positionY, sphereMesh.geometry.parameters.radius)
    
scene.add(csgFinal);
console.log("🚀 ~ file: rebatedor.js:152 ~ csgFinal:", csgFinal)

//scene.add(ellipse);
player.center = parseInt(player.segments/2);
brickGeometry = new THREE.BoxGeometry(player.x, player.y, player.z);
player.edges = new THREE.EdgesGeometry(brickGeometry);

let playerSegments = new Array(player.segments);
const initialPositions = [];

for(let i = 0; i < player.segments; i++){
    playerSegments[i] = {};
    playerSegments[i].object = new THREE.Mesh(brickGeometry, new THREE.LineBasicMaterial({color: "#555"}));
    playerSegments[i].object.position.set(-player.center*player.x + i*player.x   ,  size.positionY   , planeZ/2 - size.z);
    playerSegments[i].object.castShadow = true;

    playerSegments[i].bb = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(playerSegments[i].object);
    playerSegments[i].angle = Math.PI - (Math.PI/(player.segments + 1)*(i + 1));
    playerSegments[i].line = new THREE.LineSegments(player.edges, new THREE.LineBasicMaterial({color: "#111"})); 
    playerSegments[i].line.position.copy(playerSegments[i].object.position);
    
    //scene.add(playerSegments[i].object, playerSegments[i].line);
    initialPositions.push(new THREE.Vector3().copy(playerSegments[i].object.position));
}

// Raycaster
let leftBox = new SecondaryBox("");
leftBox.changeMessage("Intersection on Layer ");
let raycaster = new THREE.Raycaster();

// Enable layers to raycaster and camera (layer 0 is enabled by default)
raycaster.layers.enable( 0 );
camera.layers.enable( 0 );

let raycasterPlane = createGroundPlaneXZ(planeX, planeZ, 10, 10, planeColor);
raycasterPlane.layers.set(0);
raycasterPlane.receiveShadow = true;
scene.add(raycasterPlane);

const LEFT_OFFSET = -planeX/2 + player.x/2 + size.z/2; // RIGHT_OFFSET = -LEFT_OFFSET
const LEFT_OFFSET2 = -planeX/2 + size.z/2 + csgFinal.geometry.boundingBox.max.x;
const RIGHT_OFFSET2 = + planeX/2 - size.z/2 + csgFinal.geometry.boundingBox.min.x
const LEFT_LIMIT = -planeX/2 + size.z/2; // RIGHT_LIMIT = -LEFT_LIMIT
const PLAYER_LEFT_END = -player.center * player.x - player.x/2; // PLAYER_RIGHT_END = -PLAYER_LEFT_END
// let geometry2 = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-2.9714701175689697, 0, -2), new THREE.Vector3(2.971470355987549, 0, -2) ] );
// let center2 = new THREE.Line( geometry2);
//     scene.add(center2);
export function onMouseMove(event) 
{
    let pointer = new THREE.Vector2();
    pointer.x =  (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    // Calculate plane intersecting the picking ray
    let intersects = raycaster.intersectObject(raycasterPlane);
    // Check if there is a intersection
    if (intersects.length > 0) {      
        let point = intersects[0].point; // Pick the point where interception occurrs

        if (point.x + csgFinal.geometry.boundingBox.min.x < LEFT_LIMIT){ // leftWall
            csgFinal.position.x = LEFT_OFFSET2;
            for (let i = 0; i < player.segments; i++){
                playerSegments[i].object.position.x = i * player.x + LEFT_OFFSET;
                playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
                playerSegments[i].line.position.copy(playerSegments[i].object.position);
            }
        } else if (point.x + csgFinal.geometry.boundingBox.max.x > -LEFT_LIMIT){ //rightWall
            csgFinal.position.x = RIGHT_OFFSET2;
            for (let i = 0; i < player.segments; i++){
                let index = player.segments-1-i;
                playerSegments[index].object.position.x = -i * player.x - LEFT_OFFSET;
                playerSegments[index].bb.copy(playerSegments[index].object.geometry.boundingBox).applyMatrix4(playerSegments[index].object.matrixWorld);
                playerSegments[index].line.position.copy(playerSegments[index].object.position);
            }
        } else {
            csgFinal.position.x = point.x
            for (let i = 0; i < player.segments; i++){
                playerSegments[i].object.position.x = point.x + ((i - player.center) * player.x);
                playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
                playerSegments[i].line.position.copy(playerSegments[i].object.position);
            }
        }
        //csgFinal.geometry.boundingBox.applyMatrix4(csgFinal.matrixWorld)
        //console.log("🚀 ~ file: rebatedor.js:231 ~ csgFinal:", csgFinal)


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

render();
function render()
{ 
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}

/***** OTHERS *****/

export const menu = document.getElementById('menu');

function resetPosition(){
    for (let i = 0; i < playerSegments.length; i++){
        playerSegments[i].object.position.copy(initialPositions[i]);
        playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
        playerSegments[i].line.position.copy(playerSegments[i].object.position);
    }

    document.addEventListener('click', () => {
        menu.style.display = 'none';
        document.addEventListener('mousemove', onMouseMove);
    }, {once: true});
}

export function restart(){
    resetPosition();
    menu.querySelector("h1").innerText = 'Jogo pausado';
}

export function pause(pause){
    if (pause){
        menu.style.display = 'block';
        document.removeEventListener('mousemove', onMouseMove);
    } else { // unpause
        menu.style.display = 'none';
        document.addEventListener('mousemove', onMouseMove);
    }
}

function end(){
    pause(true);
    menu.querySelector("h1").innerText = 'Você venceu!';
}

// Show information onscreen
let controls = new InfoBox();
controls.add("Controls");
controls.addParagraph();
controls.add("Use mouse to interact:");
controls.add("* Press left button to start");
controls.add("* Hold left button to rotate");
controls.add("* Right button to translate");
controls.add("* Scroll to zoom in/out");
controls.add("Hover over the board to move the player");
controls.show();

/***** Utilities *****/ 

const BALL_INFERIOR_LIMIT = planeZ/2 - csgFinal.geometry.boundingSphere.   radius;
const BALL_SIDE_LIMIT = leftWall.object.position.x + size.x;
let visible = true;
let inferiorLimit;
let center;
let superiorLimit;
let leftWallLimit;
let rightWallLimit;

document.addEventListener('keydown', (e) => {
    if (e.key === 'l' || e.key === 'L'){
        showLimits(visible)
    }
})

function viewLimits(){    
    let lineColor = new THREE.LineBasicMaterial({color: "#FFF"});

    let geometry = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-planeX/2, 0, BALL_INFERIOR_LIMIT), new THREE.Vector3(planeX/2, 0, BALL_INFERIOR_LIMIT) ] );
    inferiorLimit = new THREE.Line( geometry , lineColor );
    scene.add(inferiorLimit);
    let geometry3 = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-planeX/2, 0, -BALL_INFERIOR_LIMIT), new THREE.Vector3(planeX/2, 0, -BALL_INFERIOR_LIMIT) ] );
    superiorLimit = new THREE.Line( geometry3 , lineColor );
    scene.add(superiorLimit);
    let geometry4 = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(BALL_SIDE_LIMIT, 0, planeZ/2), new THREE.Vector3(BALL_SIDE_LIMIT, 0, -planeZ/2) ] );
    leftWallLimit = new THREE.Line( geometry4 , lineColor );
    scene.add(leftWallLimit);
    let geometry5 = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-BALL_SIDE_LIMIT, 0, planeZ/2), new THREE.Vector3(-BALL_SIDE_LIMIT, 0, -planeZ/2) ] );
    rightWallLimit = new THREE.Line( geometry5 , lineColor );
    scene.add(rightWallLimit);
}

function showLimits(){
    if (!inferiorLimit){
        viewLimits();
    }
    inferiorLimit.visible = visible;
    superiorLimit.visible = visible;
    leftWallLimit.visible = visible;
    rightWallLimit.visible = visible;
    visible = !visible;
}