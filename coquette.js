// https://github.com/eric-brechemier/within (License: CC0)
// within is a factory of semi-private spaces
// where properties and events can be shared.
// Usage: within("your.domain", function(get, set, publish, subscribe){ ... });

// from sub/nada/privately.js (CC0)
function privately( func ) {
  return func();
}

privately(function() {
  var
    dataSpaces = {},
    eventSpaces = {},
    has;

  // from sub/nada/copy.js (CC0)
  function copy( array ) {
    return [].concat( array );
  }

  // from sub/nada/remove.js (CC0)
  function remove( array, value ) {
    var i;
    for ( i = array.length; i >= 0; i-- ) {
      if ( array[i] === value ){
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
      isBreak = callback( array[i], i ) === true;
    }

    return isBreak;
  }

  // from sub/nada/bind.js (CC0)
  function bind( func, object ) {
    return function() {
      return func.apply( object, arguments );
    };
  }

  /*
    Define an alias for a prototype function
    The alias allows to call the function with the context object
    as first argument, followed with regular arguments of the function.
    Example:
    has = alias( Object.prototype.hasOwnProperty );
    object.hasOwnProperty( name ) === has( object, name ); // true
  */
  function alias( func ) {
    return bind( func.call, func );
  }

  has = alias( Object.prototype.hasOwnProperty );

  /*
    Create a semi-private space to share properties and events

    Parameters:
      name - string, name of the symbolic space:
             a domain name and path that you control on the Web,
             followed with the name of the module.
             Example: "github.com/eric-brechemier/within/tests/module1"
      callback - function( get, set, publish, subscribe ), function called
                 immediately, in the context ('this') of an object,
                 always the same in each call of within with the same name,
                 and with four functions as arguments to share properties and
                 events within this module (described separately below).

    Returns:
      any, the value returned by the callback function
  */
  function within( name, callback ) {
    var
      dataSpace,
      eventSpace;

    if ( !has( dataSpaces, name ) ) {
      dataSpaces[name] = {};
      eventSpaces[name] = {};
    }

    dataSpace = dataSpaces[name];
    eventSpace = eventSpaces[name];

    /*
      Retrieve the value of a property previously set in this module

      Parameter:
        name - string, the name of a property of current module

      Returns:
        any, the value previously set to the property with given name,
        or null initially before any value has been set
    */
    function get( name ) {
      if ( !has( dataSpace, name ) ){
        return null;
      }
      return dataSpace[name];
    }

    /*
      Set the value of a property of the module

      Parameters:
        name - string, the name of a property in current module
        value - any, the new value of the property

      Note:
      Calling this function is equivalent to setting the property directly
      on the context object, and the function is only provided for symmetry
      with get().
    */
    function set( name, value ) {
      dataSpace[name] = value;
    }

    /*
      Set the value of a property and fire listeners registered in this module
      for the event of the same name

      Parameters:
        name - string, the name of an event and the associated property
        value - any, the new value of the property, also provided to listeners

      Notes:
        1) Only listeners registered in this module are triggered: listeners
        for an event of the same name in a module with a different name are
        not fired.

        2) The publication of the event will be interrupted by any listener
        that returns the boolean value true. The following listeners, that
        were registered later, will not be notified of the current value of
        the event.
    */
    function publish( name, value ) {
      var listeners;
      set( name, value );
      if ( !has( eventSpace, name ) ) {
        return;
      }
      listeners = copy( eventSpace[name] );
      forEach( listeners, function( listener ) {
        return listener( value );
      });
    }

    /*
      Register a callback function for the event of given name

      Parameters:
        name - string, the name of an event and the related property
        listener - function( value ), the callback triggered immediately
                   with the current value of the property, if already set,
                   and each time a new value is published for this property
                   (not just set) unless a previous callback returns true
                   which interrupts the publication of the current event.

      Returns:
        function(), the function to call to remove current listener, which
        will no longer receive notifications for given event.

      Notes:
        1) In case the same listener is registered multiple times for the same
        event, duplicate listeners are removed at the same time.
        2) In case the same listener is registered to different events,
        other subscriptions remain active and must be canceled separately.
    */
    function subscribe( name, listener ) {
      var listeners;
      if ( !has( eventSpace, name ) ) {
        eventSpace[name] = [];
      }
      listeners = eventSpace[name];
      listeners.push( listener );
      if ( has( dataSpace, name ) ) {
        listener( dataSpace[name] );
      }
      return function unsubscribe() {
        remove( listeners, listener );
      };
    }

    return callback.apply( dataSpace, [ get, set, publish, subscribe ] );
  }

  this.within = within;
});

var Coquette = within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var Coquette = function(game, canvasId, width, height, backgroundColor, autoFocus) {
    var
      Renderer = get("Renderer"),
      Inputter = get("Inputter"),
      Updater = get("Updater"),
      Entities = get("Entities"),
      Runner = get("Runner"),
      Collider = get("Collider");

    set("game", game);
    set("canvasId", canvasId);
    set("width", width);
    set("height", height);
    set("backgroundColor", backgroundColor);
    set("autoFocus", autoFocus);

    set("coquette", this);
    set("renderer", new Renderer(canvasId, width, height, backgroundColor));
    set("inputter", new Inputter(canvasId, autoFocus));
    set("updater", new Updater());
    set("entities", new Entities());
    set("runner", new Runner());
    set("collider", new Collider());

    // Public API
    this.renderer = get("renderer");
    this.inputter = get("inputter");
    this.updater = get("updater");
    this.entities = get("entities");
    this.runner = get("runner");
    this.collider = get("collider");
    this.updater.add(this.collider);
    this.updater.add(this.runner);
    this.updater.add(this.renderer);
    this.updater.add(game);
    this.game = get("game");
  };

  Coquette.get = function() {
    return get("coquette");
  };

  set("Coquette", Coquette);

  // Public API in the browser
  return Coquette;
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var Collider = function() {};

  Collider.INITIAL = 0;
  Collider.SUSTAINED = 1;

  Collider.RECTANGLE = 0;
  Collider.CIRCLE = 1;


  Collider.prototype = {
    collideRecords: [],

    update: function() {
      var ent = Coquette.get().entities.all();
      for (var i = 0, len = ent.length; i < len; i++) {
        for (var j = i; j < len; j++) {
          if (ent[i] !== ent[j]) {
            if (Maths.isIntersecting(ent[i], ent[j])) {
              this.collision(ent[i], ent[j]);
            } else {
              this.removeOldCollision(ent[i], ent[j]);
            }
          }
        }
      }
    },

    collision: function(entity1, entity2) {
      if (this.getCollideRecord(entity1, entity2) === undefined) {
        this.collideRecords.push([entity1, entity2]);
        notifyEntityOfCollision(entity1, entity2, this.INITIAL);
        notifyEntityOfCollision(entity2, entity1, this.INITIAL);
      } else {
        notifyEntityOfCollision(entity1, entity2, this.SUSTAINED);
        notifyEntityOfCollision(entity2, entity1, this.SUSTAINED);
      }
    },

    removeEntity: function(entity) {
      this.removeOldCollision(entity);
    },

    // if passed entities recorded as colliding in history record, remove that record
    removeOldCollision: function(entity1, entity2) {
      var recordId = this.getCollideRecord(entity1, entity2);
      if (recordId !== undefined) {
        var record = this.collideRecords[recordId];
        notifyEntityOfUncollision(record[0], record[1])
        notifyEntityOfUncollision(record[1], record[0])
        this.collideRecords.splice(recordId, 1);
      }
    },

    getCollideRecord: function(entity1, entity2) {
      for (var i = 0, len = this.collideRecords.length; i < len; i++) {
        // looking for coll where one entity appears
        if (entity2 === undefined &&
            (this.collideRecords[i][0] === entity1 ||
             this.collideRecords[i][1] === entity1)) {
          return i;
        // looking for coll between two specific entities
        } else if (this.collideRecords[i][0] === entity1 &&
                   this.collideRecords[i][1] === entity2) {
          return i;
        }
      }
    },

    INITIAL: Collider.INITIAL,
    SUSTAINED: Collider.SUSTAINED,

    RECTANGLE: Collider.RECTANGLE,
    CIRCLE: Collider.CIRCLE
  };

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

    isIntersecting: function(obj1, obj2) {
      var obj1BoundingBox = obj1.boundingBox || Collider.RECTANGLE;
      var obj2BoundingBox = obj2.boundingBox || Collider.RECTANGLE;
      if (obj1BoundingBox === Collider.RECTANGLE &&
          obj2BoundingBox === Collider.RECTANGLE) {
        return Maths.rectanglesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === Collider.CIRCLE &&
                 obj2BoundingBox === Collider.CIRCLE) {
        return Maths.circlesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === Collider.CIRCLE) {
        return Maths.circleAndRectangleIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === Collider.RECTANGLE) {
        return Maths.circleAndRectangleIntersecting(obj2, obj1);
      } else {
        throw "Objects being collision tested have unsupported bounding box types."
      }
    },

    circlesIntersecting: function(obj1, obj2) {
      return Maths.distance(Maths.center(obj1), Maths.center(obj2)) <
        obj1.size.x / 2 + obj2.size.x / 2;
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

  Collider.Maths = Maths;
  set("Collider", Collider);
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var Inputter = function(canvasId, autoFocus) {
    if (autoFocus === undefined) {
      autoFocus = true;
    }

    var inputReceiverElement = window;
    if (!autoFocus) {
      inputReceiverElement = document.getElementById(canvasId)
      inputReceiverElement.contentEditable = true; // lets canvas get focus and get key events
    } else {
      // suppress scrolling
      window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
          e.preventDefault();
        }
      }, false);
    }

    inputReceiverElement.addEventListener('keydown', this.keydown.bind(this), false);
    inputReceiverElement.addEventListener('keyup', this.keyup.bind(this), false);
  };

  Inputter.prototype = {
    _state: {},
    bindings: {},

    state: function(keyCode, state) {
      if (state !== undefined) {
        this._state[keyCode] = state;
      } else {
        return this._state[keyCode] || false;
      }
    },

    keydown: function(e) {
      this.state(e.keyCode, true);
    },

    keyup: function(e) {
      this.state(e.keyCode, false);
    },

    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    UP_ARROW: 38,
    DOWN_ARROW: 40,
    SPACE: 32
  };

  set("Inputter", Inputter);
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  function Runner() {
    this.runs = [];
  };

  Runner.prototype = {
    update: function() {
      this.run();
    },

    run: function() {
      while(this.runs.length > 0) {
        var run = this.runs.pop();
        run.fn(run.obj);
      }
    },

    add: function(obj, fn) {
      this.runs.push({
        obj: obj,
        fn: fn
      });
    }
  };

  set("Runner", Runner);
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var interval = 16;

  function Updater() {
    setupRequestAnimationFrame();
    this.updatees = [];
    this.tick = interval;
    this.prev = new Date().getTime();

    var self = this;
    var update = function() {
      var now = new Date().getTime();
      self.tick = now - self.prev;
      self.prev = now;

      // call update fns
      for (var i = 0; i < self.updatees.length; i++) {
        if (self.updatees[i].update !== undefined) {
          self.updatees[i].update();
        }
      }

      // call draw fns
      for (var i = 0; i < self.updatees.length; i++) {
        if (self.updatees[i].draw !== undefined) {
          self.updatees[i].draw();
        }
      }

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  Updater.prototype = {
    add: function(updatee) {
      this.updatees.push(updatee);
    },

    remove: function(updatee) {
      for(var i = 0; i < this.updatees.length; i++) {
        if(this.updatees[i] === updatee) {
          this.updatees.splice(i, 1);
          break;
        }
      }
    }
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
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, interval - (currTime - lastTime));
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

  set("Updater", Updater);
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var Renderer = function(canvasId, width, height, backgroundColor) {
    var canvas = document.getElementById(canvasId);
    canvas.style.outline = "none"; // stop browser outlining canvas when it has focus
    canvas.style.cursor = "default"; // keep pointer normal when hovering over canvas
    this.ctx = canvas.getContext('2d');
    this.backgroundColor = backgroundColor;
    canvas.width = this.width = width;
    canvas.height = this.height = height;
  };

  Renderer.prototype = {
    getCtx: function() {
      return this.ctx;
    },

    update: function() {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    },

    center: function() {
      return {
        x: this.width / 2,
        y: this.height / 2
      };
    },

    onScreen: function(obj) {
      return obj.pos.x > 0 && obj.pos.x < get("renderer").width &&
        obj.pos.y > 0 && obj.pos.y < get("renderer").height;
    }
  };

  set("Renderer", Renderer);
});

within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  function Entities() {
    this._entities = [];
  };

  Entities.prototype = {
    all: function(clazz) {
      if (clazz === undefined) {
        return this._entities;
      } else {
        var entities = [];
        for (var i = 0; i < this._entities.length; i++) {
          if (this._entities[i] instanceof clazz) {
            entities.push(this._entities[i]);
          }
        }

        return entities;
      }
    },

    create: function(clazz, settings, callback) {
      get("runner").add(this, function(entities) {
        var entity = new clazz(get("game"), settings || {});
        get("updater").add(entity);
        entities._entities.push(entity);
        if (callback !== undefined) {
          callback(entity);
        }
      });
    },

    destroy: function(entity, callback) {
      get("runner").add(this, function(entities) {
        get("updater").remove(entity);
        entity._killed = true;
        get("updater").remove(entity);
        for(var i = 0; i < entities._entities.length; i++) {
          if(entities._entities[i] === entity) {
            entities._entities.splice(i, 1);
            if (callback !== undefined) {
              callback();
            }
            break;
          }
        }
      });
    }
  };

  set("Entities", Entities);
});

