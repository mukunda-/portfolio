precision mediump float;


varying lowp float f_intensity;
varying lowp vec2 f_uv;

void main(void) {
   //float d =  1.0 - length( f_uv ) + 0.03 ;
   //d *= f_intensity;
   float d = f_uv.x*f_uv.x+f_uv.y*f_uv.y;
   if( d > 1.0 ) discard;
   //d = pow(1.0 - sqrt(d), 0.15) + pow(1.0 - sqrt(d), 4.0) * 2.5 ;
   //d = pow(1.0-max(abs(f_uv.x), abs(f_uv.y)), 16.0) * 16.0;
   //d = pow(d, 4.0) + 
       //pow(d, 2.0) * 0.5 + 
    //   pow(d, 1.0) * 0.25;

   //d *= d;
   //gl_FragColor = vec4( vec3(f_intensity*0.2*d), 1.0 );//d, d, d, 1.0);
   gl_FragColor = vec4( vec3(f_intensity   )   , 1.0 );//d, d, d, 1.0);
}
