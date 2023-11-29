import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
import { MeshPhongMaterial, ObjectLoader } from '../build/three.module.js';
import { CSG } from '../libs/other/CSGMesh.js'
import { RGBELoader } from '../build/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../build/jsm/environments/RoomEnvironment.js';

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
let planeX =  20;
let planeZ = planeX*2;
let planeColor = "rgb(0, 219, 100)";

// Background
const environment = new RoomEnvironment();
const pmremGenerator = new THREE.PMREMGenerator( renderer );
scene.environment = pmremGenerator.fromScene( environment ).texture;
//renderer.outputEncoding = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;

const loader = new RGBELoader();
loader.load('./assets/wooden_lounge_4k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.exposure = 2;
    scene.background = texture;
});

// Camera
export let orthoSize = planeZ; // Estimated size for orthographic projection
let w = window.innerWidth;
let h = window.innerHeight;
export let aspect = w / h;
let near = 0.1;
let far = 1000;
let position = new THREE.Vector3(0, 35, 25);
let lookat   = new THREE.Vector3(0, 0, 0);
let up       = new THREE.Vector3(0, 1, 0);
const camera = new THREE.PerspectiveCamera (45, w / h, near, far);
    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(lookat);
scene.add( camera );
orbit = new OrbitControls( camera, renderer.domElement );
orbit.target = new THREE.Vector3(0, 0, 4);
orbit.update();
orbit.saveState();
orbit.enabled = false;

// Audios
const listener = new THREE.AudioListener();
camera.add( listener );
const audioLoader = new THREE.AudioLoader();  
const backgroundSound = new THREE.Audio(listener);
audioLoader.load('./assets/backgroundSound.mpeg', (buffer) => {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.15 );
    backgroundSound.play();
});
const commonBrickSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/bloco1.mp3', (buffer) => {
    commonBrickSound.setBuffer(buffer);
    commonBrickSound.setLoop(false);
    commonBrickSound.setVolume(0.1);
});
const specialBrickSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/bloco2.mp3', (buffer) => {
    specialBrickSound.setBuffer(buffer);
    specialBrickSound.setLoop(false);
    specialBrickSound.setVolume(0.1);
});
const onFireSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/bloco3.mp3', (buffer) => {
    onFireSound.setBuffer(buffer); 
    onFireSound.setLoop(false);
    onFireSound.setVolume(0.1);
});
const playerSound = new THREE.Audio(listener);
audioLoader.load('../assets/sounds/rebatedor.mp3', (buffer) => {
    playerSound.setBuffer(buffer);
    playerSound.setLoop(false);
    playerSound.setVolume(0.15);
});

// Lights
let dirLight = new THREE.DirectionalLight( 0xffffff , 0.15 ); //0.15
    dirLight.position.set( 0, 20, -7 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1028;
    dirLight.shadow.mapSize.height = 1028;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 20 * 2;
    dirLight.shadow.camera.left = -planeX/2;
    dirLight.shadow.camera.right = planeX/2;
    dirLight.shadow.camera.bottom = -planeZ/2;
    dirLight.shadow.camera.top = planeZ/2;

let ambientLight = new THREE.AmbientLight( 0xffffff, 0.15); // 0.1

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
const csgFinalMaterial = new THREE.MeshPhongMaterial({color: 0xF0F000, shininess: 50, specular: 0xdada00});
let cubeMesh = new THREE.Mesh(new THREE.BoxGeometry(planeX/2, planeX/2, planeX/2),)
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
    csgFinal.material = csgFinalMaterial;
    csgFinal.position.set(0, size.positionY, planeZ/2 + csgFinal.geometry.boundingSphere.radius - 2.5);
    csgFinal.bb = new THREE.Sphere(sphereMesh.geometry.position, planeX/4);
    csgFinal.castShadow = true;
scene.add(csgFinal);
const initialPositions = [];
initialPositions.push(new THREE.Vector3().copy(csgFinal.position));

let gltfPlayer;
let gltfInitialPosition;
const playerLoader = new GLTFLoader();
playerLoader.load('./assets/scene.gltf', function(gltf){
    console.log(gltf);
    gltfPlayer = gltf.scene;
    gltf.scene.scale.copy(new THREE.Vector3(0.4, 0.35, -0.3));
    gltfInitialPosition = new THREE.Vector3(-0.2, size.positionY/2, planeZ/2-2)
    gltf.scene.position.copy(new THREE.Vector3().copy(gltfInitialPosition));
    gltf.scene.traverse(function(node){
        if (node.isMesh){
            node.castShadow = true;
        }
    });
    scene.add(gltf.scene)
}, function(xhr){
    console.log((xhr.loaded/xhr.total * 100) + "% loaded");
}, function(){
    console.log('An error occurred');
});

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
    if (gltfPlayer && intersects.length > 0) {      
        let point = intersects[0].point; // Pick the point where interception occurrs

        if (point.x + csgFinal.geometry.boundingBox.min.x < LEFT_LIMIT){ // leftWall
            csgFinal.position.x = LEFT_OFFSET;
            gltfPlayer.position.x = LEFT_OFFSET - 0.2;
        } else if (point.x + csgFinal.geometry.boundingBox.max.x > -LEFT_LIMIT){ //rightWall
            csgFinal.position.x = RIGHT_OFFSET;
            gltfPlayer.position.x = RIGHT_OFFSET - 0.2;
        } else {
            csgFinal.position.x = point.x;
            gltfPlayer.position.x = point.x - 0.2;
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
        this.speedConstant = planeX/500;
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
function splitBall(ballToSplit){
    let angle = new THREE.Vector2(ballToSplit.dx * 100, ballToSplit.dz * 100).angle();
    ball.dx = Math.cos(angle + angle15rad) * ball.speedConstant;
    ball.dz = Math.sin(angle + angle15rad) * ball.speedConstant;
    secondaryBall.dx = Math.cos(angle - angle15rad) * secondaryBall.speedConstant;
    secondaryBall.dz = Math.sin(angle - angle15rad) * secondaryBall.speedConstant;
}

function duplicate(){
    if (!secondaryBall.object.visible){
        secondaryBall.object.position.copy(ball.object.position);
        splitBall(ball)
        secondaryBall.object.visible = secondaryBall.move = true;
        numBalls++;
    }
    if (!ball.object.visible){
        ball.object.position.copy(secondaryBall.object.position);
        splitBall(secondaryBall)
        ball.object.visible = ball.move = true;
        numBalls++;
    }
}

let onFire = false;
function setFire(){
    balls.forEach(ball => {
        if (ball.object.visible){
            ball.object.material.color.set(0xff0000);
        }
    });
    onFire = true;
    setTimeout(() => unsetFire(), 7000); // efeito 'Em chamas' dura 7 segundos
}

function unsetFire(){
    balls.forEach(ball => {
        ball.object.material.color.set(0xffffff);
    });
    onFire = false;
}
    

export let ball = new Ball(size.z/4);
ball.object.castShadow = true;
ball.object.position.copy(csgFinal.position); // Initial position
ball.object.position.y += 0.1;
ball.object.translateZ(-sphereMesh.geometry.parameters.radius - ball.radius);
initialPositions.push(new THREE.Vector3().copy(ball.object.position));
scene.add(ball.object);

let secondaryBall = new Ball(ball.radius);
secondaryBall.object.castShadow = true;
secondaryBall.object.visible = false;
scene.add(secondaryBall.object);
let numBalls = 1;

const balls = [ball, secondaryBall];

// Create powerUp
const powerUpGeometry = new THREE.CapsuleGeometry( 0.3, 0.3, 5, 15 ); 
const powerUpTMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFF00,
    shininess: 100,
    specular: 0x333333
}); 
const powerUpSMaterial = new THREE.MeshPhongMaterial({
    color: 0x00FF44,
    shininess: 100,
    specular: 0x333333
}); 
const powerUpT = new THREE.Mesh( powerUpGeometry, powerUpTMaterial );
    powerUpT.rotateOnAxis(new THREE.Vector3( 1, 0, 0), THREE.MathUtils.degToRad(90))
    powerUpT.rotateOnAxis(new THREE.Vector3( 0, 0, 1), THREE.MathUtils.degToRad(90))
    powerUpT.visible = false;
    powerUpT.speed = -ball.initialDz/4;
    powerUpT.material.map = textureLoader.load('./assets/textureT.png');
const powerUpS = new THREE.Mesh( powerUpGeometry, powerUpSMaterial );
    powerUpS.rotateOnAxis(new THREE.Vector3( 1, 0, 0), THREE.MathUtils.degToRad(90))
    powerUpS.rotateOnAxis(new THREE.Vector3( 0, 0, 1), THREE.MathUtils.degToRad(90))
    powerUpS.visible = false;
    powerUpS.speed = -ball.initialDz/4;
    powerUpS.material.map = textureLoader.load('./assets/textureT.png');
const powerUps = [powerUpT, powerUpS];
let powerUpSwitch = true;
let powerUpCounter = 0;
scene.add( powerUpT , powerUpS);

// Collisions detection 
const BALL_INFERIOR_LIMIT = planeZ/2 - csgFinal.geometry.boundingSphere.radius - 2.5;
const BALL_PLAYER_LIMIT = planeZ/2 - csgFinal.geometry.boundingSphere.radius;
const BALL_SIDE_LIMIT = leftWall.object.position.x + size.x;
let BALL_BRICK_LIMIT = bricks[rowsAmount-1][bricksAmount-1].object.position.z + size.z*2;
import { remainingLives, decreaseLives, resetLives } from './lives.js';
let powerUpInferiorLimit;
let ballInferiorLimit;
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
    powerUps.forEach((powerUp) => {
        if (powerUp.position.z - powerUp.geometry.parameters.radius > planeZ/2){
            powerUp.visible = false;
        }
    });
    // Collsion with the player
    // Only verifies when the ball is near the player, otherwise it won't execute aiming optimization
    ballInferiorLimit = ball.object.position.z + ball.radius;
    if (ballInferiorLimit > BALL_INFERIOR_LIMIT && ballInferiorLimit < BALL_PLAYER_LIMIT){
        if (ball.bb.intersectsSphere(csgFinal.bb)){
            let direction = new THREE.Vector3(ball.dx * 1000, 0, ball.dz * 1000 ).normalize();
            let normal = new THREE.Vector3(csgFinal.bb.center.x - ball.object.position.x, 0, csgFinal.bb.center.z - ball.object.position.z ).normalize();
            direction.reflect(normal);
            ball.dx = direction.x * ball.speedConstant;
            ball.dz = -Math.abs(direction. z) * ball.speedConstant;

            if (playerSound.isPlaying) playerSound.stop();
            playerSound.play();
        }
    }
    // Collsion with the powerUp
    powerUps.forEach((powerUp, index) => {
        powerUpInferiorLimit = powerUp.position.z + powerUp.geometry.parameters.radius;
        if (powerUp.visible && (powerUpInferiorLimit > BALL_INFERIOR_LIMIT) && (powerUpInferiorLimit < BALL_PLAYER_LIMIT)){
            if (powerUp.bb.intersectsSphere(csgFinal.bb)){
                powerUp.visible = false;
                switch(index){
                    case 0: duplicate(); break;
                    case 1: setFire(); break;
                }
                    
            }
        }
    });

    // Collision with the bricks
    if (ball.object.position.z - ball.radius < BALL_BRICK_LIMIT){
        for (let i = 0; i < rowsAmount; i++){
            for (let j = 0; j < bricksAmount; j++){
                if (bricks[i][j].bb && ball.bb && ball.bb.intersectsBox(bricks[i][j].bb[0])){  
                    // If the brick is golden or the ball is on fire then it collides
                    if (bricks[i][j].object.material.color.getHexString() === 'ffd93c' || ball.object.material.color.getHexString() !== 'ff0000'){
                        if (ball.bb.intersectsBox(bricks[i][j].bb[1])){
                            ball.dz = Math.abs(ball.dz);
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[2])){
                            ball.dz = ball.dz > 0 ? -ball.dz : ball.dz;
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[3])){
                            ball.dx = ball.dx > 0 ? -ball.dx : ball.dx;
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[4])){
                            ball.dx = Math.abs(ball.dx);
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[5])){ // Corners
                            if (onFire) 
                                ball.dx = -Math.abs(ball.dx);
                            ball.dz = -Math.abs(ball.dz);
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[6])){
                            if (onFire) 
                                ball.dx = Math.abs(ball.dx);
                            ball.dz = -Math.abs(ball.dz);
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[7])){
                            if (onFire) 
                                ball.dx = -Math.abs(ball.dx);
                            ball.dz = Math.abs(ball.dz);
                        } else if (ball.bb.intersectsBox(bricks[i][j].bb[8])){
                            if (onFire) 
                                ball.dx = Math.abs(ball.dx);
                            ball.dz = Math.abs(ball.dz);
                        }
                    } else {
                        if (onFireSound.isPlaying) onFireSound.stop();
                        onFireSound.play();
                    }

                    // golden bricks are indestructible 
                    if (bricks[i][j].object.material.color.getHexString() === 'ffd93c'){
                        continue;
                    }

                    // change gray bricks' color after first hit
                    if (bricks[i][j].object.material.map?.isTexture){
                        bricks[i][j].object.material.color.set("#a0a0a0");
                        bricks[i][j].object.material.map = null;
                        bricks[i][j].object.material.needsUpdate = true;
                        if (specialBrickSound.isPlaying) specialBrickSound.stop();
                        specialBrickSound.play();
                        continue;
                    }
                    
                    bricksLeft--;
                    bricks[i][j].object.visible = false;
                    bricks[i][j].bb[0].makeEmpty();
                    if (commonBrickSound.isPlaying) commonBrickSound.stop();
                    commonBrickSound.play();
                    powerUpCounter++;
                    if (powerUpCounter == 2){
                        if (!powerUpT.visible && numBalls == 1 && powerUpSwitch){
                            powerUpT.position.copy(bricks[i][j].object.position);
                            powerUpT.bb = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(powerUpT);
                            powerUpT.visible = true;
                            powerUpSwitch = !powerUpSwitch;
                        } else if (!powerUpS.visible && (!powerUpSwitch || numBalls > 1) && !onFire){            
                            powerUpS.position.copy(bricks[i][j].object.position);
                            powerUpS.bb = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()).setFromObject(powerUpS);
                            powerUpS.visible = true;
                            powerUpSwitch = !powerUpSwitch;
                        }
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
   
    ball.object.position.x += ball.dx * Math.pow(speedMultiplier, 1/2);
    ball.object.position.z += ball.dz * Math.pow(speedMultiplier, 1/2);
    ball.bb.center.copy(ball.object.position);
}

function movePowerUp(){
    powerUps.forEach((powerUp) => {
        if (powerUp.visible){
            powerUp.position.z += powerUp.speed;
            powerUp.rotation.x += 0.01;
            powerUp.rotation.y += 0.01;
            powerUp.bb.min.z += powerUp.speed;
            powerUp.bb.max.z += powerUp.speed;
        }
    });
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
            movePowerUp();
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
    gltfPlayer.position.copy(gltfInitialPosition);
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
    bricksLeft = 0;
    for (let i = 0; i < rowsAmount; i++){
        for (let j = 0; j < bricksAmount; j++){
            if (!bricks[i][j].object) continue;
            bricksLeft++;
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
    resetLives();
    resetPosition();
    menu.querySelector("h1").innerText = 'Jogo pausado';
    speedMultiplier = 1;
    startTime = Date.now();
    powerUps.forEach((powerUp) => {
        powerUp.visible = false;
    });
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
        
        if (startTime && startPauseTime)
            startTime += Date.now() - startPauseTime;
        else 
            startTime = Date.now();
    }
}

export function toggleOrbit(toggle){
    orbit.enabled = toggle;
    if (!orbit.enabled){
        orbit.reset();
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
    
    powerUps.forEach((powerUp) => {
        powerUp.visible = false;
    });
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
                    if (currentColor !== colors[4]) bricksLeft++;


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