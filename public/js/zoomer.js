// ok zoomer
// (C) 2020 Mukunda Johnson
//-----------------------------------------------------------------------------
import {GetDeviceDimensions} from "./index.js";
///////////////////////////////////////////////////////////////////////////////

// An image element which copies whatever image is clicked to zoom them outside
// of the layout.
let m_image;

// True if we are zooming an image.
let m_showing = false;

// The image element that is being used. It will be set to hidden.
let m_zoomed_image = null;

// For disabling the document click handler for one frame to not cancel the
// zoom immediately.
let m_ignoreClicks = false;

//-----------------------------------------------------------------------------
function Setup() {
   m_image = document.createElement( "img" );
   m_image.id        = "zoomer_image";
   m_image.className = "zoomer";
   document.body.appendChild( m_image );

   document.addEventListener( "keydown", e => {
      if( e.key == "Escape" ) {
         Unzoom();
      }
   });

   document.addEventListener( "click", e => {
      if( m_ignoreClicks ) return;
      Unzoom();
   });
}

//-----------------------------------------------------------------------------
// Exit zoomed mode.
function Unzoom() {
   if( m_zoomed_image ) {
      m_zoomed_image.classList.remove( "zoomhide" );
      m_zoomed_image = null;
   }
   if( m_showing ) {
      m_image.style.display = "none";
      m_showing = false;
   }
}

//-----------------------------------------------------------------------------
// Zoom an image.
function ShowImage( img ) {
   m_ignoreClicks = true;
   Unzoom();
   const [windowWidth,windowHeight] = GetDeviceDimensions();

   m_zoomed_image = img;
   m_image.src = img.src;
   let rect = img.getBoundingClientRect();
   
   let width = img.naturalWidth;
   let height = img.naturalHeight;
   let aspect = width/height;

   let left, top;

   // Give the image the best fit while preserving the aspect ratio.
   // If they resize the window, it will resize too, but it won't switch
   // aspect modes until the next zoom.
   if( aspect < windowWidth/windowHeight ) {
      width  = "auto";
      height = "100%";
      left   = windowWidth / 2 - width / 2;
      top    = 0;
   } else {
      height = "auto";
      width  = "100%";
      left   = 0;
      top    = windowHeight / 2 - height / 2;
   }

   // First we set the initial style to overlay over the original image.
   m_image.style.left      = `${(rect.left+rect.right)/2}px`;
   m_image.style.top       = `${(rect.top+rect.bottom)/2}px`;
   m_image.style.width     = `${rect.right-rect.left}px`;
   m_image.style.height    = `${rect.bottom-rect.top}px`;
   m_image.style.opacity   = `1.0`;
   m_image.style.transform = `translate( -50%, -50% )`;
   m_image.transition      = null;

   // The `data-pixel` attribute will turn on PIXELATED rendering.
   m_image.style.imageRendering = img.hasAttribute('data-pixel') ? "pixelated" : null;

   m_image.style.display = `block`;

   requestAnimationFrame( () => {
      // One frame after, we transition to a fullscreen display (whatever best
      // fits).
      img.classList.add( "zoomhide" );
      m_image.style.opacity    = `1`;
      m_image.style.transition = `left 0.25s, top 0.25s, width 0.25s, height 0.25s, opacity 0.4s, filter 0.4s`;
      m_image.style.filter     = null;
      m_image.style.left       = `50%`;
      m_image.style.top        = `50%`;
      m_image.style.width      = width;
      m_image.style.height     = height;
      m_showing                = true;
      m_ignoreClicks           = false;
   });
}

///////////////////////////////////////////////////////////////////////////////
export default {
   ShowImage, Setup
}
