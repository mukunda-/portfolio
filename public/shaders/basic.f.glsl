precision mediump float;
varying lowp vec2 f_uv;
varying lowp vec4 f_color;
uniform sampler2D u_sampler;

void main() {
    vec4 col = texture2D( u_sampler, f_uv );
    
    gl_FragColor = vec4(col.rgb , 1.0);//gl_FragCoord.xy / 128.0, 1.0, 1.0);//, f_uv.x, f_uv.y, 1.0 );
}
