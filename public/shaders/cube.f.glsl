// (C) 2020 Mukunda Johnson
// Cube/colors shader.
///////////////////////////////////////////////////////////////////////////////
precision mediump float;

const float PI = 3.1415926535897932384626433832795;

// The CPU side transforms the vertexes for us. These are the 8 corners of the
// cube.
uniform lowp vec3 points[8];

// Aspect ratio of the screen, width/height.
uniform float aspect;

// The coordinate of the current fragment we're working on.
varying lowp vec2 fragmentPoint;

// Vector that points towards the current fragment from the camera eye.
varying lowp vec3 fragmentAngle;

uniform lowp vec3 color;
uniform float intensity;

//-----------------------------------------------------------------------------
// Returns the distance between a line segment from `a` to `b` and the point
// `e`.
// `a` and `b` are vec3, with the third component being "intensity".
// 
vec2 dist( vec3 a, vec3 b, vec2 e ) {

   // We don't interpolate between these two, just use the minimum intensity.
   float minaz = min( a.z, b.z ); 

   a.x *= aspect;
   b.x *= aspect;
   e.x *= aspect;

   // I forgot where I sourced some of this from, but god damn is it magic.
   // I think it was tagged as community wiki.
   vec2 AE = e - a.xy;
   vec2 AB = b.xy - a.xy;

   float dotp = dot( AE, AB.xy );
   float len_sq = AB.x * AB.x + AB.y * AB.y;
   float param = -1.0;
   if( len_sq > 0.00001 ) // Epsilon.
      param = dotp / len_sq;

   vec2 lp; // line point - the point on the line segment that is closest to
            // `e`.

   if( param < 0.0 ) {
      lp = a.xy;
   } else if( param > 1.0 ) {
      lp = b.xy;
   } else {
      lp = a.xy + AB * param;
   }

   return vec2( distance( e, lp.xy ), minaz );
}

//-----------------------------------------------------------------------------
// Computes the pixel intensity based on the current fragment position and the
// given line segment.
float line_d( vec3 start, vec3 end ) {
   vec2 di = dist( start, end, fragmentPoint.xy );
   float d = di.x;
   float i = di.y;
   
   d *= 1.0;
   d -= 0.001; // For a wider HOT beam.
   d = clamp( d, 0.0, 1.0 );
   d = 1.0 - d;

   // I don't know what this is doing, but it looks cool.
   // Basically I want a very thin hot line and then a wider glow.
   return (pow( d, 128.0 ) + pow( d, 8.0 ) * 0.17) * i;
}

//-----------------------------------------------------------------------------
void main() {
   float i = 0.0;
   
   // Nice fullscreen battery juicer.
   i += line_d( points[0], points[1] );
   i += line_d( points[1], points[2] );
   i += line_d( points[2], points[3] );
   i += line_d( points[3], points[0] );
   i += line_d( points[4], points[5] );
   i += line_d( points[5], points[6] );
   i += line_d( points[6], points[7] );
   i += line_d( points[7], points[4] );

   i += line_d( points[0], points[4] );
   i += line_d( points[1], points[5] );
   i += line_d( points[2], points[6] );
   i += line_d( points[3], points[7] );

   i *= intensity;
   
   // OKAY so `i` contains the rendered cube, and now we add some background
   // colors. These are based on the angles.
   vec3 add = normalize(fragmentAngle);
   float y = asin(add.y) / (PI / 2.0);
   
   // WARNING: documentation states that if x is 0, it's undefined behavior.
   float h = atan( add.z, add.x ); // returns range -pi to pi

   // The depth is a color based on the pitch, with the floor aiming to look
   // like some kind of energy well in this mysterious abyss.
   float depthIntensity = max( -y * 0.3, 0.0 );
   vec3 depthsColor = vec3( 0.05, 0.6, 1.0 ) * depthIntensity;

   // Left and right are filled with a subtle red and blue glow.
   float leftColorIntensity = abs(h) / PI;
   float rightColorIntensity = 1.0 - leftColorIntensity;
   float hMult = (1.0 - abs(y)) * 0.15;
   leftColorIntensity *= hMult;
   rightColorIntensity *= hMult;
   vec3 leftColor = vec3( 1.0, 0.3, 0.2 ) * leftColorIntensity;
   vec3 rightColor = vec3( 0.0, 0.0, 1.0 ) * rightColorIntensity;

   // The computed shade. "upward" should be darkness.
   vec3 backgroundShade = (leftColor + rightColor + depthsColor);
   
   gl_FragColor = vec4(
               // The cube lines sort of radiate the light. This looks really
               // cool.
      color * i * (1.0 + backgroundShade * 8.0)
      // And then add the background shade on top of it all.
      + backgroundShade, 1.0);
}

///////////////////////////////////////////////////////////////////////////////