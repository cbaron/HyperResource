require('./config/v8Flags');

require('https')
    .createServer( { key: fs.readFileSync( process.env.httpsServerKey ), cert: fs.readFileSync( process.env.httpsServerCert ) }, require('./lib/router ) )
    .listen( process.env.port );
