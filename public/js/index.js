import hc from "./hc/hc.js";
import Smath from "./smath.js";
import Camera from "./camera.js";
import Cube from "./cube.js";
import App from "./app.js";
import Animate from "./animate.js";
import Roller from "./roller.js";
import Arrows from "./arrows.js";
import Color from "./color.js";
import Zoomer from "./zoomer.js";
import Dots from "./dots.js";
///////////////////////////////////////////////////////////////////////////////

let currentScreenSize = [0, 0];

let appState = "startup";

const renderState = {
   cubeBuffer : null,
   cubeShader : null,
};

console.log( "%cwondering how this puppy works? 😏", 
   "background-color:#222; color:white; font-size: 1.4em" );

   ///////////////////////////////////////////////////////////////////
   /*
const testp = mat4.create();
mat4.perspective( testp, 45 * Math.PI / 180, 1, 1, 100 );

const test2 = getProjection( 45, 1, 1, 100 );

let point = [5, 5, 0, 1];
let point2 = [];

console.log(testp);
console.log(test2);

console.log( "MINE",  multiplyMatrixAndPoint( test2, point ));
vec4.transformMat4( point2, point, testp );
console.log( "YOURS", point2 );

const ctest1 = mat4.create();
mat4.lookAt( ctest1, [35,22,1], [33,22,11], [0,1,0] );
const ctest2 = lookAt( [35,22,1], [33, 22, 11], [0,1,0] );
console.log( "MINE", ctest2 );
console.log( "YOURS", ctest1 );

const result1 = mat4.create();
const result2 = multiplyMatrices( test2, ctest2 );
mat4.multiply( result1, testp, ctest1 );

console.log( "YOURS", result1 );
console.log("MINE", result2);


//debugger;*/
///////////////////////////////////////////////////////////////////

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
function GetDeviceDimensions() {
   return [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),
           Math.max( document.documentElement.clientHeight, window.innerHeight || 0 )];
}

function ResizeViewport() {
   // The device/client viewport rectangle.
   const [vw, vh] = GetDeviceDimensions();
   
   if( vw !== currentScreenSize[0] || vh !== currentScreenSize[1] ) {
      currentScreenSize = [vw, vh];
      hc.Context.Resize( vw, vh );
   }
}

function OnResize() {
	//var w = window.innerWidth & ~1;
   //var h = window.innerHeight & ~1;
   ResizeViewport();
   Roller.SetupContentPadding();
}

let cameraAngle = 0.0;

function Render() {

   let projMatrix  = Smath.MakeProjectionMatrix(
            45.0, currentScreenSize[0] / currentScreenSize[1], 0.1, 1000.0 );
   let modelMatrix = Smath.IdentityMatrix();
   
   let viewMatrix = Camera.GetViewMatrix();
   
   let projview = Smath.MultiplyMatrices( projMatrix, viewMatrix );
   
   //hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );
   Cube.Render( projview, currentScreenSize );
   Dots.Render( projview );

}

function Update() {
   requestAnimationFrame( Update );

   App.Update();
   Animate.Update();
   Render();
}

export function IsMobile() {
   return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

//-----------------------------------------------------------------------------
async function Setup() {
   hc.Init( "background", {
      premultipliedAlpha : false,
      alpha   : false,
      depth   : false,
      stencil : false
   });

   window.addEventListener( "resize", e => {
      OnResize();
   });

   ResizeViewport();
   
   hc.gl.clearColor( 0.01, 0.01, 0.05, 1.0 );
   hc.gl.disable( hc.gl.DEPTH_TEST );
   hc.gl.disable( hc.gl.CULL_FACE );

   await Promise.all([
      Cube.Setup(),
      Dots.Setup()
   ]);

   Cube.color[0] = 1.0;
   Cube.color[1] = 0.7;
   Cube.color[2] = 1.0;
   Cube.intensity = 0.2;
   App.Setup();
   Arrows.Setup();
   Color.Setup();
   Zoomer.Setup();
   
   let content = document.getElementById( "content" )
   content.style.display = "none";
   //content.innerHTML = document.getElementById( "panel1" ).innerHTML;
   
   requestAnimationFrame( Update );
}

Setup();

document.getElementById( "bottomleft" ).classList.remove( "hide" );
