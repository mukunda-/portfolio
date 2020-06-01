// (C) 2020 Mukunda Johnson
//-----------------------------------------------------------------------------
import hc      from "./hc/hc.js";
import Smath   from "./smath.js";
import Camera  from "./camera.js";
import Cube    from "./cube.js";
import App     from "./app.js";
import Animate from "./animate.js";
import Roller  from "./roller.js";
import Arrows  from "./arrows.js";
import Color   from "./color.js";
import Zoomer  from "./zoomer.js";
import Dots    from "./dots.js";

import Background from "./background.js";
///////////////////////////////////////////////////////////////////////////////

let currentScreenSize = [0, 0];

const FOV = 60.0;

console.log( "%cwondering how this puppy works? 😏", 
   "background-color:#222; color:white; font-size: 1.4em" );

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
export function GetDeviceDimensions() {
   // Hope this works LOL. We don't want to use the clientHeight. We want to
   // use something that is 100vh tall (which ignores some annoying shrinkages
   // on mobile).
   return [background.offsetWidth, background.offsetHeight];
   //return [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),
   //        Math.max( document.documentElement.clientHeight, window.innerHeight || 0 )];
}

//-----------------------------------------------------------------------------
function ResizeViewport() {
   // The device/client viewport rectangle.
   const [vw, vh] = GetDeviceDimensions();
   console.log( "Resizing viewport:", vw, vh );
   
   if( vw !== currentScreenSize[0] || vh !== currentScreenSize[1] ) {
      currentScreenSize = [vw, vh];
      hc.Context.Resize( vw, vh );
   }
}

//-----------------------------------------------------------------------------
function OnResize() {

   ResizeViewport();
   Roller.SetupContentPadding();
   Dots.HandleResize();
}

//-----------------------------------------------------------------------------
function Render() {

   let projMatrix  = Smath.MakeProjectionMatrix(
            FOV, currentScreenSize[0] / currentScreenSize[1], 0.1, 1000.0 );
   let viewMatrix = Camera.GetViewMatrix();
   
   let projview = Smath.MultiplyMatrices( projMatrix, viewMatrix );
   
   //hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );
   Background.Render( projview );
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
      Dots.Setup(),
      Background.Setup()
   ]);

   Cube.color[0] = 1.0;
   Cube.color[1] = 0.7;
   Cube.color[2] = 1.0;
   Cube.intensity = 0.2;
   App.Setup();
   Arrows.Setup();
   Color.Setup();
   Zoomer.Setup();
   Roller.Setup();
   
   let content = document.getElementById( "content" )
   content.style.display = "none";
   //content.innerHTML = document.getElementById( "panel1" ).innerHTML;
   
   requestAnimationFrame( Update );

   requestAnimationFrame( () => {
      document.getElementById( "bottomleft" ).classList.remove( "hide" );
   });
}

Setup();

///////////////////////////////////////////////////////////////////////////////
export { FOV };
