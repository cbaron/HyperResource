var MyObject = function( data ) { return this._.extend( this, data ) }

MyObject.prototype._ = require('underscore');

MyObject.prototype.Q = require('q');

MyObject.prototype.util = require('util');

module.exports = MyObject;
