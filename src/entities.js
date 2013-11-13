within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  function Entities(space) {
    this.space = space;
    this._entities = [];
  };

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
      if (Constructor === undefined) {
        return this._entities;
      } else {
        var entities = [];
        for (var i = 0; i < this._entities.length; i++) {
          if (this._entities[i] instanceof Constructor) {
            entities.push(this._entities[i]);
          }
        }

        return entities;
      }
    },

    create: function(clazz, settings, callback) {
      var game = this.space.get("game");
      this.space.get("runner").add(this, function(entities) {
        var entity = new clazz(game, settings || {});
        entities._entities.push(entity);
        if (callback !== undefined) {
          callback(entity);
        }
      });
    },

    destroy: function(entity, callback) {
      var self = this;
      this.space.get("runner").add(this, function(entities) {
        for(var i = 0; i < entities._entities.length; i++) {
          if(entities._entities[i] === entity) {
            self.space.get("collider").destroyEntity(entity);
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

  subscribe("create-game", function(space) {
    space(function(){
      var entities = new Entities(space);

      space.subscribe("before-entities-update", function() {
        // TODO: create/destroy entities
      });

      space.subscribe("update-entities", function(interval) {
        entities.update(interval);
      });

      this.entities = entities;
    });
  });

  this.Entities = Entities;
});
