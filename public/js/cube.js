import hc from "./hc/hc.js";
import Smath from "./smath.js";
import Camera from "./camera.js";
///////////////////////////////////////////////////////////////////////////////

let m_packer, m_buffer, m_shader;

let m_intensity = 0;
let m_color = [0, 0, 0];

let m_zNear          = 0.0;
let m_zFar           = 1000.0;
let m_zNearIntensity = 1.0;
let m_zFarIntensity  = 1.0;


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
   
   m_shader = new hc.Shader();
   await Promise.all( [
      m_shader.AttachFromURL( "shaders/cube.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/cube.f.glsl", "fragment" ),
   ]);

   m_shader.Link();
}

//-----------------------------------------------------------------------------
function SetColor( color ) {
   Smath.Copy( m_color, color );
}

//-----------------------------------------------------------------------------
function Render( matProjView, screenSize ) {
   m_shader.Use();

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

   const [cameraEye] = Camera.Get();

   let geometryT = [];
   for( const g of geometry ) {
      const [x, y, z, w] = Smath.MultiplyMatrixAndPoint( matProjView, g );
      let d = Smath.Distance( g, cameraEye );
      d -= m_zNear;
      d /= (m_zFar - m_zNear);
      d = d < 0 ? 0 : d;
      d = d > 1 ? 1 : d;
      d = m_zNearIntensity + (m_zFarIntensity - m_zNearIntensity) * d;
      
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
   
   const a_position = m_shader.GetAttribute( "a_position" );
   hc.Context.EnableVertexAttribArrays( [ a_position ] );
   m_buffer.Bind();
   hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );
   hc.Context.DisableVertexAttribArrays( [ a_position ] );
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

