within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
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

    set("renderer", new Renderer(canvasId, width, height, backgroundColor));
    set("inputter", new Inputter(canvasId, autoFocus));
    set("updater", new Updater());
    set("entities", new Entities());
    set("runner", new Runner());
    set("collider", new Collider());

    get("updater").add(this.collider);
    get("updater").add(this.runner);
    get("updater").add(this.renderer);
    get("updater").add(game);
  };

  Coquette.get = function() {
    return get("coquette");
  };

  set("Coquette", Coquette);
});
