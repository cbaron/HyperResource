var MyObject = require('./MyObject'),
    Router = function() { return MyObject.apply( this, arguments ) };

MyObject._.extend( Router.prototype, MyObject.prototype, {

    _postgres: function() { return ( new require('./lib/postgres') )( { connectionString: process.env.postgres } ) },

    _queryBuilder: require( './lib/queryBuilder' ),

    _url: require( 'url' ),

    initialize: function() {

        return this.Q.fcall( this._postgres().query, { query: this._queryBuilder.getAllTables() } )
            .then( this.storeTableData.bind(this) )
            .done();
    },

    handleFailure: function( error ) {

        console.log( err || err.stack );

        this.writeHead( 500, {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Keep-Alive': 'timeout=50, max=100',
            'Date': new Date().toISOString() } )

        data.response.end( ( process.env.env !== "production" ) ? data.body : "Unknown Error" );
    },
    
    handleResourceResponse: function( data ) {

        this.respond( {
            body: ( typeof data.body === "string" ) ? data.body : JSON.stringify( data.body ),
            code: data.code || 200,
            headers: _.extend( {}, this.responseHeaders, data.headers ),
            response: data.response
        } );
    },

    handler: function( request, response ) {

        var resource = this._url.parse( request.url ).pathname.split("/")[0];

        this.Q.when( new ( require( util.format('../resources/%s', resource ) ) )( {
                name: resource,
                request: request,
                response: response } )[ request.method ]() )
              .fail( this.handleFailure.bind(res) )
              .done();
    },

    storeTableData: function( tableResult ) {
        
        return this.Q.all( tableResult.rows.map( row =>
            this._postgres().query( this._queryBuilder.getTableColumns( row.table_name ) )
                .then( columnResult => this.tables[ row.table_name ] = columnResult.rows.map( column => column.column_name ) )
        ) )
    },

} );

module.exports = new Router( { tables: { } } ).initialize().handler;
