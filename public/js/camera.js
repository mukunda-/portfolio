// A bit of code to handle the camera state.
//-----------------------------------------------------------------------------
import Smath from "./smath.js";
///////////////////////////////////////////////////////////////////////////////

// The current position of the camera.
let cameraEye    = [];
// What point in space the camera is looking at.
let cameraTarget = [];
// The direction "upward" from the camera. This is not always the sky - we do a
// lot of rotation.
let cameraUp     = [0, 1, 0];

//-----------------------------------------------------------------------------
function GetViewMatrix() {
   // TODO: cache this result.
   return Smath.LookAt( cameraEye, cameraTarget, cameraUp );
}

//-----------------------------------------------------------------------------
// Copy the current camera orientation.
function Get() {
   return [cameraEye.slice(), cameraTarget.slice(), cameraUp.slice()];
}

//-----------------------------------------------------------------------------
// Set the camera orientation. `position` looks at `target` with `up` oriented
// overhead.
function Set( position, target, up ) {
   up = up || [0,1,0];
   for( let i = 0; i < 3; i++ ) {
      cameraEye[i]    = position[i];
      cameraTarget[i] = target[i];
      cameraUp[i]     = up[i];
   }
}

///////////////////////////////////////////////////////////////////////////////
export default {
   GetViewMatrix,
   Get,
   Set
}
