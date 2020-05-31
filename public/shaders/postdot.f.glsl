precision mediump float;
varying lowp vec2 fragmentPoint;
uniform sampler2D u_sampler;
uniform vec3 u_color;
uniform float u_aspect;

void main(void) {
   float d = 1.0;//length( vec2(fragmentPoint.x * u_aspect, fragmentPoint.y) );
   vec2 uv = fragmentPoint * (1.0 - length(fragmentPoint) * 0.15);
   //fragmentPoint = fragmentPoint * 1.5;
   //d = d*d;//pow(d,2.0);
   gl_FragColor = texture2D( u_sampler, (uv + 1.0) / 2.0 ) * vec4(u_color,1.0) * d*d;
   return;
   //vec4 color = texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );
   //float i = clamp( 1.0 - abs(0.5 - color.g) / 0.1, 0.0, 1.0 );
   //i = pow( i, 2.0 ) ;
   //gl_FragColor = vec4( i, 0.0, 0.0, 1.0 );//color;//texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );//vec4( 1.0,1.0,1.0, 1.0);
}
