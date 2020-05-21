import hc from "./hc/hc.js";
///////////////////////////////////////////////////////////////////////////////

let currentScreenSize = [0, 0];

console.log( "%cwondering how this puppy works? 😏", 
   "background-color:#222; color:white; font-size: 1.4em" );

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
function getDeviceDimensions() {
   return [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),
           Math.max( document.documentElement.clientHeight, window.innerHeight || 0 )];
}

function ResizeViewport() {
   // The device/client viewport rectangle.
   const [vw, vh] = getDeviceDimensions();
   
   if( vw !== currentScreenSize[0] || vh !== currentScreenSize[1] ) {
      currentScreenSize = [vw, vh];
      hc.Context.Resize( vw, vh );
   }
}

function OnResize() {
	//var w = window.innerWidth & ~1;
   //var h = window.innerHeight & ~1;
   ResizeViewport();
}

async function Setup() {
   hc.Init( "background", {
      premultipliedAlpha : false,
   
      alpha   : false,
      depth   : false,
      stencil : false
   });

   document.getElementsByTagName("body")[0].addEventListener( "onresize", e => {
      OnResize();
   });
   ResizeViewport();
   
   hc.gl.clearColor( 0.01, 0.01, 0.05, 1.0 );
   hc.gl.disable( hc.gl.DEPTH_TEST );
   hc.gl.enable( hc.gl.BLEND );
   hc.gl.disable( hc.gl.CULL_FACE );
   
   let packer = new hc.Packer( "ff bbbb" );
   packer.Push( [0.0, 0.0, 255, 0, 0, 255] );
   packer.Push( [0.0, 1.0, 0, 255, 0, 255] );
   packer.Push( [1.0, -1.0, 0, 0, 255, 255] );
   
   let buffer = new hc.Buffer();
   buffer.Load( packer.Buffer(), hc.gl.STATIC_DRAW );
   
   let shader = new hc.Shader();
   await Promise.all( [
      shader.AttachFromURL( "shaders/vertex.glsl", "vertex" ),
      shader.AttachFromURL( "shaders/fragment.glsl", "fragment" ),
   ]);
   shader.Link();
   shader.Use();

   hc.gl.clear( hc.gl.COLOR_BUFFER_BIT );

   const a_position = shader.GetAttribute( "a_position" );
   const a_color    = shader.GetAttribute( "a_color" );
   hc.Context.EnableVertexAttribArrays( [ a_position, a_color ] );
   buffer.Bind();
   hc.gl.vertexAttribPointer( a_position, 2, hc.gl.FLOAT, false, 12, 0 );
   hc.gl.vertexAttribPointer( a_color, 4, hc.gl.UNSIGNED_BYTE, true, 12, 8 );
   hc.gl.drawArrays( hc.gl.TRIANGLES, 0, 3 );
   hc.Context.DisableVertexAttribArrays( [ a_position, a_color ] );
}

Setup();

document.getElementById( "bottomleft" ).classList.remove( "hide" );