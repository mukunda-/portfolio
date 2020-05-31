import hc from "./hc/hc.js";
import Camera from "./camera.js";
import Smath from "./smath.js";
import Animate from "./animate.js";

let m_buffer, m_shader;
let m_bufferShape;

let m_time = 0;
let m_time_elapsed = 0;

let m_renderTexture = null;
let m_frameBuffer   = null;

const m_particleCount = 15000;

let m_postdotShader;
let m_fadeShader;
let m_fade_factor = new Animate.Slider( 0.1, 150.0 );
let m_time_scale = new Animate.Slider( 0.1, 20.0 );

let m_color = [1,1,1];

async function Setup() {

   // one vertex per dot.
   // x|y|z

   {
      const packer = new hc.Packer( "fff" );

      for( let i = 0; i < m_particleCount; i++ ) {
         let x = (Math.random() - 0.5) * 120.0;
         let y = (Math.random() - 0.5) * 120.0;
         let z = (Math.random() - 0.5) * 120.0;
         let size = 0.05 + (Math.random() ** 16) * 0.05;//(0.75 + 2)
         //let size = 5+ (Math.random() ** 2) * (10)
         packer.Push( [ x, y, z, size ] );
      }

      //packer.Push([-1, -1, -1]);
      //packer.Push([1, 1, 1]);

      m_buffer = new hc.Buffer();
      m_buffer.Load( packer.Buffer(), hc.gl.STATIC_DRAW );
   }

   {
      const packer = new hc.Packer( "ff" );
      let source = [
         [1, 1], [-1, 1], [-1, -1], [-1, -1], [1, -1], [1, 1]
      ];
      for( const s of source )
         packer.Push( s );

      m_bufferShape = new hc.Buffer();
      m_bufferShape.Load( packer.Buffer(), hc.gl.STATIC_DRAW );

   }

   m_shader = new hc.Shader();
   m_postdotShader = new hc.Shader();
   m_fadeShader = new hc.Shader();
   await Promise.all( [
      m_shader.AttachFromURL( "shaders/dots.v.glsl", "vertex" ),
      m_shader.AttachFromURL( "shaders/dots.f.glsl", "fragment" ),
      m_postdotShader.AttachFromURL( "shaders/generic_fullscreen.v.glsl", "vertex" ),
      m_postdotShader.AttachFromURL( "shaders/postdot.f.glsl", "fragment" ),
      m_fadeShader.AttachFromURL( "shaders/generic_fullscreen.v.glsl", "vertex" ),
      m_fadeShader.AttachFromURL( "shaders/fade.f.glsl", "fragment" )
   ]);

   m_shader.Link();
   m_postdotShader.Link();
   m_fadeShader.Link();

   m_time = 0;

   Animate.Start( "dots_time", (time, elapsed) => {
      m_time_elapsed = elapsed;
      m_time += elapsed * m_time_scale.update( elapsed/1000 );
   });

   // Create render buffer.
   // call this again if the window resizes.
   CreateRenderBuffer();
}

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
function GetDeviceDimensions() {
   return [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),
           Math.max( document.documentElement.clientHeight, window.innerHeight || 0 )];
}

//-----------------------------------------------------------------------------
function CreateRenderBuffer() {
   let dimensions = GetDeviceDimensions();

   m_renderTexture = hc.gl.createTexture();
   hc.gl.bindTexture( hc.gl.TEXTURE_2D, m_renderTexture );

   hc.gl.texImage2D(
      hc.gl.TEXTURE_2D,
      // Mip level (just one level)
      0,
      // Internal format.
      hc.gl.RGB,
      // Dimensions.
      dimensions[0], dimensions[1],
      // Border size (which is???)
      0,
      // Texture format. (?)
      hc.gl.RGB,
      // Component type.
      hc.gl.UNSIGNED_BYTE,
      // Null to just create the texture with no data.
      null
   );

   hc.gl.texParameteri( hc.gl.TEXTURE_2D, hc.gl.TEXTURE_MIN_FILTER, hc.gl.LINEAR );
   hc.gl.texParameteri( hc.gl.TEXTURE_2D, hc.gl.TEXTURE_WRAP_S, hc.gl.CLAMP_TO_EDGE );
   hc.gl.texParameteri( hc.gl.TEXTURE_2D, hc.gl.TEXTURE_WRAP_T, hc.gl.CLAMP_TO_EDGE );

   m_frameBuffer = hc.gl.createFramebuffer();
   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, m_frameBuffer );

   hc.gl.framebufferTexture2D(
      hc.gl.FRAMEBUFFER, hc.gl.COLOR_ATTACHMENT0,
      hc.gl.TEXTURE_2D, m_renderTexture, 0
   );

   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, null );
}

//-----------------------------------------------------------------------------
function Render( projview ) {

   // Render to our temporary buffer.
   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, m_frameBuffer );
   hc.gl.enable( hc.gl.BLEND );

   let fadeFactor = m_fade_factor.update(m_time_elapsed/1000);
   if( fadeFactor > 0 ) { 
      // Clear operation.
      hc.gl.blendFunc( hc.gl.DST_COLOR, hc.gl.ZERO );
      m_fadeShader.Use();
      const u_factor = m_fadeShader.GetUniform( "u_factor" );
      
      hc.gl.uniform1f( u_factor, 0.2 ** (m_time_elapsed / fadeFactor) );
      
      const a_position = m_fadeShader.GetAttribute( "a_position" );
      hc.Context.EnableVertexAttribArrays( [a_position] );
      m_bufferShape.Bind();
      hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
      hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );
      
      // Cleanup.
      hc.Context.DisableVertexAttribArrays( [a_position] );
   }

   m_shader.Use();

   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ONE );

   { // Set camera parameters.
      const u_camera = m_shader.GetUniform( "u_camera" );
      hc.gl.uniformMatrix4fv( u_camera, false, projview );

      const camera = Camera.Get();
      const u_cameraPos = m_shader.GetUniform( "u_cameraPos" );
      const u_cameraUp = m_shader.GetUniform( "u_cameraUp" );
      const u_cameraRight = m_shader.GetUniform( "u_cameraRight" );
      hc.gl.uniform3fv( u_cameraPos, camera[0], 0, 1 );
      let cameraRight = Smath.Normalize( Smath.Cross( camera[2], camera[0] ));
      let cameraUp = Smath.Normalize( Smath.Cross( camera[0], cameraRight ));
      hc.gl.uniform3fv( u_cameraUp, cameraUp, 0, 1 );
      hc.gl.uniform3fv( u_cameraRight, cameraRight, 0, 1 );
   }
   { // Set time.
      const u_time = m_shader.GetUniform( "u_time" );
      hc.gl.uniform1f( u_time, m_time / 1000.0 );
   }


   { // Render 
      const a_position = m_shader.GetAttribute( "a_position" );
      const a_corner   = m_shader.GetAttribute( "a_corner" );
      hc.Context.EnableVertexAttribArrays( [a_position, a_corner] );
      m_buffer.Bind();
      hc.gl.vertexAttribPointer( a_position, 4, hc.gl.FLOAT, false, 16, 0 );
      hc.gl.aia.vertexAttribDivisorANGLE( a_position, 1 );
      m_bufferShape.Bind();
      hc.gl.vertexAttribPointer( a_corner, 2, hc.gl.FLOAT, false, 8, 0 );

      //hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );


      if( fadeFactor == 0 ) {
         hc.gl.clearColor( 0, 0, 0, 1.0 );
         hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );

      }

      hc.gl.aia.drawArraysInstancedANGLE(
         hc.gl.TRIANGLES,
         0,
         6,
         m_particleCount
      );
      
      // Cleanup.
      hc.gl.aia.vertexAttribDivisorANGLE( a_position, 0 );
      hc.Context.DisableVertexAttribArrays( [a_position, a_corner] );
      // Render to the canvas.
      hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, null );
   }

   m_postdotShader.Use();

   { // Render to screen.
      
      const a_position = m_postdotShader.GetAttribute( "a_position" );
      hc.Context.EnableVertexAttribArrays( [a_position] );

      m_bufferShape.Bind();
      hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );

      const u_sampler = m_postdotShader.GetUniform( "u_sampler" );
      hc.gl.bindTexture( hc.gl.TEXTURE_2D, m_renderTexture );
      hc.gl.uniform1i( u_sampler, 0 );
      
      let [deviceWidth, deviceHeight] = GetDeviceDimensions();
      const u_aspect = m_postdotShader.GetUniform( "u_aspect" );
      hc.gl.uniform1f( u_aspect, deviceWidth/deviceHeight );
      const u_color = m_postdotShader.GetUniform( "u_color" );
      hc.gl.uniform3fv( u_color, m_color, 0, 1 );
      

      hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );

      // Cleanup.
      hc.Context.DisableVertexAttribArrays( [a_position] );
   }
}

function SetColor( color ) {
   Smath.Copy( m_color, color );
}

function SetFadeFactor( factor ) {
   m_fade_factor.desired = factor;
}

function SetTimeScale( speed ) {
   m_time_scale.desired = speed;
}

export default {
    Setup, Render, SetColor, SetFadeFactor, SetTimeScale
}