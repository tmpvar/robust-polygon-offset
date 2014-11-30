var orient = require('robust-orientation');

module.exports = offsetPolygon;

// TODO: this is R2 currently, consider R3?
// TODO: ensure the start/end are not the same

// requires the points to be wound in CCW order

function offsetPolygon(points) {
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
        return true;
      } else {
        // handles collinear and convex angles
        return false;
      }
    })
  }




  // return simplicial complex
  return sc
}



console.log(
  offsetPolygon([
    [-10,  10],
    [-10, -10],
    [  0, -5],
    [ 10, -10],
    [ 10,  10]
  ])
);
