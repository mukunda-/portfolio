// Handles coloring the page and exposing color utility functions.
//
import Cube from "./cube.js";
import Dots from "./dots.js";
///////////////////////////////////////////////////////////////////////////////

// Custom <style> element to insert our style overrides.
let m_style;

//-----------------------------------------------------------------------------
// Called at startup.
function Setup() {
   m_style = document.createElement( "style" );
   document.head.appendChild( m_style );
   m_style.sheet.insertRule( "#content a { color: #ffffff }" );
}

//-----------------------------------------------------------------------------
// Converts a RRGGBB hexcode to a color vector.
function FromHex( hex ) {
   return [
      parseInt( hex.substr(0, 2), 16 ) / 255,
      parseInt( hex.substr(2, 2), 16 ) / 255,
      parseInt( hex.substr(4, 2), 16 ) / 255,
   ];
}

//-----------------------------------------------------------------------------
// Converts a color vector to a RRGGBB hexcode.
function ToHex( color ) {
   let out = [];
   for( let i = 0; i < color.length; i++ ) {
      out[i] = Math.round(color[i] * 255).toString(16);
   }
   return out.join( "" );
}

//-----------------------------------------------------------------------------
// Linear interpolation between two colors. (No bounds checking!)
function Lerp( color1, color2, delta ) {
   return [
      color1[0] + (color2[0] - color1[0]) * delta,
      color1[1] + (color2[1] - color1[1]) * delta,
      color1[2] + (color2[2] - color1[2]) * delta
   ];
}

//-----------------------------------------------------------------------------
// Change the color scheme. `color` is the background/cube color. `linkcolor`
// is the color for links/anchors.
function Set( color, linkcolor ) {
   // Backdrop color is 1% of the color value.
   // (Changed my mind, the midnight blue is fine.)
   //hc.gl.clearColor( color[0] * 0.02, color[1] * 0.02, color[2]  * 0.02, 1.0 );
   Cube.SetColor( color );
   
   // Todo: change this index to not be hardcoded. Delete and then insert
   // before the index specified?
   m_style.sheet.deleteRule( 0 );
   m_style.sheet.insertRule( 
      `#content a { color: rgb( ${linkcolor[0]*255}, ${linkcolor[1]*255}, ${linkcolor[2]*255}` );

   Dots.SetColor( color );
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Setup, FromHex, ToHex, Set, Lerp
}
