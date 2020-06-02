// ROLLER.JS - the amazing rolling cube.
// (C) 2020 Mukunda Johnson (www.mukunda.com)
//-----------------------------------------------------------------------------
import Camera  from "./camera.js";
import Smath   from "./smath.js";
import Animate from "./animate.js";
import Arrows  from "./arrows.js";
import Color   from "./color.js";
import Zoomer  from "./zoomer.js";
import {GetDeviceDimensions, FOV} from "./index.js";
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

// This is set by the up/down arrows (on the keyboard, not the on-screen
// buttons).
let m_arrowScroll = 0;

// Higher = slower (1.0 = infinity slow). This is how fast the screen scrolls
// towards the desired scroll point. It's so that scrolling pages is a little
// more dramatic, whereas using the scrollwheel is much faster, and touch
// scrolling (where it should follow your finger) should be near instant (as
// the device usually handles their own smooth-scrolling finger-flung slide).
let m_verticalScrollSlide = 0.1;

// These are obsolete, from when I wanted to have a more flexible swivel mode.
// (It just felt confusing.)
let m_touchingSwivel = false;
let m_touchingSwivelTime = 0;
let m_swivelTouchSwing = 0;

// Fixed music multiplier. 60% seems like a good balance.
const MUSIC_VOLUME = 0.6;

// We don't dim the music, just mute it.
//const MUSIC_DIM_VOLUME = 0.00;

// Music volume slider control.
let m_music_volume = new Animate.Slider( 0.1, MUSIC_VOLUME );

//-----------------------------------------------------------------------------
// Collection of video IDs that are playing, either youtube iframes or
// video tags. If this has any in the list, then the music is "dimmed"
// (which means volume slides to zero and it pauses).
let m_videos_playing = {};

//-----------------------------------------------------------------------------
// This is true if the user clicks the music switch, to toggle it off manually.
let m_music_manual_dim = false;

//-----------------------------------------------------------------------------
// This is true if the music is dimmed (volume fades to 0 and it pauses).
// The music dims whenever a media file is active with sound enabled (non-muted
// and non-zero volume).
let m_music_dimmed = false;

//-----------------------------------------------------------------------------
// This keeps track of videos that enter the content view range, indexed by
//  their IDs.
let m_activeVideos = {}

//-----------------------------------------------------------------------------
function Setup() {
   // Initialize the startup screen colors. (This function is called at the
   // very start.)
   UpdateColorTheme( 0, 0 );
}

//-----------------------------------------------------------------------------
// This starts up the roller phase, and it takes control of the program mostly.
// Nice spaghetti code when it comes to component management. :)
function Start() {
   // OK, so the state we're in is just after the zooming event. That leaves us
   // with this camera point. We start out with a cleanly snapped point, with
   // an up vector towards the sky.
   let [eye] = Camera.Get();
   m_scrollCam = eye;
   Smath.Snap( m_scrollCam, 1.0 );
   m_scrollUpVector = [0, 1, 0];

   // A bunch of this is legacy stuff that probably needs to be cleaned, but
   // at least it's somewhat flexible. Right now we always move the camera to
   // exactly the distance away where the cube face will be covering 80% of the
   // vertical height.
   //
   // This code is for computing arbitrary distances from the cube.
   let fov = FOV;        // Even though it's kinda just fixed, here.
   const cameraDistance = 1.25 / Math.tan(FOV/2 * Math.PI / 180) + 1;
   // Read the above as "height of half the cube plus 25% (50/40, to cover 80%
   // with both halves) - and the camera must be slid back to have tan(fov/2)
   // match that." It's also translated 1 unit over to start from the
   // outside of the cube.

   let cubedistance = cameraDistance - 1;
   let cubesize = 2;
   let vrange = Math.tan( fov / 2 * Math.PI / 180 ) * cubedistance;
   const content = document.getElementById( "content" );

   // So tl;dr above, this can probably just be 80vh height.
   content.style.top = (vrange - cubesize/2) * 50 / vrange + "vh";
   content.style.height = (cubesize) * 100 / (vrange*2) + "vh";
   content.style.display = "block";

   // A css attribute that flashes on text occasionally to make
   // it flicker.
   StartFlicker();
   
   // Is scrollY standard..?
   window.addEventListener( "scroll", e => {
      SetDesiredScroll( PixelsToVH(window.scrollY) );
   });

   // These two handlers are just in general to avoid stuck arrow buttons.
   window.addEventListener( "mouseup", e => {
      if( e.button == 0 ) {
         m_arrowScroll = 0;
      }
   });

   window.addEventListener( "touchend", e => {
      m_arrowScroll = 0;
   });

   SetupSwiping();

   document.addEventListener( "wheel", ( e ) => {
      // Scrolling is handled by the onscroll handler.
      // Wheel: fast
      // Touch: native (fast)
      // PgDown/PgUp/Space: slow
      m_verticalScrollSlide = 0.1;
   });

   // Replace this with native scrolling of element.
   document.addEventListener( "keydown", ( e ) => {
      if( !e.repeat ) {
         if( e.key == "ArrowDown" ) {
            // Start downward slide (TODO: for some reason Firefox doesn't care
            // about preventing default.)
            m_arrowScroll = 1;
            m_verticalScrollSlide = 0.1;
            e.preventDefault();
         } else if( e.key == "ArrowUp" ) {
            // Start upward slide.
            m_arrowScroll = -1;
            m_verticalScrollSlide = 0.1;
            e.preventDefault();
         } else if( e.key == "ArrowLeft" ) {
            // Left and right activate swivel mode.
            PanelLeft();
         } else if( e.key == "ArrowRight" ) {
            PanelRight();
         } else if( e.key == "PageDown" || e.key == ' ' ) {
            // Pagedown or space go to the next page.
            // (Or scroll a bit through long pages.)
            ScrollDownPage();
            m_verticalScrollSlide = 0.5;
            e.preventDefault();
            
         } else if( e.key == "PageUp" ) {
            ScrollUpPage();
            m_verticalScrollSlide = 0.5;
            e.preventDefault();
         }
      }
   });

   document.addEventListener( "keyup", e => {
      if( e.key == "ArrowDown" || e.key == "ArrowUp" ) {
         // Both keys overwrite each other.
         m_arrowScroll = 0;
      }
   });

   UpdateLeftRightArrows();

   // Swivel mode is horizontal turning.
   StartSwivelMode( "none", 0 );
}

//-----------------------------------------------------------------------------
// Sets up handlers to intercept swipe motions for swiveling.
function SetupSwiping() {
   // This is indexed by touch.id. IDs are persistent for each touch until
   // they end.
   const touches = {};

   // This used to be more complicated, but it's simpler now without
   // the ability to "hold" the cube when swiveling. I found it confusing
   // and a waste of implementation.
   //
   // This method just watches for touches to drag a certain distance
   // horizontally before they trigger a swivel turn.
   //
   // Vertical scrolling works natively by a hidden scrollable area transferred
   // to the content scroll.
   //
   window.addEventListener( "touchstart", e => {
      // When touching the screen with a finger, make the slide near instant
      // so the native slide is followed.
      m_verticalScrollSlide = 0.001;
      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         touches[touch.identifier] = {
            startX: touch.clientX,
            startY: touch.clientY
         }
      }
   });

   window.addEventListener( "touchmove", e => {
      const [windowWidth, windowHeight] = GetDeviceDimensions();

      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         let tdata = touches[touch.identifier];
         if( !tdata ) return;
         let x = touch.clientX - tdata.startX;
         let y = touch.clientY - tdata.startY;

         // Portrait mode: 30% of width = swipe. Landscape: 30% of height.
         const swipeThreshold = Math.min( windowWidth * 0.3,
                                          windowHeight * 0.3 );

         if( Math.abs(y) > windowHeight * 0.3 ) {
            // This swipe went out of range.
            delete touches[touch.identifier];
            continue;
         }

         // I'm not really satisfied with this. Native swipes take velocity
         // into account, so a tiny swipe left,right that's fast still counts
         // as a swipe. (Better to just use a touchscreen library at that point
         // of detail.)
         // For our primitive version here, the swipe endpoint has to be within
         // 10 degrees of the original position.
         if( x < -swipeThreshold && Math.abs(y) / Math.abs(x) < Math.tan(10) ) {
            tdata.startx = touch.clientX;
            tdata.starty = touch.clientY;
            PanelRight();
            delete touches[touch.identifier];
         } else if( x > swipeThreshold
                                 && Math.abs(y) / Math.abs(x) < Math.tan(10) ) {
            tdata.startx = touch.clientX;
            tdata.starty = touch.clientY;
            PanelLeft();
            delete touches[touch.identifier];
         }
      }
      
   });

   window.addEventListener( "touchend", e => {
      // changedTouches contains all touches that are ending, which invalidates
      // the ID.
      for( let i = 0; i < e.changedTouches.length; i++ ) {
         let touch = e.changedTouches[i];
         delete touches[touch.identifier];
      }

      // e.touches is empty if all touches have ended.
   });
}

//-----------------------------------------------------------------------------
function StartPanelDisplay() {
   // The "panel" is a vertical slice of content. This starts that display
   // state.

   {
      // When we start, we want a nice aligned angle. This doesn't strike me
      // as super safe if we're calling from any angle, but this function
      // should only be called when the camera is nearly straight already.
      const [eye, , up] = Camera.Get();
      m_scrollCam = eye;
      Smath.Snap( m_scrollCam, 1.0 );
      m_scrollUpVector = up;
      Smath.Snap( m_scrollUpVector, 1.0 );
   }

   // Loading the content.
   const panel = GetPanelContent( m_currentPanel );
   const content = document.getElementById( "content" );
   const header_element = `<h2 class="header">${panel.title}</h2>`

   content.innerHTML = panel.html;

   // We wrap all <section> content in `.inner`, for our stupid centering
   // trick that uses table layout css.
   let firstPage = true;
   for( const page of content.getElementsByTagName("section") ) {
      if( firstPage ) {
         // The first page gets the special title header. The CSS also has a
         // rule to lessen the padding at the top of the first page to make
         // the rest of the content feel more centered.
         page.innerHTML = header_element + page.innerHTML;
         firstPage = false;
      }
      page.innerHTML = `<div class="inner">${page.innerHTML}</div>`;
   }

   // Adjust all links so they open a new tab (you can imagine otherwise what
   // would happen to the precious cube state).
   for( const a of content.getElementsByTagName( "a" )) {
      a.setAttribute( "target", "_blank" );
   }

   // Setup some handlers for <video> elements.
   for( const video of content.getElementsByTagName( "video" )) {

      // Play, volume change, and pause, these register the video if the
      // video is playing and the volume is nonzero and it's not muted, and
      // unregisters as playing otherwise.
      //
      // Also, on play, pause other videos that are making sound.
      //
      video.addEventListener( "play", () => {
         if( video.volume > 0.01 && !video.muted ) {
            VideoStartedPlaying( video.id );
            PauseOtherVideosWithSound( video.id );
         }
      });

      video.addEventListener( "volumechange", () => {
         if( video.volume > 0.01 && !video.paused && !video.muted ) {
            VideoStartedPlaying( video.id );
         } else {
            VideoStoppedPlaying( video.id );
         }
      });

      video.addEventListener( "pause", () => {
         VideoStoppedPlaying( video.id );
      });

      video.addEventListener( "ended", () => {
         VideoStoppedPlaying( video.id );
      });
   }

   // iframes for youtube are marked with the class `youtube`. Handle them in
   // a similar way to <video> elements, but with their own API.
   for( const yt of content.getElementsByClassName( "youtube" )) {
      yt.isYoutube = true;
      // Each iframe needs a YT player attached. `enablejsapi=1` needs to be
      // present in the query string of the iframe to allow this.
      yt.player = new YT.Player( yt.id, {
         events: {
            onReady() {
               // Set a property to let other code know that the API is ready
               // to be used on this element.
               yt.ytready = true;
            },
            onStateChange( e ) {
               // PLAYING and PAUSED trigger when the video is buffering, too.
               if( e.data == YT.PlayerState.PLAYING ) {
                  VideoStartedPlaying( yt.id );
                  PauseOtherVideosWithSound( yt.id );
               } else if( e.data == YT.PlayerState.PAUSED
                        || e.data == YT.PlayerState.ENDED ) {
                  VideoStoppedPlaying( yt.id );
               }
            }
         }
      });
   }

   // Setup images with class "zoomable" to be passed to the zooming module.
   for( const img of content.getElementsByTagName( "img" )) {
      if( img.classList.contains("zoomable") ) {
         img.addEventListener( "click", () => {
            Zoomer.ShowImage( img );
         });
      }
   }

   // Reset content position from the last fadeout.
   content.classList.remove( "slideleft" );
   content.classList.remove( "slideright" );
   content.classList.add( "show" );

   // Entering panel display mode now.
   m_swivelMode = false;

   // (This is basically just to hide this.)
   UpdateBigText();

   // Make sure we're in a clean state.
   m_currentScroll   = 0;
   m_desiredScroll   = 0;
   m_scrollAngle     = 0;
   content.scrollTop = 0;

   UpdateUpDownArrows();

   window.scrollTo( 0, 0 );
   UpdateScrollSpace();

   // This should be empty, but just in case clean it up anyway.
   m_activeVideos = {};

   Animate.Start( "roller", OnPanelAnimate );   
}

let m_currentScrollHeight = 0;

//-----------------------------------------------------------------------------
function UpdateScrollSpace() {
   const content = document.getElementById( "content" );

   let sh2 = content.scrollHeight - content.offsetHeight;

   if( m_currentScrollHeight != sh2 ) {
      m_currentScrollHeight = sh2;
      document.getElementById( "scroller_height" ).style.height =
                                    `calc(100vh + ${m_currentScrollHeight}px)`;
      window.scrollTo( 0, VHToPixels(m_desiredScroll) );
      
   }
}

//-----------------------------------------------------------------------------
// Show the left or right arrows if they can take a valid action (swiveling
// left or right).
function UpdateLeftRightArrows() {
   const numPanels = GetNumPanels();

   let showLeft  = false;
   let showRight = false;

   // Swivel mode supports arbitrary positions, but we don't use that currently.
   if( m_swivelMode ){
      let absoluteSwivel = m_swivelOrigin * 90 + m_swivelDesiredOffset;
      showLeft  = absoluteSwivel > 0.1;
      showRight = absoluteSwivel < (numPanels - 1) * 90 - 0.1;
   } else {
      // Normally, left/right arrows are enabled when we aren't against the
      // left/right boundary.
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

//-----------------------------------------------------------------------------
// Show the up or down arrows if they can take action.
function UpdateUpDownArrows() {
   if( m_swivelMode ) {
      // Swivel mode has no up/down arrows.
      Arrows.SetAction( "up", null );
      Arrows.SetAction( "down", null );
      return;
   }

   // "1" is a deadzone, since exact scroll positions is kinda awkward from
   // conversion between pixels and vh.
   if( m_desiredScroll > 1 ) {
      Arrows.SetAction( "up", (type, e) => {
         if( type == "click" && e.button == 0 ) {
            // When scrolling pages, we use a slower slide value so it isn't
            // too much of a sudden jerk.
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
            m_verticalScrollSlide = 0.5;
            ScrollDownPage();
         }
      });
   } else {
      Arrows.SetAction( "down", null );
   }
}

//-----------------------------------------------------------------------------
function StartFlicker() {
   const content = document.getElementById( "content" );

   // A little animation to make the text alpha flicker... giving it that
   // ...authentic...busted feel...
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

//-----------------------------------------------------------------------------
// Get the panel camera origin tilted by m_scrollAngle.
function GetRotatedCam() {
   
   let angle = m_scrollAngle * Math.PI / 180;
   
   // Pointing outward from center.
   let camdir   = Smath.Normalize( m_scrollCam );

   // Perpendicular horizontally.
   let axis     = Smath.Normalize( Smath.Cross(m_scrollUpVector, camdir) );

   // Build rotation matrix to tilt downward by the angle around that 
   // perpendicular axis.
   let rotation = Smath.RotateAroundAxis( axis, angle );

   // Translated camera and up vector.
   let tcam     = Smath.MultiplyVec3ByMatrix3( m_scrollCam, rotation );
   let tup      = Smath.MultiplyVec3ByMatrix3( m_scrollUpVector, rotation );

   // Camera distance is fixed to be the distance from the cube where a cube
   // face will cover 80% of the vertical height.
   // 50/40 (half of 100/80) over tan(half of fov) plus 1 (cube face from zero)
   const cameraDistance = 1.25 / Math.tan(FOV/2 * Math.PI / 180) + 1;
   tcam[0] = tcam[0] * cameraDistance;
   tcam[1] = tcam[1] * cameraDistance;
   tcam[2] = tcam[2] * cameraDistance;

   return {
      eye:   tcam,
      right: axis, // Return the axis too - that's a useful "right" vector.
      up:    tup
   };
}

//-----------------------------------------------------------------------------
// The following functions aren't used. I wanted videos to autopause when they
// go out of range, but I decided that letting the audio keep playing is
// better.
function ActivateVideo( element ) {
   if( m_activeVideos[element.id] ) return;
   m_activeVideos[element.id] = element;
   
   if( !element.firstTimeActivated ) {
      element.firstTimeActivated = true;
      element.classList.add( "flash" );
   }
}

//-----------------------------------------------------------------------------
function DeactivateVideo( element ) {
   if( !m_activeVideos[element.id] ) return;
   // yikes
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

//-----------------------------------------------------------------------------
function OnPanelAnimate( time, elapsed ) {

   // Updating this every frame because I don't know the exact behavior of when
   // scroll/height/etc. parameters update.
   UpdateScrollSpace();

   // Tilt camera down by the currently desired angle. (Set in SetScroll)
   let cam = GetRotatedCam();

   Camera.Set( cam.eye, [0, 0, 0], cam.up );

   if( m_arrowScroll != 0 ) {
      // If arrowScroll is set, then scroll every frame.
      window.scrollBy( 0, VHToPixels(m_arrowScroll * elapsed / 1000 * 100) );
   }

   let [,windowHeight] = GetDeviceDimensions();

   if( m_currentScroll != m_desiredScroll ) {
      // Might change this to a Slider class later, but it's rather awkward with
      // the different input types (e.g. touch should not use a slider).
      let d = m_verticalScrollSlide ** (elapsed / 250);
      m_currentScroll = m_currentScroll * d + m_desiredScroll * (1-d);
      SetScroll( m_currentScroll );
   }

   // WIP: stuff for handling videos out of the viewing range. Don't really
   // need to do anything, but we could make it pause muted videos to save
   // on cpu load.
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

//-----------------------------------------------------------------------------
// Convert vh units to pixels.
function VHToPixels( vh ) {
    return vh * GetDeviceDimensions()[1] / 100;
}

//-----------------------------------------------------------------------------
// Convert pixels to vh units.
function PixelsToVH( pixels ) {
    return pixels / GetDeviceDimensions()[1] * 100;
}

//-----------------------------------------------------------------------------
// Returns max scroll value of the content area in vh units.
function MaxScroll() {
    const content = document.getElementById( "content" );
    return (content.scrollHeight - content.offsetHeight) / GetDeviceDimensions()[1] * 100;
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

//-----------------------------------------------------------------------------
// This scrolls down one page ideally, but it can have three outcomes:
// 1. Scrolling down one page if it's within range of the display height.
// 2. Scrolling down 60% if the above is false and the page is long enoug.
// 3. Scrolling down to the bottom of the current page to view the rest of it.
function ScrollDownPage() {
   const content = document.getElementById( "content" );

   // You have no idea how long this simple shit took to figure out.
   const pi = GetPagingInfo( m_desiredScroll );
   if( !pi ) return;

   let top = VHToPixels( m_desiredScroll );
   let tolerance = pi.displayHeight * 0.05;

   const pages = content.getElementsByTagName("section");
   if( !pages ) return;

   // Default to max (bottom of last page minus display height).
   let nextLevel = pages[pages.length-1].offsetTop
                 + pages[pages.length-1].offsetHeight
                 - content.offsetHeight;

   for( let i = 0; i < pages.length; i++ ) {
      let page = pages[i];
      // Tolerance lets us do two things: skip a page if we are "close enough"
      // to the bottom of it, as well as ignoring inaccuracies from VH/pixel
      // conversions.
      if( page.offsetTop > top + tolerance ) {
         nextLevel = page.offsetTop;
         break;
      }
   }

   if( nextLevel - top < content.offsetHeight * 1.1 ) {
      // Next page is within reach, so just scroll to there.
      window.scrollTo( 0, nextLevel );
   } else {
      // Next page is too far away, scroll upto 60% of the display height,
      // but don't scroll into the next page - halt there if that comes first.
      let amount = Math.min( content.offsetHeight * 0.6,
                             nextLevel - (top + content.offsetHeight) );
      window.scrollBy( 0, amount );
   }
}

//-----------------------------------------------------------------------------
// Like the above but reverse.
function ScrollUpPage() {
   const content = document.getElementById( "content" );
   
   const pi = GetPagingInfo( m_desiredScroll );
   if( !pi ) return;

   let top = VHToPixels(m_desiredScroll);
   let tolerance = pi.displayHeight * 0.05;

   const pages = content.getElementsByTagName("section");
   if( !pages ) return;

   let bottom = top + content.offsetHeight;

   // Default to top.
   let nextLevel = 0;

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
      window.scrollBy( 0, -amount );
   }
}

//-----------------------------------------------------------------------------
// The onscroll handler should be the only thing calling this. Everything else
// should go through there (via window.scrollBy or window.scrollTo).
function SetDesiredScroll( vh ) {
   m_desiredScroll = vh;
}

//-----------------------------------------------------------------------------
// This directly sets the scroll value of the content.
function SetScroll( vh ) {
   vh = Smath.Clamp( vh, 0, MaxScroll() );
   m_currentScroll = vh;

   UpdateScrollSpace();

   const content = document.getElementById( "content" );
   const pixels  = Math.round(vh * GetDeviceDimensions()[1] / 100);

   // The input will be clamped to the content height.
   content.scrollTop = pixels;

   // Does this belong here...? This belongs more in setting the desired scroll.
   UpdateUpDownArrows();

   const pi = GetPagingInfo();
   let divider = pi.bottom / pi.displayHeight;
   if( divider < 0 ) divider = 0;
   if( divider > 1 ) divider = 1;

   divider = 1 - divider;
   m_scrollAngle = pi.index * 90 + readTurnTable(divider);
}

//-----------------------------------------------------------------------------
// Returns the number of panels defined. A panel is a vertical strip of text.
function GetNumPanels() {
   // A little optimization...
   GetNumPanels.numPanels = GetNumPanels.numPanels 
                          || document.getElementsByClassName( "panel" ).length;
   return GetNumPanels.numPanels;
}

//-----------------------------------------------------------------------------
// Interpolate the colors between two panels and then adjust the color theme.
function UpdateColorTheme( panelBaseIndex, fraction ) {
   const page1 = GetPanelContent( panelBaseIndex );
   const page2 = GetPanelContent( panelBaseIndex + 1 ) || page1;

   let color = Color.Lerp( Color.FromHex( page1.color ),
                           Color.FromHex( page2.color ),
                           fraction );
   let linkcolor = Color.Lerp( Color.FromHex( page1.linkcolor ),
                               Color.FromHex( page2.linkcolor ),
                               fraction );

   Color.Set( color, linkcolor );
}

//-----------------------------------------------------------------------------
// For smooth swivel support - this just snaps the desired angle to be facing
// a panel directly.
function ClampSwivelDesiredOffset() {
   let min = -m_swivelOrigin * 90;
   let max = ((GetNumPanels() - 1) - m_swivelOrigin) * 90;
   m_swivelDesiredOffset = Smath.Clamp( m_swivelDesiredOffset, min, max );
}

//-----------------------------------------------------------------------------
// Activate "swivel" mode, which is horizontal rotation. Vertical scrolling is
// disabled here.
//
// `startDirection` is "left" or "right" or null. "left/right" will cause the
// content to have a left or right swipe animation.
//
// "right" will cause the content to slide off to the left (we are seeking
// towards the panel on the right).
//
// swivelOffset is the starting offset we should apply. 90 for one panel to the
// right. -90 for one panel to the left.
// 
// At the start of the program, this is called with no offsets to enter the
// mode naturally.
function StartSwivelMode( startDirection, swivelOffset ) {
   if( m_swivelMode ) return;

   // TODO: this might not work as expected? Just below the volume is going
   // to fade, and that may mute the background music again.
   AllVideosStoppedPlaying();

   // Fade the content out with an optional slide animation.
   let content = document.getElementById( "content" );
   content.classList.remove( "show" );
   if( startDirection == "left" ) {
      content.classList.add( "slideright" );
   } else if( startDirection == "right" ) {
      content.classList.add( "slideleft" );
   }

   // We're going to slide from the original "tilt" angle towards a snapped
   // angle, and then rotate around a vertically perpendicular axis to that.
   let startingScrollAngle = m_scrollAngle;
   let snapScrollAngle     = Math.round(m_scrollAngle / 90) * 90;

   m_scrollAngle = snapScrollAngle;
   let normalCam = GetRotatedCam();
   m_scrollAngle = startingScrollAngle;

   // Find our vertical pivot axis by snapping from the camera up vector.
   Smath.Copy( m_swivelUpVector, normalCam.up );
   Smath.Snap( m_swivelUpVector );

   m_swivelMode          = true;
   m_swivelOrigin        = m_currentPanel;
   // This is in degrees, and slides towards a desired value. 0 is the 
   // start where panel will equal the current panel, -90 is centered on one
   // panel to the left, and 90 on one panel to the right.
   m_swivelOffset        = 0;
   m_swivelDesiredOffset = swivelOffset;
   ClampSwivelDesiredOffset(); // Make sure we're nice and tight.

   // This should persist for a small while, to hide showing the last panel
   //  name briefly. (This isn't used anymore in favor of immediate title
   //  updates.)
   m_currentPanel = Math.floor(m_swivelOrigin + ((m_swivelDesiredOffset+45)/90));

   // Clean up old states. Not sure what is exactly necessary here, but the
   // more the merrier.
   m_desiredScroll = 0;
   m_currentScroll = 0;

   UpdateBigText();
   UpdateUpDownArrows();

   // To expose our animate time to outer functions.
   m_swivelAnimateTime = 0;

   // The last time the swivel was turned, and we wait some time after that to
   // start the panel display.
   m_swivelTurnTime    = 0;

   // Not used anymore - was for swivel touch-fling velocity.
   m_swivelTouchSwing  = 0;                 

   // Sliders make it easy to slide around with smooth starts and stops.
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
         AllVideosStoppedPlaying();
         return true;
      }
   });

   Animate.Start( "roller", ( time, elapsed ) => {
      m_swivelAnimateTime = time;
      // When the animations start, the camera tilts down (relative down)
      //  until perpendicular with the up axis. Meanwhile it rotates around
      //  that axis when panels are changed.
      //
      // Note that 8 panels to the right is not cancelled out to zero; it is
      //  two full-circle turns to the right.

      sliderScroll.desired = snapScrollAngle;

      // 1000ms to reach nearly done with tilt adjustment.
      m_scrollAngle = sliderScroll.update( elapsed/1000 );
      let newCam = GetRotatedCam();

      // This is not used currently.
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

      // 1000ms to turn to the desired offset.
      m_swivelOffset = sliderOffset.update( elapsed/1000 );

      // We tilted the camera up/down, first, and then want to rotate around
      // our desired "up" vector.
      let rotation = Smath.RotateAroundAxis( m_swivelUpVector,
                                              m_swivelOffset * Math.PI / 180 );
      let tcam = Smath.MultiplyVec3ByMatrix3( newCam.eye, rotation );

      Camera.Set( tcam, [0, 0, 0], newCam.up );

      // Compute current panel index for other functions.
      m_currentPanel = Math.floor( m_swivelOrigin 
                                   + ((m_swivelDesiredOffset+45)/90) );

      {
         // m_currentPanel is the desired panel. This is angle that we are
         // actually facing, and we want to get that panel index and interpolate
         // between that and the next one to make the current color scheme.
         let absoluteTurn = m_swivelOrigin + (m_swivelOffset/90);

         let currentPanel = Math.floor(absoluteTurn);
         let currentFraction = absoluteTurn - currentPanel;

         UpdateColorTheme( currentPanel, currentFraction );
      }

      UpdateLeftRightArrows();
      UpdateBigText();

      // If the panel doesn't turn for a specific amount of time
      // and we aren't touching it, and the sliders are in position, then
      // start the panel display phase again.
      if( time > m_swivelTurnTime + 1800 && !m_touchingSwivel
                         && sliderOffset.remaining() < 1
                         && sliderScroll.remaining() < 1 ) {
         // This overwrites this animation slot.
         StartPanelDisplay();
      }
   });
}

//-----------------------------------------------------------------------------
// The bigtext is the big text centered that shows the year and title of each
// panel.
function UpdateBigText() {
   const bigtext = document.getElementById( "bigtext_container" );
   const bigtext_string = document.getElementById( "bigtext" );
   if( !m_swivelMode ) {
      // If not in swivel mode, this text fades out.
      bigtext.classList.remove( "show" );
      return;
   }

   bigtext.classList.add( "show" );

   const panel = GetPanelContent( m_currentPanel );
   bigtext_string.innerText = panel.year;

   const bigtext_subtitle = document.getElementById( "bigtext_subtitle" );
   bigtext_subtitle.innerText = panel.title;
}

//-----------------------------------------------------------------------------
// Reads data from the panel templates in the HTML.
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

//-----------------------------------------------------------------------------
function PanelTurn( offset ) {
   if( m_swivelMode ) {
      // If already in swivel mode, just add the offset. This will be clamped
      // automatically.
      m_swivelDesiredOffset += offset;
   } else {
      // Only start a panel turn if we can turn that way.
      if( offset < 0 && m_currentPanel == 0 ) return;
      if( offset >= 0 && m_currentPanel == GetNumPanels() - 1 ) return;
      StartSwivelMode( offset > 0 ? "right" : "left", offset );
   }
   m_swivelTurnTime = m_swivelAnimateTime;
}

//-----------------------------------------------------------------------------
// Navigate one panel to the right (starts swivel mode).
function PanelRight() {
   PanelTurn( 90 );
}

//-----------------------------------------------------------------------------
// Navigate one panel to the left (starts swivel mode).
function PanelLeft() {
   PanelTurn( -90 );
}

//-----------------------------------------------------------------------------
// Not used. Rotates the panel left/right according to touch gestures dragging
// x pixels.
function RotateWithTouch( pixels ) {
   const [,windowHeight] = GetDeviceDimensions();
   //const windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
   m_touchingSwivel = true;
   let offset = pixels / (windowHeight * 0.8) * 90;
   m_swivelDesiredOffset += offset;
   m_swivelTouchSwing += offset * 16;
}

//-----------------------------------------------------------------------------
// Should be called on touchend to release the cube.
function StopRotateTouch() {
   m_touchingSwivel = false;
   m_touchingSwivelTime = m_swivelAnimateTime;
   m_swivelTurnTime     = m_swivelAnimateTime;
}

//-----------------------------------------------------------------------------
// Lookup table generated for a 60-degrees fov. This is a one-quarter turn.
// See cubetest.lua
const m_turnTable = [
   1.4210854715202e-14,0.81086921475955,1.5834781595992,2.3224997407682,3.0317443266044,3.7143668739005,4.3730142455317,5.009932553703,5.6270470306119,6.2260225558525,6.8083102721089,7.3751840058483,7.9277690906836,8.4670654435971,8.9939662343893,9.5092731343904,10.01370887999,10.507927706705,10.992524078576,11.468040041047,11.934971453431,12.393773302571,12.844864257854,13.288630595741,13.725429597182,14.155592501852,14.579427087778,14.997219932775,15.409238404311,15.815732416576,16.216935987171,16.613068620607,17.004336541573,17.390933797417,17.773043246381,18.150837445712,18.52447945177,18.89412354253,19.259915871498,19.621995060804,19.980492740251,20.335534038212,20.687238029524,21.035718144892,21.38108254577,21.723434468205,22.062872538729,22.399491065034,22.733380303835,23.06462670808,23.39331315542,23.719519159653,24.043321066657,24.364792236198,24.684003210827,25.001021872983,25.31591359129,25.628741356947,25.939565911022,26.248445863388,26.555437803959,26.860596406845,27.163974527945,27.465623296523,27.765592201171,28.063929170621,28.360680649755,28.655891671171,28.94960592263,29.241865810664,29.532712520621,29.82218607339,30.110325379036,30.397168287552,30.682751636918,30.967111298655,31.250282221022,31.532298470024,31.813193268364,32.092999032468,32.371747407715,32.649469301963,32.926194917504,33.201953781518,33.476774775134,33.750686161182,34.023715610695,34.295890228269,34.567236576312,34.837780698274,35.107548140907,35.376563975608,35.644852818908,35.912438852148,36.179345840388,36.445597150604,36.711215769197,36.976224318866,37.240645074883,37.504499980786,37.767810663546,38.030598448227,38.292884372163,38.554689198693,38.816033430469,39.076937322365,39.337420894017,39.597503942006,39.857206051713,40.116546608858,40.375544810759,40.634219677312,40.892590061714,41.150674660957,41.408492026098,41.666060572322,41.923398588819,42.180524248486,42.43745561747,42.69421066456,42.950807270452,43.207263236893,43.463596295716,43.719824117783,43.975964321847,44.232034483339,44.488052143106,44.744034816093,45,45
];

//-----------------------------------------------------------------------------
// Fraction is 0 to 1, 0 meaning zero tilt, 1 meaning 90-degree tilt.
function readTurnTable( fraction ) {
   fraction = Smath.Clamp( fraction, 0, 1 );

   // The lookup table is only a quarter turn, so we inverse it for the upper
   // half.
   let upperHalf = false;
   if( fraction >= 0.5 ) {
      upperHalf = true; 
      fraction = 1 - fraction;
   }
   
   // 128 entries, and interpolate between them.
   fraction = fraction * 2 * 128;
   let a = Math.floor( fraction );
   let d = fraction - a;

   let r = m_turnTable[a] + (m_turnTable[a+1] - m_turnTable[a]) * d;
   return upperHalf ? 90 - r : r;
}

//-----------------------------------------------------------------------------
// "Dimming" means fade the music out and pause.
// This is called whenever another video starts playing sound, or when the user
// manually pauses it.
function DimMusic() {
   m_music_dimmed = true;
   const music_button = document.getElementById( "music_button" );
   music_button.classList.add( "muted" );

   const music = document.getElementById( "music" );
   if( music.ended ) return;
   if( music.paused ) {
      m_music_volume.reset(0);
      return;
   }

   m_music_volume.desired = 0;
   Animate.Start( "music_volume", ( time, elapsed ) => {
      if( music.ended ) return true;
      music.volume = m_music_volume.update( elapsed / 1000 );
      if( m_music_volume.value < 0.01 ) {
         music.pause();
         return true;
      }
   });
}

//-----------------------------------------------------------------------------
// "Dimming" means fade the music out and pause.
// It's lifted when all videos on the page have stopped making sound, and the
// user hasn't manually paused it.
function UndimMusic() {
   m_music_dimmed = false;
   const music_button = document.getElementById( "music_button" );
   music_button.classList.remove( "muted" );

   const music = document.getElementById( "music" );
   if( music.ended ) return;

   m_music_volume.desired = MUSIC_VOLUME;
   if( music.paused ) music.play();

   Animate.Start( "music_volume", ( time, elapsed ) => {
      if( music.ended ) return true;
      music.volume = m_music_volume.update( elapsed / 1000 );
      if( m_music_volume.value >= MUSIC_VOLUME - 0.01 ) {
         return true;
      }
   });
}

//-----------------------------------------------------------------------------
// Dim/Undim shouldn't be called directly, go through here to handle all of the
// cases.
function UpdateMusicPlaying() {
   let videoPlaying = false;
   for( const x in m_videos_playing ) {
      videoPlaying = true;
      break;
   }

   if( m_music_manual_dim || videoPlaying ) {
      DimMusic();
   } else {
      UndimMusic();
   }
}

//-----------------------------------------------------------------------------
// Called when a video with this id has started playing sound.
// This should be called in onplay and onvolumechanged handlers.
// (Only call if it's making sound).
function VideoStartedPlaying( id ) {
   m_videos_playing[id] = true;
   UpdateMusicPlaying();
}

//-----------------------------------------------------------------------------
// Called when a video has stopped or is muted.
function VideoStoppedPlaying( id ) {
   delete m_videos_playing[id];
   for( const x in m_videos_playing ) return;
   UpdateMusicPlaying();
}

//-----------------------------------------------------------------------------
// Searches for any videos on the page that are making sound, and pauses them,
// except for the specified id, which is about to begin.
function PauseOtherVideosWithSound( id ) {
   const youtubes = document.getElementsByClassName( "youtube" );
   for( const youtube of youtubes ) {
      if( youtube.ytready && youtube.id != id ) {
         youtube.player.pauseVideo();
      }
   }

   const videos = document.getElementsByTagName( "video" );
   for( const video of videos ) {
      if( video.id != id ) {
         if( video.volume > 0.01 && !video.muted ) {
            video.pause();
            // Not sure if this triggers the state event?
         }
      }
   }
}

//-----------------------------------------------------------------------------
// To clean up the state when the content is reset.
function AllVideosStoppedPlaying() {
   m_videos_playing = {};
   UpdateMusicPlaying();
}

//-----------------------------------------------------------------------------
// The opportune time to start music is at the very start, but since we require
//      user interaction, we start it as soon as they click and start the zoom.
function StartMusic() {
   const music        = document.getElementById( "music" );
   const music_note   = document.getElementById( "music_note" );
   const music_button = document.getElementById( "music_button" );

   m_music_volume.reset( MUSIC_VOLUME );
   music.volume = MUSIC_VOLUME;

   // Bad name. This is the text note about the music, not the musical
   // note icon.
   document.getElementById( "music_note" ).classList.add( "show" );
   music.play();

   music.addEventListener( "ended", () => {
      // Hide the music button completely when the music ends.
      music_button.classList.remove( "show" );
   });

   // Show the copyright information for 10 seconds, and then fade out in
   // favor of a control. The music starts very slow, so this is more than fine
   // for 10 seconds.
   setTimeout( () => {
      music_note.classList.remove( "show" );
      setTimeout( () => {
         music_button.classList.add( "show" );
      }, 1000 );
   }, 10000 );

   // Manual dim switch.
   music_button.addEventListener( "click", () => {
      m_music_manual_dim = !m_music_dimmed;
      UpdateMusicPlaying();
   });

   SetupVisibilityHandler();
}

//-----------------------------------------------------------------------------
// Sets up automatically pausing the music when the user switches to another
// tab.
function SetupVisibilityHandler() {
   let hidden, visibilityChange; 
   if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
   } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
   } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
   }

   if( !visibilityChange ) return;

   // We need to be very careful in here. I think this will work okay because
   // all update loops should pause when the page goes to the background.
   const music = document.getElementById( "music" );

   document.addEventListener( visibilityChange, () => {
      if( document[hidden] ) {
         if( !music.paused ) {
            music.pause();
         }
      } else {
         UpdateMusicPlaying();
      }
   });
}

///////////////////////////////////////////////////////////////////////////////
export default {
    Start, SetScroll, Setup, StartMusic
}