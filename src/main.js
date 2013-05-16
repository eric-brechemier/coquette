var Coquette = within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {

  // set default values of options
  set("canvasId", "canvas");
  set("width", 600);
  set("height", 600);
  set("backgroundColor", "#000");
  set("autoFocus", true);

  /*
    Check whether given value is null or undefined
  */
  function no( value ) {
    var undef; // do not trust global undefined, which can be set to a value
    return value === null || value === undef;
  }

  subscribe("started", function() {
    get("updater").add( get("game") );
  });

  function start(game) {
    set("game", game);
    publish("start");
    publish("started", true);
  }

  function Coquette(game, canvasId, width, height, backgroundColor, autoFocus) {
    set("canvasId", canvasId);
    set("width", width);
    set("height", height);
    set("backgroundColor", backgroundColor);
    if ( !no(autoFocus) ) {
      set("autoFocus", autoFocus);
    }

    start(game);

    // Public API
    set("coquette", this); // for Coquette.get()
    this.renderer = get("renderer");
    this.inputter = get("inputter");
    this.updater = get("updater");
    this.entities = get("entities");
    this.runner = get("runner");
    this.collider = get("collider");
    this.game = get("game");
  }

  Coquette.get = function() {
    return get("coquette");
  };

  set("Coquette", Coquette);

  // Public API in the browser
  return Coquette;
});
