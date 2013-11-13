within("github.com/eric-brechemier/coquette", function(publish, subscribe) {
  function Runner() {
    this.runs = [];
  };

  Runner.prototype = {
    update: function() {
      this.run();
    },

    run: function() {
      while(this.runs.length > 0) {
        var run = this.runs.shift();
        run.fn(run.obj);
      }
    },

    add: function(obj, fn) {
      this.runs.push({
        obj: obj,
        fn: fn
      });
    }
  };

  subscribe("create-game", function(space) {
    space(function(){
      var runner = new Runner(space);

      space.subscribe("before-game-update", function(){
        runner.update();
      });

      this.runner = runner;
    });
  });

  this.Runner = Runner;
});
