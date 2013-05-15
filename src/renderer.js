within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  var Renderer = function() {
    var
      canvasId = get("canvasId"),
      width = get("width"),
      height = get("height"),
      backgroundColor = get("backgroundColor"),
      canvas = document.getElementById(canvasId);

    canvas.style.outline = "none"; // stop browser outlining canvas when it has focus
    canvas.style.cursor = "default"; // keep pointer normal when hovering over canvas
    this.ctx = canvas.getContext('2d');
    this.backgroundColor = backgroundColor;
    canvas.width = this.width = width;
    canvas.height = this.height = height;
  };

  Renderer.prototype = {
    getCtx: function() {
      return this.ctx;
    },

    update: function() {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    },

    center: function() {
      return {
        x: this.width / 2,
        y: this.height / 2
      };
    },

    onScreen: function(obj) {
      return obj.pos.x > 0 && obj.pos.x < get("renderer").width &&
        obj.pos.y > 0 && obj.pos.y < get("renderer").height;
    }
  };

  set("Renderer", Renderer);
});
