precision mediump float;


varying lowp float f_intensity;
varying lowp vec2 f_uv;

void main(void) {
   //float d =  1.0 - length( f_uv ) + 0.03 ;
   //d *= f_intensity;
   float d = f_uv.x*f_uv.x+f_uv.y*f_uv.y;
   if( d > 1.0 ) discard;
   d = 1.0-sqrt(d);
   //d *= d;
   //gl_FragColor = vec4( vec3(f_intensity*0.2*d), 1.0 );//d, d, d, 1.0);
   gl_FragColor = vec4( vec3(f_intensity*d), 1.0 );//d, d, d, 1.0);
}
