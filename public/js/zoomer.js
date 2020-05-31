// ok zoomer

let m_image;

let m_showing = false;
let m_zoomed_image = null;

let m_ignoreClicks = false;

function Setup() {
   m_image = document.createElement( "img" );
   m_image.id = "zoomer_image";
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

function ShowImage( img ) {
   m_ignoreClicks = true;
   Unzoom();
   const windowWidth = Math.max( document.documentElement.clientWidth, window.innerWidth || 0 );
   const windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );

   m_zoomed_image = img;
   img.classList.add( "zoomhide" );
   m_image.src = img.src;
   let rect = img.getBoundingClientRect();
   
   let width = img.naturalWidth;
   let height = img.naturalHeight;
   let aspect = width/height;

   let left, top;

   if( width/height < windowWidth/windowHeight ) {
      width  = "auto";//windowHeight/height * width;
      height = "100%";//windowHeight;
      left   = windowWidth / 2 - width / 2;
      top    = 0;
   } else {
      height = "auto";//windowWidth/width * height;
      width  = "100%";//windowWidth;
      left   = 0;
      top    = windowHeight / 2 - height / 2;
   }

   //m_image.style.transform = `translateX(${rect.left}px, ${rect.top}px)`
   m_image.style.left      = `${(rect.left+rect.right)/2}px`;
   m_image.style.top       = `${(rect.top+rect.bottom)/2}px`;
   m_image.style.width     = `${rect.right-rect.left}px`;
   m_image.style.height    = `${rect.bottom-rect.top}px`;
   m_image.style.opacity   = `1.0`;
   m_image.style.transform = `translate( -50%, -50% )`;
   //m_image.style.filter    = "blur(16px)";
   m_image.transition      = null;

   m_image.style.imageRendering = img.hasAttribute('data-pixel') ? "pixelated" : null;
   

   //m_image.style.width = `100%`;
   //m_image.style.height = `auto`;//${height}px`;
   m_image.style.display = `block`;//${height}px`;
   //m_image.style.left = `0px`;
   //m_image.style.top = `50%`;
   //m_image.style.transform = `translateY(-50%)`;
   requestAnimationFrame( () => {
      m_image.style.opacity = `1`;
      m_image.style.transition = `left 0.25s, top 0.25s, width 0.25s, height 0.25s, opacity 0.4s, filter 0.4s`;
      m_image.style.filter = null;
      m_image.style.left = `50%`;
      m_image.style.top  = `50%`;
      m_image.style.width = width;//`${width}px`;
      m_image.style.height = height;//`${height}px`;
      m_showing = true;
      m_ignoreClicks = false;
   });
   
   /*
   console.log( img.naturalWidth );
   if( img.zoomed ) {
      img.zoomed = false;
      img.style.position = null;
      img.style.left = null;
      img.style.top = null;
   } else {
      img.zoomed = true;
      img.addClass( "zoomed" );
      
   }*/
}

export default {
   ShowImage, Setup
}
