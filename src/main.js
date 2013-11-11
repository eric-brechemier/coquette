this.Coquette = within("github.com/eric-brechemier/coquette", function(
  publish, subscribe, get, set
) {
  var
    Renderer = this.Renderer,
    Inputter = this.Inputter,
    Entities = this.Entities,
    Runner = this.Runner,
    Collider = this.Collider,
    Ticker = this.Ticker;

  function Coquette(
    game, canvasId, width, height, backgroundColor, autoFocus
  ) {
    var
      space = within(),
      canvas = document.getElementById(canvasId);

    space(function() {
      this.game = game;
      this.canvas = canvas;
      this.width = width;
      this.height = height;
      this.backgroundColor = backgroundColor;
      this.autoFocus = autoFocus;

      this.renderer = new Renderer(this, game, canvas, width, height, backgroundColor);
      this.inputter = new Inputter(this, canvas, autoFocus);
      this.entities = new Entities(this, game);
      this.runner = new Runner(this);
      this.collider = new Collider(this);

      var self = this;
      this.ticker = new Ticker(this, function(interval) {
        space.publish("update-game", interval);
        space.publish("game-updated");

        self.collider.update(interval);
        self.runner.update(interval);
        if (game.update !== undefined) {
          game.update(interval);
        }

        self.entities.update(interval)
        self.renderer.update(interval);
        self.inputter.update();
      });
    });

    publish("create-game", space);
    publish("game-created");
  };

  return Coquette;
});
