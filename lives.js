// Create a new renderer to show the remaining lives
import * as THREE from  'three';

const container = document.getElementById('lives');
const size = {
    width: container.offsetWidth,
    height: container.offsetHeight,
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera (45, size.width / size.height, 0.1, 500);
    camera.position.setZ(10);


document.body.appendChild(container);

const renderer = new THREE.WebGLRenderer({
	canvas: container,
    antialias: true,
    alpha: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( size.width, size.height );

// const planeGeometry = new THREE.PlaneGeometry(50, 15, 10, 10);
// const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x00db64, side: THREE.DoubleSide });
// let plane = new THREE.Mesh(planeGeometry, planeMaterial);
// plane.position.z = -5
// plane.receiveShadow = true;
//scene.add(plane)

export let remainingLives = 4;
const lives = [];
const material = new THREE.MeshPhongMaterial({color : 0xAAAAAA, shininess: 10, specular: 0x555555});
let life = new THREE.Mesh(new THREE.SphereGeometry(1), material);
    life.position.x -= 4.5
    lives.push(life);
let life2 = new THREE.Mesh(new THREE.SphereGeometry(1), material);
    life2.position.x -= 1.5
    lives.push(life2);
let life3 = new THREE.Mesh(new THREE.SphereGeometry(1), material);
    life3.position.x += 1.5
    lives.push(life3);
let life4 = new THREE.Mesh(new THREE.SphereGeometry(1), material);
    life4.position.x += 4.5
    lives.push(life4);

let light = new THREE.DirectionalLight( 0xffffff , 1 ); 
    light.position.set(0, 5, 5);
    light.castShadow = true;
    light.shadow.mapSize.width = 256;
    light.shadow.mapSize.height = 256;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 20 * 2;
    light.shadow.camera.left = -size.width/2;
    light.shadow.camera.right = size.width/2
    light.shadow.camera.bottom = -size.height/2
    light.shadow.camera.top = size.height/2;
    
let ambientLight = new THREE.AmbientLight( 0xffffff, 0.4);
scene.add(life, life2, life3, life4);
scene.add(ambientLight,light);

export function decreaseLives(){
    remainingLives--;
}

function render(){
    lives.forEach((life, index) => {
        if (index + 1 <= remainingLives)
            life.visible = true;
        else 
            life.visible = false;
    });

    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}
render();
