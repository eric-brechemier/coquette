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
