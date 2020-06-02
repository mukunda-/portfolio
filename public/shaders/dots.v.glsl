// (C) 2020 Mukunda Johnson
// Dots shader.
///////////////////////////////////////////////////////////////////////////////
// This contains a 3D position and size. It holds the center of the dot, one
// per instance, and `w` holds the size. This is the size of the whole
//            rendering space. The spark/center is a tiny part of that.
attribute vec4 a_position;
// This is the direction to the corner of this instance, four per instance.
// (Rendered as trianglestrips.)
attribute vec2 a_corner;

// The modelViewProjection Matrix.
uniform mat4 u_camera;

// For primitive fog/fading out.
uniform vec3 u_cameraPos;

// Not used anymore. Instead scaling to screen coordinates rather than world
// coordinates.
uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;

// The current time - used for sliding the dots.
uniform float u_time;

// The current mouse position in screen coordinates [-1, 1] range both
// horizontal and vertical. Horizontal is scaled by `aspect`.
uniform vec2 u_mouse;
uniform float u_aspect;

// How much the dots will move towards the mouse. 1.0 = full pressure.
// 0.0 = disabled.
uniform float u_mouse_pressure;

// Outputs:
// `intensity` - Brightness factor.
// `uv` - Texture coordinate.
//        Textures aren't used, but UV is still used by the fragment shader to
//        generate the shape and colors.
varying lowp float f_intensity;
varying lowp vec2 f_uv;

// How big the dot space is, if a dot moves out of this range, it will wrap to
// the other side.
const float loopSize = 120.0;

// Any particles this close to the camera should be invisible.
const float deadZone = 3.0;

//----------------------------------------------------------------------------
void main() {
   // Translation from time passing.
   vec3 timeTranslation = vec3( 0.01, 0.4, 0.005 ) * u_time;
   vec3 tpos = a_position.xyz;

   // Basically a way to do modulo with positive/negative range here.
   tpos += vec3( loopSize / 2.0 ) + timeTranslation;
   tpos -= floor(tpos / loopSize) * loopSize;
   tpos -= vec3(loopSize / 2.0);
   
   {
      // Compute intensity.
      float distanceToEye = distance( u_cameraPos, tpos );

      float intensity = 1.0;
      intensity *= pow( 1.0 - min( length(tpos) / (loopSize / 2.0), 1.0 ), 1.0 );
      f_intensity = clamp( intensity, 0.0, 1.0 );
   }
   f_uv = a_corner;

   // Transform by the camera matrix.
   vec4 pos = u_camera * vec4( tpos, 1.0 );
   
   // And now we work in 2D space. We're going to make the dots be sucked
   // towards the mouse.
   vec2 mouse = (u_mouse - (pos.xy / pos.w));
   mouse.x *= u_aspect;
   float mouseLen = mouse.x * mouse.x + mouse.y * mouse.y;
   if( mouseLen < 0.5*0.5 ) {
      mouse.x /= u_aspect;
      pos.xy += mouse 
                * pow( (1.0 - sqrt(mouseLen)/0.5), 3.0 )
                * pos.w
                * u_mouse_pressure;
   }

   // And then offset this vertex by the corner. Ideally this would be in a
   // geometry shader and we do all the math above only once.
   vec2 corner = a_corner;
   corner.x /= u_aspect;
   pos.xy += corner.xy * a_position.w  * pos.w ;
   
   gl_Position = pos;
}

///////////////////////////////////////////////////////////////////////////////