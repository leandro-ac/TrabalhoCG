import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
import { MeshPhongMaterial } from '../build/three.module.js';
import { CSG } from '../libs/other/CSGMesh.js'
import { RGBELoader } from '../build/jsm/loaders/RGBELoader.js';

let scene, renderer, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer, orthoSize)}, false );

document.addEventListener('mousemove', onMouseMove);
// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
//scene.add( axesHelper );

// Create the ground plane
let planeX = 20;
let planeZ = planeX*2;
let planeColor = "rgb(0, 219, 100)";

// Background

const skybox = new THREE.TextureLoader();
let textureEquirec = skybox.load('../assets/textures/brown_photostudio_02_4k.jpg');
textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
scene.background = textureEquirec;

// renderer.outputEncoding = THREE.SRGBColorSpace;
// renderer.toneMapping = THREE.ACESFilmicToneMapping;
// renderer.toneMappingExposure = 2.5;

// const loader = new RGBELoader();
// loader.load('../assets/textures/cannon_4k.hdr', (texture) => {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//     texture.exposure = 2
//     scene.background = texture;
// });




// Camera
export let orthoSize = planeZ; // Estimated size for orthographic projection
let w = window.innerWidth;
let h = window.innerHeight;
export let aspect = w / h;
let near = 0.1;
let far = 1000;
let position = new THREE.Vector3(0, 35, 25);
let lookat   = new THREE.Vector3(0, 0, 4);
let up       = new THREE.Vector3(0, 1, 0);

const camera = new THREE.PerspectiveCamera (45, w / h, near, far);
    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(lookat);
scene.add( camera );
orbit = new OrbitControls( camera, renderer.domElement );
orbit.target = new THREE.Vector3(0, 0, 4);
orbit.update();

// LIGHT
let dirLight = new THREE.DirectionalLight( 0xffffff , 0.4 ); //0.15
    dirLight.position.set( 0, 20, -7 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 256;
    dirLight.shadow.mapSize.height = 256;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 20 * 2;
    dirLight.shadow.camera.left = -planeX/2;
    dirLight.shadow.camera.right = planeX/2
    dirLight.shadow.camera.bottom = -planeZ/2
    dirLight.shadow.camera.top = planeZ/2;

let ambientLight = new THREE.AmbientLight( 0xffffff, 0.35); // 0.1

scene.add(dirLight, ambientLight);

let bricksAmount = 11;
let rowsAmount = 6;
let level = 0;
const borderColor = "#FF3FA4";
let colors = ["bcbcbc", "d82800", "0070ec", "fc9838", "fc74B4", "80d010"];
let size = {
    x: planeX/bricksAmount,
    y: planeX/20,
    z: planeZ/40,
    positionY: 1,
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

// BRICKS
let bricksX = (planeX-size.z)/(bricksAmount);
let bricksOffset = - planeX/2 + bricksX/2 + size.z/2;
let bricks = new Array(rowsAmount);
brickGeometry = new THREE.BoxGeometry(bricksX - 0.1, size.y, size.z - 0.1);
let bricksLeft = 0;
const textureLoader = new THREE.TextureLoader();
const cementTexture = textureLoader.load('../assets/textures/porcelanatoC.png');

createLevel(level);

function createBrickBoundingBoxes(brickBB, object){
    // Create nine bounding box using auxBrick which is an auxiliar mesh that helps with the positioning
    let cornerSize = 0.2;
    let geometry = new THREE.BoxGeometry((bricksX - 0.2 - cornerSize*2), size.y, cornerSize);
    let auxBrick = new THREE.Mesh(geometry, size.material[0]);

    auxBrick.position.set(object.position.x, object.position.y, object.position.z + size.z/2 - 0.1);
    let topBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick.position.set(object.position.x, object.position.y, object.position.z - size.z/2 + 0.1);
    let bottomBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);

    let sideGeometry = new THREE.BoxGeometry(cornerSize, size.y, size.z - 0.1 - cornerSize*2);
    auxBrick.geometry = sideGeometry;

    auxBrick.position.set(object.position.x - size.x/2 + size.x/bricksAmount, object.position.y, object.position.z);
    let leftBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick.position.set(object.position.x + size.x/2 - size.x/bricksAmount, object.position.y, object.position.z);
    let rightBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);

    let cornerGeometry = new THREE.BoxGeometry(cornerSize, size.y, cornerSize);
    auxBrick.geometry = cornerGeometry;

    auxBrick.position.set(object.position.x - size.x/2 + size.x/bricksAmount, object.position.y, object.position.z - size.z/2 + 0.1);
    let topLeftCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick.position.set(object.position.x + size.x/2 - size.x/bricksAmount, object.position.y, object.position.z - size.z/2 + 0.1);
    let topRightCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick.position.set(object.position.x - size.x/2 + size.x/bricksAmount, object.position.y, object.position.z + size.z/2 - 0.1);
    let bottomLeftCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);
    auxBrick.position.set(object.position.x + size.x/2 - size.x/bricksAmount, object.position.y, object.position.z + size.z/2 - 0.1);
    let bottomRightCorner = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(auxBrick);

    brickBB[0] = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(object);
    brickBB[1] = topBB;
    brickBB[2] = bottomBB;
    brickBB[3] = leftBB;
    brickBB[4] = rightBB;
    brickBB[5] = topLeftCorner;
    brickBB[6] = topRightCorner;
    brickBB[7] = bottomLeftCorner;
    brickBB[8] = bottomRightCorner;
}

// PLAYER
let player = {
    segments: 5, // odd and > 5
    x: size.x/2,
    y: size.y,
    z: size.z/3 + planeX/100,
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
    csgFinal.position.set(0, size.positionY, planeZ/2 + csgFinal.geometry.boundingSphere.radius)
    csgFinal.bb = new THREE.Sphere(sphereMesh.geometry.position, planeX/4)
    csgFinal.castShadow = true;
    csgFinal.s
scene.add(csgFinal);

const playerLength = (csgFinal.geometry.boundingBox.max.x - csgFinal.geometry.boundingBox.min.x).toFixed(2);

//brickGeometry = new THREE.BoxGeometry(player.x, player.y, player.z);

const initialPositions = [];
initialPositions.push(new THREE.Vector3().copy(csgFinal.position));
const playerAngles = new Array(9) // Seven angles for hit against player

for (let i = 0; i < playerAngles.length; i++){
    playerAngles[i] = {};
    // Activation region, 0 <= ball.x < x, x <= ball.x < 2x ...
    playerAngles[i].x = (playerLength/playerAngles.length)*(i + 1)
    playerAngles[i].value = Math.PI - (Math.PI/(playerAngles.length + 1)*(i + 1));
    playerAngles[i].normal = new THREE.Vector3(Math.cos(playerAngles[i].value), 0, -Math.sin(playerAngles[i].value));
}

// Raycaster
let leftBox = new SecondaryBox("");
leftBox.changeMessage("Ball speed: 1");
let raycaster = new THREE.Raycaster();

// Enable layers to raycaster and camera (layer 0 is enabled by default)
raycaster.layers.enable( 0 );
camera.layers.enable( 0 );

let raycasterPlane = createGroundPlaneXZ(planeX, planeZ, 10, 10, planeColor);
raycasterPlane.layers.set(0);
raycasterPlane.receiveShadow = true;
scene.add(raycasterPlane);

let startTime;

document.addEventListener('click', () => {
    menu.querySelector("h1").innerText = 'Jogo pausado';
    document.addEventListener('mousemove', onMouseMove);
    ball.move = true;
    startTime = Date.now();
}, {once: true});


const LEFT_LIMIT = -planeX/2 + size.z/2; // RIGHT_LIMIT = -LEFT_LIMIT
const LEFT_OFFSET = -planeX/2 + size.z/2 + csgFinal.geometry.boundingBox.max.x;
const RIGHT_OFFSET = + planeX/2 - size.z/2 + csgFinal.geometry.boundingBox.min.x
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
            csgFinal.position.x = LEFT_OFFSET;
        } else if (point.x + csgFinal.geometry.boundingBox.max.x > -LEFT_LIMIT){ //rightWall
            csgFinal.position.x = RIGHT_OFFSET;
        } else {
            csgFinal.position.x = point.x
        }
        csgFinal.bb.center.copy(csgFinal.position)

        if (!ball.move){
            ball.object.position.x = csgFinal.position.x;
            ball.bb.center.copy(ball.object.position);
        }
    }   
};

function showInterceptionCoords(){
    leftBox.changeMessage("Ball speed: " + speedMultiplier.toFixed(2)); 
}

// Create ball
let speedMultiplier = 1;
class Ball {
    constructor(radius){
        this.radius = radius;
        this.speedConstant = planeX/200;
        this.material = new THREE.MeshPhongMaterial({color : 0xffffff, shininess: 90, specular: 0x777777});
        this.object = new THREE.Mesh(new THREE.SphereGeometry(radius), this.material);
        this.bb = new THREE.Sphere(this.object.position, radius);
        this.angle = Math.PI / 2;
        this.dx = Math.cos(this.angle) * this.speedConstant;
        this.dz = -Math.sin(this.angle) * this.speedConstant;
        this.initialDx = Math.cos(this.angle) * this.speedConstant;
        this.initialDz = -Math.sin(this.angle) * this.speedConstant;
    
        this.move = false
    }
}

const angle15rad = Math.PI/12;
function splitBall(){
    let angle = new THREE.Vector2(ball.dx * 100, ball.dz * 100).angle();
    ball.dx = Math.cos(angle + angle15rad) * ball.speedConstant;
    ball.dz = Math.sin(angle + angle15rad) * ball.speedConstant;
    secondaryBall.dx = Math.cos(angle - angle15rad) * secondaryBall.speedConstant;
    secondaryBall.dz = Math.sin(angle - angle15rad) * secondaryBall.speedConstant;
}

function duplicate(){
    if (!secondaryBall.object.visible){
        secondaryBall.object.position.copy(ball.object.position);
        splitBall()
        secondaryBall.object.visible = secondaryBall.move = true;
        numBalls++;
    }
    if (!ball.object.visible){
        ball.object.position.copy(secondaryBall.object.position);
        splitBall()
        ball.object.visible = ball.move = true;
        numBalls++;
    }
}

export let ball = new Ball(player.z/2.5);
ball.object.castShadow = true;
ball.object.position.copy(csgFinal.position); // Initial position
ball.object.translateZ(-sphereMesh.geometry.parameters.radius - ball.radius);
initialPositions.push(new THREE.Vector3().copy(ball.object.position));
scene.add(ball.object);

let secondaryBall = new Ball(ball.radius);
secondaryBall.object.castShadow = true;
secondaryBall.object.visible = false;
scene.add(secondaryBall.object)
let numBalls = 1;

// Create powerUp
const powerUpGeometry = new THREE.TorusGeometry( 0.3, 0.15, 16, 100 ); 
const powerUpMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFF00,
    shininess: 100,
    specular: 0x333333
}); 
const torus = new THREE.Mesh( powerUpGeometry, powerUpMaterial );
    torus.rotateOnAxis(new THREE.Vector3( 1, 0, 0), THREE.MathUtils.degToRad(90))
    torus.visible = false;
    torus.speed = -ball.initialDz/4;
let powerUpCounter = 0;
scene.add( torus );

// Collisions detection 
const BALL_INFERIOR_LIMIT = planeZ/2 - csgFinal.geometry.boundingSphere.   radius;
const BALL_SIDE_LIMIT = leftWall.object.position.x + size.x;
let BALL_BRICK_LIMIT = bricks[rowsAmount-1][bricksAmount-1].object.position.z + size.z*2;
let angle;
import { remainingLives, decreaseLives } from './lives.js';
function checkCollisions(ball) {
    // Collision with the walls
    if (ball.object.position.z - ball.radius < -BALL_INFERIOR_LIMIT && ball.bb.intersectsBox(topWall.bb)){
        ball.dz = -ball.dz;
    }
    if (ball.object.position.x - ball.radius < BALL_SIDE_LIMIT && ball.bb.intersectsBox(leftWall.bb)){
        ball.dx = -ball.dx;
        return true;
    }
    if (ball.object.position.x + ball.radius > -BALL_SIDE_LIMIT && ball.bb.intersectsBox(rightWall.bb)){
        ball.dx = -ball.dx;
        return true;
    }

    // If ball is completely out of the bounds, reset the positions
    if (ball.object.position.z - ball.radius > planeZ/2){
        if (numBalls >= 2){
            ball.object.visible = false; ball.move = false;
            numBalls--;
        } else if (remainingLives !== 0){
            resetPosition();
            speedMultiplier = 1;
            startTime = Date.now();
            decreaseLives();
        } else {
            resetPosition();
            menu.style.display = 'block';
            menu.querySelector("h1").innerText = 'Você perdeu.';
            speedMultiplier = 1;
            startTime = Date.now();
        }
    }

    // If power up is completely out of the bounds, reset the positions
    if (torus.position.z - torus.geometry.parameters.radius > planeZ/2){
        torus.visible = false;
    }

    // Collsion with the player
    // Only verifies when the ball is near the player, otherwise it won't execute aiming optimization
    if (ball.object.position.z + ball.radius > BALL_INFERIOR_LIMIT ){
        if (ball.bb.intersectsSphere(csgFinal.bb) && ball.object.position.z + ball.radius < planeZ){
            angle = playerAngles.find(angle => {
                return ball.bb.center.x < (csgFinal.bb.center.x - playerLength/2 + angle.x)
            })
            if (angle){
                let direction = new THREE.Vector3(ball.dx * 1000, 0, ball.dz * 1000 ).normalize();
                direction.reflect(angle.normal);
                ball.dx = direction.x * ball.speedConstant;
                ball.dz = -Math.abs(direction. z) * ball.speedConstant;
            }
        }
    }
    // Collsion with the powerUp
    if (torus.visible && (torus.position.z + torus.geometry.parameters.radius > BALL_INFERIOR_LIMIT)){
        if (torus.bb.intersectsSphere(csgFinal.bb)){
            torus.visible = false;
            duplicate();
        }
    }

    // Collision with the bricks
    if (ball.object.position.z - ball.radius < BALL_BRICK_LIMIT){
        for (let i = 0; i < rowsAmount; i++){
            for (let j = 0; j < bricksAmount; j++){
                if (bricks[i][j].bb && ball.bb && ball.bb.intersectsBox(bricks[i][j].bb[0])){
                    if (ball.bb.intersectsBox(bricks[i][j].bb[1])){
                        ball.dz = Math.abs(ball.dz);
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[2])){
                        ball.dz = ball.dz > 0 ? -ball.dz : ball.dz;
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[3])){
                        ball.dx = ball.dx > 0 ? -ball.dx : ball.dx;
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[4])){
                        ball.dx = Math.abs(ball.dx);
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[5])){ // Corners
                        ball.dx = -Math.abs(ball.dx);
                        ball.dz = -Math.abs(ball.dz);
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[6])){
                        ball.dx = Math.abs(ball.dx);
                        ball.dz = -Math.abs(ball.dz);
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[7])){
                        ball.dx = -Math.abs(ball.dx);
                        ball.dz = Math.abs(ball.dz);
                    } else if (ball.bb.intersectsBox(bricks[i][j].bb[8])){
                        ball.dx = Math.abs(ball.dx);
                        ball.dz = Math.abs(ball.dz);
                    }

                    // golden bricks are indestructible 
                    if (bricks[i][j].object.material.color.getHexString() === 'ffd93c'){
                        continue;
                    }

                    // change gray bricks' color after first hit
                    // if (bricks[i][j].object.material.color.getHexString() === colors[0]){
                    if (bricks[i][j].object.material.map?.isTexture){
                        bricks[i][j].object.material.color.set("#a0a0a0");
                        bricks[i][j].object.material.map = null;
                        bricks[i][j].object.material.needsUpdate = true;
                        continue;
                    }
                    
                    bricksLeft--;
                    bricks[i][j].object.visible = false;
                    bricks[i][j].bb[0].makeEmpty();
                   
                    if (!torus.visible && numBalls == 1 && powerUpCounter++ && powerUpCounter == 2){
                        torus.position.copy(bricks[i][j].object.position);
                        torus.bb = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(torus);
                        torus.visible = true;
                        powerUpCounter = 0;
                    }
        
                    return true;
                }
            }
        }
    }
}

let currentTime;
let elapsedTime;
function moveBall(ball){
    if (speedMultiplier < 2){
        currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        speedMultiplier = 1 + (elapsedTime / 15000); // Equivalence ratio for double the velocity in 15s (15000 ms)
        showInterceptionCoords();
    } else {
        speedMultiplier = 2;
    }
    if (torus.visible){
        torus.position.z += torus.speed;
        torus.rotation.x += 0.01;
        torus.rotation.y += 0.01;
        torus.bb.min.z += torus.speed;
        torus.bb.max.z += torus.speed;
    }
   
    ball.object.position.x += ball.dx * Math.pow(speedMultiplier, 1/2);
    ball.object.position.z += ball.dz * Math.pow(speedMultiplier, 1/2);
    ball.bb.center.copy(ball.object.position);
}

render();

function render()
{
    if (ball.move || secondaryBall.move){
        for (let i = 0; i < 4; i++){
            if (ball.move){
                moveBall(ball);
                checkCollisions(ball);
            }
            if (secondaryBall.move){
                moveBall(secondaryBall);
                checkCollisions(secondaryBall);
            }
        }
        
        if (bricksLeft === 0){
            if (level == 2){
                 end() 
            } else {
                nextLevel();
            }
        }
    } 
 
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}

/***** OTHERS *****/

export const menu = document.getElementById('menu');
let visible = true;
let inferiorLimit;
let center;
let superiorLimit;
let leftWallLimit;
let rightWallLimit;

function resetPosition(){
    pause(true)
    csgFinal.position.copy(initialPositions[0]);
    csgFinal.bb.center.copy(csgFinal.position);
    ball.object.position.copy(initialPositions[initialPositions.length - 1]);
    ball.bb.center.copy(ball.object.position);
    ball.dx = Math.cos(Math.PI / 2) * ball.speedConstant;
    ball.dz = -Math.sin(Math.PI / 2) * ball.speedConstant;
    ball.object.visible = true;

    secondaryBall.object.position.copy(initialPositions[initialPositions.length - 1]);
    secondaryBall.bb.center.copy(secondaryBall.object.position);
    secondaryBall.dx = ball.dx;
    secondaryBall.dz = ball.dz;
    secondaryBall.object.visible = false;
    
    numBalls = 1;
}

export function restart(){
    for (let i = 0; i < rowsAmount; i++){
        for (let j = 0; j < bricksAmount; j++){
            if (!bricks[i][j].object) continue;
            bricks[i][j].object.visible = true;
            bricks[i][j].bb[0].copy(bricks[i][j].object.geometry.boundingBox).applyMatrix4(bricks[i][j].object.matrixWorld);
            if (bricks[i][j].object.material.color.getHexString() === "a0a0a0"){
                bricks[i][j].object.material.color.set("#bcbcbc");
                bricks[i][j].object.material.map = cementTexture;
                bricks[i][j].object.material.map.minFilter = THREE.LinearFilter;
                bricks[i][j].object.material.map.magFilter = THREE.NearestFilter;
                bricks[i][j].object.material.needsUpdate = true;
            }
        }
    }
    resetPosition();
    bricksLeft = rowsAmount * bricksAmount;
    menu.querySelector("h1").innerText = 'Jogo pausado';
    speedMultiplier = 1;
    startTime = Date.now();
    torus.visible = false;
}

let startPauseTime;
export function pause(pause){
    if (pause){
        startPauseTime = Date.now();
        menu.style.display = 'block';
        ball.move = false;
        secondaryBall.move = false;
        document.removeEventListener('mousemove', onMouseMove);
    } else { // unpause   
        menu.style.display = 'none';
        if (ball.object.visible) ball.move = true;
        if (secondaryBall.object.visible) secondaryBall.move = true;
        document.addEventListener('mousemove', onMouseMove);
        
        if (startPauseTime)
            startTime += Date.now() - startPauseTime;
        else 
            startTime = Date.now();
    }
}

function end(){
    pause(true);
    menu.querySelector("h1").innerText = 'Você venceu!';
}

const levelConfig = [{bricksAmount: 11,rowsAmount: 6}, {bricksAmount: 9, rowsAmount: 14}, {bricksAmount: 11,rowsAmount: 11}];
export function nextLevel(){
    resetPosition();
    // Remove remaining blocks
    if (bricksLeft > 0)
        for (let i = 0; i < rowsAmount; i++){
            for (let j = 0; j < bricksAmount; j++){   
                scene.remove(bricks[i][j].object );
            }
        }

    level = (level + 1) % 3;
    bricksAmount = levelConfig[level].bricksAmount;
    rowsAmount = levelConfig[level].rowsAmount;
    brickGeometry = new THREE.BoxGeometry(bricksX - 0.1, size.y, size.z - 0.1);
    bricks = new Array(rowsAmount);
    speedMultiplier = 1;
    bricksLeft = 0;
    
    torus.visible = false
    startTime = Date.now();

    createLevel(level);

    BALL_BRICK_LIMIT = bricks[rowsAmount-1][bricksAmount-1].object.position.z + size.z*2;
    // Update limit when checking for collisions with bricks
    if (center)
        center.geometry = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-planeX/2, 0, BALL_BRICK_LIMIT), new THREE.Vector3(planeX/2, 0, BALL_BRICK_LIMIT) ] );
}

function createLevel(level){
    switch (level) {
        case 0: {
            colors = ["bcbcbc", "d82800", "0070ec", "fc9838", "fc74B4", "80d010"];
            bricksOffset = - planeX/2 + bricksX/2 + size.z/2;
            let currentColor;
            for(let i = 0; i < rowsAmount; i++){
                bricks[i] = new Array(bricksAmount);
                for(let j = 0; j < bricksAmount; j++){
                    bricks[i][j] = {};

                    bricksLeft++;
                    currentColor = colors[i%colors.length];
                    let brick = new THREE.Mesh(brickGeometry, new THREE.MeshLambertMaterial({color: "#" + currentColor}));
                    brick.position.set(j*bricksX + bricksOffset,    size.positionY,   i*size.z - planeZ/4);
                    if (currentColor == colors[0]){
                        brick.material.map = cementTexture;
                        brick.material.map.minFilter = THREE.LinearFilter;
                        brick.material.map.magFilter = THREE.NearestFilter;
                    }
                    brick.castShadow = true;
                    
                    scene.add(brick);
            
                    bricks[i][j].object = brick;
                    bricks[i][j].bb = new Array(9);
                    createBrickBoundingBoxes(bricks[i][j].bb, bricks[i][j].object);
                }
            }
        } break;
        case 1: {
            bricksOffset = - planeX/2 + bricksX/2 + size.z/2 + bricksX; // Add offset of half brick at each border
            let currentColor;
            for(let i = 0; i < rowsAmount; i++){
                bricks[i] = new Array(bricksAmount);
                for(let j = 0; j < bricksAmount; j++){
                    bricks[i][j] = {};
                    if (j == Math.floor(bricksAmount/2)) continue; // central spacing
        
                    bricksLeft++;
                    currentColor = colors[(i+j)%colors.length];
                    let brick = new THREE.Mesh(brickGeometry, new THREE.MeshLambertMaterial({color: "#" + currentColor}));
                    brick.position.set(j*bricksX + bricksOffset,    size.positionY,   i*size.z - planeZ/4);
                    if (currentColor == colors[0]){
                        brick.material.map = cementTexture;
                        brick.material.map.minFilter = THREE.LinearFilter;
                        brick.material.map.magFilter = THREE.NearestFilter;
                    }
                    brick.castShadow = true;
                    
                    scene.add(brick);
            
                    bricks[i][j].object = brick;
                    bricks[i][j].bb = new Array(9);
                    createBrickBoundingBoxes(bricks[i][j].bb, bricks[i][j].object);
                }
            }
            
        } break;
        case 2: {
            colors = ["0070ec", "d82800", "80d010", "fc9838", "ffd93c"];
            bricksOffset = - planeX/2 + bricksX/2 + size.z/2;
            let currentColor;
            for(let i = 0; i < rowsAmount; i++){
                bricks[i] = new Array(bricksAmount);
                for(let j = 0; j < bricksAmount; j++){
                    bricks[i][j] = {};
                    if (j == 1 || j == 9) continue;
                    if (j % 2 === 1 && i !== 3) continue;
        
                    bricksLeft++;
                    // Choose the color
                    if ((j == 0 || j == 10) && i != 9) currentColor = colors[0];
                    else if (j == 2 || j == 8) {
                        if (i == 3 || i == 9) currentColor = colors[4];
                        else currentColor = colors[1];
                    }
                    else if (j == 4 || j == 6){
                        if (i == 3 || i == 9) currentColor = colors[4];
                        else currentColor = colors[2];
                    }
                    else currentColor = colors[3];


                    let brick = new THREE.Mesh(brickGeometry, new THREE.MeshLambertMaterial({color: "#"+currentColor}));
                    brick.position.set(j*bricksX + bricksOffset,    size.positionY,   i*size.z - planeZ/4);
                    brick.castShadow = true;
                    
                    scene.add(brick);
            
                    bricks[i][j].object = brick;
                    bricks[i][j].bb = new Array(9);
                    createBrickBoundingBoxes(bricks[i][j].bb, bricks[i][j].object);
                }
            }
        } break;
    }
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
controls.add("Space - pause");
controls.add("R - restart");
controls.add("G - next level");
controls.add("L - show limits");
controls.add("Hover over the board to move the player");
controls.show();

/***** Utilities *****/ 

function viewLimits(){    
    let lineColor = new THREE.LineBasicMaterial({color: "#FFF"});

    let geometry = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-planeX/2, 0, BALL_INFERIOR_LIMIT), new THREE.Vector3(planeX/2, 0, BALL_INFERIOR_LIMIT) ] );
    inferiorLimit = new THREE.Line( geometry , lineColor );
    scene.add(inferiorLimit);
    let geometry2 = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(-planeX/2, 0, BALL_BRICK_LIMIT), new THREE.Vector3(planeX/2, 0, BALL_BRICK_LIMIT) ] );
    center = new THREE.Line( geometry2, lineColor );
    scene.add(center);
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

export function showLimits(){
    if (!inferiorLimit){
        viewLimits();
    }
    inferiorLimit.visible = visible;
    center.visible = visible;
    superiorLimit.visible = visible;
    leftWallLimit.visible = visible;
    rightWallLimit.visible = visible;
    visible = !visible;
}