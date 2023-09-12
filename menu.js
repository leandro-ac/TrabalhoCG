import { onMouseMove, ball, restart, camera, pause} from "./index.js";



document.addEventListener('click', () => {
    menu.querySelector("h1").innerText = 'Jogo pausado';
    document.addEventListener('mousemove', onMouseMove);
    ball.move = true;
}, {once: true});

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R'){
        restart();
    }

    if (e.key === " "){
        pause(ball.move);
    }

    if (e.key === "Enter"){
        toggleFullScreen();
        camera.fov = 10;
        console.log("🚀 ~ file: menu.js:23 ~ document.addEventListener ~ camera:", camera)
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