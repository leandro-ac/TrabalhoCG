import { onMouseMove, ball, restart, pause, showLimits, nextLevel} from "./index.js";

let visible = true;

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R'){
        restart();
    }

    if (e.key === 'l' || e.key === 'L'){
        showLimits(visible)
        visible = !visible;
    }

    if (e.key === 'g' || e.key === 'G'){
        nextLevel()
    }

    if (e.key === " "){
        pause(ball.move);
    }

    if (e.key === "Enter"){
        toggleFullScreen();
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