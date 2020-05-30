attribute vec4 a_position;
attribute vec2 a_corner;
uniform mat4 u_camera;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;
uniform float u_time;

varying lowp float f_intensity;
varying lowp vec2 f_uv;

void main(void) {
   float loopSize = 150.0;
   vec3 timeTranslate = vec3( 0.1, 1.0, 0.05 ) * u_time;
   vec3 tpos = a_position.xyz;// - u_cameraPos + vec3(loopSize / 2.0,loopSize / 2.0,loopSize / 2.0);
   tpos += vec3( loopSize / 2.0 ) + timeTranslate;
//   tpos.y += u_time * 1.2;
   tpos -= floor(tpos / loopSize) * loopSize;
   //tpos += u_cameraPos;
   tpos -= vec3(loopSize / 2.0);
   //vec3 tpos = a_position.xyz;
   {
      float deadZone = 3.0;
      float distanceToEye = distance( u_cameraPos, tpos );
      float i = distanceToEye - deadZone;

      float intensity = (distanceToEye - deadZone) / 10.0;
      intensity *= pow( 0.1, distanceToEye / 50.0 );
      f_intensity = clamp( intensity, 0.0, 1.0 );
   }
   f_uv = a_corner;

   vec3 vert = tpos;
   vert += u_cameraUp * (a_corner.y * a_position.w);
   vert += u_cameraRight * (a_corner.x * a_position.w);

   vec4 pos = u_camera * vec4( vert, 1.0 );
   
   gl_Position = pos;
}
