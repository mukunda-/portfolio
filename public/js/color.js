// Handles coloring the page and exposing color utility functions.
//
import hc from "./hc/hc.js";
import Cube from "./cube.js";
import Dots from "./dots.js";
///////////////////////////////////////////////////////////////////////////////

let m_style; // Style element.
let m_anchor_rule;

function Setup() {
   m_style = document.createElement( "style" );
   document.head.appendChild( m_style );
   m_style.sheet.insertRule( "a { color: #ffffff }" );
}

function FromHex( hex ) {
   return [
      parseInt( hex.substr(0, 2), 16 ) / 255,
      parseInt( hex.substr(2, 2), 16 ) / 255,
      parseInt( hex.substr(4, 2), 16 ) / 255,
   ];
}

function ToHex( color ) {
   let out = [];
   for( let i = 0; i < color.length; i++ ) {
      out[i] = Math.round(color[i] * 255).toString(16);
   }
   return out.join( "" );
}

function Lerp( color1, color2, delta ) {
   return [
      color1[0] + (color2[0] - color1[0]) * delta,
      color1[1] + (color2[1] - color1[1]) * delta,
      color1[2] + (color2[2] - color1[2]) * delta
   ];
}

function Set( color, linkcolor ) {
   // Backdrop color is 1% of the color value.
   //hc.gl.clearColor( color[0] * 0.02, color[1] * 0.02, color[2]  * 0.02, 1.0 );
   Cube.color[0] = color[0];
   Cube.color[1] = color[1];
   Cube.color[2] = color[2];
   
   m_style.sheet.deleteRule( 0 );
   m_style.sheet.insertRule( 
      `a { color: rgb( ${linkcolor[0]*255}, ${linkcolor[1]*255}, ${linkcolor[2]*255}` );

   Dots.SetColor( color );
}

export default {
   Setup,
   FromHex,
   ToHex,
   Set,
   Lerp
}