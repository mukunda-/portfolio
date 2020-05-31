attribute vec4 a_position;
attribute vec2 a_corner;
uniform mat4 u_camera;
uniform vec3 u_cameraPos;
uniform vec3 u_cameraRight;
uniform vec3 u_cameraUp;
uniform float u_time;

uniform vec2 u_mouse;
uniform float u_aspect;

varying lowp float f_intensity;
varying lowp vec2 f_uv;

void main(void) {
   float loopSize = 120.0;
   vec3 timeTranslate = vec3( 0.01, 0.4, 0.005 ) * u_time;
   vec3 tpos = a_position.xyz;// - u_cameraPos + vec3(loopSize / 2.0,loopSize / 2.0,loopSize / 2.0);
   tpos += vec3( loopSize / 2.0 ) + timeTranslate;
   tpos -= floor(tpos / loopSize) * loopSize;
   tpos -= vec3(loopSize / 2.0);
   //vec3 tpos = a_position.xyz;
   {
      float deadZone = 3.0;
      float distanceToEye = distance( u_cameraPos, tpos );
      float i = distanceToEye - deadZone;

      float intensity = 1.0;//min( (distanceToEye - deadZone) / 10.0, 1.0 );// (distanceToEye - deadZone) / 10.0;
      //intensity *= 1.0 - pow( length(tpos) / (loopSize / 2.0), 32.0 );
      intensity *= pow( 1.0 - min( length(tpos) / (loopSize / 2.0), 1.0 ), 1.0 );
      //intensity *= min( 1.0, pow( (intensity - 10.0) / 50.0, 2.0) );
      f_intensity = clamp( intensity, 0.0, 1.0 ) * 0.4;
      
   }
   f_uv = a_corner;

   

   vec4 center = u_camera * vec4( tpos, 1.0 );
   vec2 mouse = (u_mouse - center.xy/center.w);
   mouse.x *= u_aspect;

   float lenToMouse = length(mouse);
   //if( lenToMouse < 0.2 ) {
      mouse = mouse * 0.99 * pow( 0.5, lenToMouse / 0.2 ) * center.w / 3.0;
      //tpos += u_cameraUp
   ///} else {
   //   mouse = vec2( 0.0 );
   //}
   //mouse = mouse*mouse;
   
   vec3 vert = tpos;
    //+ u_cameraUp * mouse.y + u_cameraRight * mouse.x;
   vert += u_cameraUp * (a_corner.y * a_position.w + mouse.y);
   vert += u_cameraRight * (a_corner.x * a_position.w + mouse.x);

   vec4 pos = u_camera * vec4( vert, 1.0 );
   
   gl_Position = pos;
}
