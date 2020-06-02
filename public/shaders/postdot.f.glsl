// Post-processing shader for the dots.
// (C) 2020 Mukunda Johnson
///////////////////////////////////////////////////////////////////////////////
precision mediump float;
uniform sampler2D u_sampler;
uniform vec3 u_color;
uniform float u_aspect;

varying lowp vec2 fragmentPoint;

// Can do all kinds of fun things in here with the color, but... we're just
// applying a color.
void main() {
   vec2 uv = fragmentPoint;

   gl_FragColor = texture2D( u_sampler, (uv + 1.0) / 2.0 )
                * vec4( u_color, 1.0 );
   return;
}

///////////////////////////////////////////////////////////////////////////////