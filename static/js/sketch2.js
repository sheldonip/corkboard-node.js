window.addEventListener('load', function () {
    // get the canvas element and its context
    var canvas = document.getElementById('sketchpad');
    var context = canvas.getContext('2d');

    // create a drawer which tracks touch movements
    var drawer = {
    	color : "#222",
    	width: 3,
        isDrawing: false,
        touchstart: function (coors) {
            context.beginPath();
            context.moveTo(coors.x, coors.y);
            this.isDrawing = true;
        },
        touchmove: function (coors) {
            if (this.isDrawing) {
                context.lineTo(coors.x, coors.y);
                context.strokeStyle = this.color;
                context.lineWidth = this.width;
                context.lineJoin = "round";
                context.stroke();
            }
        },
        touchend: function (coors) {
            if (this.isDrawing) {
                this.touchmove(coors);
                this.isDrawing = false;
            }
        }
    };
    // create a function to pass touch events and coordinates to drawer
    function draw(event) { 
        var type = null;
        // map mouse events to touch events
        switch(event.type){
            case "mousedown":
                    event.touches = [];
                    event.touches[0] = { 
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchstart";                  
            break;
            case "mousemove":                
                    event.touches = [];
                    event.touches[0] = { 
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchmove";                
            break;
            case "mouseup":                
                    event.touches = [];
                    event.touches[0] = { 
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchend";
            break;
        }    
        
        // touchend clear the touches[0], so we need to use changedTouches[0]
        var coors;
        if(event.type === "touchend") {
            coors = {
                x: event.changedTouches[0].pageX,
                y: event.changedTouches[0].pageY
            };
        }
        else {
            // get the touch coordinates
            coors = {
                x: event.touches[0].pageX,
                y: event.touches[0].pageY
            };
        }
        type = type || event.type
        // pass the coordinates to the appropriate handler
        drawer[type](coors);
    }
    
    // detect touch capabilities
    var touchAvailable = ('createTouch' in document) || ('ontouchstart' in window);
    
    // attach the touchstart, touchmove, touchend event listeners.
    if(touchAvailable){
        canvas.addEventListener('touchstart', draw, false);
        canvas.addEventListener('touchmove', draw, false);
        canvas.addEventListener('touchend', draw, false);        
    }    
    // attach the mousedown, mousemove, mouseup event listeners.
    else {
        canvas.addEventListener('mousedown', draw, false);
        canvas.addEventListener('mousemove', draw, false);
        canvas.addEventListener('mouseup', draw, false);
    }

    // prevent elastic scrolling
    document.body.addEventListener('touchmove', function (event) {
        event.preventDefault();
    }, false); // end body.onTouchMove
    
    
//color spectrum
$(".basic").spectrum({
    color: "#222",
    change: function(color) {
        drawer.color = color.toHexString();
    }
});

//rubber
$( "#rubber" ).on( "click", function() {
  drawer.color = "#FFF";
});

$( "#clear" ).on( "click", function() {
  context.clearRect(0, 0, 310, 310);
});

}, false); // end window.onLoad


