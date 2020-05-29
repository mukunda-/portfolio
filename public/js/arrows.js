// The navigation arrows.

const m_actions = {}

function Setup() {
    let leftArrow  = CreateArrow( "leftArrow", 180 );
    let rightArrow = CreateArrow( "rightArrow", 0 );
    let downArrow  = CreateArrow( "downArrow", 90 );
    let upArrow    = CreateArrow( "upArrow", -90 );
}

function SetAction( id, action, actionUp ) {
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

function OnArrowEvent( type, e ) {
    let snippedID = e.currentTarget.id.split("Arrow")[0];
    if( m_actions[snippedID] ) {
        return m_actions[snippedID]( type, e );
    }
}

function CreateArrow( id, angle ) {
    let arrow = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );
    arrow.setAttribute( "id", id );
    arrow.setAttribute( "class", "arrow" );
    arrow.style.width = "10vh";
    arrow.style.height = "10vh";

    let ca = Math.cos(angle * Math.PI / 180);
    let sa = Math.sin(angle * Math.PI / 180);
    let points = [
        -6.5, -15,
        6.5,  0,
        -6.5, 15
    ];

    let pointst = [];

    for( let i = 0; i < points.length ; i += 2 ) {
        let [x,y] = [points[i], points[i+1]];
        pointst.push( `${(x * ca - y * sa) + 20}, ${x * sa + y * ca + 20}` );
        //points[i] = x * ca - y * sa;
        //points[i+1] = x * sa + y * ca;
    }

    arrow.setAttribute( "viewBox", "0 0 40 40" );
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline" );
    polyline.setAttribute( "points", pointst.join(" ") );//"5,5  20,18  35,5" );
    polyline.setAttribute( "style", "fill:none;stroke:rgb(255,255,255);stroke-width:7" );
    arrow.appendChild( polyline );

    arrow.addEventListener( "click", e => OnArrowEvent( "click", e ) );
    arrow.addEventListener( "mousedown", e => OnArrowEvent( "mousedown", e ) );
    arrow.addEventListener( "mouseup", e => OnArrowEvent( "mouseup", e ) );

    document.body.appendChild( arrow );
    return arrow;
}

///////////////////////////////////////////////////////////////////////////////
export default {
    Setup, SetAction
}