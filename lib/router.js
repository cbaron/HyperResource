var _ = require('underscore'),
    Router = function() { this.tables = { }; return this; },

_.extend( Router.prototype, {

    _postgres: function() { return ( new require('./lib/postgres') )( { connectionString: process.env.postgres } ) },

    _queryBuilder: require( './lib/queryBuilder' ),

    initialize: function() {

        return this.Q.fcall( this._postgres().query, { query: this._queryBuilder.getAllTables() } )
            .then( this.storeTableData.bind(this) )
            .done();
    },

    handleResourceResponse: function( data ) {

        this.respond( {
            body: ( typeof data.body === "string" ) ? data.body : JSON.stringify( data.body ),
            code: data.code || 200,
            headers: _.extend( {}, this.responseHeaders, data.headers ),
            response: data.response
        } );
    }

    storeTableData: function( tableResult ) {
        
        return this.Q.all( tableResult.rows.map( row =>
            this._postgres().query( this._queryBuilder.getTableColumns( row.table_name ) )
                .then( columnResult => this.tables[ row.table_name ] = columnResult.rows.map( column => column.column_name ) )
        ) )
    },

} );


    ,

    Q: require('q'),

    respond: function( data ) {
        data.headers['Content-Length'] = Buffer.byteLength( data.body );
        data.response.writeHead( data.code, data.headers );
        data.response.end( data.body );
    },

    responseHeaders: {
        'Content-Type': 'application/json',
        'Content-Length': undefined,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Keep-Alive': 'timeout=50, max=100',
        'Date': new Date().toISOString()
    },

    returnNotFound: function( response ) {
        this.respond( {
            body: JSON.stringify( { message: 'Not Found.' } ),
            code: 404,
            headers: this.responseHeaders,
            response: response
        } );
    },

    route: function( data ) {
        var urlObj = url.parse( data.request.url ),
            path = urlObj.pathname.split("/"),
            resourceRequested,
            self = this,
            version = 1;
   
        path.shift();

        if( path[0] === "v2" ) {
            version = 2;
            path.shift();
        }
 
        resourceRequested = _.find( this.resources, function( resource ) { return resource.name === path[0]; } );

        if( resourceRequested === undefined || data.request.headers.version === "2" ) {

            this.Q.when( new ( require( [ '../resources/app/', path[0] ].join('') ) )( {
                name: path[0],
                data: { path: path,
                        request: data.request,
                        session: data.session,
                        columns: this.tables[ path[0] ],
                        urlObj: urlObj } } )[ data.request.method ]() )
            .then( function( result ) {
                if( result.isResponse ) {
                    data.response.writeHead( result.response.statusCode.toString(), result.response.headers );
                    data.response.end( result.response.body );
                } else {
                    self.handleResourceResponse( _.extend( result, { response: data.response } ) )
                }
             } )
            .fail( function( error ) {
                console.log( error.stack || error );
                self.handleResourceResponse( { code: error.code || 500, body: "There was an error", response: data.response } )
            } )
            .done();
        }

        else if( path.length < 3  ) {

            path.shift();

            resourceRequested[ data.request.method ]( {
                path: path,
                request: data.request,
                session: data.session,
                version: version,
                urlObj: urlObj } )
            .then( function( result ) {
                if( result.isResponse ) {
                    data.response.writeHead( result.response.statusCode.toString(), result.response.headers );
                    data.response.end( result.response.body );
                } else {
                    self.handleResourceResponse( _.extend( result, { response: data.response } ) )
                }
             } )
            .fail( function( error ) { self.handleResourceResponse( { code: error.code || 500, body: error.message || error, response: data.response } ) } )
            .done();

        } else {
            this.returnNotFound( data.response );
        }
    }

    url = require('url');

} );

module.exports = new Router( { tables: { } } ).initialize().handler;
