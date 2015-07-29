module.exports = Object.create( {

    _util: require('util'),

    getAllTables: function() {
        return this.util.format(
            "SELECT table_name",
           "FROM information_schema.tables",
           "WHERE table_schema='public'",
           "AND table_type='BASE TABLE';" )
    },

    getTableColumns: function( tableName ) {
        return this._util.format(
            'SELECT column_name',
            'FROM information_schema.columns',
            this._util.format( "WHERE table_name = '%s';", tableName ) )
    }
} );
