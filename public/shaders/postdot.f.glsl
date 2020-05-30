precision mediump float;
varying lowp vec2 fragmentPoint;
uniform sampler2D u_sampler;

void main(void) {
   //gl_FragColor = texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );
   //return;
   vec4 color = texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );
   float i = clamp( 1.0 - abs(0.5 - color.g) / 0.1, 0.0, 1.0 );
   i = pow( i, 2.0 ) ;
   gl_FragColor = vec4( i, 0.0, 0.0, 1.0 );//color;//texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );//vec4( 1.0,1.0,1.0, 1.0);
}
