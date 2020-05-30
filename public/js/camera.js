import Smath from "./smath.js";

let cameraEye    = [];
let cameraTarget = [];
let cameraUp     = [0, 1, 0];

function GetViewMatrix() {
   // TODO: cache this result.
   return Smath.LookAt( cameraEye, cameraTarget, cameraUp );
}

function Get() {
   return [cameraEye.slice(), cameraTarget.slice(), cameraUp.slice()];
}

function Set( position, target, up ) {
   up = up || [0,1,0];
   for( let i = 0; i < 3; i++ ) {
      cameraEye[i]    = position[i];
      cameraTarget[i] = target[i];
      cameraUp[i]     = up[i];
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
