var debug = require('debug')('orienteer-http'),
    OrientError = require('../errors').OrientError,
    interfaces = {},
    methodMap = {
        get:  'GET',
        put:  'PUT',
        post: 'POST',
        del:  'DELETE',
        head: 'HEAD'
    },
    _ = require('underscore'),
    reLeadingSlash = /^\//,
    reStatusOK = /^[23]\d{2}$/,
    reStatusError = /^5\d{2}$/,

    // this object contains keys for operations that require
    // dblevel auth for http (which is a little different) to the
    // binary protocol driver
    dbLevelAuth = {
        dbExist: true
    };

exports.send = function(connection, data, callback) {
    // if we don't have an interface for the current command
    // report an error
    if (typeof interfaces[data.command] != 'function') {
        return callback(new Error('Unable to find http interface for ' + data.command + ' command'));
    }

    interfaces[data.command].apply(this, arguments);
};

/* internal command functions  */

/**
## command
*/
interfaces.command = function(connection, data, callback) {
    prepareRequest(connection, data).post(
        '/command/' + connection.dbname + '/sql', 
        { body: data.sql }, 
        function(err, body) {
            console.log(body);
            callback.apply(this, arguments);
        }
    );
};

/**
## dbCreate
*/
interfaces.dbCreate = function(connection, data, callback) {
    var args;

    // initialise the args
    args = [
        data.name,
        data.storage || 'local',
        data.type || 'document'
    ];
    
    // make the request
    prepareRequest(connection, data).post('/database/' + args.join('/'), callback);
};

/**
## dbDelete
*/
interfaces.dbDelete = function(connection, data, callback) {
    prepareRequest(connection, data).del('/database/' + data.name, callback);
};

/**
## dbExist
*/
interfaces.dbExist = function(connection, data, callback) {
    // override the user details with credentials for the specified db
    data = _.extend({}, data, connection.getDbUser(data.name));

    prepareRequest(connection, data).get('/database/' + data.name, function(err, data) {
        // add the data exists flag
        data = data || {};
        data.exists = (! err) && typeof data.config != 'undefined';

        // trigger the callback
        callback(null, data);
    });
};

/* internal helper functions */

function prepareRequest(connection, data) {
    var baseOpts = {
            hostname: connection.protocol.host,
            port: connection.protocol.port
        },
        http = require(connection.protocol.https ? 'https' : 'http'),
        err;

    function proxy(opts, callback) {
        var authToken, request;

        // handle the two argument case
        if (typeof data == 'function') {
            callback = data;
            data = {};
        }

        // ensure the opts have base opts as defaults
        opts = _.defaults(opts, baseOpts);

        // ensure we have headers in the data
        opts.headers = opts.headers || {};

        // add the auth headers
        if (data.username) {
            authToken = data.username + ':' + (data.password || '');
            opts.headers['Authorization'] = 'Basic ' + new Buffer(authToken).toString('base64');           
        }

        // if we have a body, set the content length header
        if (opts.body) {
            opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            opts.headers['Content-Length'] = opts.body.length;
        }

        // call the actual request
        debug('making ' + opts.method + ' request to: ' + opts.path + ', auth user: ' + data.username);
        request = http.request(opts, function(response) {
            var body = '', chunks = [], statusOK;

            // check the status
            statusOK = response && reStatusOK.test(response.statusCode);
            debug('received ' + response.statusCode + ' response from server, ok: ' + statusOK);

            // handle response data and end
            response.on('data', function(data) {
                chunks[chunks.length] = data;
            });

            response.on('end', function() {
                // get the overall body
                body = Buffer.concat(chunks).toString();

                // attempt to json parse the body
                try {
                    body = JSON.parse(body);
                }
                catch (e) {
                }

                // if we have a 5xx status do some debugging
                if (reStatusError.test(response.statusCode)) {
                    debug('receieved error: ', body);
                }

                // if the status is not ok, then abort
                if (! statusOK) {
                    err = new OrientError('invalid-http-response', {
                        statusCode: response.statusCode,
                        method: opts.method,
                        url: opts.path
                    });

                    // add the body to the error
                    err.body = body;
                    return callback(err, body);
                }               

                // trigger the callback
                callback(null, body, response);
            });
        });

        // handle errors
        request.on('error', function(err) {
            debug('received connection error', err);
            callback(err);
        });

        // if we have a body, write the data
        if (opts.body) {
            request.write(opts.body);
        }

        // end the request
        request.end();
        return request;
    }

    // add the helpers as per request
    _.each(methodMap, function(method, key) {
        proxy[key] = function(path, extraOpts, callback) {
            if (typeof extraOpts == 'function') {
                callback = extraOpts;
                extraOpts =  {};
            }

            return proxy(_.extend({ method: method, path: path }, extraOpts), callback);
        };
    });

    return proxy;
}