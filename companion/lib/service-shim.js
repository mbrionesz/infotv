'use strict';
// HTTP host for the original service callbacks; no Luna bus is needed on PC.
var instance;
function Service(name) { this.name = name; this.methods = {}; instance = this; }
Service.prototype.register = function (name, handler) { this.methods[name] = handler; };
Service.instance = function () { return instance; };
module.exports = Service;
