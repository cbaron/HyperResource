var MyObject = function( data ) { return this._.extend( this, data ) }

MyObject.prototype._ = require('underscore');

MyObject.prototype.Q = require('q');

module.exports = MyObject;
