precision mediump float;

uniform lowp vec2 points[8];
uniform float aspect;

varying lowp vec2 poop;

uniform lowp vec3 color;
uniform float intensity;

float dist( vec2 a, vec2 b, vec2 e ) {
   // Create vectors, a->b, a->e, b->e
   vec2 AB = b - a;
   vec2 AE = e - a;
   vec2 BE = e - b;
   AB.x *= aspect;
   AE.x *= aspect;
   BE.x *= aspect;
  
   // Dot products.
   float AB_BE = (AB.x * BE.x + AB.y * BE.y);
   float AB_AE = (AB.x * AE.x + AB.y * AE.y);

   if( AB_BE > 0.0 ) {
      // Past B.
      float x = BE.x;
      return sqrt( x*x + BE.y * BE.y );
   } else if( AB_AE < 0.0 ) {
      // Past A.
      float x = AE.x;
      return sqrt( x * x + AE.y * AE.y );
   } else {
      // Perpendicular.
      float x1 = AB.x;
      float y1 = AB.y;
      float x2 = AE.x;
      float y2 = AE.y;
      float mod = sqrt(x1 * x1 + y1 * y1);
      return abs(x1 * y2 - y1 * x2) / mod;
   }
}

float line_d( vec2 start, vec2 end ) {
   float d = dist( start, end, poop.xy );//vec2( 0.6, 0.9 ), vec2( -0.6, -0.6 ), poop.xy );
   d *= 1.0;
   //d -= 0.001;
   d = clamp( d, 0.0, 1.0 );
   d = 1.0-d;
   return pow( d, 145.0 ) + pow( d, 10.0 )*0.17;//0.0005, d );
}

void main(void) {
	//lowp vec4 texel = texture2D( u_sampler, f_uv );
	//if( texel.a == 0.0 ) discard;
	//texel *= f_color;
   //float d = 0.0;
   float i = 0.0;
   
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

   //float m = max( a, b );
   //m = max( m, c );

   //float dd = a + b + c + d + e + f + g + h;
   //d = max( d, m + 0.01 ) - 0.01;
           
   //i = clamp( i, 0.0, 1.0 );
   i *= intensity;//0.05;
   gl_FragColor = vec4( color * i, 1.0);
}
