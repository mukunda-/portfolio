
varying lowp vec2 fragmentPoint;
uniform sampler2D u_sampler;

void main(void) {
   gl_FragColor = texture2D( u_sampler, (fragmentPoint + 1.0) / 2.0 );//vec4( 1.0,1.0,1.0, 1.0);
}
