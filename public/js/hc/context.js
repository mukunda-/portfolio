// HC, a WebGL utility library.
// Copyright 2020 Mukunda Johnson <mukunda@mukunda.com>
///////////////////////////////////////////////////////////////////////////////
 
let gl = null; // WebGL context
let mainCanvas = null; // Canvas object

let canvasWidth  = 0; // Size of canvas.
let canvasHeight = 0;

/** ---------------------------------------------------------------------------
 * Initialize WebGL. `canvas_id` is an HTML element ID. `options` are directly
 *  passed to getContext() for the canvas.
 */
function Init( canvas_id, options ) {
   mainCanvas = document.getElementById( canvas_id );
   gl = null;
   
   try {
      // Try to grab the standard context. If it fails, fallback to
      //  experimental.
      gl = mainCanvas.getContext( "webgl", options )
              || mainCanvas.getContext( "experimental-webgl", options );
   }
   catch(e) {}
   
   // If we don't have a GL context, give up now
   if( !gl ) {
      alert( "Unable to initialize WebGL. Your browser may not support it." );
      console.log( "Failed to get WebGL context." );
      gl = null;
      return false;
   }
   
   return true;
}

/** ---------------------------------------------------------------------------
 * Resize the canvas.
 *
 * @param int width New width.
 * @param int height New height.
 */
function Resize( width, height ) {
   if( gl == null ) return;
   mainCanvas.width  = width;
   mainCanvas.height = height;
   gl.viewport( 0, 0, width, height );
   canvasWidth  = width;
   canvasHeight = height;
}

/** ---------------------------------------------------------------------------
 * Enable a list of vertex attribute arrays.
 *
 * @param array list List of vertex attribute array indexes to enable.
 */
function EnableVertexAttribArrays( list ) {
   for( var i = 0; i < list.length; i++ ) {
      gl.enableVertexAttribArray( list[i] );
   }
}

/** ---------------------------------------------------------------------------
 * Disable a list of vertex attribute arrays.
 *
 * @param array list List of vertex attribute array indexes to disable.
 */
function DisableVertexAttribArrays( list ) {
   for( var i = 0; i < list.length; i++ ) {
      gl.disableVertexAttribArray( list[i] );
   }
}

export {gl};

//-----------------------------------------------------------------------------
export default {
   Init, Resize, EnableVertexAttribArray, DisableVertexAttribArray,
   GetCanvas     : () => mainCanvas,
   GetCanvasSize : () => canvas
};
