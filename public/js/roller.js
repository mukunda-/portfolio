import Camera from "./camera.js";
import Smath from "./smath.js";
import Animate from "./animate.js";
import Arrows from "./arrows.js";
import Color from "./color.js";

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

let m_panelMode = false;
let m_panel = 0;
let m_panelFraction = 0; // this is 0 when scrolling is activated

let m_panelTurn       = 0;
let m_panelTurnOrigin = 0; // Which panel we started on, where angle 0 is that.
let m_panelRotateStart      = 0;
let m_panelRotateUp         = [0, 1, 0];
let m_panelRotateStartPanel = 0;
let m_panelAnimateTime      = 0;
let m_panelTouchTime        = 0;

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

    StartFlicker();
    //LoadContent( "panel1" );


    // Replace this with native scrolling of element.
    document.addEventListener( "wheel", ( e ) => {
        if( e.deltaY > 0 ) {
            Scroll( 5 );
        } else {
            Scroll( -5 );
        }
    });

    // Replace this with native scrolling of element.
    document.addEventListener( "keydown", ( e ) => {
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

    UpdateLeftRightArrows( m_panel );
    StartPanelRotate();

    //Animate.Start( "roller", OnAnimate );
    

}

function StartPanelDisplay() {
    {
        const [eye, , up] = Camera.Get();
        m_cam = eye;
        Smath.Snap( m_cam, 1.0 );
        m_up = up; //[0, 1, 0];
        Smath.Snap( m_up, 1.0 );
    }

    const panel = GetPanelContent( m_panel );

    const content = document.getElementById( "content" );

    const header_element = `<h2 class="header">${panel.title}</h2>`

    content.innerHTML = panel.html;

    let firstPage = true;
    
    for( const page of content.getElementsByClassName( "page" )) {
        if( firstPage ) {
            page.innerHTML = header_element + page.innerHTML;
            firstPage = false;
        }
        page.innerHTML = `<div class="inner">${page.innerHTML}</div>`;
    }

    for( const a of content.getElementsByTagName( "a" )) {
        a.setAttribute( "target", "_blank" );
    }


    content.classList.remove( "slideleft" );
    content.classList.remove( "slideright" );
    content.classList.add( "show" );
    
    SetupContentPadding();

    m_panelMode = false;
    UpdateBigText();

    m_currentScroll = 0;
    m_desiredScroll = 0;
    m_scrollAngle   = 0;
    content.scrollTop = 0;

    UpdateUpDownArrows();

    Animate.Start( "roller", OnAnimate );
}

function UpdateLeftRightArrows( currentPanel ) {
    const numPanels = GetNumPanels();
    if( currentPanel > 0 ) {
        Arrows.SetAction( "left", () => {
            PanelLeft();
        });
    } else {
        Arrows.SetAction( "left", null );
    }

    if( currentPanel < numPanels - 1 && numPanels != 0 ) {
        
        Arrows.SetAction( "right", () => {
            PanelRight();
        });
    } else {
        Arrows.SetAction( "right", null );
    }
}

function UpdateUpDownArrows() {
    if( m_panelMode ) {
        Arrows.SetAction( "up", null );
        Arrows.SetAction( "down", null );
        return;
    }

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

function GetRotatedCam() {
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

    return {
        eye: tcam,
        right: axis,
        up: tup
    };
}

function OnAnimate( time, elapsed ) {
    // Rotate camera "down" by desired angle.
    let cam = GetRotatedCam();
    
    Camera.Set( cam.eye, [0, 0, 0], cam.up );

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

function LoadContent( panel ) {

    
}

function SetupContentPadding() {
    const content = document.getElementById( "content" );
    if( !content.classList.contains( "show" )) return;
    
    let windowHeight = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
    const pages = content.getElementsByClassName( "page" );
    let st = content.scrollTop;
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

    UpdateUpDownArrows();

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

function GetNumPanels() {
    return document.getElementsByClassName( "panel" ).length;
}

function UpdateColorTheme( panelIndex, fraction ) {
    const page1 = GetPanelContent( panelIndex );
    const page2 = GetPanelContent( panelIndex + 1 ) || page1;

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

// Applies the difference times factor or a constant amount
//  if less than.
function ApplyFactorOrConstSlide( from, to, delta, linearSpeed, time ) {

    let diff = (to - from) * (1-delta);
    linearSpeed *= time;
    if( Math.abs(diff) < linearSpeed ) {
        // Use linear speed
        if( from < to ) {
            from += linearSpeed;
            if( from > to ) from = to;
        } else {
            from -= linearSpeed;
            if( from < to ) from = to;
        }
        return from;
    } else {
        return from + diff * delta;
    }
}

function StartPanelRotate( startDirection ) {
    if( m_panelMode ) return;

    let content = document.getElementById( "content" );
    content.classList.remove( "show" );

    if( startDirection == "left" ) {
        content.classList.add( "slideright" );
    } else if( startDirection == "right" ) {
        content.classList.add( "slideleft" );
    }


    let startingAngle = m_scrollAngle;
    let snapAngle = Math.round(m_scrollAngle / 90) * 90;

    let startingCam = GetRotatedCam();
    m_scrollAngle = snapAngle;
    let normalCam = GetRotatedCam();
    m_scrollAngle = startingAngle;

    //Smath.Copy( m_panelRotateStart, cam.eye );
    //Smath.Snap( m_panelRotateStart, 1.0 );
    Smath.Copy( m_panelRotateUp, normalCam.up );
    Smath.Snap( m_panelRotateUp );
    //m_panelRotateUp = Smath.Normalize( Smath.Cross( m_panelRotateStart, cam.right) );

    m_panelMode = true;
    m_panelTurnOrigin = m_panel;
    m_panelTurn = 0;
    //m_cam.

    m_desiredScroll = 0;
    m_currentScroll = 0;

    UpdateBigText();
    UpdateUpDownArrows();

    m_panelAnimateTime = 0;
    m_panelTouchTime   = 0;


    Animate.Start( "roller", ( time, elapsed ) => {
        m_panelAnimateTime = time;
        // When the animations start, the camera tilts down (relative down)
        //  until perpendicular with the up axis. Meanwhile it rotates around
        //  that axis when panels are changed.
        // 8 panels to the right is not cancelled out to zero; it is two
        //  full-circle turns.

        let turnSpeed = Animate.Slide( 0.95, 0.4, "lerp", time, m_panelTouchTime, m_panelTouchTime+400 );

        let d = turnSpeed ** (elapsed / 250);
        //let d = 0.4 ** (elapsed / 250);

        let newCam;
        //if( time < 500 ) {
            // 500
            //m_scrollAngle = Animate.Slide( startingAngle, snapAngle, "fall", time, 0, 500 );
            m_scrollAngle = ApplyFactorOrConstSlide( m_scrollAngle, snapAngle, d, 4.0, elapsed / 1000 ); //m_scrollAngle * d + snapAngle * (1-d);
            newCam = GetRotatedCam();
        //} else {
         //   newCam = normalCam;
        //}

        let desiredTurn = (m_panel - m_panelTurnOrigin) * 90;
        
        m_panelTurn = ApplyFactorOrConstSlide( m_panelTurn, desiredTurn, d, 4.0, elapsed / 1000 );
        //m_panelTurn = m_panelTurn * d + desiredTurn * (1-d);
        let rotation = Smath.RotateAroundAxis( m_panelRotateUp, m_panelTurn * Math.PI / 180 );
        let tcam = Smath.MultiplyVec3ByMatrix3( newCam.eye, rotation );

        Camera.Set( tcam, [0, 0, 0], newCam.up );

        // Set the color.
        {
            let currentTurn = m_panelTurnOrigin + (m_panelTurn/90);
            let currentPanel = Math.floor(currentTurn);
            let currentFraction = currentTurn - currentPanel;
            
            UpdateColorTheme( currentPanel, currentFraction );
        }

        if( time > m_panelTouchTime + 1800 ) {
            StartPanelDisplay();
        }
    });

}

function UpdateBigText() {
    const bigtext = document.getElementById( "bigtext_container" );
    const bigtext_string = document.getElementById( "bigtext" );
    if( !m_panelMode ) {
        bigtext.classList.remove( "show" );
        return;
    }
    
    bigtext.classList.add( "show" );

    const panel = GetPanelContent( m_panel );
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
    let newPanel = Smath.Clamp( m_panel + offset, 0, GetNumPanels() - 1 );
    if( newPanel == m_panel ) return;
    StartPanelRotate( newPanel > m_panel ? "right" : "left" );
    m_panel = newPanel;
    UpdateLeftRightArrows( m_panel );
    UpdateBigText();
    m_panelTouchTime = m_panelAnimateTime;
}

function PanelRight() {
    PanelTurn( 1 );
}

function PanelLeft() {
    PanelTurn( -1 );
}


export default {
    Start, SetScroll, LoadContent, SetupContentPadding
}