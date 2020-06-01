precision mediump float;

const float PI = 3.1415926535897932384626433832795;

uniform lowp vec3 points[8];
uniform float aspect;

varying lowp vec2 fragmentPoint;
varying lowp vec3 fragmentAngle;

uniform lowp vec3 color;
uniform float intensity;


vec2 dist( vec3 a, vec3 b, vec2 e ) {
   // Create vectors, a->b, a->e, b->e
   /*
   vec2 AB = b.xy - a.xy;
   vec2 AE = e - a.xy;
   vec2 BE = e - b.xy;
   AB.x *= aspect;
   AE.x *= aspect;
   BE.x *= aspect;
  
   // Dot products.
   float AB_BE = (AB.x * BE.x + AB.y * BE.y);
   float AB_AE = (AB.x * AE.x + AB.y * AE.y);

   if( AB_BE > 0.0 ) {
      // Past B.
      float x = BE.x;
      return vec2( sqrt( x*x + BE.y * BE.y ), b.z );
   } else if( AB_AE < 0.0 ) {
      // Past A.
      float x = AE.x;
      return vec2( sqrt( x * x + AE.y * AE.y ), a.z );
   } else {
      // Perpendicular.
      float x1 = AB.x;
      float y1 = AB.y;
      float x2 = AE.x;
      float y2 = AE.y;
      float mod = sqrt(x1 * x1 + y1 * y1);
      return vec2( abs(x1 * y2 - y1 * x2) / mod, 1.0 );
   }*/
/*
   //stackoverflow is your friend
   vec2 AE = e - a.xy;
   //float A = e.x - a.x;
   //float B = e.y - a.y;
   vec2 AB = b.xy - a.xy;
   //float C = b.x - a.x;
   //float D = b.y - a.y;

   float dot = A * C + B * D;
   float len_sq = C * C + D * D;
   float param = -1.0;
   if( len_sq > 0.00001 ) //in case of 0 length line
      param = dot / len_sq;

   float xx, yy;

   if( param < 0.0 ) {
      xx = a.x;
      yy = a.y;
   } else if( param > 1.0 ) {
      xx = b.x;
      yy = b.y;
   } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
   }

   float dx = e.x - xx;
   float dy = e.y - yy;
   return vec2( sqrt(dx * dx + dy * dy), 1.0 );
*/
   float minaz = min( a.z, b.z ); 
   a.z = minaz;
   b.z = minaz;

   a.x *= aspect;
   b.x *= aspect;
   e.x *= aspect;
   //stackoverflow is your friend
   vec2 AE = e - a.xy;
   //float A = e.x - a.x;
   //float B = e.y - a.y;
   vec3 AB = b - a;
   //float C = b.x - a.x;
   //float D = b.y - a.y;

   float dotp = dot( AE, AB.xy );
   float len_sq = AB.x * AB.x + AB.y * AB.y;
   float param = -1.0;
   if( len_sq > 0.00001 ) //in case of 0 length line
      param = dotp / len_sq;

   vec3 lp; // line point

   if( param < 0.0 ) {
      lp = a;
   } else if( param > 1.0 ) {
      lp = b;
   } else {
      lp = a + AB * param;
   }

   //vec2 distance = e - lp;
   //float dx = e.x - xx;
   //float dy = e.y - yy;
   return vec2( distance( e, lp.xy ), lp.z );
}

float line_d( vec3 start, vec3 end ) {
   vec2 di = dist( start, end, fragmentPoint.xy );
   float d = di.x;
   float i = di.y;
   
   d *= 1.0;
   d -= 0.001; // for wider hot beam
   d = clamp( d, 0.0, 1.0 );
   d = 1.0-d;
   return (pow( d, 128.0 ) + pow( d, 8.0 )*0.17) * i;//0.0005, d );
}

void main() {
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

   i *= intensity;
   
   
   vec3 add = abs(normalize(fragmentAngle));// * 0.1;
   add = add * (add.y + 1.0) / 2.0;
   add.y *= 0.25;
   add = add * add;

   add = normalize(fragmentAngle);// * 0.1;
   float y = asin(add.y) / (PI / 2.0);
   //if( add.x == 0.0 ) add.x += 0.00001; // Is this needed?
   float h = atan( add.z, add.x ); // returns range -pi to pi

   float depthIntensity = max( -y * 0.3, 0.0 );
   vec3 depthsColor = vec3( 0.05, 0.6, 1.0 ) * depthIntensity;

   float leftColorIntensity = abs(h) / PI;
   float rightColorIntensity = 1.0 - leftColorIntensity;
   float hMult = (1.0 - abs(y)) * 0.15;
   leftColorIntensity = pow( leftColorIntensity, 1.0) * hMult;
   rightColorIntensity= pow( rightColorIntensity, 1.0) * hMult;
   vec3 leftColor = vec3( 1.0, 0.3, 0.2 ) * leftColorIntensity;
   vec3 rightColor = vec3( 0.0, 0.0, 1.0 ) * rightColorIntensity;

   vec3 backgroundShade = leftColor + rightColor + depthsColor;
   
   //gl_FragColor = vec4( backgroundShade, 1.0);
   gl_FragColor = vec4( color * i * (1.0 + backgroundShade * 8.0) + backgroundShade, 1.0);

   //gl_FragColor = vec4( color * i * (1.0 + add ) + add * 0.27, 1.0);
}
