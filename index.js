import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// Create the ground plane
let planeX = 20;
let planeZ = planeX*2;
let planeColor = "rgb(234, 219, 200)";

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
export let camera = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
                                                orthoSize / 2 , -orthoSize / 2,                  // top, bottom
                                                near, far);              
camera.position.copy(position);
camera.up.copy(up);
camera.lookAt(lookat);
scene.add( camera );
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

let bricksAmount = 10;
const borderColor = "#FF3FA4";
const color ="";
let size = {
    x: planeX/bricksAmount,
    y: 1,
    z: planeZ/30,
    material: new THREE.MeshLambertMaterial({color: "#4EF037"}),
    borderMaterial: new THREE.MeshLambertMaterial({color: borderColor})
}

// TOP BORDER
let brickGeometry = new THREE.BoxGeometry(planeX - size.z, size.y, size.z);

let topWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
    normal: new THREE.Vector3(0.0, 0.0, 1.0)
}
topWall.object.position.set(0, size.y/2, -planeZ/2 + size.z/2);
topWall.bb.setFromObject(topWall.object);

// SIDE BORDERS
brickGeometry = new THREE.BoxGeometry(size.z, size.y, planeZ);

let leftWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
    normal: new THREE.Vector3(1.0, 0.0, 0.0)
}
leftWall.object.position.set(-planeX/2, size.y/2, 0)
leftWall.bb.setFromObject(leftWall.object);

let rightWall = {
    object: new THREE.Mesh(brickGeometry, size.borderMaterial),
    bb: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()),
    normal: new THREE.Vector3(-1.0, 0.0, 0.0)
}
rightWall.object.position.set(planeX/2, size.y/2, 0)
rightWall.bb.setFromObject(rightWall.object);

scene.add(topWall.object, leftWall.object, rightWall.object);

// BRICKS
let bricksX = (planeX-size.z)/10;
let bricksOffset = - planeX/2 + bricksX/2 + size.z/2;
let bricks = new Array(5);
brickGeometry = new THREE.BoxGeometry(bricksX - 0.1, size.y, size.z - 0.1);
let edges = new THREE.EdgesGeometry(brickGeometry); 

for(let i = 0; i < 5; i++){
    bricks[i] = new Array(10);
    for(let j = 0; j < 10; j++){
        bricks[i][j] = {};
        let brick = new THREE.Mesh(brickGeometry, size.material);
        brick.position.set(j*bricksX + bricksOffset,    size.y/2,   i*size.z -planeZ/4);
        // add brick border
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: "#38E54D"})); 
        line.position.copy(brick.position);
        scene.add(brick, line);
        //line.visible = false;

        bricks[i][j].object = brick;
        bricks[i][j].line = line;
        bricks[i][j].bb = new Array(9);
        createBrickBoundingBoxes(bricks[i][j].bb, bricks[i][j].object);
    }
}

function createBrickBoundingBoxes(brickBB, object){
    let cornerSize = 0.2;
    let geometry = new THREE.BoxGeometry((bricksX - 0.2 - cornerSize*2), size.y, cornerSize);
    let auxBrick = new THREE.Mesh(geometry, size.material);
    
    let auxBrick2 = new THREE.Mesh(geometry, size.material);
    auxBrick.position.set(object.position.x, object.position.y, object.position.z + size.z/2 - 0.1);
    let topBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick2.position.set(object.position.x, object.position.y, object.position.z - size.z/2 + 0.1);
    let bottomBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick2);


    let geometry2 = new THREE.BoxGeometry(cornerSize, size.y, size.z - 0.1 - cornerSize*2);
    let auxBrick3 = new THREE.Mesh(geometry2, size.material);
    let auxBrick4 = new THREE.Mesh(geometry2, size.material);
    auxBrick3.position.set(object.position.x - size.x/2 + size.x/10, object.position.y, object.position.z);
    auxBrick4.position.set(object.position.x + size.x/2 - size.x/10, object.position.y, object.position.z);
    let leftBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick3);
    let rightBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick4);

    let geometry3 = new THREE.BoxGeometry(cornerSize, size.y, cornerSize);
    let auxBrick5 = new THREE.Mesh(geometry3, size.material);
    let auxBrick6 = new THREE.Mesh(geometry3, material);
    let auxBrick7 = new THREE.Mesh(geometry3, size.material);
    let auxBrick8 = new THREE.Mesh(geometry3, material);
    auxBrick5.position.set(object.position.x - size.x/2 + size.x/10, object.position.y, object.position.z - size.z/2 + 0.1);
    auxBrick6.position.set(object.position.x + size.x/2 - size.x/10, object.position.y, object.position.z - size.z/2 + 0.1);
    auxBrick7.position.set(object.position.x - size.x/2 + size.x/10, object.position.y, object.position.z + size.z/2 - 0.1);
    auxBrick8.position.set(object.position.x + size.x/2 - size.x/10, object.position.y, object.position.z + size.z/2 - 0.1);
    let topLeftCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick5);
    let topRightCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick6);
    let bottomLeftCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick7);
    let bottomRightCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick8);


    brickBB[0] = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(object);
    brickBB[1] = topBB;
    brickBB[2] = bottomBB;
    brickBB[3] = leftBB;
    brickBB[4] = rightBB;
    brickBB[5] = topLeftCorner;
    brickBB[6] = topRightCorner;
    brickBB[7] = bottomLeftCorner;
    brickBB[8] = bottomRightCorner;

    //object.visible = false
    //scene.add(auxBrick, auxBrick2, auxBrick3, auxBrick4, auxBrick5, auxBrick6, auxBrick7, auxBrick8);
}

// PLAYER
let player = {
    segments: 5, // odd and > 5
    x: size.x/2,
    y: size.y,
    z: size.z/3 + planeX/100,
}
player.center = parseInt(player.segments/2);
brickGeometry = new THREE.BoxGeometry(player.x, player.y, player.z);
player.edges = new THREE.EdgesGeometry(brickGeometry);

let playerSegments = new Array(player.segments);
const initialPositions = [];

for(let i = 0; i < player.segments; i++){
    playerSegments[i] = {};
    playerSegments[i].object = new THREE.Mesh(brickGeometry, new THREE.LineBasicMaterial({color: "#555"}));
    playerSegments[i].object.position.set(-player.center*player.x + i*player.x   ,  player.y/2   , planeZ/2 - size.z);

    playerSegments[i].bb = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(playerSegments[i].object);
    playerSegments[i].angle = Math.PI - (Math.PI/(player.segments + 1)*(i + 1));
    playerSegments[i].line = new THREE.LineSegments(player.edges, new THREE.LineBasicMaterial({color: "#111"})); 
    playerSegments[i].line.position.copy(playerSegments[i].object.position);
    
    scene.add(playerSegments[i].object, playerSegments[i].line);
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
scene.add(raycasterPlane);

const LEFT_OFFSET = -planeX/2 + player.x/2 + size.z/2; // RIGHT_OFFSET = -LEFT_OFFSET
const LEFT_LIMIT = -planeX/2 + size.z/2; // RIGHT_LIMIT = -LEFT_LIMIT
const PLAYER_LEFT_END = -player.center * player.x - player.x/2; // PLAYER_RIGHT_END = -PLAYER_LEFT_END
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

        if (point.x + PLAYER_LEFT_END < (LEFT_LIMIT)){
            for (let i = 0; i < player.segments; i++){
                playerSegments[i].object.position.x = i * player.x + LEFT_OFFSET;
                playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
                playerSegments[i].line.position.copy(playerSegments[i].object.position);
            }
        } else if (point.x - PLAYER_LEFT_END > (-LEFT_LIMIT)){
            for (let i = 0; i < player.segments; i++){
                let index = player.segments-1-i;
                playerSegments[index].object.position.x = -i * player.x - LEFT_OFFSET;
                playerSegments[index].bb.copy(playerSegments[index].object.geometry.boundingBox).applyMatrix4(playerSegments[index].object.matrixWorld);
                playerSegments[index].line.position.copy(playerSegments[index].object.position);
            }
        } else {
            for (let i = 0; i < player.segments; i++){
                playerSegments[i].object.position.x = point.x + ((i - player.center) * player.x);
                playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
                playerSegments[i].line.position.copy(playerSegments[i].object.position);
            }
        }

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

// Create ball
export let ball = {
    radius: player.z/3,
    object: null,
    bb: null,
    dx: Math.cos(playerSegments[player.center+1].angle)*planeX/100,
    dz: -Math.sin(playerSegments[player.center+1].angle)*planeZ/200,
    move: false
}

let sphereGeometry = new THREE.SphereGeometry(ball.radius);
ball.object = new THREE.Mesh(sphereGeometry, material);
ball.object.position.copy(playerSegments[player.center + 1].object.position); // Initial position
ball.object.translateZ(-player.z);
initialPositions.push(new THREE.Vector3().copy(ball.object.position));
ball.bb = new THREE.Sphere(ball.object.position, ball.radius)
scene.add(ball.object);

let bricksDestroyed = 0;
let anteriorHit = null;
function checkCollisions() {
    if (ball.bb.intersectsBox(topWall.bb)){
        ball.dz = -ball.dz;
    }
    if (ball.bb.intersectsBox(leftWall.bb)){
        ball.dx = -ball.dx;
    }
    if (ball.bb.intersectsBox(rightWall.bb)){
        ball.dx = -ball.dx;
    }

    playerSegments.some((segment, index) => {
        if (ball.bb.intersectsBox(segment.bb)){
            ball.dx = Math.cos(playerSegments[index].angle)*planeX/100;
            ball.dz = -Math.sin(playerSegments[index].angle)*planeZ/200;
            return true;
        } 
    });

    for (let i = 0; i < 5; i++){
        for (let j = 0; j < 10; j++){
            if (bricks[i][j].bb && bricks[i][j].bb != anteriorHit && ball.bb.intersectsBox(bricks[i][j].bb[0])){
                anteriorHit = bricks[i][j].bb;
                if (ball.bb.intersectsBox(bricks[i][j].bb[1])){
                    ball.dz = Math.abs(ball.dz);
                    console.log("baixo");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[2])){
                    ball.dz = ball.dz > 0 ? -ball.dz : ball.dz;
                    console.log("cima");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[3])){
                    ball.dx = ball.dx > 0 ? -ball.dx : ball.dx;
                    console.log("esquerda");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[4])){
                    ball.dx = Math.abs(ball.dx);
                    console.log("direita");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[5])){ // Corners
                    ball.dx = -Math.abs(ball.dx);
                    ball.dz = -Math.abs(ball.dz);
                    console.log("top left");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[6])){
                    ball.dx = Math.abs(ball.dx);
                    ball.dz = -Math.abs(ball.dz);
                    console.log("top right");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[7])){
                    ball.dx = -Math.abs(ball.dx);
                    ball.dz = Math.abs(ball.dz);
                    console.log("bottom left");
                } else if (ball.bb.intersectsBox(bricks[i][j].bb[8])){
                    ball.dx = Math.abs(ball.dx);
                    ball.dz = Math.abs(ball.dz);
                    console.log("bottom right");
                }

                bricks[i][j].object.visible = false;
                bricks[i][j].line.visible = false;
                bricks[i][j].bb = null;
                bricksDestroyed++;
                return true;
            }
        }
    }

    if (ball.object.position.z > planeZ/2 + player.z){
        resetPosition();
    }

    
}

function moveBall(){
    ball.object.position.x += ball.dx;
    ball.object.position.z += ball.dz;
    ball.bb.center.copy(ball.object.position);
    ball.bb.radius = ball.radius;
}

render();
function render()
{
    if (ball.move){
        //end();
        moveBall();
        checkCollisions();
        moveBall();
        checkCollisions();
        if (bricksDestroyed === 50){
            end();
        }
    }
    
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}

/***** OTHERS *****/

function resetPosition(){
    for (let i = 0; i < playerSegments.length; i++){
        playerSegments[i].object.position.copy(initialPositions[i]);
        playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
        playerSegments[i].line.position.copy(playerSegments[i].object.position);
    }
    ball.object.position.copy(initialPositions[initialPositions.length - 1]);
    ball.move = false;
    ball.dx = Math.cos(playerSegments[player.center+1].angle)*planeX/100;
    ball.dz = -Math.sin(playerSegments[player.center+1].angle)*planeZ/200;

    document.removeEventListener('mousemove', onMouseMove);
    document.addEventListener('click', () => {
        document.addEventListener('mousemove', onMouseMove);
        ball.move = true;
    }, {once: true});
}

export function restart(){
    for (let i = 0; i < playerSegments.length; i++){
        playerSegments[i].object.position.copy(initialPositions[i]);
        playerSegments[i].bb.copy(playerSegments[i].object.geometry.boundingBox).applyMatrix4(playerSegments[i].object.matrixWorld);
        playerSegments[i].line.position.copy(playerSegments[i].object.position);
    }
    ball.object.position.copy(initialPositions[initialPositions.length - 1]);
    ball.move = false;
    ball.dx = Math.cos(playerSegments[player.center+1].angle)*planeX/100;
    ball.dz = -Math.sin(playerSegments[player.center+1].angle)*planeZ/200;

    document.addEventListener('click', () => {
        document.addEventListener('mousemove', onMouseMove);
        ball.move = true;
    }, {once: true});
}

function end(){
    menu.style.display = 'block';
    ball.move = false;
    document.removeEventListener('mousemove', onMouseMove);
}

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Controls");
controls.addParagraph();
controls.add("Use mouse to interact:");
controls.add("* Press left button to start");
controls.add("* Hold left button to rotate");
controls.add("* Right button to translate");
controls.add("* Scroll to zoom in/out");
controls.add("Space - pause");
controls.add("R - restart");
controls.add("Hover over the board to move the player");
controls.show();