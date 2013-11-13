within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  var Maths = this.Collider.Maths;

  function configureCanvas(space) {
    var canvas = space.get("canvas");
    // stop browser outlining canvas when it has focus
    canvas.style.outline = "none";
    // keep pointer normal when hovering over canvas
    canvas.style.cursor = "default";
    canvas.width = space.get("width");
    canvas.height = space.get("height");
  }

  function Renderer(space) {
    var
      game = space.get("game"),
      canvas = space.get("canvas"),
      wView = space.get("width"),
      hView = space.get("height");

    this.space = space;
    configureCanvas(space);
    this.ctx = canvas.getContext('2d');

    viewSize = this.getViewSize();
    this.viewCenterPos = { x: viewSize.x / 2, y: viewSize.y / 2 };
  };

  Renderer.prototype = {
    getCtx: function() {
      return this.ctx;
    },

    getBackgroundColor: function() {
      return this.space.get("backgroundColor");
    },

    getViewSize: function() {
      return {
        x: this.space.get("width"),
        y: this.space.get("height")
      };
    },

    getViewCenterPos: function() {
      return this.viewCenterPos;
    },

    setViewCenterPos: function(pos) {
      this.viewCenterPos = { x:pos.x, y:pos.y };
    },

    update: function() {
      var
        ctx = this.getCtx(),
        game = this.space.get("game"),
        gameEntities = this.space.get("entities").all();

      var
        viewSize = this.getViewSize(),
        viewTranslate = viewOffset(this.viewCenterPos, viewSize);

      // translate so all objs placed relative to viewport
      ctx.translate(-viewTranslate.x, -viewTranslate.y);

      // draw background
      ctx.fillStyle = this.getBackgroundColor();
      ctx.fillRect(this.viewCenterPos.x - viewSize.x / 2,
                   this.viewCenterPos.y - viewSize.y / 2,
                   viewSize.x,
                   viewSize.y);

      // draw game and entities
      var drawables = [game].concat(gameEntities.concat().sort(zindexSort));
      for (var i = 0, len = drawables.length; i < len; i++) {
        if (drawables[i].draw !== undefined) {
          drawables[i].draw(ctx);
        }
      }

      // translate back
      ctx.translate(viewTranslate.x, viewTranslate.y);
    },

    onScreen: function(obj) {
      var viewSize = this.getViewSize();
      return Maths.rectanglesIntersecting(obj, {
        size: viewSize,
        pos: {
          x: this.viewCenterPos.x - viewSize.x / 2,
          y: this.viewCenterPos.y - viewSize.y / 2
        }
      });
    }
  };

  var viewOffset = function(viewCenterPos, viewSize) {
    return {
      x:viewCenterPos.x - viewSize.x / 2,
      y:viewCenterPos.y - viewSize.y / 2
    }
  };

  // sorts passed array by zindex
  // elements with a higher zindex are drawn on top of those with a lower zindex
  var zindexSort = function(a, b) {
    return (a.zindex || 0) < (b.zindex || 0) ? -1 : 1;
  };

  subscribe("create-game", function(space) {
    space(function(){
      var renderer = new Renderer(space);

      space.subscribe("update-display", function() {
        renderer.update();
      });

      this.renderer = renderer;
    });
  });

  this.Renderer = Renderer;
});
