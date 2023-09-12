import { onMouseMove, ball, restart, camera, orthoSize, aspect} from "./index.js";

const menu = document.getElementById('menu');

document.addEventListener('click', () => {
    document.addEventListener('mousemove', onMouseMove);
    ball.move = true;
}, {once: true});

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R'){
        document.removeEventListener('mousemove', onMouseMove);
        restart();
    }

    if (e.key === " "){
        if (ball.move){
            menu.style.display = 'block';
            ball.move = false;
            document.removeEventListener('mousemove', onMouseMove);
        } else {
            menu.style.display = 'none';
            ball.move = true;
            document.addEventListener('mousemove', onMouseMove);
        }
    }

    if (e.key === "Enter"){
        toggleFullScreen();
        camera.zoom = 1;
    }
});

function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}