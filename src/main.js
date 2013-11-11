this.Coquette = within(
  "github.com/eric-brechemier/coquette",
  function(publish, subscribe) {

    function Coquette(
      game, canvasId, width, height, backgroundColor, autoFocus
    ) {
      var space = within();

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
