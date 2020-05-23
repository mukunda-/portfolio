import Camera from "./camera.js";
import Cube from "./cube.js";
import Animate from "./animate.js";

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
         clicker.addEventListener( "click", () => {
            document.body.removeChild( clicker );
            SetState( "zoom" );
         });

         Animate.Start( "cube_intensity", (time, elapsed) => {
            Cube.intensity = Animate.Slide( 0.0, 0.7, "fall", time, 0, 2000 );
            if( time >= 2000 ) return true;
         });

         Animate.Start( "cube_rotate", ( time, elapsed ) => {
            let distance = Animate.Slide( 1000, 65, "fall", time, 0, 1000 );
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

         let panel = document.createElement("div");
         panel.className = "panel";
         panel.style.width = "20vh";
         panel.style.height = "20vh";

         document.body.appendChild( panel );

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
         const newEye = [0, 0, -4];
         const originalDistance = m_state.cameraDistance;
         const originalAngle = m_state.cameraAngle % (Math.PI * 2);
         let desiredAngle = 0;
         if( desiredAngle < originalAngle ) {
            desiredAngle += Math.PI * 2;
         }
         Animate.Start( "cube_zoom", ( time, elapsed ) => {
            //m_state.cameraAngle += elapsed * 0.0006;
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
