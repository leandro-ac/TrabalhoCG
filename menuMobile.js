import {restart, pause} from "./appMobile.js";

import { Buttons } from "../libs/other/buttons.js";
const buttons = new Buttons(onButtonDown, onButtonUp);

let move = true; 

function onButtonDown(event) {
    switch(event.target.id){
        case "start":
        case "startSvg":
            move = true;
            pause(move); break;
        case "fullscreen":
        case "fullscreenSvg":    
            buttons.setFullScreen(); break;
        case "restart":
        case "restartSvg":
            restart();
            move = false; break;
    }
}
  
function onButtonUp(event) {
    pause(!move);
}