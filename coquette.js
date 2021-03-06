// https://github.com/eric-brechemier/within (License: CC0)
//
// within is a factory of semi-private spaces
// where properties and events can be shared
// in isolation.
//
// Usage:
//
//   // Run code within a module
//   within( "your.domain/path", function( publish, subscribe, get, set ) {
//     // semi-private space
//   });
//
//   // Access a shared space by name
//   within( "your.domain/path" ).set( "property", "value" );
//
//   // Create an anonymous space for single use
//   var space = within();

// from sub/nada/privately.js (CC0)
function privately( func ) {
  return func();
}

privately(function() {
  var
    undef, // do not trust global undefined, which can be set to a value
    dataSpaces = {},
    eventSpaces = {},
    has,
    call;

  // from sub/nada/no.js (CC0)
  function no( value ) {
    return value === null || value === undef;
  }

  // from sub/nada/copy.js (CC0)
  function copy( array ) {
    return [].concat( array );
  }

  // from sub/nada/remove.js (CC0)
  function remove( array, value ) {
    var i;
    for ( i = array.length; i >= 0; i-- ) {
      if ( array[ i ] === value ){
        array.splice( i, 1 );
      }
    }
  }

  // from sub/nada/forEach.js (CC0)
  function forEach( array, callback ) {
    var
      isBreak = false,
      i,
      length = array.length;

    for ( i = 0; i < length && !isBreak ; i++ ){
      isBreak = callback( array[ i ], i ) === true;
    }

    return isBreak;
  }

  // from sub/nada/bind.js (CC0)
  function bind( func, object ) {
    return function() {
      return func.apply( object, arguments );
    };
  }

  // from sub/nadasurf/alias.js (CC0)
  function alias( func ) {
    return bind( func.call, func );
  }

  has = alias( Object.prototype.hasOwnProperty );
  call = alias( Function.prototype.call );

  /*
    Function: within( [name, [callback]] ): any
    Create a semi-private space to share properties and events

    Parameters:
      name - string, optional, name of the symbolic space:
             a domain name and path that you control on the Web.
             Example: "github.com/eric-brechemier/within/tests/module1"
      callback - function( publish, subscribe, get, set ), optional, function
                 called immediately in the context ('this') of the space data
                 object with four functions (described separately below) as
                 arguments to share events and properties within the space.

    Returns:
      any, the value returned by the callback function,
      or a space function with the four methods publish, subscribe, get, set,
      to interact with the space data when the callback function is omitted;
      the space function can then be called at any point with the same kind
      of callback function described above to run code within the space.
      When no name is provided, an anonymous module is created for single use,
      for which no reference is kept in the internal space factory.
  */
  function within( name, callback ) {
    var
      // data space - object(string -> any), set of properties
      dataSpace,
      // event space - object(string -> array of functions), event listeners
      eventSpace;

    if ( no( name ) ) {
      dataSpace = {};
      eventSpace = {};
    } else {
      if ( !has( dataSpaces, name ) ) {
        dataSpaces[ name ] = {};
        eventSpaces[ name ] = {};
      }
      dataSpace = dataSpaces[ name ];
      eventSpace = eventSpaces[ name ];
    }

    /*
      Function: get( name ): any
      Retrieve the value of a property

      Parameter:
        name - string, the name of a property in module data object

      Returns:
        any, the value of the property with given name
        in the own properties of the module data object
    */
    function get( name ) {
      if ( !has( dataSpace, name ) ){
        return undef;
      }
      return dataSpace[ name ];
    }

    /*
      Function: set( name, value )
      Set the value of a property of the module

      Parameters:
        name - string, the name of a property in module data object
        value - any, the new value of the property
    */
    function set( name, value ) {
      dataSpace[ name ] = value;
    }

    /*
      Function: publish( name, value )
      Set the value of a property and fire listeners registered for this event
      in this module and in this module only, until a listener returns true or
      all listeners have been called.

      Parameters:
        name - string, the name of an event and the associated property
        value - any, optional, the new value of the property, also provided
                to listeners, defaults to boolean value true
    */
    function publish( name, value ) {
      var listeners;
      if ( arguments.length < 2 ) {
        value = true;
      }
      set( name, value );
      if ( !has( eventSpace, name ) ) {
        return;
      }
      listeners = copy( eventSpace[ name ] );
      forEach( listeners, function( listener ) {
        return call( listener, dataSpace, value );
      });
    }

    /*
      Function: subscribe( name, listener ): function
      Register a callback function for the event of given name

      Parameters:
        name - string, the name of an event and the related property
        listener - function( value ), the callback triggered in the context of
                   the module data object:
                   - immediately, if the property with given name has been set,
                     with the value of the property as parameter
                   - then each time the event with given name is published
                     until the subscription is cancelled, with the value of
                     the property when the event is published as parameter.

      Returns:
        function(), the function to call to remove current callback function
        from listeners and prevent it from receiving further notifications
        for this event.
    */
    function subscribe( name, listener ) {
      var listeners;
      if ( !has( eventSpace, name ) ) {
        eventSpace[ name ] = [];
      }
      listeners = eventSpace[ name ];
      listeners.push( listener );
      if ( has( dataSpace, name ) ) {
        call( listener, dataSpace, dataSpace[ name ] );
      }
      return function unsubscribe() {
        remove( listeners, listener );
      };
    }

    /*
      Function: space( callback ): any
      Run code in the given space

      Parameter:
        callback - function( publish, subscribe, get, set ), optional, function
                   called immediately in the context ('this') of the space data
                   object with four functions (described above) as arguments to
                   share events and properties within the space.

      Returns:
        any, the value returned by the callback function,
        or undefined
    */
    function space( callback ) {
      return callback.apply( dataSpace, [ publish, subscribe, get, set ] );
    }

    if ( arguments.length < 2 ) {
      space.publish = publish;
      space.subscribe = subscribe;
      space.get = get;
      space.set = set;
      return space;
    }

    return space( callback );
  }

  // export to global 'this'
  this.within = within;
});

within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  function Collider(space) {
    this.space = space;
  };

  // if no entities have uncollision(), skip expensive record keeping for uncollisions
  var isUncollisionOn = function(entities) {
    for (var i = 0, len = entities.length; i < len; i++) {
      if (entities[i].uncollision !== undefined) {
        return true;
      }
    }
    return false;
  };

  var isSetupForCollisions = function(obj) {
    return obj.pos !== undefined && obj.size !== undefined;
  };

  Collider.prototype = {
    collideRecords: [],

    update: function() {
      var ent = this.space.get("entities").all();
      for (var i = 0, len = ent.length; i < len; i++) {
        for (var j = i + 1; j < len; j++) {
          if (this.isColliding(ent[i], ent[j])) {
            this.collision(ent[i], ent[j]);
          } else {
            this.removeOldCollision(this.getCollideRecordIds(ent[i], ent[j])[0]);
          }
        }
      }
    },

    collision: function(entity1, entity2) {
      var collisionType;
      if (!isUncollisionOn(this.space.get("entities").all())) {
        collisionType = this.INITIAL;
      } else if (this.getCollideRecordIds(entity1, entity2).length === 0) {
        this.collideRecords.push([entity1, entity2]);
        collisionType = this.INITIAL;
      } else {
        collisionType = this.SUSTAINED;
      }

      notifyEntityOfCollision(entity1, entity2, collisionType);
      notifyEntityOfCollision(entity2, entity1, collisionType);
    },

    destroyEntity: function(entity) {
      var recordIds = this.getCollideRecordIds(entity);
      for (var i = 0; i < recordIds.length; i++) {
        this.removeOldCollision(recordIds[i]);
      }
    },

    // remove collision at passed index
    removeOldCollision: function(recordId) {
      var record = this.collideRecords[recordId];
      if (record !== undefined) {
        notifyEntityOfUncollision(record[0], record[1])
        notifyEntityOfUncollision(record[1], record[0])
        this.collideRecords.splice(recordId, 1);
      }
    },

    getCollideRecordIds: function(entity1, entity2) {
      if (entity1 !== undefined && entity2 !== undefined) {
        var recordIds = [];
        for (var i = 0, len = this.collideRecords.length; i < len; i++) {
          if (this.collideRecords[i][0] === entity1 && this.collideRecords[i][1] === entity2) {
            recordIds.push(i);
          }
        }
        return recordIds;
      } else if (entity1 !== undefined) {
        for (var i = 0, len = this.collideRecords.length; i < len; i++) {
          if (this.collideRecords[i][0] === entity1 || this.collideRecords[i][1] === entity1) {
            return [i];
          }
        }
        return [];
      } else {
        throw "You must pass at least one entity when searching collision records."
      }
    },

    isColliding: function(obj1, obj2) {
      return isSetupForCollisions(obj1) && isSetupForCollisions(obj2) &&
        this.isIntersecting(obj1, obj2);
    },

    isIntersecting: function(obj1, obj2) {
      var obj1BoundingBox = obj1.boundingBox || this.RECTANGLE;
      var obj2BoundingBox = obj2.boundingBox || this.RECTANGLE;

      if (obj1BoundingBox === this.RECTANGLE && obj2BoundingBox === this.RECTANGLE) {
        return Maths.rectanglesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.CIRCLE && obj2BoundingBox === this.RECTANGLE) {
        return Maths.circleAndRectangleIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.RECTANGLE && obj2BoundingBox === this.CIRCLE) {
        return Maths.circleAndRectangleIntersecting(obj2, obj1);
      } else if (obj1BoundingBox === this.POINT && obj2BoundingBox === this.RECTANGLE) {
        return Maths.pointAndRectangleIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.RECTANGLE && obj2BoundingBox === this.POINT) {
        return Maths.pointAndRectangleIntersecting(obj2, obj1);
      } else if (obj1BoundingBox === this.CIRCLE && obj2BoundingBox === this.CIRCLE) {
        return Maths.circlesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.POINT && obj2BoundingBox === this.CIRCLE) {
        return Maths.pointAndCircleIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.CIRCLE && obj2BoundingBox === this.POINT) {
        return Maths.pointAndCircleIntersecting(obj2, obj1);
      } else if (obj1BoundingBox === this.POINT && obj2BoundingBox === this.POINT) {
        return Maths.pointsIntersecting(obj1, obj2);
      } else {
        throw "Objects being collision tested have unsupported bounding box types."
      }
    },

    INITIAL: 0,
    SUSTAINED: 1,

    RECTANGLE: 0,
    CIRCLE: 1,
    POINT:2
  };

  var orEqual = function(obj1BB, obj2BB, bBType1, bBType2) {
    return (obj1BB === bBType1 && obj2BB === bBType2) ||
      (obj1BB === bBType2 && obj2BB === bBType1);
  }

  var notifyEntityOfCollision = function(entity, other, type) {
    if (entity.collision !== undefined) {
      entity.collision(other, type);
    }
  };

  var notifyEntityOfUncollision = function(entity, other) {
    if (entity.uncollision !== undefined) {
      entity.uncollision(other);
    }
  };

  var Maths = {
    center: function(obj) {
      if(obj.pos !== undefined) {
        return {
          x: obj.pos.x + (obj.size.x / 2),
          y: obj.pos.y + (obj.size.y / 2),
        };
      }
    },

    circlesIntersecting: function(obj1, obj2) {
      return Maths.distance(Maths.center(obj1), Maths.center(obj2)) <
        obj1.size.x / 2 + obj2.size.x / 2;
    },

    pointAndCircleIntersecting: function(obj1, obj2) {
      return this.distance(obj1.pos, this.center(obj2)) < obj2.size.x / 2;
    },

    pointAndRectangleIntersecting: function(obj1, obj2) {
      return this.pointInsideObj(obj1.pos, obj2);
    },

    pointsIntersecting: function(obj1, obj2) {
      return obj1.pos.x === obj2.pos.x && obj1.pos.y === obj2.pos.y;
    },

    pointInsideObj: function(point, obj) {
      return point.x >= obj.pos.x
        && point.y >= obj.pos.y
        && point.x <= obj.pos.x + obj.size.x
        && point.y <= obj.pos.y + obj.size.y;
    },

    rectanglesIntersecting: function(obj1, obj2) {
      if(obj1.pos.x + obj1.size.x < obj2.pos.x) {
        return false;
      } else if(obj1.pos.x > obj2.pos.x + obj2.size.x) {
        return false;
      } else if(obj1.pos.y > obj2.pos.y + obj2.size.y) {
        return false;
      } else if(obj1.pos.y + obj1.size.y < obj2.pos.y) {
        return false
      } else {
        return true;
      }
    },

    distance: function(point1, point2) {
      var x = point1.x - point2.x;
      var y = point1.y - point2.y;
      return Math.sqrt((x * x) + (y * y));
    },

    rectangleCorners: function(rectangleObj) {
      var corners = [];
      corners.push({ x:rectangleObj.pos.x, y: rectangleObj.pos.y });
      corners.push({ x:rectangleObj.pos.x + rectangleObj.size.x, y:rectangleObj.pos.y });
      corners.push({
        x:rectangleObj.pos.x + rectangleObj.size.x,
        y:rectangleObj.pos.y + rectangleObj.size.y
      });
      corners.push({ x:rectangleObj.pos.x, y: rectangleObj.pos.y + rectangleObj.size.y });
      return corners;
    },

    vectorTo: function(start, end) {
      return {
        x: end.x - start.x,
        y: end.y - start.y
      };
    },

    magnitude: function(vector) {
      return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    },

    dotProduct: function(vector1, vector2) {
      return vector1.x * vector2.x + vector1.y * vector2.y;
    },

    unitVector: function(vector) {
      return {
        x: vector.x / Maths.magnitude(vector),
        y: vector.y / Maths.magnitude(vector)
      };
    },

    closestPointOnSeg: function(linePointA, linePointB, circ_pos) {
      var seg_v = Maths.vectorTo(linePointA, linePointB);
      var pt_v = Maths.vectorTo(linePointA, circ_pos);
      if (Maths.magnitude(seg_v) <= 0) {
        throw "Invalid segment length";
      }

      var seg_v_unit = Maths.unitVector(seg_v);
      var proj = Maths.dotProduct(pt_v, seg_v_unit);
      if (proj <= 0) {
        return linePointA;
      } else if (proj >= Maths.magnitude(seg_v)) {
        return linePointB;
      } else {
        return {
          x: linePointA.x + seg_v_unit.x * proj,
          y: linePointA.y + seg_v_unit.y * proj
        };
      }
    },

    isLineIntersectingCircle: function(circleObj, linePointA, linePointB) {
      var circ_pos = {
        x: circleObj.pos.x + circleObj.size.x / 2,
        y: circleObj.pos.y + circleObj.size.y / 2
      };

      var closest = Maths.closestPointOnSeg(linePointA, linePointB, circ_pos);
      var dist_v = Maths.vectorTo(closest, circ_pos);
      return Maths.magnitude(dist_v) < circleObj.size.x / 2;
    },

    circleAndRectangleIntersecting: function(circleObj, rectangleObj) {
      var corners = Maths.rectangleCorners(rectangleObj);
      return Maths.pointInsideObj(Maths.center(circleObj), rectangleObj) ||
        Maths.isLineIntersectingCircle(circleObj, corners[0], corners[1]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[1], corners[2]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[2], corners[3]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[3], corners[0]);
    },
  };

  subscribe("create-game", function(space) {
    space(function(){
      var collider = new Collider(space);

      space.subscribe("after-entities-update", function() {
        collider.update();
      });

      this.collider = collider;
    });
  });

  this.Collider = Collider;
  this.Collider.Maths = Maths;
});

within("github.com/eric-brechemier/coquette", function(publish, subscribe) {

  var
    SPACE = 32,
    LEFT_ARROW = 37,
    UP_ARROW = 38,
    RIGHT_ARROW = 39,
    DOWN_ARROW = 40;

  function preventScrolling(e) {
    var suppressedKeys = [
      SPACE,
      LEFT_ARROW,
      UP_ARROW,
      RIGHT_ARROW,
      DOWN_ARROW
    ];
    for (var i = 0; i < suppressedKeys.length; i++) {
      if(suppressedKeys[i] === e.keyCode) {
        e.preventDefault();
        return;
      }
    }
  }

  function suppressScrolling() {
    // suppress scrolling
    window.addEventListener("keydown", preventScrolling, false);
  }

  function configureCanvasFocus(space, suppressedKeys) {
    var
      autoFocus = space.get("autoFocus"),
      canvas = space.get("canvas");

    var inputReceiverElement = window;
    // handle whether to autofocus on canvas, or not
    if (autoFocus === false) {
      inputReceiverElement = canvas;
      // lets canvas get focus and get key events
      canvas.contentEditable = true;
    } else {
      suppressScrolling();
    }
  }

  function configureKeyListeners(space, onKeyDown, onKeyUp) {
    var
      autoFocus = space.get("autoFocus"),
      canvas = space.get("canvas"),
      inputReceiverElement;

    // handle whether to autofocus on canvas, or not
    if (autoFocus === false) {
      inputReceiverElement = canvas;
    } else {
      inputReceiverElement = window;
    }

    // set up key listeners
    inputReceiverElement.addEventListener('keydown', onKeyDown, false);
    inputReceiverElement.addEventListener('keyup', onKeyUp, false);
  }

  function Inputter(space) {
    var
      keyDownState = {},
      keyPressedState = {};

    this.space = space;
    space.set("keyDownState", keyDownState);
    space.set('keyPressedState', keyPressedState)

    function onKeyDown(e) {
      keyDownState[e.keyCode] = true;
      if (keyPressedState[e.keyCode] === undefined) { // start of new keypress
        keyPressedState[e.keyCode] = true; // register keypress in progress
      }
    }

    function onKeyUp(e) {
      keyDownState[e.keyCode] = false;
      if (keyPressedState[e.keyCode] === false) { // prev keypress over
        keyPressedState[e.keyCode] = undefined; // prep for keydown to start next press
      }
    }

    configureCanvasFocus(space);
    configureKeyListeners(space, onKeyDown, onKeyUp);
  }

  Inputter.prototype = {
    update: function() {
      var keyPressedState = this.space.get('keyPressedState');
      for (var i in keyPressedState) {
        if (keyPressedState[i] === true) { // tick passed and press event in progress
          keyPressedState[i] = false; // end key press
        }
      }
    },

    down: function(keyCode) {
      return this.space.get('keyDownState')[keyCode] || false;
    },

    pressed: function(keyCode) {
      return this.space.get('keyPressedState')[keyCode] || false;
    },

    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    SEMI_COLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_SQUARE_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_SQUARE_BRACKET: 221,
    SINGLE_QUOTE: 222
  };

  Inputter.prototype.state = Inputter.prototype.down;

  subscribe("create-game", function(space) {
    space(function(){
      var inputter = new Inputter(space);

      space.subscribe("after-display-update", function(){
        inputter.update();
      });

      this.inputter = inputter;
    });
  });

  this.Inputter = Inputter;
});

within("github.com/eric-brechemier/coquette", function(publish, subscribe) {

  function Ticker(gameLoop) {
    setupRequestAnimationFrame();

    var nextTickFn;
    this.stop = function() {
      nextTickFn = function() {};
    };

    this.start = function() {
      var prev = new Date().getTime();
      var tick = function() {
        var now = new Date().getTime();
        var interval = now - prev;
        prev = now;
        gameLoop(interval);
        requestAnimationFrame(nextTickFn);
      };

      nextTickFn = tick;
      requestAnimationFrame(nextTickFn);
    };

    this.start();
  };

  // From: https://gist.github.com/paulirish/1579671
  // Thanks Erik, Paul and Tino
  var setupRequestAnimationFrame = function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
        || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var INTERVAL = 16;
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, INTERVAL - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                                   timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  };

  subscribe("game-created", function(space) {
    space(function(){
      this.ticker = new Ticker(function(interval) {
        space.publish("tick", interval);
      });
    });
  });

  this.Ticker = Ticker;
});

within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  var Maths = this.Collider.Maths;

  function configureCanvas(space) {
    var canvas = space.get("canvas");
    // stop browser outlining canvas when it has focus
    canvas.style.outline = "none";
    // keep pointer normal when hovering over canvas
    canvas.style.cursor = "default";
    canvas.width = space.get("width");
    canvas.height = space.get("height");
  }

  function initCanvasContext(space) {
    var canvas = space.get("canvas");
    space.set("canvasContext", canvas.getContext('2d'));
  }

  function centerView(space) {
    var
      width = space.get("width"),
      height = space.get("height");
    space.set("viewCenterX", width / 2);
    space.set("viewCenterY", height / 2);
  }

  function Renderer(space) {
    this.space = space;
    configureCanvas(space);
    initCanvasContext(space);
    centerView(space);
  };

  Renderer.prototype = {
    getCtx: function() {
      return this.space.get("canvasContext");
    },

    getBackgroundColor: function() {
      return this.space.get("backgroundColor");
    },

    getViewSize: function() {
      return {
        x: this.space.get("width"),
        y: this.space.get("height")
      };
    },

    getViewCenterPos: function() {
      return {
        x: this.space.get("viewCenterX"),
        y: this.space.get("viewCenterY")
      };
    },

    setViewCenterPos: function(pos) {
      this.space.set("viewCenterX", pos.x);
      this.space.set("viewCenterY", pos.y);
    },

    update: function() {
      var
        ctx = this.getCtx(),
        game = this.space.get("game"),
        gameEntities = this.space.get("entities").all();

      var
        viewSize = this.getViewSize(),
        viewCenterPos = this.getViewCenterPos(),
        viewTranslate = viewOffset(viewCenterPos, viewSize);

      // translate so all objs placed relative to viewport
      ctx.translate(-viewTranslate.x, -viewTranslate.y);

      // draw background
      ctx.fillStyle = this.getBackgroundColor();
      ctx.fillRect(viewCenterPos.x - viewSize.x / 2,
                   viewCenterPos.y - viewSize.y / 2,
                   viewSize.x,
                   viewSize.y);

      // draw game and entities
      var drawables = [game].concat(gameEntities.concat().sort(zindexSort));
      for (var i = 0, len = drawables.length; i < len; i++) {
        if (drawables[i].draw !== undefined) {
          drawables[i].draw(ctx);
        }
      }

      // translate back
      ctx.translate(viewTranslate.x, viewTranslate.y);
    },

    onScreen: function(obj) {
      var
        viewSize = this.getViewSize(),
        viewCenterPos = this.getViewCenterPos();
      return Maths.rectanglesIntersecting(obj, {
        size: viewSize,
        pos: {
          x: viewCenterPos.x - viewSize.x / 2,
          y: viewCenterPos.y - viewSize.y / 2
        }
      });
    }
  };

  var viewOffset = function(viewCenterPos, viewSize) {
    return {
      x: viewCenterPos.x - viewSize.x / 2,
      y: viewCenterPos.y - viewSize.y / 2
    }
  };

  // sorts passed array by zindex
  // elements with a higher zindex are drawn on top of those with a lower zindex
  var zindexSort = function(a, b) {
    return (a.zindex || 0) < (b.zindex || 0) ? -1 : 1;
  };

  subscribe("create-game", function(space) {
    space(function(){
      var renderer = new Renderer(space);

      space.subscribe("update-display", function() {
        renderer.update();
      });

      this.renderer = renderer;
    });
  });

  this.Renderer = Renderer;
});

within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  function Entities(space) {
    this.space = space;
    space.set("gameEntities", []);
  };

  // fire the callback just once, the *next* time the event is published
  function runOnce(space, event, callback) {
    var
      isReady = false,
      unsubscribe = space.subscribe(event, function() {
      if ( !isReady ){
        return; // skip immediate callback when the property is already set
      }
      unsubscribe(); // fire only once
      return callback.apply(this, arguments);
    });
    isReady = true;
  }

  Entities.prototype = {
    update: function(interval) {
      var entities = this.all();
      for (var i = 0, len = entities.length; i < len; i++) {
        if (entities[i].update !== undefined) {
          entities[i].update(interval);
        }
      }
    },

    all: function(Constructor) {
      var gameEntities = this.space.get("gameEntities");
      if (Constructor === undefined) {
        return gameEntities;
      } else {
        var entities = [];
        for (var i = 0; i < gameEntities.length; i++) {
          if (gameEntities[i] instanceof Constructor) {
            entities.push(gameEntities[i]);
          }
        }

        return entities;
      }
    },

    create: function(clazz, settings, callback) {
      var
        space = this.space,
        game = space.get("game"),
        gameEntities = space.get("gameEntities");

      runOnce(space, "create-entities", function(){
        var entity = new clazz(game, settings || {});
        gameEntities.push(entity);
        if (callback !== undefined) {
          callback(entity);
        }
      });
    },

    destroy: function(entity, callback) {
      var
        space = this.space,
        gameEntities = space.get("gameEntities");

      runOnce(space, "destroy-entities", function(){
        for(var i = 0; i < gameEntities.length; i++) {
          if(gameEntities[i] === entity) {
            space.get("collider").destroyEntity(entity);
            gameEntities.splice(i, 1);
            if (callback !== undefined) {
              callback();
            }
            break;
          }
        }
      });
    }
  };

  subscribe("create-game", function(space) {
    space(function(){
      var entities = new Entities(space);

      space.subscribe("before-entities-update", function() {
        space.publish("create-entities");
        space.publish("destroy-entities");
      });

      space.subscribe("update-entities", function(interval) {
        entities.update(interval);
      });

      this.entities = entities;
    });
  });

  this.Entities = Entities;
});

this.Coquette = within(
  "github.com/eric-brechemier/coquette",
  function(publish, subscribe) {

    function Coquette(
      game, canvasId, width, height, backgroundColor, autoFocus
    ) {
      var space = within();

      space.subscribe("tick", function(interval) {
        space.publish("before-entities-update", interval);
        space.publish("update-entities", interval);
        space.publish("after-entities-update", interval);

        space.publish("before-game-update", interval);
        space.publish("update-game", interval);
        space.publish("after-game-update", interval);

        space.publish("before-display-update", interval);
        space.publish("update-display", interval);
        space.publish("after-display-update", interval);
      });

      space.subscribe("update-game", function(interval) {
        if (game.update !== undefined) {
          game.update(interval);
        }
      });

      return space(function() {
        this.game = game;
        this.canvas = document.getElementById(canvasId);
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;
        this.autoFocus = autoFocus;

        publish("create-game", space);
        publish("game-created", space);
        return this;
      });
    };

    return Coquette;
  }
);

