// App state controller.
//-----------------------------------------------------------------------------
import Camera     from "./camera.js";
import Cube       from "./cube.js";
import Animate    from "./animate.js";
import Smath      from "./smath.js";
import Roller     from "./roller.js";
import {IsMobile} from "./index.js";
import Dots       from "./dots.js";
import Arrows     from "./arrows.js";
///////////////////////////////////////////////////////////////////////////////

// This all really needs to be cleaned up. This was planned to be more overall
// high-level state control, but rushed implementation made this more of just
// the intro screen.
let m_state = {
   name : "",
   cameraAngle: 0,
   cameraDistance: 1000
};

//-----------------------------------------------------------------------------
let m_state_handlers = {
   //--------------------------------------------------------------------------
   startup: {
      // Startup state, this sets things up and has an animation to rotate
      //                     around the overall scene, waiting for a click.
      Start() {
         m_state.cameraAngle = 0.0;

         // If the brower doesn't support touches (taps), then change this text
         // to "click" to start. This might not be a sure-fire condition, but
         // it should catch most cases.
         if( !('ontouchstart' in window) ) {
            document.getElementById( "splash_text_bottom" ).innerText = "Click to begin."
         }

         // These timers display the two large text displays during the start.
         Animate.Start( "splash", time => {
            if( time >= 2000 ) {
               document.getElementById( "splash_text_top" ).classList.add( "show" );
               Animate.Start( "splash", time => {
                  if( time >= 2000 ) {
                     document.getElementById( "splash_text_bottom" ).classList.add( "show" );
                     return true;
                  }
               });
            }
         });

         // Create a clicker to intercept the starting click.
         let clicker = document.createElement("div");
         clicker.className = "cubeclicker";
         document.body.appendChild( clicker );
         
         clicker.addEventListener( "click", () => {
            document.body.removeChild( clicker );
            SetState( "zoom" );
         });

         Animate.Start( "cube_intensity", (time, elapsed) => {
            Cube.intensity = Animate.Slide( 0.0, 0.7, "fall", time, 0, 2000 );
            if( time >= 2000 ) return true;
         });

         Animate.Start( "cube_rotate", ( time, elapsed ) => {
            let distance = Animate.Slide( 1000, 64 /*65*/, "fall", time, 0, 1000 );
            m_state.cameraDistance = distance;
            m_state.cameraAngle += elapsed * 0.0006;

            Camera.Set( 
               [
                  Math.cos(m_state.cameraAngle) * distance,
                  distance,
                  Math.sin(m_state.cameraAngle) * distance
               ],
               [0, 0, 0] );
         });
      },

      Update() {
         
      },

      End() {
         Animate.Stop( "cube_rotate" );
      }
   },

   //--------------------------------------------------------------------------
   zoom: {
      Start() {
         Roller.StartMusic();
         // Hide the big splash text. Cancel any active animation slot.
         Animate.Stop( "splash" );
         document.getElementById( "splash_text_top" ).classList.remove( "show" );
         document.getElementById( "splash_text_bottom" ).classList.remove( "show" );
         document.getElementById( "splash_text_top" ).classList.add( "fade" );
         document.getElementById( "splash_text_bottom" ).classList.add( "fade" );

         // On mobile mode only, try to set it to fullscreen, to avoid annoying
         //  address bar popups.
         if( IsMobile() ) {
            // iOS/Safari I know is one instance that doesn't support
            // fullscreen, so the function below will fail. We don't want an
            //                                activation button in that case.
            if( !/iPhone|iPod/i.test(navigator.userAgent) ) {
               // iPhone doesn't'support fullscreen.
               Arrows.EnableFullscreenButton();
            }

            // Not 100% sure if this function can be missing, but if it is we
            // won't throw an error.
            if( document.documentElement.requestFullscreen )
               document.documentElement.requestFullscreen();
         }

         // Disable these displays completely when the transition is done.
         setTimeout( () => {
            document.getElementById( "splash_text_top" ).style.display = "none";
            document.getElementById( "splash_text_bottom" ).style.display = "none";
         }, 1500 );
         
         // distance to one of the points, 0,0,4 -> 1,1,1
         const originalDistance = m_state.cameraDistance;
         const originalAngle = m_state.cameraAngle % (Math.PI * 2);
         let desiredAngle = 0;
         if( desiredAngle < originalAngle ) {
            desiredAngle += Math.PI * 2;
         }

         // Turn off the Dots' fade effect, and slow down their movement.
         Dots.SetFadeFactor( 0 );
         Dots.SetTimeScale( 1.0 );
         
         // We are going to slide the ZScale parameter of the cube to a much
         // lower amount. It makes it so that the faces in the back are dimmed.
         // (This slide is continued in the animation below.)
         Cube.SetZScale( 0, 10, 1.0, 1.0 );
         let originalCubeZscale = Cube.GetZScale();
         let newCubeZscale = [
            Smath.Distance( [0,0,4], [1,1,1] ), // Near plane (distance to front).
            Smath.Distance( [0,0,4], [1,1,0] ), // Far plane (distance to back).
            1.0, 0.1 ]; // near visibility, far visibility.
            
         Animate.Start( "cube_zoom", ( time, elapsed ) => {
            const cubeZscale = Animate.Slide( originalCubeZscale, newCubeZscale, "ease", time, 1000, 1500 );
            Cube.SetZScale( cubeZscale[0], cubeZscale[1], cubeZscale[2], cubeZscale[3] );

            m_state.cameraAngle = Animate.Slide( originalAngle, desiredAngle, "ease", time, 0, 1500 );
            let distanceH = Animate.Slide( originalDistance, 4, "fall", time, 0, 1500 );
            let distanceV = Animate.Slide( originalDistance, 0, "fall", time, 0, 1500 );

            // Slide the camera towards our starting position, level with the cube.
            Camera.Set( 
               [
                  Math.cos(m_state.cameraAngle) * distanceH,
                  distanceV,
                  Math.sin(m_state.cameraAngle) * distanceH
               ],
               [0, 0, 0] );

            // 100ms past the end of the slides, a nice spot to start the next text.
            if( time >= 1600 ) {
               SetState( "ready" );
               return true;
            }
         });
      }
   },

   //--------------------------------------------------------------------------
   ready: {
      // From here we just pass execution to the Roller code.
      Start() {
         Roller.Start();

      }
   }
}

//-----------------------------------------------------------------------------
function CallHandler( sig ) {
   let handler = m_state_handlers[m_state.name];
   if( !handler ) return;
   handler = handler[sig];
   if( !handler ) return;
   return handler();
}

//-----------------------------------------------------------------------------
function SetState( name ) {
   CallHandler( "End" );
   m_state.name = name;
   CallHandler( "Start" );
}

//-----------------------------------------------------------------------------
function Setup() {
   SetState( "startup" );
}

//-----------------------------------------------------------------------------
function Update() {
   CallHandler( "Update" );
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Setup, Update, SetState
}
