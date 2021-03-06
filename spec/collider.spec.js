require('../src/')

within("github.com/eric-brechemier/coquette", function() {
  var
    Collider = this.Collider,
    Renderer = this.Renderer,
    Entities = this.Entities,
    Maths = Collider.Maths;

  var mockObj = function(posX, posY, sizeX, sizeY, boundingBox) {
    return {
      pos: { x:posX, y:posY },
      size: { x:sizeX, y:sizeY },
      boundingBox: boundingBox
    };
  };

  var mock = function(thingToMockHost, thingToMockAttribute, mock) {
    var originalThingToMock = thingToMockHost[thingToMockAttribute];
    thingToMockHost[thingToMockAttribute] = mock;
    return function() {
      thingToMockHost[thingToMockAttribute] = originalThingToMock;
    };
  };

  describe('collider', function() {
    describe('main collider obj', function() {
      var MockCoquette = function() {
        var space = within();
        return space(function(){
          this.entities = new Entities(space);
          this.collider = new Collider(space);
          return this;
        });
      };

      var Thing = function(__, settings) {
        for (var i in settings) {
          this[i] = settings[i];
        }
      };

      describe('update()', function() {
        it('should test all entities against all other entities once', function() {
          var c = new MockCoquette();
          var comparisons = [];
          var unmock = mock(c.collider, "isColliding", function(a, b) {
            comparisons.push([a.id, b.id]);
          });

          c.entities.create(Thing, { id: 0 });
          c.entities.create(Thing, { id: 1 });
          c.entities.create(Thing, { id: 2 });
          c.entities.create(Thing, { id: 3 });
          c.entities.space.publish("create-entities");
          c.collider.update();
          expect(comparisons.length).toEqual(6);
          expect(comparisons[0][0] === 0 && comparisons[0][1] === 1).toEqual(true);
          expect(comparisons[1][0] === 0 && comparisons[1][1] === 2).toEqual(true);
          expect(comparisons[2][0] === 0 && comparisons[2][1] === 3).toEqual(true);
          expect(comparisons[3][0] === 1 && comparisons[3][1] === 2).toEqual(true);
          expect(comparisons[4][0] === 1 && comparisons[4][1] === 3).toEqual(true);
          expect(comparisons[5][0] === 2 && comparisons[5][1] === 3).toEqual(true);
          unmock();
        });

        it('should do no comparisons when only one entity', function() {
          var c = new MockCoquette();
          var unmock = mock(c.collider, "isColliding", function(a, b) {
            throw "arg";
          });

          c.entities.create(Thing, { id: 0 });
          c.entities.space.publish("create-entities");
          c.collider.update();
          unmock();
        });

        it('should fire uncollision on uncollision', function() {
          var c = new MockCoquette();
          var uncollisions = 0;
          var unmock = mock(c.collider, "isColliding", function() { return true; });
          c.entities.create(Thing, { uncollision: function() { uncollisions++; }});
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          mock(c.collider, "isColliding", function() { return false; })
          c.collider.update();
          expect(uncollisions).toEqual(1);
          unmock();
        });

        it('should not fire uncollision on sustained non coll', function() {
          var c = new MockCoquette();
          var uncollisions = 0;
          var unmock = mock(c.collider, "isColliding", function() { return true; });
          c.entities.create(Thing, { uncollision: function() { uncollisions++; }});
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          mock(c.collider, "isColliding", function() { return false; })
          c.collider.update();
          expect(uncollisions).toEqual(1);
          c.collider.update();
          expect(uncollisions).toEqual(1);
          unmock();
        });
      });

      describe('destroyEntity()', function() {
        it('should fire uncollision if colliding', function() {
          var c = new MockCoquette();
          var uncollisions = 0;
          var unmock = mock(c.collider, "isColliding", function() { return true; });
          var entity1;
          c.entities.create(
            Thing,
            {
              uncollision: function() {
                uncollisions++;
              }
            },
            function(newEntity) {
              entity1 = newEntity;
            }
          );
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          expect(uncollisions).toEqual(0);
          c.collider.destroyEntity(entity1);
          expect(uncollisions).toEqual(1);
          unmock();
        });

        it('should not fire uncollision if not colliding', function() {
          var c = new MockCoquette();
          var uncollisions = 0;
          var unmock = mock(c.collider, "isColliding", function() { return false; });
          var entity1;
          c.entities.create(
            Thing,
            {
              uncollision: function() {
                uncollisions++;
              }
            },
            function(newEntity) {
              entity1 = newEntity;
            }
          );
          c.entities.space.publish("create-entities");
          c.collider.update();
          c.collider.destroyEntity(entity1);
          expect(uncollisions).toEqual(0);
          unmock();
        });
      });

      describe('collision()', function() {
        it('should keep on banging out INITIAL colls if no uncollision fns', function() {
          var c = new MockCoquette();

          var unmock = mock(c.collider, "isColliding", function() { return true });
          var collisions = 0;
          c.entities.create(Thing, {
            collision: function(__, type) {
              collisions++;
              if (type !== c.collider.INITIAL) {
                throw "arg";
              }
            }
          });
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          c.collider.update();
          c.collider.update();
          expect(collisions).toEqual(3);
          unmock();
        });

        it('should do initial INITIAL coll if entity uncollision fn', function() {
          var c = new MockCoquette();

          var unmock = mock(c.collider, "isColliding", function() { return true });
          var initial = 0;
          c.entities.create(Thing, {
            uncollision: function() {},
            collision: function(__, type) {
              if (type === c.collider.INITIAL) {
                initial++;
              }
            }
          });
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          expect(initial).toEqual(1);
          unmock();
        });

        it('should bang out sustained colls if colls are sustained and entity has uncollision fn', function() {
          var c = new MockCoquette();

          var unmock = mock(c.collider, "isColliding", function() { return true });
          var sustained = 0;
          c.entities.create(Thing, {
            uncollision: function() {},
            collision: function(__, type) {
              if (type === c.collider.SUSTAINED) {
                sustained++;
              }
            }
          });
          c.entities.create(Thing);
          c.entities.space.publish("create-entities");
          c.collider.update();
          c.collider.update();
          c.collider.update();
          expect(sustained).toEqual(2);
          unmock();
        });
      });
    });

    describe('maths', function() {
      describe('rectangleCorners', function() {
        it('should get corners of rect', function() {
          var obj = mockObj(5, 5, 10, 10);
          var corners = Maths.rectangleCorners(obj);
          expect(corners[0]).toEqual({ x:5, y:5 });
          expect(corners[1]).toEqual({ x:15, y:5 });
          expect(corners[2]).toEqual({ x:15, y:15 });
          expect(corners[3]).toEqual({ x:5, y:15 });
        });
      });

      describe('isLineIntersectingCircle', function() {
        it('should return false when circle and line intersect', function() {
          var obj = mockObj(5, 5, 10, 10);
          var intersecting = Maths.isLineIntersectingCircle(obj, { x:1, y:1 }, { x:20, y:20 });
          expect(intersecting).toEqual(true);
        });

        it('should return false when circle and line do not intersect', function() {
          var obj = mockObj(5, 5, 10, 10);
          var intersecting = Maths.isLineIntersectingCircle(obj, { x:1, y:1 }, { x:1, y:20 });
          expect(intersecting).toEqual(false);
        });
      });

      describe('circleAndRectangleIntersecting', function() {
        it('should return true when centres align', function() {
          var circle = mockObj(5, 5, 10, 10);
          var rectangle = mockObj(7, 7, 10, 10);
          var intersecting = Maths.circleAndRectangleIntersecting(circle, rectangle);
          expect(intersecting).toEqual(true);
        });

        it('should return true when circle and rect overlap a bit', function() {
          var circle = mockObj(5, 5, 10, 10);
          var rectangle = mockObj(7, 7, 10, 10);
          var intersecting = Maths.circleAndRectangleIntersecting(circle, rectangle);
          expect(intersecting).toEqual(true);
        });

        it('should return false when circle and rect do not intersect', function() {
          var circle = mockObj(5, 5, 10, 10);
          var rectangle = mockObj(16, 16, 10, 10);
          var intersecting = Maths.circleAndRectangleIntersecting(circle, rectangle);
          expect(intersecting).toEqual(false);
        });
      });

      describe('isColliding', function() {
        describe('objects not set up for collisions', function() {
          var correctObj = mockObj(5, 5, 10, 10);
          var c = new Collider(within());
          it('should return true for two objects with pos and size', function() {
            expect(c.isColliding(correctObj, correctObj)).toEqual(true);
          });

          it('should return false when pos missing', function() {
            expect(c.isColliding(correctObj, { size: { x:1, y: 1 }})).toEqual(false);
            expect(c.isColliding({ size: { x:1, y: 1 }}, correctObj)).toEqual(false);
          });

          it('should return false when size missing', function() {
            expect(c.isColliding(correctObj, { pos: { x:1, y: 1 }})).toEqual(false);
            expect(c.isColliding({ pos: { x:1, y: 1 }}, correctObj)).toEqual(false);
          });
        });
      });

      describe('isIntersecting', function() {
        it('should use rect as default bounding box', function() {
          var collider = new Collider(within());
          var obj1 = mockObj(5, 5, 10, 10);
          var obj2 = mockObj(15, 15, 10, 10);
          var intersecting = collider.isIntersecting(obj1, obj2);
          expect(intersecting).toEqual(true);
        });

        describe('two rects', function() {
          describe('collisions', function() {
            it('should return true: bottom right corner over top left corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(10, 10, 2, 4),
                  mockObj(12, 14, 4, 2)
                )
              ).toEqual(true);
            });

            it('should return true: bottom left corner over top right corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(10, 10, 2, 4),
                  mockObj(6, 14, 4, 2)
                )
              ).toEqual(true);
            });

            it('should return true: top left corner over bottom right corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(12, 14, 4, 2),
                  mockObj(10, 10, 2, 4)
                )
              ).toEqual(true);
            });

            it('should return true: top right corner over bottom left corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(6, 14, 4, 2),
                  mockObj(10, 10, 2, 4)
                )
              ).toEqual(true);
            });
          });

          describe('non-collisions', function() {
            it('should return true: bottom right corner over top left corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(10, 10, 2, 4),
                  mockObj(13, 14, 4, 2)
                )
              ).toEqual(false);
            });

            it('should return true: bottom left corner over top right corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(10, 10, 2, 4),
                  mockObj(5, 14, 4, 2)
                )
              ).toEqual(false);
            });

            it('should return true: top left corner over bottom right corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(13, 14, 4, 2),
                  mockObj(10, 10, 2, 4)
                )
              ).toEqual(false);
            });

            it('should return true: top right corner over bottom left corner', function() {
              expect(
                new Collider(within()).isIntersecting(
                  mockObj(5, 14, 4, 2),
                  mockObj(10, 10, 2, 4)
                )
              ).toEqual(false);
            });
          });
        });

        it('should return false for two circles that are not colliding', function() {
          var collider = new Collider(within());
          var obj1 = mockObj(5, 5, 10, 10, collider.CIRCLE);
          var obj2 = mockObj(14, 14, 10, 10, collider.CIRCLE);
          var intersecting = collider.isIntersecting(obj1, obj2);
          expect(intersecting).toEqual(false);
        });

        it('should return true for circ+rect that are colliding', function() {
          var collider = new Collider(within());
          var obj1 = mockObj(5, 5, 10, 10, collider.CIRCLE);
          var obj2 = mockObj(14, 14, 10, 10, collider.RECTANGLE);
          var intersecting = collider.isIntersecting(obj1, obj2);
          expect(intersecting).toEqual(false);
        });

        it('should return true for point+rect that are colliding', function() {
          var collider = new Collider(within());
          var obj1 = mockObj(5, 5, 1, 1, collider.POINT);
          var obj2 = mockObj(0, 0, 10, 10, collider.RECTANGLE);
          var intersecting = collider.isIntersecting(obj1, obj2);
          expect(intersecting).toEqual(true);
        });

        it('should return true for point+circ that are colliding', function() {
          var collider = new Collider(within());
          var obj1 = mockObj(5, 5, 1, 1, collider.POINT);
          var obj2 = mockObj(0, 0, 10, 10, collider.CIRCLE);
          var intersecting = collider.isIntersecting(obj1, obj2);
          expect(intersecting).toEqual(true);
        });

        it('should throw when either obj has invalid bounding box', function() {
          var collider = new Collider(within());

          var obj1 = mockObj(5, 5, 1, 1, "la");
          var obj2 = mockObj(0, 0, 10, 10, collider.CIRCLE);
          expect(function() {
            collider.isIntersecting(obj1, obj2);
          }).toThrow();

          var obj1 = mockObj(5, 5, 1, 1, Collider.CIRCLE);
          var obj2 = mockObj(0, 0, 10, 10, "la");
          expect(function() {
            collider.isIntersecting(obj1, obj2);
          }).toThrow();
        });

        describe('object ordering', function() {
          it('should only return true when circle+rect in right order to collide', function() {
            var collider = new Collider(within());

            var obj1 = mockObj(33, 33, 10, 10, collider.CIRCLE);
            var obj2 = mockObj(5, 5, 30, 30, collider.RECTANGLE);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(true);

            // same dimensions, swap shape type and get no collision
            var obj1 = mockObj(33, 33, 10, 10, collider.RECTANGLE);
            var obj2 = mockObj(5, 5, 30, 30, collider.CIRCLE);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(false);
          });

          it('should only return true when point+rect in right order to collide', function() {
            var collider = new Collider(within());

            var obj1 = mockObj(5, 5, 1, 1, collider.POINT);
            var obj2 = mockObj(0, 0, 10, 10, collider.RECTANGLE);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(true);

            // same dimensions, swap shape type and get no collision
            var obj1 = mockObj(5, 5, 1, 1, collider.RECTANGLE);
            var obj2 = mockObj(0, 0, 10, 10, collider.POINT);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(false);
          });

          it('should only return true when point+circ in right order to collide', function() {
            var collider = new Collider(within());

            var obj1 = mockObj(5, 5, 1, 1, collider.POINT);
            var obj2 = mockObj(0, 0, 10, 10, collider.CIRCLE);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(true);

            // same dimensions, swap shape type and get no collision
            var obj1 = mockObj(5, 5, 1, 1, collider.CIRCLE);
            var obj2 = mockObj(0, 0, 10, 10, collider.POINT);
            expect(collider.isIntersecting(obj1, obj2)).toEqual(false);
          });
        });
      });
    });

    describe('regressions', function() {
      it('should not re-report coll as result of entity reorder', function() {
        // In progress collisions recorded inside collider.  When checking to see
        // if collision already recorded, assumed two entities would be in same order in
        // record.  This assumption valid if entities always compared in same order.
        // But, this was occasionally not the case after zindex sort following entity
        // creation.

        var MockCoquette = function() {
          var space = within();
          return space(function(){
            this.entities = new Entities(space);
            this.collider = new Collider(space);
            this.game = {};
            this.canvas = {
              style: {},
              getContext: function() { }
            };
            this.renderer = new Renderer(space);
            return this;
          });
        };

        var Entity = function(__, settings) {
          for (var i in settings) {
            this[i] = settings[i];
          }
        };

        // prove that sorting on entities with zindexes of zeroes reorders them
        // (this was how the entities got reordered)

        var c = new MockCoquette();
        var entity1, entity2;
        function setEntity1(entity) {
          entity1 = entity;
        }
        function setEntity2(entity) {
          entity2 = entity;
        }
        c.entities.create(Entity, { zindex: 0, id: 0 }, setEntity1);
        c.entities.create(Entity, { zindex: 0, id: 1 }, setEntity2);
        c.entities.space.publish("create-entities");
        expect(c.entities.all()[0]).toEqual(entity1);
        expect(c.entities.all()[1]).toEqual(entity2);

        c.entities.all().sort(function(a, b) {
          return (a.zindex || 0) < (b.zindex || 0) ? -1 : 1;
        });
        expect(c.entities.all()[0]).toEqual(entity2);
        expect(c.entities.all()[1]).toEqual(entity1);

        // prove that Entities.create no longer sorts on zindex

        c = new MockCoquette();
        c.entities.create(Entity, { zindex: 1 }, setEntity1);
        c.entities.create(Entity, { zindex: 0 }, setEntity2);
        c.entities.space.publish("create-entities");
        expect(c.entities.all()[0]).toEqual(entity1);
        expect(c.entities.all()[1]).toEqual(entity2);

        // prove that reordering entities produces the bug

        c = new MockCoquette();
        var initial = 0;
        c.entities.create(Entity, {
          uncollision: function() {}, // switch off repeated collision reporting
          collision: function(__, type) {
            if (type === c.collider.INITIAL) {
              initial++;
            }
          }
        }, setEntity1);
        c.entities.create(Entity, {}, setEntity2);

        c.entities.space.publish("create-entities");

        var restoreIsIntersecting = mock(c.collider, 'isColliding', function() {
          return true;
        });

        c.collider.update();
        expect(initial).toEqual(1);
        c.collider.update();
        expect(initial).toEqual(1); // collision not re-reported

        // reorder entities (hack)
        var list = c.entities.all();
        list[0] = entity2;
        list[1] = entity1;
        c.collider.update();
        expect(initial).toEqual(2); // boom
        restoreIsIntersecting();
      });
    });
  });
});
