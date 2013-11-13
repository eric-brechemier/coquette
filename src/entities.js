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
