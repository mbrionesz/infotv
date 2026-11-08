if (typeof Symbol === 'undefined') {
  window.Symbol = Symbol = function (desc) { return '__sym_' + (desc || '') + '_' + Math.random(); };
  Symbol.toPrimitive = window.Symbol.toPrimitive = '__toPrimitive__';
  Symbol.iterator = window.Symbol.iterator = '__iterator__';
  Symbol.toStringTag = window.Symbol.toStringTag = '__toStringTag__';
} else if (!window.Symbol.toPrimitive) {
  Symbol.toPrimitive = window.Symbol.toPrimitive = '__toPrimitive__';
}
if (!Array.prototype.includes) {
  Array.prototype.includes = function (search, start) {
    if (this == null) { throw new TypeError("this is null or not defined"); }
    var o = Object(this), len = o.length >>> 0;
    if (len === 0) { return false; }
    var n = start | 0, k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (search === o[k] || (search !== search && o[k] !== o[k])) { return true; }
      k++;
    }
    return false;
  };
}
if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (typeof start !== "number") { start = 0; }
    if (start + search.length > this.length) { return false; }
    return this.indexOf(search, start) !== -1;
  };
}
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (search, pos) {
    pos = !pos || pos < 0 ? 0 : +pos;
    return this.substring(pos, pos + search.length) === search;
  };
}
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (search, len) {
    if (len === undefined || len > this.length) { len = this.length; }
    return this.substring(len - search.length, len) === search;
  };
}
if (typeof Object.assign !== "function") {
  Object.assign = function (target) {
    if (target == null) { throw new TypeError("Cannot convert undefined or null to object"); }
    var to = Object(target);
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src != null) {
        for (var k in src) {
          if (Object.prototype.hasOwnProperty.call(src, k)) { to[k] = src[k]; }
        }
      }
    }
    return to;
  };
}
if (!Math.trunc) {
  Math.trunc = function (v) { v = +v; return (v - v % 1) || (!isFinite(v) || v === 0 ? v : v < 0 ? -0 : 0); };
}
if (!Array.prototype.find) {
  Array.prototype.find = function (pred, thisArg) {
    if (this == null) { throw new TypeError("this is null or not defined"); }
    var o = Object(this), len = o.length >>> 0;
    for (var i = 0; i < len; i++) {
      var val = o[i];
      if (pred.call(thisArg, val, i, o)) { return val; }
    }
    return undefined;
  };
}
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function (pred, thisArg) {
    if (this == null) { throw new TypeError("this is null or not defined"); }
    var o = Object(this), len = o.length >>> 0;
    for (var i = 0; i < len; i++) {
      if (pred.call(thisArg, o[i], i, o)) { return i; }
    }
    return -1;
  };
}
