// The dot particles.
// Very cool stuff.
// (C) 2020 Mukunda Johnson
import hc                    from "./hc/hc.js";
import Camera                from "./camera.js";
import Smath                 from "./smath.js";
import Animate               from "./animate.js";
import {GetDeviceDimensions} from "./index.js";
///////////////////////////////////////////////////////////////////////////////

// The main particle shader.
let m_shader;
// The vertex buffer which contains the particle positions.
let m_buffer;
// Contains 4 vertexes that are a triangle strip for a single quad. This is
// instanced for each particle. (We can probably save a bit on our massive
// dot computations by using 4 vertexes per rather than six.)
let m_bufferShape;

// This is used to control particle translation. They all move slowly upward
// and wrap at the top.
let m_time = 0;
let m_time_elapsed = 0;

// Our own little backbuffer. I don't really think this looks that great, but
// I can't just let all that work go to waste! We use it mostly at the start
// swirly phase.
let m_renderTexture = null;
let m_frameBuffer   = null;

// I find it hard to believe that there are 15000 particles.
// Original tests were using like 500.
const m_particleCount = 15000;

// postdot shader is what colors the particles and then draws them onto the
// screen. It could do more post-processing, but that's all it does basically.
let m_postdotShader;
// Fade shader is what applies a fading function (multiply by factor) to our
// framebuffer.
let m_fadeShader;
let m_fade_factor = new Animate.Slider( 0.1, 50.0 );
let m_time_scale  = new Animate.Slider( 0.1, 1.0 );

// The color of the particles (set by the current color scheme).
let m_color = [1,1,1];

// Where the mouse is. Particles are attracted towards this point. It's kinda
// weird because there is no 3d point - it works in screen coordinates.
//
// 0,0 is the center of the screen, -1 to 1 are the edges. Horizontal coordinate
// is also -1,1, and represents the full range (multiply by aspect ratio for
// actual distance).
let m_mouse = [0,0];
let m_mouse_pressure = 0.0;
let m_mouse_desired_pressure = 0.0;
let m_mouse_pressure_slide_speed = 250.0;

async function Setup() {

   {
      const packer = new hc.Packer( "fff" );
      const spaceSize = 120.0;

      for( let i = 0; i < m_particleCount; i++ ) {
         let x = (Math.random() - 0.5) * spaceSize;
         let y = (Math.random() - 0.5) * spaceSize;
         let z = (Math.random() - 0.5) * spaceSize;

         // so basically after testing this to death, I think tiny looks good.
         // The ** 16 is to make larger particles very rare.
         let size = 0.05 + (Math.random() ** 16) * 0.05;
         packer.Push( [ x, y, z, size ] );
      }

      m_buffer = new hc.Buffer();
      m_buffer.Load( packer.Buffer(), hc.gl.STATIC_DRAW );
   }

   {
      // This is the shape of the particles, a simple square.
      const packer = new hc.Packer( "ff" );
      let source = [
         [1, 1], [-1, 1], [1, -1], [-1, -1]
      ];
      for( const s of source )
         packer.Push( s );

      m_bufferShape = new hc.Buffer();
      m_bufferShape.Load( packer.Buffer(), hc.gl.STATIC_DRAW );
   }

   m_shader        = new hc.Shader();
   m_postdotShader = new hc.Shader();
   m_fadeShader    = new hc.Shader();
   // This many requests makes me nervous.
   await Promise.all([
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

   // Handle updating certain sliding variables.
   Animate.Start( "dots_time", (time, elapsed) => {
      m_time_elapsed = elapsed;
      m_time += elapsed * m_time_scale.update( elapsed/1000 );
      
      let d = 0.1 ** (elapsed / m_mouse_pressure_slide_speed);
      m_mouse_pressure += (m_mouse_desired_pressure - m_mouse_pressure) * (1-d);
   });

   const activateDotTouch = ( x, y ) => {
      let [width, height] = GetDeviceDimensions();
      x = (x / width - 0.5) * 2;
      y = (y / height - 0.5) * 2;
      m_mouse[0] = x;
      m_mouse[1] = -y;
      m_mouse_desired_pressure = 1.0;
      m_mouse_pressure_slide_speed = 250.0;
   };

   // Setting the mouse coordinate from touches and mouse moves.
   if( "ontouchstart" in window ) {
      window.addEventListener( "touchstart", e => {
         for( const t of e.changedTouches ) {
            activateDotTouch( t.clientX, t.clientY );
            break;
         }
      });

      window.addEventListener( "touchmove", e => {
         for( const t of e.changedTouches ) {
            activateDotTouch( t.clientX, t.clientY );
            break;
         }
      });

      // When all touches are finished, hide the dot sucker.
      window.addEventListener( "touchend", e => {
         console.log( e.touches.length );
         if( e.touches.length == 0 ) {
            console.log( "setting to zero from touchend" );
            m_mouse_desired_pressure = 0.0;
            m_mouse_pressure_slide_speed = 250.0;
         }
      });
   } else {
      // For non-touchscreen devices (hopefully), just use the mouse position.
      document.addEventListener( "mousemove", (e) => {
         activateDotTouch( e.clientX, e.clientY );
      });
   
   }

   // Create render buffer.
   // Call this again if the window resizes.
   CreateRenderBuffer();
   
   window.addEventListener( "resize", e => {
      HandleResize();
   });
}

//-----------------------------------------------------------------------------
function HandleResize() {
   CreateRenderTexture();
   BindRenderTexture();
}

//-----------------------------------------------------------------------------
function BindRenderTexture() {

   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, m_frameBuffer );

   hc.gl.framebufferTexture2D(
      hc.gl.FRAMEBUFFER, hc.gl.COLOR_ATTACHMENT0,
      hc.gl.TEXTURE_2D, m_renderTexture, 0
   );
   
   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, null );
}

//-----------------------------------------------------------------------------
// Delete our old rendering surface and then create a new one.
function CreateRenderTexture() {
   // There might be a better way to do this. I seem to remember something to
   // resize textures.
   let dimensions = GetDeviceDimensions();
   
   let originalTexture = m_renderTexture;
   if( originalTexture ) requestAnimationFrame( () => {
      hc.gl.deleteTexture( originalTexture );
   });

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

}

//-----------------------------------------------------------------------------
function CreateRenderBuffer() {
   CreateRenderTexture();

   m_frameBuffer = hc.gl.createFramebuffer();
   BindRenderTexture();
}

//-----------------------------------------------------------------------------
function Render( viewProj ) {

   let [deviceWidth, deviceHeight] = GetDeviceDimensions();
   // Render to our temporary buffer.
   hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, m_frameBuffer );
   hc.gl.enable( hc.gl.BLEND );

   // If fadeFactor is zero, then we skip this and just do a glClear in the
   // next block.
   let fadeFactor = m_fade_factor.update( m_time_elapsed / 1000 );
   if( fadeFactor > 0 ) { 
      // Clear operation.

      // DST_COLOR multiplies everything together, so our color is the fade
      // factor, to be multiplied by the existing pixels in the buffer.
      hc.gl.blendFunc( hc.gl.DST_COLOR, hc.gl.ZERO );
      m_fadeShader.Use();
      const u_factor = m_fadeShader.GetUniform( "u_factor" );
      
      // Uh... probably some random math here, but it looks like "fade to 20%
      // of original value over fadeFactor milliseconds".
      // It's kinda ugly if things aren't sharp enough, as the lower values
      // get stuck. (I assume due to rounding the values.)
      hc.gl.uniform1f( u_factor, 0.2 ** (m_time_elapsed / fadeFactor) );
      
      const a_position = m_fadeShader.GetAttribute( "a_position" );
      hc.Context.EnableVertexAttribArrays( [a_position] );
      m_bufferShape.Bind();

      // Fullscreen fill.
      hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );
      hc.gl.drawArrays( hc.gl.TRIANGLE_STRIP, 0, 4 );
      
      // Cleanup.
      hc.Context.DisableVertexAttribArrays( [a_position] );
   }

   m_shader.Use();

   hc.gl.blendFunc( hc.gl.ONE, hc.gl.ONE );

   { // Set camera parameters.
      // Though the current shader doesn't need the up/right. It just works in
      // screen coordinates instead.
      const u_camera = m_shader.GetUniform( "u_camera" );
      hc.gl.uniformMatrix4fv( u_camera, false, viewProj );

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
   { // Time controls the translation of particles, and possibly other animated
      // values.
      const u_time = m_shader.GetUniform( "u_time" );
      hc.gl.uniform1f( u_time, m_time / 1000.0 );
   }


   { // Render 
      const a_position = m_shader.GetAttribute( "a_position" );
      const a_corner   = m_shader.GetAttribute( "a_corner" );
      hc.Context.EnableVertexAttribArrays( [a_position, a_corner] );

      m_buffer.Bind();
      hc.gl.vertexAttribPointer( a_position, 4, hc.gl.FLOAT, false, 16, 0 );

      // A value of 0 means 1 vertex per vertex.
      // A value of 1 means 1 vertex per 1 instance.
      hc.gl.aia.vertexAttribDivisorANGLE( a_position, 1 );
      m_bufferShape.Bind();
      // The 'corner' vertex attribute is the direction towards the four corners
      // of the shape of each particle.
      hc.gl.vertexAttribPointer( a_corner, 2, hc.gl.FLOAT, false, 8, 0 );

      //hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 6 );

      // Update other uniforms. mouse_pressure is set elsewhere with 
      // per-frame slides.
      const u_mouse = m_shader.GetUniform( "u_mouse" );
      const u_mouse_pressure = m_shader.GetUniform( "u_mouse_pressure" );
      const u_aspect = m_shader.GetUniform( "u_aspect" );
      hc.gl.uniform2f( u_mouse, m_mouse[0], m_mouse[1] );
      hc.gl.uniform1f( u_aspect, deviceWidth / deviceHeight );
      hc.gl.uniform1f( u_mouse_pressure, m_mouse_pressure );

      // If fadeFactor is 0, the above fading part was skipped, so just clear
      // it directly here.
      if( fadeFactor == 0 ) {
         hc.gl.clearColor( 0, 0, 0, 1.0 );
         hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );
      }

      // Instanced draw. m_particleCount instances times 4 vertexes
      // (one square per).
      hc.gl.aia.drawArraysInstancedANGLE(
         hc.gl.TRIANGLE_STRIP,
         0,
         4,
         m_particleCount
      );
      
      // Cleanup.
      hc.gl.aia.vertexAttribDivisorANGLE( a_position, 0 );
      hc.Context.DisableVertexAttribArrays( [a_position, a_corner] );
      // Render to the canvas.
      hc.gl.bindFramebuffer( hc.gl.FRAMEBUFFER, null );
   }

   // The post-shader.
   m_postdotShader.Use();

   { // Render to screen.
      
      const a_position = m_postdotShader.GetAttribute( "a_position" );
      hc.Context.EnableVertexAttribArrays( [a_position] );

      // Just a single fullscreen quad, we use the same vertexes as the
      // particles.
      m_bufferShape.Bind();
      hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 8, 0 );

      // Bind the backbuffer texture as our sampler.
      const u_sampler = m_postdotShader.GetUniform( "u_sampler" );
      hc.gl.bindTexture( hc.gl.TEXTURE_2D, m_renderTexture );
      hc.gl.uniform1i( u_sampler, 0 );
      
      // Setup uniforms - what was rendered already is grayscale, and we
      // color it in here. (I was planning on doing other effects, but this
      // seemed like what I wanted in the end.)
      const u_aspect = m_postdotShader.GetUniform( "u_aspect" );
      hc.gl.uniform1f( u_aspect, deviceWidth/deviceHeight );
      const u_color = m_postdotShader.GetUniform( "u_color" );
      hc.gl.uniform3fv( u_color, m_color, 0, 1 );
      
      hc.gl.drawArrays( hc.gl.TRIANGLE_STRIP, 0, 4 );

      // Cleanup.
      hc.Context.DisableVertexAttribArrays( [a_position] );
   }
}

//-----------------------------------------------------------------------------
// Change all particles' color.
function SetColor( color ) {
   Smath.Copy( m_color, color );
}

//-----------------------------------------------------------------------------
// 0 = no blur. 50 = blur for 50ms (ish).
// The screen will fade to 20% of intensity every factor milliseconds.
// Slow speeds don't look great due to rounding.
function SetFadeFactor( factor ) {
   m_fade_factor.desired = factor;
}

//-----------------------------------------------------------------------------
// How fast the particles move (float upward). 1.0 = normal.
function SetTimeScale( speed ) {
   m_time_scale.desired = speed;
}

///////////////////////////////////////////////////////////////////////////////
export default {
    Setup, Render, SetColor, SetFadeFactor, SetTimeScale, HandleResize
}