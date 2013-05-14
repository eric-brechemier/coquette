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
