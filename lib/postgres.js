var MyObject = require('./lib/MyObject');

var Postgres = function() {
    return MyObject.apply( this._.extend( this, {
        client: undefined,
        deferred: { connection: undefined, query: undefined },
        done: undefined } ), arguments )
}

MyObject.prototype._.extend( Postgres.prototype, MyObject.prototype, {

    _handleConnect: function( err, client, done ) {
        if( err ) {
            var message = "Error fetching client from pool : " + err;
            return this.deferred.connection.reject( new Error( message ) );
        }

        this.client = client;
        this.done = done;
     
        this.deferred.connection.resolve( true );

        return this;
    },

    _handleQuery: function( err, result ) {
        this.done();

        if( err ) {
            var message = [ "Error running query : ", this.queryArguments[0], " ", err ].join("");
            return this.deferred.query.reject( new Error( message ) );
        }

        this.deferred.query.resolve( result );

        return this;
    },

    _pg: require('pg'),

    _query: function() {
        this.client.query( this.queryArguments[0], this.queryArguments[1], this._handleQuery.bind(this) );
        return this;
    },

    connect: function() {
        this.deferred.connection = Q.defer();
        this._pg.connect( this.connectionString, this._handleConnect.bind(this) );
        return this.deferred.connection.promise;
    },

    query: function( query, params ) {
        
        this.queryArguments = arguments;
       
        this.connect().then( this._query.bind(this) );

        return this.deferred.query.promise;
    }

} );

module.exports = Postgres;
