
/**
 * 共通処理
 */
 function isInteger(x) {
   return Math.round(x) === x
 }

 function clone(obj) {
   if (obj === null || typeof obj !== 'object') return obj;
   var copy = obj.constructor();
   for (var attr in obj) {
     if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
   }
   return copy;
 }


/**
 * Rangeオブジェクト
 */
function Range(begin, end) {
  if (!isInteger(begin) || !isInteger(end)) return null
  this.begin = begin
  this.end = end
}
(function() {
  Range.prototype.intersect = function(range) {
    if (!(range instanceof Range)) return

    var begin = (this.range.begin > range.begin) ?
                    this.range.begin : range.begin
    var end   = (this.range.end < range.end) ?
                    this.range.end : range.end

    if (begin > end) return []

    return new Range(begin, end)
  }

  /**
   * begin ~ end を配列で返す
   */
  Range.prototype.array = function() {
    var arr = []
    for (var i = this.begin; i < this.end; ++i) {
      arr.push(i)
    }
    return arr
  }
})()
