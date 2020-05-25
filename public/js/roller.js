import Camera from "./camera.js";
import Smath from "./smath.js";
import Animate from "./animate.js";
import Arrows from "./arrows.js";

// Camera angle (vector pointing outward from center).
let m_cam;

// Up angle (pointing up from camera).
let m_up;

// The angle to lean downward from the top.
let m_scrollAngle = 0;

let m_currentScroll = 0;
let m_desiredScroll = 0;
let m_pageScroll    = 0; // TODO, different scrolling for the page
let m_maxVSpeed     = 0;

let m_keyNav = 0;
const KEYNAV_UP = 1;
const KEYNAV_DOWN = 2;

function Start() {
    let [eye] = Camera.Get();
    m_cam = eye;
    Smath.Snap( m_cam, 1.0 );
    m_up = [0, 1, 0];

    let fov = 45.0;
    let cubedistance = 3;
    let cubesize = 2;
    let vrange = Math.tan( fov / 2 * Math.PI / 180 ) * cubedistance;
    content.style.top = (vrange - cubesize/2) * 50 / vrange + "vh";
    content.style.bottom = (vrange - cubesize/2) * 50 / vrange + "vh";
    content.style.display = "block";

    LoadContent( "panel1" );
    Animate.Start( "roller", OnAnimate );

    StartFlicker();

    document.addEventListener( "wheel", ( e ) => {
        if( e.deltaY > 0 ) {
            Scroll( 5 );
        } else {
            Scroll( -5 );
        }
    });

    document.addEventListener( "keydown", ( e ) => {
        console.log(e);
        if( !e.repeat ) {
            if( e.key == "ArrowDown" ) {
                // down
                m_keyNav = KEYNAV_DOWN;
            } else if( e.key == "ArrowUp" ) {
                // up arrow
                m_keyNav = KEYNAV_UP;
            } else if( e.key == "PageDown" ) {
                ScrollDownPage();
            } else if( e.key == "PageUp" ) {
                ScrollUpPage();
            }
        }
    });

    document.addEventListener( "keyup", ( e ) => {
        if( e.key == "ArrowDown" ) {
            m_keyNav &= ~KEYNAV_DOWN;
        } else if( e.key == "ArrowUp" ) {
            m_keyNav &= ~KEYNAV_UP;
        }
    });
}

function StartFlicker() {
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

function OnAnimate( time, elapsed ) {
    // Rotate camera "down" by desired angle.
    
    let angle = m_scrollAngle * Math.PI / 180;
    //let angle = (Math.sin( time*0.001 )) * 1.9;
    let camdir = Smath.Normalize( m_cam );
    let axis = Smath.Normalize( Smath.Cross(m_up, camdir) );
    let rotation = Smath.RotateAroundAxis( axis, angle );
    let tcam = Smath.MultiplyVec3ByMatrix3( m_cam, rotation );
    let tup = Smath.MultiplyVec3ByMatrix3( m_up, rotation );
    tcam[0] = tcam[0] * 4;
    tcam[1] = tcam[1] * 4;
    tcam[2] = tcam[2] * 4;
    Camera.Set( tcam, [0, 0, 0], tup );

    if( m_keyNav & KEYNAV_UP ) {
        Scroll( -2 * 16 / elapsed );
    } else if( m_keyNav & KEYNAV_DOWN ) {
        Scroll( 2 * 16 / elapsed );
    }

    if( m_currentScroll != m_desiredScroll ) {
        let d = 0.4 ** (elapsed / 250);
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
}

function LoadContent( tag ) {
    

    const content = document.getElementById( "content" );
    content.innerHTML = document.getElementById( "panel1" ).innerHTML;

    SetupContentPadding();
}

function SetupContentPadding() {
    const content = document.getElementById( "content" );
    let windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
    const pages = content.getElementsByClassName( "page" );
    let st = content.scrollTop;
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
    }
    content.scrollTop = st;
    //m_desiredScroll = content.scrollTop / GetDeviceHeight() * 100;
    SetScroll( m_desiredScroll );
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
    if( scroll === undefined ) {
        scroll = content.scrollTop;
    } else {
        scroll = VHToPixels( scroll );
    }
    const pages = content.getElementsByClassName("page");

    let i = 0;
    for( i = 0; i < pages.length; i++ ) {
        let page = pages[i];
        let bottom = page.offsetTop + page.offsetHeight - scroll;
        if( bottom > 0.001 ) break;
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

function ScrollDownPage() {
    // ALL VERY DELICATE STUFF
    const pi = GetPagingInfo( m_desiredScroll );
    
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

    const pi = GetPagingInfo( m_desiredScroll );
    
   // let scrollPixels = VHToPixels( m_desiredScroll );

    if( (pi.top / pi.displayHeight) <= -0.05 ) {
        // Too far to reach next page.
        let scrollAmount = pi.displayHeight * 0.6;
        if( scrollAmount > -pi.top )
            scrollAmount = -pi.top;
        //if( toBottom > pi.displayHeight * 0.9 ) toBottom = pi.displayHeight * 0.9
        m_desiredScroll -= PixelsToVH( scrollAmount );//toBottom );
        if( scrollAmount / pi.displayHeight < 0.1 && pi.index > 0 )
            return ScrollUpPage();
    } else {
        let amount = -pi.top + pi.displayHeight;
        m_desiredScroll -= PixelsToVH( amount );
        
        if( amount / pi.displayHeight < 0.1 && pi.index > 0 )
            return ScrollUpPage();
    }

    m_desiredScroll = Smath.Clamp( m_desiredScroll, 0, MaxScroll() );
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

function SetScroll( vh ) {
    vh = Smath.Clamp( vh, 0, MaxScroll() );
    m_currentScroll = vh;
    let content = document.getElementById( "content" );
    let pixels = Math.round(vh * GetDeviceHeight() / 100);
    

    // The input will be clamped to the content height.
    content.scrollTop = pixels;
    
    if( m_desiredScroll > 1 ) {
        Arrows.SetAction( "up", ScrollUpPage );
    } else {
        Arrows.SetAction( "up", null );
    }
    
    if( m_desiredScroll < MaxScroll() - 1 ) {
        Arrows.SetAction( "down", ScrollDownPage );
    } else {
        Arrows.SetAction( "down", null );
    }

    // go through page bottoms and find out which one is on the screen.
    // lock the horizontal bar of the cube on that.
    // make sure one bar corresponds to each page.
    // first 90deg turn is the first page, second for the second ,etc.

    const pages = content.getElementsByClassName("page");

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
    m_scrollAngle = (pi.index + divider) * 90;
}


export default {
    Start, SetScroll, LoadContent, SetupContentPadding
}