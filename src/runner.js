within("coquette.maryrosecook.com", function(get, set, publish, subscribe) {
  function Runner() {
    this.runs = [];
  }

  Runner.prototype = {
    update: function() {
      this.run();
    },

    run: function() {
      while(this.runs.length > 0) {
        var run = this.runs.pop();
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

  set("Runner", Runner);

  subscribe("start", function() {
    set("runner", new Runner());
  });

  subscribe("started", function() {
    get("updater").add( get("runner") );
  });

});
