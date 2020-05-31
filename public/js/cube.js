import hc from "./hc/hc.js";
import Smath from "./smath.js";
import Camera from "./camera.js";
import PerlinStream from "./PerlinStream.js";
import Animate from "./animate.js";
///////////////////////////////////////////////////////////////////////////////

let m_packer, m_buffer, m_shader;
let m_bufferVectors;

let m_intensity = 0;
let m_color = [0, 0, 0];

let m_zNear          = 0.0;
let m_zFar           = 1000.0;
let m_zNearIntensity = 1.0;
let m_zFarIntensity  = 1.0;

let m_jitter = [
   new PerlinStream( 4, 1.4 ),
   new PerlinStream( 4, 1.4 ),
   new PerlinStream( 4, 1.4 )
]

//-----------------------------------------------------------------------------
async function Setup() {
   m_packer = new hc.Packer( "ff" );

   // Full screen geometry.
   const vertexes = [
      [-1.0,  1.0],
      [-1.0, -1.0],
      [ 1.0, -1.0],
      [ 1.0, -1.0],
      [ 1.0,  1.0],
      [-1.0,  1.0]
   ];

   for( const v of vertexes ) m_packer.Push( v );
   
   m_buffer = new hc.Buffer();
   m_buffer.Load( m_packer.Buffer(), hc.gl.STATIC_DRAW );

   m_bufferVectors = new hc.Buffer();
   
   m_shader = new hc.Shader();
   await Promise.all( [
      m_shader.AttachFromURL( "shaders/cube.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/cube.f.glsl", "fragment" ),
   ]);

   m_shader.Link();

   Animate.Start( "cube_jitter", (time, elapsed) => {
      for( const j of m_jitter ) {
         j.update( elapsed / 2000 );
      }
   });
}

//-----------------------------------------------------------------------------
function SetColor( color ) {
   Smath.Copy( m_color, color );
}

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
function GetDeviceDimensions() {
   return [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),
           Math.max( document.documentElement.clientHeight, window.innerHeight || 0 )];
}

function GetAspect() {
   let [x,y] = GetDeviceDimensions();
   return x/y;
}

//-----------------------------------------------------------------------------
function Render( matProjView, screenSize ) {
   m_shader.Use();
   const a_position = m_shader.GetAttribute( "a_position" );
   const a_angles = m_shader.GetAttribute( "a_angles" );
   hc.Context.EnableVertexAttribArrays( [ a_position, a_angles ] );

   //   4_______7
   //   /      /|      1       -1
   // 0/_____3/ |      |       /
   // |5|____|__|6 -1<-+->1   /
   // | /    | /       |     /
   // |/_____|/       -1    1
   // 1      2
   //

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
      // Setup angles for background.
      
      let forward = Smath.Normalize( Smath.SubtractVectors( cameraTarget,cameraEye   ) );
      let left    = Smath.Normalize( Smath.Cross(cameraUp, forward) );
      let up      = Smath.Normalize( Smath.Cross(forward, left) );

      const aspect = GetAspect();
      //hc.gl.uniform1f( u_aspect, deviceWidth/deviceHeight );

      let points = [
         [aspect, 1, 1],
         [aspect, -1, 1],
         [-aspect, -1, 1],

         [-aspect, -1, 1],
         [-aspect, 1, 1],
         [aspect, 1, 1],
      ];

      let stan = Math.tan(45.0);

      let packer = new hc.Packer( "fff" );

      for( const p of points ) {
         let v = [];
         v[0] = p[0] * left[0] + p[1] * up[0] + p[2] * forward[0] * stan;
         v[1] = p[0] * left[1] + p[1] * up[1] + p[2] * forward[1] * stan;
         v[2] = p[0] * left[2] + p[1] * up[2] + p[2] * forward[2] * stan;
         v = Smath.Normalize( v );
         
         packer.Push(v );
      }
      
      m_bufferVectors.Load( packer.Buffer(), hc.gl.STREAM_DRAW );
         
      m_bufferVectors.Bind();
      hc.gl.vertexAttribPointer( a_angles, 3, hc.gl.FLOAT, false, 12, 0 );
   }

   // TODO: merge this again.
   let m2 = //Smath.MultiplyMatrices(
         //matProjView, 
         Smath.RotationMatrixFromYawPitchRoll(
               m_jitter[0].value*0.02, m_jitter[1].value*0.02, m_jitter[2].value *0.02 )
   //);

   let angle = cameraEye.slice();
   Smath.Snap( angle );
   let highlight = [];
   for( let i = 0; i < 8; i++ ) {
      highlight[i] = geometry[i][0] == angle[0] || geometry[i][1] == angle[1] || geometry[i][2] == angle[2];
   }
   //highlight[0] = angle[0] == -1 || angle[1] == 1 || angle[2] == 1;
   //highlight[0] = angle[0] == -1 || angle[1] == -1 || angle[2] == 1;

   let geometryT = [];
   for( const i in geometry ) {
      let g = geometry[i];

      let p1 = Smath.MultiplyMatrixAndPoint( m2, g );
      let [x,y,z,w] = Smath.MultiplyMatrixAndPoint( matProjView, p1 );
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
      const points = m_shader.GetUniform( "points" );
      hc.gl.uniform3fv( points, geometryT, 0, 8 );
      const u_aspect = m_shader.GetUniform( "aspect" );
      hc.gl.uniform1f( u_aspect, screenSize[0] / screenSize[1] );

      const uColor = m_shader.GetUniform( "color" );
      const uIntensity = m_shader.GetUniform( "intensity" );
      
      hc.gl.uniform3fv( uColor, m_color, 0, 1 );
      hc.gl.uniform1f( uIntensity, m_intensity );
   }
   
   hc.gl.enable( hc.gl.BLEND );
   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ONE );

   m_buffer.Bind();
   hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );
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

