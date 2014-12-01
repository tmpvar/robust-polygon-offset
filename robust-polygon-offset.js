var orient = require('robust-orientation')[3];
var sum = require('two-sum');
var segseg = require('exact-segment-intersect');
var float = require('robust-estimate-float');

module.exports = offsetPolygon;

// TODO: this is R2 currently, consider R3?
// TODO: ensure the start/end are not the same

// requires the points to be wound in CCW order

function offsetPolygon(points, amount) {
  var concave = amount > 0;

  var sc = {
    positions: points,
    edges: points.map(function computeEdges(point, i) {
      var p = i>0? i-1: points.length-1;
      return [p, i];
    }),
    convex: points.map(function(point, i) {
      var p = i>0? i-1: points.length-1;
      var n = i<points.length-1? i+1: 0;

      if (orient(points[p], point, points[n]) < 0) {
        // this is a reflex angle
        return concave;
      } else {
        // handles collinear and convex angles (>0˚)
        return !concave;
      }
    })
  }

  offsetLines(sc, amount);

  // return simplicial complex
  return sc
}


function offsetLines(sc, amount) {
  // TODO: make this robust
  //       The main issue here is the sqrt and normalization of vectors
  //       Perhaps using rational numbers would help in the normalization
  //       case, and finding a different way to compute the offset vector
  //       may eliminated the calls to sqrt

  var positions = sc.positions;
  var edges = sc.edges;
  var convex = sc.convex;

  // the output will have 2x the amount of verts as each original point
  // will be contributing to two offset edges (except for concave )

  var elen = edges.length;
  var out = {
    positions: [],
    cells: []
  }

  for (var i=0; i<elen; i++) {
    var a = positions[edges[i][0]];
    var b = positions[edges[i][1]];

    // var dx = sum(b[0], -a[0]);
    // var dy = sum(b[1], -a[1]);

    var dx = b[0] - a[0];
    var dy = b[1] - a[1];

    var xperp = dy;
    var yperp = -dx;

    var length = Math.sqrt(xperp * xperp + yperp * yperp);
    xperp = (xperp * amount)/length;
    yperp = (yperp * amount)/length;

    var o1 = [
      a[0] + xperp,
      a[1] + yperp,
    ];

    var o2 = [
      b[0] + xperp,
      b[1] + yperp,
    ];

    if (!convex[edges[i][0]]) {
      var lastEdge = out.cells[out.cells.length-1];
      var isect = segseg(
        o1,
        o2,
        out.positions[lastEdge[0]],
        out.positions[lastEdge[1]]
      );
      o1[0] = float(isect[0])/isect[2];
      o1[1] = float(isect[1])/isect[2];
      out.positions.pop();
    }

    out.positions.push(o1);
    out.positions.push(o2);

    out.cells.push([out.positions.length-2, out.positions.length-1]);
  }

  out.cells.push([out.positions.length-1, 0]);

  return out;
}


console.log(
  offsetPolygon([
    [-10,  10],
    [-10, -10],
    [  0, -5],
    [ 10, -10],
    [ 10,  10]
  ], 5)
);
