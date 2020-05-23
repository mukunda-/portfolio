import Smath from "./smath.js";

let cameraEye    = [];
let cameraTarget = [];

function GetViewMatrix() {
   return Smath.LookAt( cameraEye, cameraTarget );
}

function Get() {
   return [cameraEye.slice(), cameraTarget.slice()];
}

function Set( position, target ) {
   for( let i = 0; i < 3; i++ ) {
      cameraEye[i]    = position[i];
      cameraTarget[i] = target[i];
   }
}

function SlideTo( position, target ) {
   
}

export default {
   GetViewMatrix,
   Get,
   Set,
   SlideTo
}
