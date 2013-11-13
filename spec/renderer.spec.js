require('../src/')

within("github.com/eric-brechemier/coquette", function() {
  var
    Renderer = this.Renderer,
    Collider = this.Collider,
    Entities = this.Entities,

  var MockContext = function() {
    this.translate = function() {};
    this.fillRect = function() {};
  };

  var MockCanvas = function() {
    this.style = {};
    var ctx = new MockContext();
    this.getContext = function() { return ctx; };
  };

  var MockCoquette = function() {
    var space = within();
    return space(function(){
      this.entities = new Entities(space);
      this.game = {};
      this.canvas = new MockCanvas();
      this.renderer = new Renderer(space);
      return this;
    });
  };

  describe('entities', function() {
    describe('zindex', function() {
      var Entity = function(_, settings) {
        for (var i in settings) {
          this[i] = settings[i];
        }
      };

      var coquette;
      beforeEach(function() {
        coquette = new MockCoquette();
      });

      it('should sort entities with zindex vars lowest to highest', function() {
        var callOrder = 0;
        var recordDrawCall = function() {
          this.callOrder = callOrder++;
        };

        coquette.entities.create(Entity, { zindex: -1, draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: -20, draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: 0, draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: 21, draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: 9, draw: recordDrawCall });

        coquette.entities.space.publish("create-entities");
        coquette.renderer.update();

        expect(coquette.entities.all()[0].callOrder).toEqual(1);
        expect(coquette.entities.all()[1].callOrder).toEqual(0);
        expect(coquette.entities.all()[2].callOrder).toEqual(2);
        expect(coquette.entities.all()[3].callOrder).toEqual(4);
        expect(coquette.entities.all()[4].callOrder).toEqual(3);
      });

      it('should sort entities w/o zindex as 0', function() {
        var callOrder = 0;
        var recordDrawCall = function() {
          this.callOrder = callOrder++;
        };

        coquette.entities.create(Entity, { zindex: -1, draw: recordDrawCall });
        coquette.entities.create(Entity, { draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: 21, draw: recordDrawCall });
        coquette.entities.create(Entity, { draw: recordDrawCall });
        coquette.entities.create(Entity, { zindex: 0, draw: recordDrawCall });

        coquette.entities.space.publish("create-entities");
        coquette.renderer.update();

        expect(coquette.entities.all()[0].callOrder).toEqual(0);
        expect(coquette.entities.all()[1].callOrder).toEqual(3);
        expect(coquette.entities.all()[2].callOrder).toEqual(4);
        expect(coquette.entities.all()[3].callOrder).toEqual(2);
        expect(coquette.entities.all()[4].callOrder).toEqual(1);
      });
    });

    describe('view center position', function() {
      it('should default view top left to 0 0', function() {
        var space = within();
        space.set("canvas", new MockCanvas());
        space.set("width", 200);
        space.set("height", 100);
        var r = new Renderer(space);
        expect({
          x: r.getViewCenterPos().x - r.getViewSize().x / 2,
          y: r.getViewCenterPos().y - r.getViewSize().y / 2
        }).toEqual({ x: 0, y: 0 });
      });

      it('should be able to get view center with getViewCenterPos()', function() {
        var space = within();
        space.set("canvas", new MockCanvas());
        space.set("width", 200);
        space.set("height", 100);
        var r = new Renderer(space);
        expect({
          x: r.getViewCenterPos().x - r.getViewSize().x / 2,
          y: r.getViewCenterPos().y - r.getViewSize().y / 2
        }).toEqual({ x: 0, y: 0 });
      });

      describe('setViewCenterPos()', function() {
        it('should be able to set view center', function() {
          var space = within();
          space.set("canvas", new MockCanvas());
          var r = new Renderer(space);
          r.setViewCenterPos({ x: 10, y: 12 });
          expect(r.getViewCenterPos()).toEqual({ x: 10, y: 12 });
        });

        it('should make new obj to hold set pos', function() {
          var space = within();
          space.set("canvas", new MockCanvas());
          var r = new Renderer(space);
          var newPos = { x: 10, y: 12 };
          r.setViewCenterPos(newPos);
          expect(r.getViewCenterPos()).toEqual({ x: 10, y: 12 });
          newPos.x = 15;
          expect(r.getViewCenterPos()).toEqual({ x: 10, y: 12 });
        });
      });
    });

    describe('getCtx()', function() {
      it('should return ctx', function() {
        var space = within();
        space.set("canvas", new MockCanvas());
        var r = new Renderer(space);
        expect(r.getCtx() instanceof MockContext).toEqual(true);
      });
    });

    describe('background color', function() {
      it('should set background color to passed color', function() {
        var space = within();
        space.set("canvas", new MockCanvas())
        space.set("backgroundColor", "#aaa");
        var r = new Renderer(space);
        expect(r.getBackgroundColor()).toEqual("#aaa");
      });
    });

    describe('view size', function() {
      it('should set view size to passed vals', function() {
        var space = within();
        space.set("canvas", new MockCanvas());
        space.set("width", 100);
        space.set("height", 200);
        var r = new Renderer(space);
        expect(r.getViewSize()).toEqual({ x: 100, y: 200 });
      });

      it('should set width and height of canvas to passed view size', function() {
        var space = within();
        var canvas = new MockCanvas();
        space.set("canvas", canvas);
        space.set("width", 100);
        space.set("height", 200);
        var r = new Renderer(space);
        expect(canvas.width).toEqual(100);
        expect(canvas.height).toEqual(200);
      });

      it('should be able to get view size with getViewSize()', function() {
        var space = within();
        space.set("canvas", new MockCanvas());
        space.set("width", 100);
        space.set("height", 200);
        var r = new Renderer(space);
        expect(r.getViewSize()).toEqual({ x: 100, y: 200 });
      });
    });

    describe('onScreen()', function() {
      it('should return true for on screen entity', function() {
        // Unorthodox test that just checks the rectanglesIntersecting() fn is used
        // for the onScreen functionality.  Then can just rely on the comprehensive tests
        // of that fn in collider.spec.js
        var oldRectanglesIntersecting = Collider.Maths.rectanglesIntersecting;

        var ran = false;
        Collider.Maths.rectanglesIntersecting = function() {
          ran = true;
        };

        expect(ran).toEqual(false);
        var space = within();
        space.set("canvas", new MockCanvas());
        new Renderer(space).onScreen();
        expect(ran).toEqual(true);
      });
    });
  });
});
