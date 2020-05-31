// ROLLER.JS by Mukunda Johnson (www.mukunda.com)
//-----------------------------------------------------------------------------
import Camera  from "./camera.js";
import Smath   from "./smath.js";
import Animate from "./animate.js";
import Arrows  from "./arrows.js";
import Color   from "./color.js";
import Zoomer  from "./zoomer.js";
///////////////////////////////////////////////////////////////////////////////

//-----------------------------------------------------------------------------
// SCROLL variables are for "scrolling" mode, where the cube can be turned
//  vertically.
// SWIVEL variables are for "swivel" mode, where the cube can be turned
//  horizontally.
//-----------------------------------------------------------------------------
// Camera origin angle (vector pointing outward from the center of the cube).
// GetCameraRotation rotates this downward m_scrollAngle degrees, oriented
//  by m_scrollUpVector.
let m_scrollCam;

// Camera orientation (sky/up vector).
let m_scrollUpVector;

// The angle to lean downward from the starting vector.
let m_scrollAngle = 0;

// This slides towards desiredScroll, depending on certain parameters, like
//  where the input came from. Touch events should not have any delay, where
//                                wheel and arrow events should have a little.
let m_currentScroll = 0;
let m_desiredScroll = 0;

// The panel index that is selected to be shown.
let m_currentPanel = 0;

//-----------------------------------------------------------------------------
// True if we are in swivel mode - i.e. horizontal rotation mode.
let m_swivelMode = false;

// This is the panel that we started on, where an offset of 0 degrees rotation
//                                        means m_currentPanel will equal this.
let m_swivelOrigin = 0;

let m_swivelOffset = 0;
let m_swivelDesiredOffset = 0;


// Which direction is UP for when we're turning, aka the rotation axis.
// This slides in towards a aligned position from the last scroll-camera
//  orientation.
let m_swivelUpVector         = [0, 1, 0];
// Exposed time from the animate callback.
let m_swivelAnimateTime      = 0;
// The last time an action was taken (which resets the time it takes to switch
//                                                        back to scroll mode).
let m_swivelTurnTime        = 0;

let m_arrowScroll = 0;

let m_verticalScrollSlide = 0.1;

let m_touchingSwivel = false;
let m_touchingSwivelTime = 0;
let m_swivelTouchSwing = 0;

//-----------------------------------------------------------------------------
// This keeps track of videos that enter the content view range, indexed by
//  their IDs.
let m_activeVideos = {}

function Setup() {
   UpdateColorTheme( 0, 0 );
}

function Start() {
   let [eye] = Camera.Get();
   m_scrollCam = eye;
   Smath.Snap( m_scrollCam, 1.0 );
   m_scrollUpVector = [0, 1, 0];

   let fov = 45.0;
   let cubedistance = 3;
   let cubesize = 2;
   let vrange = Math.tan( fov / 2 * Math.PI / 180 ) * cubedistance;
   const content = document.getElementById( "content" );

   content.style.top = (vrange - cubesize/2) * 50 / vrange + "vh";
   content.style.bottom = (vrange - cubesize/2) * 50 / vrange + "vh";
   content.style.display = "block";

   StartFlicker();
   //LoadContent( "panel1" );

   window.addEventListener( "scroll", e => {
      SetDesiredScroll( PixelsToVH(window.scrollY) );
   });

   window.addEventListener( "mouseup", e => {
      if( e.button == 0 ) {
         // This is just in general to avoid stuck arrow buttons.
         m_arrowScroll = 0;
         //console.log( "VERIFY ME!" ); done.
      }
   });
   window.addEventListener( "touchend", e => {
      m_arrowScroll = 0;
   });

   SetupSwiping();

   // Replace this with native scrolling of element.

   document.addEventListener( "wheel", ( e ) => {
      m_verticalScrollSlide = 0.1;
      /*
      if( e.deltaY > 0 ) {
         Scroll( 5 );
      } else {
         Scroll( -5 );
      }*/
   });

   // Replace this with native scrolling of element.
   document.addEventListener( "keydown", ( e ) => {
      if( !e.repeat ) {
         if( e.key == "ArrowDown" ) {
            // down
            //m_keyNav = KEYNAV_DOWN;
            m_arrowScroll = 1;
            m_verticalScrollSlide = 0.1;
            e.preventDefault();
         } else if( e.key == "ArrowUp" ) {
            // up arrow
            //m_keyNav = KEYNAV_UP;
            m_arrowScroll = -1;
            m_verticalScrollSlide = 0.1;
            e.preventDefault();
         } else if( e.key == "ArrowLeft" ) {
            PanelLeft();
         } else if( e.key == "ArrowRight" ) {
            PanelRight();
         } else if( e.key == "PageDown" || e.key == ' ' ) {
            ScrollDownPage();
            e.preventDefault();
            
            m_verticalScrollSlide = 0.5;
            // TODO
         } else if( e.key == "PageUp" ) {
            ScrollUpPage();
            e.preventDefault();
            m_verticalScrollSlide = 0.5;
         }
      }
   });
   document.addEventListener( "keyup", ( e ) => {
      if( e.key == "ArrowDown" || e.key == "ArrowUp" ) {
         m_arrowScroll = 0;
         //m_keyNav &= ~KEYNAV_DOWN;
      } else if( e.key == "ArrowUp" ) {
         //m_keyNav &= ~KEYNAV_UP;
      }
   });

   UpdateLeftRightArrows();
   StartSwivelMode( "none", 0 );

   //Animate.Start( "roller", OnAnimate );
}

function SetupSwiping() {
   const touches = {
   };

   // SWIPING.
   window.addEventListener( "touchstart", e => {
      //if( !m_swivelMode ) {
      //   RotateWithTouch( 0 );
      //}
      m_verticalScrollSlide = 0.001; // near instant for touch interfaces.
      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         touches[touch.identifier] = {
            startX: touch.clientX,
            startY: touch.clientY
         }
      }
      
   });

   window.addEventListener( "touchmove", e => {

      const windowWidth = Math.max( document.documentElement.clientWidth, window.innerWidth || 0 );
      const windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );

      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         let tdata = touches[touch.identifier];
         if( !tdata ) return;
         let x = touch.clientX - tdata.startX;
         let y = touch.clientY - tdata.startY;

         //if( !m_swivelMode ) {


            const swipeThreshold = Math.min( windowWidth * 0.3, windowHeight * 0.3 );

            if( Math.abs(y) > windowHeight * 0.3 ) {
               // This swipe went out of range.
               delete touches[touch.identifier];
               continue;
            }

            if( x < -swipeThreshold && Math.abs(y) / Math.abs(x) < Math.tan(10) ) {
               tdata.startx = touch.clientX;
               tdata.starty = touch.clientY;
               PanelRight();
               delete touches[touch.identifier];
            } else if( x > swipeThreshold && Math.abs(y) / Math.abs(x) < Math.tan(10) ) {
               tdata.startx = touch.clientX;
               tdata.starty = touch.clientY;
               PanelLeft();
               delete touches[touch.identifier];
            }
         //} else {
         //   tdata.startX = touch.clientX;
         //   tdata.startY = touch.clientY;
         //   RotateWithTouch( -x );
         //}
      }
      
   });

   window.addEventListener( "touchend", e => {
      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         delete touches[touch.identifier];
      }

      //console.log( e.changedTouches.length, e.touches.length)
     // if( e.touches.length == 0 ) {
     //    // finished all touches.
      //   StopRotateTouch();
     // }
      
   });
}

function StartPanelDisplay() {
   {
      const [eye, , up] = Camera.Get();
      m_scrollCam = eye;
      Smath.Snap( m_scrollCam, 1.0 );
      m_scrollUpVector = up; //[0, 1, 0];
      Smath.Snap( m_scrollUpVector, 1.0 );
   }

   const panel = GetPanelContent( m_currentPanel );

   const content = document.getElementById( "content" );

   const header_element = `<h2 class="header">${panel.title}</h2>`

   content.innerHTML = panel.html;

   let firstPage = true;

   for( const page of content.getElementsByTagName("section") ) {
      if( firstPage ) {
         page.innerHTML = header_element + page.innerHTML;
         firstPage = false;
      }
      page.innerHTML = `<div class="inner">${page.innerHTML}</div>`;
   }

   for( const a of content.getElementsByTagName( "a" )) {
      a.setAttribute( "target", "_blank" );
   }

   for( const yt of content.getElementsByClassName( "youtube" )) {
      yt.isYoutube = true;
      yt.player = new YT.Player( yt.id, {
         events: {
            onReady() {
               yt.ytready = true;
            }
         }
      });
   }

   for( const img of content.getElementsByTagName( "img" )) {
      
      if( img.classList.contains("zoomable") ) {
         img.addEventListener( "click", () => {
            Zoomer.ShowImage( img );
         });
      }
   }

   content.classList.remove( "slideleft" );
   content.classList.remove( "slideright" );
   content.classList.add( "show" );

   SetupContentPadding();

   m_swivelMode = false;
   UpdateBigText();

   m_currentScroll = 0;
   m_desiredScroll = 0;
   m_scrollAngle   = 0;
   content.scrollTop = 0;

   UpdateUpDownArrows();

   window.scrollTo( 0, 0 );
   UpdateScrollSpace();

   m_activeVideos = {};

   Animate.Start( "roller", OnAnimate );
}

let m_currentScrollHeight = 0;

function UpdateScrollSpace() {
   let windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
   // [Math.max( document.documentElement.clientWidth, window.innerWidth || 0 ),


   //let sh1 = document.documentElement.scrollHeight - document.documentElement.clientHeight;
   let sh2 = content.scrollHeight - content.offsetHeight;

   if( m_currentScrollHeight != sh2 ) {
      m_currentScrollHeight = sh2;

      //document.getElementById( "scroller_height" ).style.height = `calc( 100% + ${m_currentScrollHeight}px)`;
      //document.body.style.height = `calc(100vh + ${m_currentScrollHeight}px)`;
      document.getElementById( "scroller_height" ).style.height = `calc(100vh + ${m_currentScrollHeight}px)`;
      //window.scrollTo( 0, VHToPixels(m_desiredScroll) );
      
   }

   /*
   if( sh1 != sh2 ) {
      console.log( "Updating body height.", sh1, sh2 );
      document.body.style.height = `${windowHeight + sh2}px`;
      window.scrollTo( 0, VHToPixels(m_desiredScroll) );
   }*///////

   //const numPanels = GetNumPanels();
/*
   if( document.body.scrollWidth != content.offsetWidth * (numPanels - 1) ) {
      document.body.style.width = `calc(100% + ${content.offsetWidth * (numPanels - 1)}px)`;
      console.log( "Updating body width." );
   }*/
}

function UpdateLeftRightArrows() {
   const numPanels = GetNumPanels();

   let showLeft  = false;
   let showRight = false;

   if( m_swivelMode ){
      let absoluteSwivel = m_swivelOrigin * 90 + m_swivelDesiredOffset;
      showLeft  = absoluteSwivel > 0.1;
      showRight = absoluteSwivel < (numPanels - 1) * 90 - 0.1;
      
   } else {
      showLeft  = m_currentPanel > 0;
      showRight = m_currentPanel < numPanels - 1;
   }

   if( showLeft ) {
      Arrows.SetAction( "left", (type, e) => {
         if( type == "click" && e.button == 0 ) {
            PanelLeft();
         }
      });
   } else {
      Arrows.SetAction( "left", null );
   }

   if( showRight ) {
      Arrows.SetAction( "right", (type, e) => {
         if( type == "click" && e.button == 0 ) {
            PanelRight();
         }
      });
   } else {
      Arrows.SetAction( "right", null );
   }
}

function UpdateUpDownArrows() {
   if( m_swivelMode ) {
      Arrows.SetAction( "up", null );
      Arrows.SetAction( "down", null );
      return;
   }

   if( m_desiredScroll > 1 ) {
      Arrows.SetAction( "up", (type, e) => {
         if( type == "click" && e.button == 0 ) {
            //m_arrowScroll = -1;
            m_verticalScrollSlide = 0.5;
            ScrollUpPage();
         }
      });
   } else {
      Arrows.SetAction( "up", null );
   }

   if( m_desiredScroll < MaxScroll() - 1 ) {
      Arrows.SetAction( "down", (type, e) => {
         if( type == "click" && e.button == 0 ) {
            //m_arrowScroll = 1;
            m_verticalScrollSlide = 0.5;
            ScrollDownPage();
         }
      });
   } else {
      Arrows.SetAction( "down", null );
   }

}

function StartFlicker() {
   const content = document.getElementById( "content" );

   let next_flicker = 1000;
   Animate.Start( "roller_flicker", ( time ) => {
      if( time >= next_flicker - 60 ) {
         if( time < next_flicker ) {
               content.style.color = "#fffe";
         } else {
               content.style.color = "#ffff";
               next_flicker = time + 200 + Math.random() * 1500;
         }
      }
   });
}

function GetRotatedCam() {
   let angle = m_scrollAngle * Math.PI / 180;
   //let angle = (Math.sin( time*0.001 )) * 1.9;
   let camdir = Smath.Normalize( m_scrollCam );
   let axis = Smath.Normalize( Smath.Cross(m_scrollUpVector, camdir) );
   let rotation = Smath.RotateAroundAxis( axis, angle );
   let tcam = Smath.MultiplyVec3ByMatrix3( m_scrollCam, rotation );
   let tup = Smath.MultiplyVec3ByMatrix3( m_scrollUpVector, rotation );
   tcam[0] = tcam[0] * 4;
   tcam[1] = tcam[1] * 4;
   tcam[2] = tcam[2] * 4;

   return {
      eye: tcam,
      right: axis,
      up: tup
   };
}

function ActivateVideo( element ) {
   if( m_activeVideos[element.id] ) return;
   m_activeVideos[element.id] = element;
   
   
   if( !element.firstTimeActivated ) {
      element.firstTimeActivated = true;
      element.classList.add( "flash" );
   }
/*
   if( element.isYoutube && element.ytready ) {
   } else {
      if( element.shouldUnpause ) {
         element.play();
      }
   }*/
}

function DeactivateVideo( element ) {
   if( !m_activeVideos[element.id] ) return;
/*
   if( element.isYoutube && element.ytready ) {
      let originalVolume = element.player.getVolume();
      Animate.Start( "video_slide_" + element.id, ( time ) => {
         if( m_swivelMode ) return; // we are fading out.
         let vol = Animate.Slide( originalVolume, originalVolume / 2, "fall", time, 0, 1500 );
         element.player.setVolume( vol );
         if( time > 1500 ) return true;
      });
      //element.originalVolume = element.player.getVolume();
      //element.player.pauseVideo();
   } else {
      let originalVolume = element.volume;
      Animate.Start( "video_slide_" + element.id, ( time ) => {
         if( m_swivelMode ) return; // we are fading out.
         let vol = Animate.Slide( originalVolume, originalVolume / 2, "fall", time, 0, 1500 );
         element.player.setVolume( vol );
         if( time > 1500 ) return true;
      });

      if( !element.paused ) {
         element.shouldUnpause = true;
         element.pause();
      }
   }*/

   delete m_activeVideos[element.id];
}

function OnAnimate( time, elapsed ) {

   UpdateScrollSpace();

   // Rotate camera "down" by desired angle.
   let cam = GetRotatedCam();

   Camera.Set( cam.eye, [0, 0, 0], cam.up );
/*
   if( m_keyNav & KEYNAV_UP ) {
      Scroll( -2 * 16 / elapsed );
   } else if( m_keyNav & KEYNAV_DOWN ) {
      Scroll( 2 * 16 / elapsed );
   }*/

   if( m_arrowScroll != 0 ) {
      window.scrollBy( 0, VHToPixels(m_arrowScroll * elapsed / 1000 * 100) );
   }

   let windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );

   if( m_currentScroll != m_desiredScroll ) {
      let d = m_verticalScrollSlide ** (elapsed / 250);
      //let d2 = 0.9 ** (elapsed / 250);
      //let scrolld = (m_currentScroll * d + m_desiredScroll * (1-d)) - m_currentScroll;
      //if( scrolld < 0 && m_maxVSpeed > 0 || scrolld > 0 && m_maxVSpeed < 0 )
      //    m_maxVSpeed = 0;
      //m_maxVSpeed = m_maxVSpeed * d2 + scrolld * (1-d2);
      //if( scrolld < 0 ) scrolld = Math.max( scrolld, m_maxVSpeed );
      //if( scrolld > 0 ) scrolld = Math.min( scrolld, m_maxVSpeed );
      m_currentScroll = m_currentScroll * d + m_desiredScroll * (1-d);
      SetScroll( m_currentScroll );
   }

   // I don't think we need this.
   if( false ) {
      const youtubes = document.getElementsByClassName( "youtube" );
      for( const youtube of youtubes ) {
         let rect = youtube.getBoundingClientRect();
         let top = rect.top / windowHeight;
         let bottom = rect.bottom / windowHeight;
         if( bottom < 0.1 || top > 0.9 ) {
            DeactivateVideo( youtube );
         } else {
            ActivateVideo( youtube );
         }
      }

      const videos = document.getElementsByTagName( "video" );
      for( const video of videos ) {
         let rect = video.getBoundingClientRect();
         let top = rect.top / windowHeight;
         let bottom = rect.bottom / windowHeight;
         if( bottom < 0.1 || top > 0.9 ) {
            DeactivateVideo( video );
         } else {
            ActivateVideo( video );
         }
      }
   }
}

function LoadContent( panel ) {


}

function SetupContentPadding() {
   const content = document.getElementById( "content" );
   if( !content.classList.contains( "show" )) return;

   let windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
   const pages = content.getElementsByTagName( "section" );
   //let st = content.scrollTop;
   /*
   for( let index = 0; index < pages.length; index++ ) {
      const page = pages[index];

      page.style.paddingTop    = 0;
      page.style.paddingBottom = 0;
      let padding = 15;
      if( page.offsetHeight < content.offsetHeight ) {
         padding = (content.offsetHeight - page.offsetHeight) / windowHeight * 100 / 2;
         padding = Math.max( padding, 15 );

         // For the margins:
         //difference -= 15;
         //if( index == 0 ) difference -= 15; // Only the first page has two margins, otherwise they're merged.

      }
      page.style.paddingTop    = `${padding}vh`;
      page.style.paddingBottom = `${padding}vh`;
   }*/
   //content.scrollTop = st;

   //m_desiredScroll = content.scrollTop / GetDeviceHeight() * 100;
   
   //m_desiredScroll = PixelsToVH(window.scrollTop);
   
   //SetScroll( m_desiredScroll );
}

//-----------------------------------------------------------------------------
// Returns the pixel dimensions of the user's client area.
function GetDeviceHeight() {
    return Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
}

function VHToPixels( vh ) {
    return vh * GetDeviceHeight() / 100;
}

function PixelsToVH( pixels ) {
    return pixels / GetDeviceHeight() * 100;
}

// Returns max scroll value in vh units.
function MaxScroll() {
    const content = document.getElementById( "content" );
    return (content.scrollHeight - content.offsetHeight) / GetDeviceHeight() * 100;
}

//-----------------------------------------------------------------------------
// Get the page dimension info for the given scroll position. `scroll` is in
//  vh units, but can be left undefined to default to the content window's
//  scroll position.
//
// Output units are in pixels, not vh.
function GetPagingInfo( scroll ) {
   const content = document.getElementById( "content" );
   if( scroll === undefined ) {
      scroll = content.scrollTop;
   } else {
      scroll = VHToPixels( scroll );
   }
   const pages = content.getElementsByTagName("section");
   if( pages.length == 0 ) return null;
   let i = 0;
   for( i = 0; i < pages.length; i++ ) {
      let page = pages[i];
      let bottom = page.offsetTop + page.offsetHeight - scroll;
      if( bottom >= 0 ) break;
   }
   if( i == pages.length ) i--;
   let pageIndex  = i;
   let pageTop    = pages[i].offsetTop - scroll;
   let pageBottom = pages[i].offsetTop + pages[i].offsetHeight - scroll;

   return {
      count: pages.length,
      index: pageIndex,
      top: pageTop,
      bottom: pageBottom,
      displayHeight: content.offsetHeight
   }
}

function DistanceToNextPageBorder( start ) {

}

function ScrollDownPage() {
   const content = document.getElementById( "content" );
   // ALL VERY DELICATE STUFF
   const pi = GetPagingInfo( m_desiredScroll );
   if( !pi ) return;

   let top = VHToPixels(m_desiredScroll);
   let tolerance = pi.displayHeight * 0.05;

   const pages = content.getElementsByTagName("section");
   if( !pages ) return;

   // default to max.
   let nextLevel = pages[pages.length-1].offsetTop + pages[pages.length-1].offsetHeight - content.offsetHeight;

   for( let i = 0; i < pages.length; i++ ) {
      let page = pages[i];
      if( page.offsetTop > top + tolerance ) {
         nextLevel = page.offsetTop;
         break;
      }
   }

   if( nextLevel - top < content.offsetHeight * 1.1 ) {
      window.scrollTo( 0, nextLevel );
   } else {
      let amount = Math.min( content.offsetHeight * 0.6, nextLevel - (top + content.offsetHeight) );
      window.scrollBy( 0, amount );
   }

   /*
   if( Math.abs((pi.bottom - pi.displayHeight) / pi.displayHeight) < 0.05 ) {
      window.scrollBy( 0, pi.bottom );
   } else {
      if( pi.bottom > pi.displayHeight ) {
         let amount = pi.displayHeight * 0.6;
         amount = Math.min( amount, pi.bottom - pi.displayHeight );
         window.scrollBy( 0, amount );
      } else {
         window.scrollBy( 0, pi.bottom );
      }
   }
*/
   // yeah, screw that bottom stuff lol, nobody even cares about
   //  it.
   
   //window.scrollBy( 0, content.clientHeight * 0.6 );
   return;
// let scrollPixels = VHToPixels( m_desiredScroll );

   if( (pi.bottom / pi.displayHeight) >= 1.05 ) {
      // Too far to reach next page.
      let scrollAmount = pi.displayHeight * 0.6;
      if( scrollAmount > pi.bottom - pi.displayHeight )
         scrollAmount = pi.bottom - pi.displayHeight;
      //if( toBottom > pi.displayHeight * 0.9 ) toBottom = pi.displayHeight * 0.9
      m_desiredScroll += PixelsToVH( scrollAmount );//toBottom );
      if( scrollAmount / pi.displayHeight < 0.1 && pi.index > 0 )
         return ScrollDownPage();
   } else {
      m_desiredScroll += PixelsToVH( pi.bottom );
      if( pi.bottom / pi.displayHeight < 0.1 && pi.index < pi.count - 1 )
         ScrollDownPage();
   }

   m_desiredScroll = Smath.Clamp( m_desiredScroll, 0, MaxScroll() );
}

function ScrollUpPage() {

   const content = document.getElementById( "content" );
   // ALL VERY DELICATE STUFF
   const pi = GetPagingInfo( m_desiredScroll );
   if( !pi ) return;

   let top = VHToPixels(m_desiredScroll);
   let tolerance = pi.displayHeight * 0.05;

   const pages = content.getElementsByTagName("section");
   if( !pages ) return;

   let bottom = top + content.offsetHeight;

   // default to max.
   let nextLevel = 0;//pages[pages.length-1].offsetTop + pages[pages.length-1].offsetHeight - content.offsetHeight;

   for( let i = pages.length-1; i >= 0; i-- ) {
      let page = pages[i];
      if( page.offsetTop + page.offsetHeight < bottom - tolerance ) {
         nextLevel = page.offsetTop + page.offsetHeight;
         break;
      }
   }

   
   if( bottom - nextLevel < content.offsetHeight * 1.1 ) {
      window.scrollTo( 0, nextLevel - content.offsetHeight );
   } else {
      let amount = Math.min( content.offsetHeight * 0.6, top - nextLevel );
      window.scrollBy( 0, -amount );//content.offsetHeight * 0.6 );
   }

   /*

   const pi = GetPagingInfo( m_desiredScroll );

   let top = VHToPixels(m_desiredScroll);
   if( Math.abs((pi.top - pi.displayHeight) / pi.displayHeight) < 0.05 ) {
      window.scrollTo( 0, pi.top - pi.displayHeight );
   } else {
      if( pi.top < 0 ) {
         let amount = pi.displayHeight * 0.6;
         amount = Math.min( amount, -pi.top );
         window.scrollBy( 0, -amount );
      } else {
         window.scrollBy( 0, pi.top );
      }
   }*/

   //window.scrollBy( 0, -content.clientHeight * 0.6 );
   return;

// let scrollPixels = VHToPixels( m_desiredScroll );

   if( (pi.top / pi.displayHeight) <= -0.05 ) {
      // Too far to reach next page.
      let scrollAmount = pi.displayHeight * 0.6;
      if( scrollAmount > -pi.top )
         scrollAmount = -pi.top;
      //if( toBottom > pi.displayHeight * 0.9 ) toBottom = pi.displayHeight * 0.9
      window.scrollBy( 0, -scrollAmount );
      //m_desiredScroll -= PixelsToVH( scrollAmount );//toBottom );
      if( scrollAmount / pi.displayHeight < 0.1 && pi.index > 0 )
         return ScrollUpPage();
   } else {
      let amount = -pi.top + pi.displayHeight;
      //m_desiredScroll -= PixelsToVH( amount );
      window.scrollBy( 0, -scrollAmount );
      if( amount / pi.displayHeight < 0.1 && pi.index > 0 )
         return ScrollUpPage();
   }

   //m_desiredScroll = Smath.Clamp( m_desiredScroll, 0, MaxScroll() );
}

function Scroll( amount ) {
   // Amount is in vh units.
   let maxScroll = MaxScroll();

   // If reversing the scroll direction, clip to the current scroll if past it.
   if( (m_desiredScroll > m_currentScroll && amount < 0)
      || (m_desiredScroll < m_currentScroll && amount > 0) ) {
      m_desiredScroll = m_currentScroll
   }
   m_desiredScroll += amount;

   m_desiredScroll = Smath.Clamp( m_desiredScroll, 0, maxScroll );
}

function SetDesiredScroll( vh ) {
   m_desiredScroll = vh;
}

function SetScroll( vh ) {
   vh = Smath.Clamp( vh, 0, MaxScroll() );
   m_currentScroll = vh;

   UpdateScrollSpace();

   let content = document.getElementById( "content" );
   let pixels = Math.round(vh * GetDeviceHeight() / 100);


   // The input will be clamped to the content height.
   content.scrollTop = pixels;

   UpdateUpDownArrows();

   // go through page bottoms and find out which one is on the screen.
   // lock the horizontal bar of the cube on that.
   // make sure one bar corresponds to each page.
   // first 90deg turn is the first page, second for the second ,etc.

   const pages = content.getElementsByTagName("section");

   const pi = GetPagingInfo();
   /*
   let currentPage = 0;
   let dividerPoint = 1;
   for( let i = 0; i < pages.length - 1; i++ ) {
      let page1 = pages[i];
      let page2 = pages[i + 1];

      let point = (page1.offsetTop + page1.offsetHeight + page2.offsetTop) / 2 - content.scrollTop;

      point /= content.offsetHeight;
      if( point > 1 ) break;
      currentPage = i;
      dividerPoint = point;
   }
   if( dividerPoint < 0 ) dividerPoint = 0;
   dividerPoint = 1 - dividerPoint;*/
   let divider = pi.bottom / pi.displayHeight;
   if( divider < 0 ) divider = 0;
   if( divider > 1 ) divider = 1;

   divider = 1 - divider;
   m_scrollAngle = pi.index * 90 + readTurnTable(divider);//(pi.index + divider) * 90;
}

//-----------------------------------------------------------------------------
// Returns the number of panels defined. A panel is a vertical strip of text.
function GetNumPanels() {
   // A little optimization...
   GetNumPanels.numPanels = GetNumPanels.numPanels || document.getElementsByClassName( "panel" ).length;
   return GetNumPanels.numPanels;
}

//-----------------------------------------------------------------------------
// Interpolate the colors between two panels and then adjust the color theme.
function UpdateColorTheme( panelBaseIndex, fraction ) {
    const page1 = GetPanelContent( panelBaseIndex );
    const page2 = GetPanelContent( panelBaseIndex + 1 ) || page1;

    let color = Color.Lerp(
                    Color.FromHex( page1.color ),
                    Color.FromHex( page2.color ),
                    fraction );
    let linkcolor = Color.Lerp(
                       Color.FromHex( page1.linkcolor ),
                       Color.FromHex( page2.linkcolor ),
                       fraction );

    Color.Set( color, linkcolor );
}

function ClampSwivelDesiredOffset() {
   let min = -m_swivelOrigin * 90;
   let max = ((GetNumPanels() - 1) - m_swivelOrigin) * 90;
   m_swivelDesiredOffset = Smath.Clamp( m_swivelDesiredOffset, min, max );
}

function StartSwivelMode( startDirection, swivelOffset ) {
   if( m_swivelMode ) return;

   let content = document.getElementById( "content" );
   content.classList.remove( "show" );

   if( startDirection == "left" ) {
      content.classList.add( "slideright" );
   } else if( startDirection == "right" ) {
      content.classList.add( "slideleft" );
   }

   let startingScrollAngle = m_scrollAngle;
   let snapScrollAngle = Math.round(m_scrollAngle / 90) * 90;

   m_scrollAngle = snapScrollAngle;
   let normalCam = GetRotatedCam();
   m_scrollAngle = startingScrollAngle;

   //Smath.Copy( m_panelRotateStart, cam.eye );
   //Smath.Snap( m_panelRotateStart, 1.0 );
   Smath.Copy( m_swivelUpVector, normalCam.up );
   Smath.Snap( m_swivelUpVector );
   //m_swivelUpVector = Smath.Normalize( Smath.Cross( m_panelRotateStart, cam.right) );

   m_swivelMode = true;
   m_swivelOrigin = m_currentPanel;
   m_swivelOffset = 0;
   m_swivelDesiredOffset = swivelOffset;
   ClampSwivelDesiredOffset();

   // This should persist for a small while, to hide showing the last panel
   //  name briefly.
   m_currentPanel = Math.floor(m_swivelOrigin + ((m_swivelDesiredOffset+45)/90));

   m_desiredScroll = 0;
   m_currentScroll = 0;

   UpdateBigText();
   UpdateUpDownArrows();

   m_swivelAnimateTime = 0;
   m_swivelTurnTime   = 0;
   
   m_swivelTouchSwing = 0;

   // Full circle in 1 second.
   const sliderScroll = new Animate.Slider( 0.01, startingScrollAngle );
   const sliderOffset = new Animate.Slider( 0.01, m_swivelOffset );

   Animate.Start( "roller_fade_videos", ( time, elapsed ) => {
      let volume = Animate.Slide( 1, 0, "fall", time, 0, 1500 );

      const youtubes = document.getElementsByClassName( "youtube" );

      for( const youtube of youtubes ) {
         if( youtube.ytready ) {
         //if( youtube.setVolume ) {
            youtube.originalVolume = youtube.originalVolume || youtube.player.getVolume();
            youtube.player.setVolume( youtube.originalVolume * volume );
         //}
         }
      }

      const videos = document.getElementsByTagName( "video" );
      for( const video of videos ) {
         video.originalVolume = video.originalVolume || video.volume;
         video.volume = video.originalVolume * volume;
      }

      if( time > 1500 ) {
         return true;
      }
   });

   Animate.Start( "roller", ( time, elapsed ) => {
      m_swivelAnimateTime = time;
      // When the animations start, the camera tilts down (relative down)
      //  until perpendicular with the up axis. Meanwhile it rotates around
      //  that axis when panels are changed.
      // 8 panels to the right is not cancelled out to zero; it is two
      //  full-circle turns.

      sliderScroll.desired = snapScrollAngle;


      //let turnSpeed = Animate.Slide( 0.95, 0.4, "lerp", time, m_swivelTurnTime, m_swivelTurnTime+400 );

      m_scrollAngle = sliderScroll.update( elapsed/1000 );
      let newCam = GetRotatedCam();

      
      if( !m_touchingSwivel ) {
         if( time > m_touchingSwivelTime + 450 ) {
            // Snap.
            m_swivelDesiredOffset = Math.floor( (m_swivelDesiredOffset + 45) / 90 ) * 90;
         } else {
            m_swivelDesiredOffset += m_swivelTouchSwing * elapsed / 1000;
            m_swivelTouchSwing *= (0.9 ** (elapsed / 1000));
         }
      } else {
         m_swivelTouchSwing *= (0.1 ** (elapsed / 500));
      }

      // Clamp swivel offset.
      ClampSwivelDesiredOffset();
      

      sliderOffset.desired = m_swivelDesiredOffset;

      m_swivelOffset = sliderOffset.update( elapsed/1000 );

      let rotation = Smath.RotateAroundAxis( m_swivelUpVector, m_swivelOffset * Math.PI / 180 );
      let tcam = Smath.MultiplyVec3ByMatrix3( newCam.eye, rotation );

      Camera.Set( tcam, [0, 0, 0], newCam.up );

      //if( time > 500 ) {
      //   //m_currentPanel = Math.floor(m_swivelOrigin + ((m_swivelOffset+45)/90));
     // }
      m_currentPanel = Math.floor(m_swivelOrigin + ((m_swivelDesiredOffset+45)/90));

      // Set the color.
      {
         let absoluteTurn = m_swivelOrigin + (m_swivelOffset/90);

         let currentPanel = Math.floor(absoluteTurn);
         let currentFraction = absoluteTurn - currentPanel;

         UpdateColorTheme( currentPanel, currentFraction );
      }

      UpdateLeftRightArrows();
      UpdateBigText();

      
      

      if( time > m_swivelTurnTime + 1800 && !m_touchingSwivel
                         && sliderOffset.remaining() < 1
                         && sliderScroll.remaining() < 1 ) {
         // This overwrites this animation slot.
         StartPanelDisplay();
      }
   });
}

function UpdateBigText() {
   const bigtext = document.getElementById( "bigtext_container" );
   const bigtext_string = document.getElementById( "bigtext" );
   if( !m_swivelMode ) {
      bigtext.classList.remove( "show" );
      return;
   }

   bigtext.classList.add( "show" );

   const panel = GetPanelContent( m_currentPanel );
   bigtext_string.innerText = panel.year;

   const bigtext_subtitle = document.getElementById( "bigtext_subtitle" );
   bigtext_subtitle.innerText = panel.title;
}

function GetPanelContent( index ) {
    const panels = document.getElementsByClassName( "panel" );
    if( index >= panels.length ) return null;

    let color = panels[index].dataset.color;
    let linkcolor = panels[index].dataset.linkcolor || color;

    return {
        id    : panels[index].id,
        year  : panels[index].dataset.year,
        title : panels[index].dataset.title,
        html  : panels[index].innerHTML,
        color,
        linkcolor
    };
}

function PanelTurn( offset ) {
   if( m_swivelMode ) {
      //let min = -m_swivelOrigin * 90;
      //let max = ((GetNumPanels() - 1) - m_swivelOrigin) * 90;
      //m_swivelDesiredOffset = Smath.Clamp( m_swivelDesiredOffset + offset, min, max );
      m_swivelDesiredOffset += offset;
   } else {
      if( offset < 0 && m_currentPanel == 0 ) return;
      if( offset >= 0 && m_currentPanel == GetNumPanels() - 1 ) return;
      StartSwivelMode( offset > 0 ? "right" : "left", offset );
   }
   m_swivelTurnTime = m_swivelAnimateTime;
}

function PanelRight() {
   PanelTurn( 90 );
}

function PanelLeft() {
   PanelTurn( -90 );
}

function RotateWithTouch( pixels ) {
   const windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
   m_touchingSwivel = true;
   let offset = pixels / (windowHeight * 0.8) * 90;
   m_swivelDesiredOffset += offset;
   m_swivelTouchSwing += offset * 16;
   
   //m_swivelTouchSwing = Smath.Clamp( m_swivelTouchSwing, -360*4, 360*4 );
}

function StopRotateTouch() {
   m_touchingSwivel = false;
   m_touchingSwivelTime = m_swivelAnimateTime;
   m_swivelTurnTime     = m_swivelAnimateTime;
}

const m_turnTable = [
   7.105427357601e-15,0.66125015102551,1.3032735415363,1.927618025078,2.5356402325826,3.1285370154133,3.7073705466288,4.2730885761747,4.8265409359956,5.3684931097338,5.8996374805119,6.4206027243404,6.9319617093889,7.4342381814961,7.927912456186,8.4134262917425,8.8911870827836,9.3615714865709,9.8249285730297,10.281582572707,10.731835283608,11.175968187228,11.614244315573,12.046909904029,12.47419585933,12.896319067281,13.313483561072,13.725881567922,14.133694449176,14.537093546794,14.936240947389,15.331290173386,15.722386809643,16.109669072726,16.493268329123,16.873309567886,17.249911832504,17.623188616213,17.993248224462,18.360194107811,18.724125168152,19.085136040814,19.443317354853,19.798755973532,20.15153521682,20.501735067524,20.849432362496,21.194700970233,21.537611956014,21.878233735656,22.21663221881,22.552870942677,22.887011196903,23.219112140364,23.549230910484,23.877422725647,24.203740981252,24.52823733988,24.850961816006,25.171962855674,25.491287411483,25.808981013231,26.125087834521,26.43965075561,26.752711422763,27.064310304351,27.374486743908,27.683279010356,27.990724345585,28.296859009551,28.601718323067,28.905336708422,29.207747727974,29.508984120835,29.809077837776,30.108060074457,30.405961303082,30.702811302571,30.998639187354,31.293473434847,31.587341911701,31.880271898889,32.17229011571,32.463422742751,32.753695443888,33.043133387369,33.33176126603,33.6196033167,33.906683338831,34.193024712407,34.478650415157,34.763583039126,35.047844806625,35.331457585612,35.614442904508,35.896821966508,36.178615663394,36.459844588886,36.740529051554,37.020689087316,37.300344471544,37.579514730795,37.858219154204,38.136476804529,38.414306528901,38.691726969269,38.968756572573,39.245413600653,39.521716139912,39.797682110755,40.073329276797,40.348675253885,40.623737518915,40.89853341848,41.173080177352,41.447394906807,41.721494612807,41.995396204059,42.269116499941,42.542672238327,42.816080083308,43.089356632825,43.362518426215,43.635581951697,43.908563653783,44.181479940645,44.454347191435,44.727181763573,45,45
];

// Fraction is 0 to 1, 0 meaning 0 turn, 1 meaning 90 degree turn.
function readTurnTable( fraction ) {
   
   fraction = Smath.Clamp( fraction, 0, 1 );
   let upperHalf = false;
   if( fraction >= 0.5 ) {
      upperHalf = true; 
      fraction = 1 - fraction;
   }
   fraction = fraction * 2 * 128;
   let a = Math.floor( fraction );
   let d = fraction - a;

   let r = m_turnTable[a] + (m_turnTable[a+1] - m_turnTable[a]) * d;
   return upperHalf ? 90 - r : r;
}

export default {
    Start, SetScroll, LoadContent, SetupContentPadding, Setup
}