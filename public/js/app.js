import Camera from "./camera.js";
import Cube from "./cube.js";
import Animate from "./animate.js";
import Smath from "./smath.js";
import Roller from "./roller.js";
import {IsMobile} from "./index.js";
import Dots from "./dots.js";
import Arrows from "./arrows.js";

let m_state = {
   name : "",
   cameraAngle: 0,
   cameraDistance: 1000
};

let m_state_handlers = {
   startup: {
      Start() {
         m_state.cameraAngle = 0.0;
         let clicker = document.createElement("div");
         clicker.className = "cubeclicker";
         document.body.appendChild( clicker );

         if( !('ontouchstart' in window) ) {
            // They don't have taps. :)
            document.getElementById( "splash_text_bottom" ).innerText = "Click to begin."
         }

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
         
         clicker.addEventListener( "click", () => {
            document.body.removeChild( clicker );
            
            Animate.Stop("splash");
            document.getElementById( "splash_text_top" ).classList.remove( "show" );
            document.getElementById( "splash_text_bottom" ).classList.remove( "show" );
            document.getElementById( "splash_text_top" ).classList.add( "fade" );
            document.getElementById( "splash_text_bottom" ).classList.add( "fade" );

            setTimeout( () => {
               document.getElementById( "splash_text_top" ).style.display = "none";
               document.getElementById( "splash_text_bottom" ).style.display = "none";
            }, 1500 );

            SetState( "zoom" );
            if( IsMobile() ) {
               if( !/iPhone|iPod/i.test(navigator.userAgent) ) {
                  // iPhone doesn't'support fullscreen.
                  Arrows.EnableFullscreenButton();
               }
               document.documentElement.requestFullscreen();
            }
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

   //      let panel = document.createElement("div");
   //      panel.className = "panel";
   //      panel.style.width = "20vh";
   //      panel.style.height = "20vh";

   //      document.body.appendChild( panel );

      },

      Update() {
         
      },

      End() {
         Animate.Stop( "cube_rotate" );
      }
   },

   zoom: {
      Start() {
         
         let [oldEye, oldTarget] = Camera.Get();
         // distance to one of the points, 0,0,4 -> 1,1,1
         const originalDistance = m_state.cameraDistance;
         const originalAngle = m_state.cameraAngle % (Math.PI * 2);
         let desiredAngle = 0;
         if( desiredAngle < originalAngle ) {
            desiredAngle += Math.PI * 2;
         }

         Dots.SetFadeFactor( 0 );
         Dots.SetTimeScale( 1.0 );
         
         // Slide the cube ZScale parameters to make the back of the cube
         //  fade into the background.
         Cube.SetZScale( 0, 10, 1.0, 1.0 );
         let originalCubeZscale = Cube.GetZScale();
         let newCubeZscale = [
            Smath.Distance( [0,0,4], [1,1,1] ), 
            Smath.Distance( [0,0,4], [1,1,0] ),
            1.0, 0.05 ];
            
         Animate.Start( "cube_zoom", ( time, elapsed ) => {
            //m_state.cameraAngle += elapsed * 0.0006;

            const cubeZscale = Animate.Slide( originalCubeZscale, newCubeZscale, "ease", time, 1000, 1500 );
            Cube.SetZScale( cubeZscale[0], cubeZscale[1], cubeZscale[2], cubeZscale[3] );

            m_state.cameraAngle = Animate.Slide( originalAngle, desiredAngle, "ease", time, 0, 1500 );
            let distanceH = Animate.Slide( originalDistance, 4, "fall", time, 0, 1500 );
            let distanceV = Animate.Slide( originalDistance, 0, "fall", time, 0, 1500 );

            Camera.Set( 
               [
                  Math.cos(m_state.cameraAngle) * distanceH,
                  distanceV,
                  Math.sin(m_state.cameraAngle) * distanceH
               ],
               [0, 0, 0] );

            if( time >= 1600 ) {
               SetState( "ready" );
               return true;
            }
            //Cube.SetColor( [1, Math.sin(m_state.cameraAngle), 1] );
         });
      }
   },

   ready: {
      Start() {
         Roller.Start();
         
         Animate.Start( "ttest1", ( time ) => {
            //Roller.SetScroll( time * 0.01 * 8 - 50 );//Math.sin(time *0.01) * 50 );
         });
      }
   }
}

function CallHandler( sig ) {
   let handler = m_state_handlers[m_state.name];
   if( !handler ) return;
   handler = handler[sig];
   if( !handler ) return;
   return handler();
}

function SetState( name ) {
   CallHandler( "End" );
   m_state.name = name;
   CallHandler( "Start" );
}

function Setup() {
   SetState( "startup" );
}

function Update() {
   CallHandler( "Update" );
}

export default {
   Setup, Update, SetState
}
