var orient = require('robust-orientation')[3];
var sum = require('two-sum');
// var segseg = require('exact-segment-intersect');
var segseg = require('segseg');
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
  //
  //       options: minkowski sum

  var positions = sc.positions;
  var edges = sc.edges;
  var convex = sc.convex;

  // the output will have 2x the amount of verts as each original point
  // will be contributing to two offset edges (except for concave )

  var elen = edges.length;
  var out = {
    positions: [],
    edges: [],
    isects: []
  }

  for (var i=0; i<elen; i++) {
    var a = positions[edges[i][0]];
    var b = positions[edges[i][1]];

    var dx = b[0] - a[0];
    var dy = b[1] - a[1];

    var xperp = dy;
    var yperp = -dx;

    var length = Math.sqrt(xperp * xperp + yperp * yperp);
    xperp = (xperp * amount)/length;
    yperp = (yperp * amount)/length;

    out.positions.push([a[0] + xperp, a[1] + yperp]);
    out.positions.push([b[0] + xperp, b[1] + yperp]);

    if (!convex[edges[i][1]]) {
      out.isects.push([
        out.edges.length ? out.edges.length-1 : elen-1,
        out.edges.length
      ]);
    }

    out.edges.push([
      out.positions.length-2,
      out.positions.length-1
    ]);
  }

  // out.positions.map(function(p) {
  //   console.log(p.join(', '));
  // })

// console.log(out);
  // close the polygon
  // out.edges[out.edges.length-1][1] = 0;

  handleLocalInterference(out);
  out.edges.map(function(edge) {
    edge.map(function(pos) {
      console.log(out.positions[pos].join(', '))
    });
  });

  // console.log('..')
  // positions.map(function(position) {
  //   console.log(position.join(', '))
  // })
  // console.log(positions[0].join(', '))
}


function handleLocalInterference(sc) {
  var p = sc.positions;
  sc.edges.forEach(function(current, i) {
    var next = sc.edges[i<sc.edges.length-1 ? i+1 : 0];

    var a = p[current[0]];
    var b = p[current[1]];
    var c = p[next[0]];
    var d = p[next[1]];

    var isect = segseg(a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]);

    if (isect) {
      // update the position
      p[current[1]][0] = isect[0];
      p[current[1]][1] = isect[1];

      // update the topology
      next[0] = current[1];

      // TODO: remove p[next[0]] or do this before creating the SC
    }
    return true;
  });
}

  // offsetPolygon([
  //   [-10,  10],
  //   [-10, -10],
  //   [  0, 0],
  // ], -1)

  offsetPolygon([
    [-10,  10],
    [-10, -10],
    [  0, -5],
    [ 10, -10],
    [ 10,  10]
  ], -1)
