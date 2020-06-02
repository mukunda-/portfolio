// The navigation arrows. This also handles the fullscreen button.
// (C) 2020 Mukunda Johnson
///////////////////////////////////////////////////////////////////////////////
const m_actions = {}

let m_fullscreenButton;

//-----------------------------------------------------------------------------
// Called at app start.
function Setup() {
   CreateArrow( "leftArrow", 180 );
   CreateArrow( "rightArrow", 0 );
   CreateArrow( "downArrow", 90 );
   CreateArrow( "upArrow", -90 );

   CreateFullScreenButton();
}

//-----------------------------------------------------------------------------
// If a button has an action set, then it becomes visible. `null` as an action
// disables the button and hides it. `id` can be "left", "up", "right", or
// "down", to set the action for that button. `action` is a callback with
// parameters( type, e )
// type: type of event (click, mousedown, or mouseup). Touches are converted
//                     into mousedown/mouseup.
// e: event data
//
function SetAction( id, action ) {
   let elem = document.getElementById( id + "Arrow" );
   if( !elem ) throw "Invalid ID.";

   if( m_actions[id] === action ) return;
   m_actions[id] = action;
   
   if( action ) {
      elem.classList.add( "enabled" );
   } else {
      elem.classList.remove( "enabled" );
   }
}

//-----------------------------------------------------------------------------
// Internal handler.
function OnArrowEvent( type, e ) {
   let snippedID = e.currentTarget.id.split("Arrow")[0];
   if( m_actions[snippedID] ) {
      return m_actions[snippedID]( type, e );
   }
}

//-----------------------------------------------------------------------------
// Sets up a button. `id` is the ID of the element. `angle` is the rotation
//  amount to apply in degrees. (0 = right arrow).
function CreateArrow( id, angle ) {
   let arrow = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
   arrow.setAttribute( "id", id );
   arrow.setAttribute( "class", "hud-button arrow" );
   arrow.style.width  = "10vh";
   arrow.style.height = "10vh";

   let ca = Math.cos(angle * Math.PI / 180);
   let sa = Math.sin(angle * Math.PI / 180);
   let points = [
      -6.5, -15,
      6.5,  0,
      -6.5, 15
   ];

   // Points transformed.
   let pointst = [];

   for( let i = 0; i < points.length ; i += 2 ) {
      let [x,y] = [points[i], points[i+1]];
      pointst.push( `${(x * ca - y * sa) + 20}, ${x * sa + y * ca + 20}` );
   }

   arrow.setAttribute( "viewBox", "0 0 40 40" );
   const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline" );
   polyline.setAttribute( "points", pointst.join(" ") );
   polyline.setAttribute( "style", "fill:none;stroke:rgb(255,255,255);stroke-width:7" );
   arrow.appendChild( polyline );

   // Hook events.
   arrow.addEventListener( "click", e => OnArrowEvent( "click", e ) );
   arrow.addEventListener( "mousedown", e => OnArrowEvent( "mousedown", e ) );
   arrow.addEventListener( "mouseup", e => OnArrowEvent( "mouseup", e ) );

   // Hacky...
   arrow.addEventListener( "touchstart", e => {
      if( arrow.holdable ) {
         e.button = 0;
         OnArrowEvent( "mousedown", e );
      }
   });
   arrow.addEventListener( "touchend", e => {
      if( arrow.holdable ) {
         e.button = 0;
         OnArrowEvent( "mouseup", e );
         e.preventDefault();
      }
   });

   document.body.appendChild( arrow );
   return arrow;
}

//-----------------------------------------------------------------------------
// This doesn't really belong here, and I would see the button creation being
// abstracted away with this file being repurposed for this app's specific
// buttons. But you know what? A bit of balance between perfect and "easy" is
// important for development time. Just so long as you don't get too crazy.
function CreateFullScreenButton() {
   let elem = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
   elem.setAttribute( "id", "fullscreenButton" );
   elem.setAttribute( "class", "hud-button" );
   elem.style.right = "0.5vh";
   elem.style.top   = "0.5vh";

   elem.setAttribute( "viewBox", "0 0 40 40" );
   
   {
      // These are specified in -1 to 1 units and transformed below to make
      // things less boggling.
      let paths = [
         [-1, -0.25,  -1, -1,  -0.25, -1],
         [-1,  0.25,  -1,  1,  -0.25,  1],
         [0.25,   1,   1,  1,   1,  0.25],
         [0.25,  -1,   1, -1,   1, -0.25]
      ];

      for( const p of paths ) {
         for( const i in p ) {
            p[i] = 20 + p[i] * 8;
         }
      }

      for( const p of paths ) {
         const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline" );
         pl.setAttribute( "points", p.join(" ") );
         pl.setAttribute( "style", "fill:none;stroke:rgb(255,255,255);stroke-width:2" );
         elem.appendChild( pl );
      }
   }

   document.body.appendChild( elem );

   // And the handler, nice and hardcoded. :)
   elem.addEventListener( "click", () => {
      if( elem.classList.contains( "enabled" )) {
         document.documentElement.requestFullscreen();
      }
   });

   m_fullscreenButton = elem;
}

function EnableFullscreenButton() {
   m_fullscreenButton.classList.add( "enabled" );
}

///////////////////////////////////////////////////////////////////////////////
export default {
   Setup, SetAction, EnableFullscreenButton
}
