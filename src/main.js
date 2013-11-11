this.Coquette = within(
  "github.com/eric-brechemier/coquette",
  function(publish, subscribe) {

    function Coquette(
      game, canvasId, width, height, backgroundColor, autoFocus
    ) {
      var space = within();

      space.subscribe("tick", function(interval) {
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
