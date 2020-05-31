precision mediump float;


varying lowp float f_intensity;
varying lowp vec2 f_uv;

void main(void) {
   //float d =  1.0 - length( f_uv ) + 0.03 ;
   //d *= f_intensity;
   float d = f_uv.x*f_uv.x+f_uv.y*f_uv.y;
   if( d > 1.0 ) discard;


      float a = 0.0;
      if( d < 0.003 ) a = 1.0;
      
      d = 1.0 - d;
      d = pow( d, 4.0 ) * 0.03;
      d += a;

   gl_FragColor = vec4( vec3(f_intensity * d)    , 1.0 );//d, d, d, 1.0);
}
