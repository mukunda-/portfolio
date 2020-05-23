import hc from "./hc/hc.js";
import Smath from "./smath.js";
import Camera from "./camera.js";

let m_packer, m_buffer, m_shader;

let m_intensity = 0;
let m_color = [0, 0, 0];

async function Setup() {
   m_packer = new hc.Packer( "ff" );

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

function SetColor( color ) {
   Smath.Copy( m_color, color );
}

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

   let geometryT = [];
   for( const g of geometry ) {
      const [x, y, z, w] = Smath.MultiplyMatrixAndPoint( matProjView, g );
      geometryT.push( x / w, y / w );
   }

   {
      const points = m_shader.GetUniform( "points" );
      hc.gl.uniform2fv( points, geometryT, 0, 8 );
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
   }
};

