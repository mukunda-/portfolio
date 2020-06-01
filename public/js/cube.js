// Handles the rotating cube.
//-----------------------------------------------------------------------------
import hc                    from "./hc/hc.js";
import Smath                 from "./smath.js";
import Camera                from "./camera.js";
import PerlinStream          from "./PerlinStream.js";
import Animate               from "./animate.js";
import {GetDeviceDimensions, FOV} from "./index.js";
///////////////////////////////////////////////////////////////////////////////

// This buffer is for a simple full-screen overlay. (2D vertexes at each
// corner).
let m_fullscreenBuffer;
// This buffer holds the corner vectors along the view frustum.
let m_bufferVectors;
// This is the compiled cube+background shader.
let m_shader;

// Cube color/brightness factor. 1 = normal. 0 = hidden.
let m_intensity = 0;

// The current cube color. The cube is rendered with additive blending, so
// 0 is transparent.
let m_color = [0, 0, 0];

//-----------------------------------------------------------------------------
// These intensity values are interpolated between the near and far distances
// provided. If a point is "far" distance away, then the far intensity is used.
// (And this clamps values past/before this range.)
//
// Currently we don't use the near/far parameters, and instead manually choose
// cube vertexes according to camera orientation.
let m_zNear          = 0.0;
let m_zFar           = 1000.0;
let m_zNearIntensity = 1.0;
let m_zFarIntensity  = 1.0;

//----------------------------------------------------------------------------
// Perlin noise streams for the hovering/jittery effect. Three for yaw, pitch,
// and roll (Euler angles).
let m_jitter = [
   new PerlinStream( 4, 1.4 ),
   new PerlinStream( 4, 1.4 ),
   new PerlinStream( 4, 1.4 )
]

//-----------------------------------------------------------------------------
// Called at startup.
async function Setup() {
   const packer = new hc.Packer( "ff" );

   // Full screen geometry.
   const vertexes = [
      [-1.0,  1.0],
      [-1.0, -1.0],
      [ 1.0, -1.0],
      [ 1.0, -1.0],
      [ 1.0,  1.0],
      [-1.0,  1.0]
   ];

   for( const v of vertexes ) packer.Push( v );
   
   m_fullscreenBuffer = new hc.Buffer();
   m_fullscreenBuffer.Load( packer.Buffer(), hc.gl.STATIC_DRAW );

   m_bufferVectors = new hc.Buffer();
   
   m_shader = new hc.Shader();

   // We could probably do this better... like return this promise and then
   // finish up asyncrhonously. The important thing is that the rendering
   // needs to be delayed until its done.
   await Promise.all( [
      m_shader.AttachFromURL( "shaders/cube.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/cube.f.glsl", "fragment" ),
   ]);

   m_shader.Link();

   // I actually really like this animation utility.
   Animate.Start( "cube_jitter", (time, elapsed) => {
      for( const j of m_jitter ) {
         j.update( elapsed / 2000 );
      }
   });
}

//-----------------------------------------------------------------------------
// Sets the cube color. 3 color components in range [0.0, 1.0].
function SetColor( color ) {
   Smath.Copy( m_color, color );
}

//-----------------------------------------------------------------------------
// Returns the current aspect ratio.
function GetAspect() {
   // This implementation is kinda ugly.
   let [x,y] = GetDeviceDimensions();
   return x / y;
}

//-----------------------------------------------------------------------------
function Render( matProjView, screenSize ) {
   m_shader.Use();
   
   const a_position = m_shader.GetAttribute( "a_position" );
   const a_angles = m_shader.GetAttribute( "a_angles" );
   hc.Context.EnableVertexAttribArrays( [ a_position, a_angles ] );

   // Front face counter-clockwise, then the back face, 8 vertexes.
   // The cube is entirely fragment rendered, so there is no triangles/etc.
   //   4_______7
   //   /      /|      1       -1
   // 0/_____3/ |      |       /
   // |5|____|__|6 -1<-+->1   /
   // | /    | /       |     /
   // |/_____|/       -1    1
   // 1      2
   //

   // These are actual world-coordinates. The cube is 2 units wide.
   let geometry = [ 
      [-1,  1, 1],
      [-1, -1, 1],
      [ 1, -1, 1],
      [ 1,  1, 1],

      [-1,  1, -1],
      [-1, -1, -1],
      [ 1, -1, -1],
      [ 1,  1, -1]
   ];

   const [cameraEye,cameraTarget,cameraUp] = Camera.Get();

   {
      // Setup angles for background. This whole section is kinda rushed/messy
      // and I don't really know what's going on.
      let forward = Smath.Normalize( Smath.SubtractVectors(cameraTarget, cameraEye) );
      let left    = Smath.Normalize( Smath.Cross(cameraUp, forward) );
      let up      = Smath.Normalize( Smath.Cross(forward, left) );

      const aspect = GetAspect();

      let points = [
         [ aspect,  1, 1],
         [ aspect, -1, 1],
         [-aspect, -1, 1],

         [-aspect, -1, 1],
         [-aspect,  1, 1],
         [ aspect,  1, 1],
      ];

      let stan = Math.tan(FOV / 2 * Math.PI / 180);

      let packer = new hc.Packer( "fff" );

      for( const p of points ) {
         let v = [];
         v[0] = p[0] * left[0] * stan + p[1] * up[0] * stan + p[2] * forward[0];
         v[1] = p[0] * left[1] * stan + p[1] * up[1] * stan + p[2] * forward[1];
         v[2] = p[0] * left[2] * stan + p[1] * up[2] * stan + p[2] * forward[2];
         v = Smath.Normalize( v );
         
         packer.Push(v );
      }
      
      m_bufferVectors.Load( packer.Buffer(), hc.gl.STREAM_DRAW );
         
      m_bufferVectors.Bind();
      hc.gl.vertexAttribPointer( a_angles, 3, hc.gl.FLOAT, false, 12, 0 );
   }

   // Making a model-view-projection matrix. Model is just the jitter. View
   // is the camera, and then the projection.
   let m2 = Smath.MultiplyMatrices(
         matProjView, 
         Smath.RotationMatrixFromYawPitchRoll(
               m_jitter[0].value*0.02, m_jitter[1].value*0.02, m_jitter[2].value *0.02 )
   );

   // Get the camera and then snap it to a single axis. That points out which
   // face should be highlighted. Any vertex touching that face is selected.
   let angle = cameraEye.slice();
   Smath.Snap( angle );
   let highlight = [];
   for( let i = 0; i < 8; i++ ) {
      highlight[i] = geometry[i][0] == angle[0] || geometry[i][1] == angle[1] || geometry[i][2] == angle[2];
   }
   
   let geometryT = [];
   for( const i in geometry ) {
      let g = geometry[i];
      let [x,y,z,w] = Smath.MultiplyMatrixAndPoint( m2,g );
      let d = Smath.Distance( g, cameraEye );
      d -= m_zNear;
      d /= (m_zFar - m_zNear);
      d = d < 0 ? 0 : d;
      d = d > 1 ? 1 : d;
      d = m_zNearIntensity + (m_zFarIntensity - m_zNearIntensity) * d;

      if( highlight[i] ) {
         d = m_zNearIntensity;
      } else {
         d = m_zFarIntensity;
      }
      
      geometryT.push( x / w, y / w, d );
   }

   {
      // The vertexes are stored in a uniform array.
      const points = m_shader.GetUniform( "points" );
      hc.gl.uniform3fv( points, geometryT, 0, 8 );

      // Aspect is needed to determine how far a certain fragment is from a
      // given 2D vertex.
      const u_aspect = m_shader.GetUniform( "aspect" );
      hc.gl.uniform1f( u_aspect, screenSize[0] / screenSize[1] );

      // Fragment shader will also handle multiplying by color and intensity.
      const uColor = m_shader.GetUniform( "color" );
      const uIntensity = m_shader.GetUniform( "intensity" );
      hc.gl.uniform3fv( uColor, m_color, 0, 1 );
      hc.gl.uniform1f( uIntensity, m_intensity );
   }
   
   hc.gl.enable( hc.gl.BLEND );
   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ONE );

   // Going to draw a simple rectangle over the full screen. The fragment
   // shader handles the rest.
   m_fullscreenBuffer.Bind();
   hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );

   // Cleanup.
   hc.Context.DisableVertexAttribArrays( [ a_position, a_angles ] );
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Setup, Render,

   get color() {
      return m_color;
   },

   get intensity() {
      return m_intensity;
   },

   set intensity( i ) {
      m_intensity = i;
   },

   SetZScale( near, far, near_i, far_i ) {
      m_zNear          = near;
      m_zFar           = far;
      m_zNearIntensity = near_i;
      m_zFarIntensity  = far_i;
   },

   GetZScale() {
      return [
         m_zNear,
         m_zFar,
         m_zNearIntensity,
         m_zFarIntensity
      ];
   },

   SetColor
};

