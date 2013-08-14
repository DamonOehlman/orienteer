/* jshint node: true */
'use strict';

var debug = require('debug')('orienteer-http');
var errors = require('../errors');
var OrientError = errors.OrientError;
var OrientServerError = errors.OrientServerError;
var _ = require('underscore');

var reStatusOK = /^[23]\d{2}$/;
var reStatusError = /^5\d{2}$/;
var reMissingClass = /^invalid\sclass/i;

var escapeChars = ['%', '+', '$'];
var methodMap = {
  get:  'GET',
  put:  'PUT',
  post: 'POST',
  del:  'DELETE',
  head: 'HEAD'
};

// compile the escape character regexes
escapeChars.forEach(function(chr, index) {
  escapeChars[index] = {
    regex: new RegExp('\\' + chr, 'g'),
    entity: encodeURIComponent(chr)
  };
});

/**
  ## orienteer http protocol driver
**/

/**
  ### command(connection, data, callback)

  Issue an SQL command against the specified connection.

**/
exports.command = function(connection, data, callback) {
  // escape the sql as required
  var sql = data.sql;

  escapeChars.forEach(function(chr) {
    sql = sql.replace(chr.regex, chr.entity);
  });

  prepareRequest(connection, data).post(
    '/command/' + connection.dbname + '/sql',
    { body: sql },
    function(err, response) {
      if (err) {
        return callback(err);
      }

      // if we have a response result, then provide that result
      if (response && response.result) {
        return callback(null, response.result);
      }

      // otherwise, just pass the arguments through
      callback.apply(this, arguments);
    }
  );
};

/**
  ### describeClass(connection, data, callback)

  Describe the specified class.
**/
exports.describeClass = function(connection, data, callback) {
  prepareRequest(connection, data).get(
    '/class/' + connection.dbname + '/' + data.name,
    function(err, response) {
      // if the class does not exist then handle that condition
      if (err && reMissingClass.test(err.message)) {
        return callback(new errors.NoClassError(connection.dbname, data.name));
      }

      callback(err, response);
    }
  );
};

/**
  ### describeDb

  Issue a connect request against the specified database.
**/
exports.describeDb = function(connection, data, callback) {
  prepareRequest(connection, data).get(
    '/database/' + data.name,
    callback
  );
};

/**
  ### dbCreate

  Create a new database instance.
**/
exports.dbCreate = function(connection, data, callback) {
  var args;

  // initialise the args
  args = [
    data.name,
    data.storage || 'local',
    data.type || 'document'
  ];
  
  // make the request
  prepareRequest(connection, data)
    .post('/database/' + args.join('/'), callback);
};

/**
  ### dbDelete

  Delete the specified db
**/
exports.dbDelete = function(connection, data, callback) {
  prepareRequest(connection, data)
    .del('/database/' + data.name, callback);
};

/**
  ### dbExist

  Check to see if the requested db exists.
**/
exports.dbExist = function(connection, data, callback) {
  prepareRequest(connection, data)
    .get('/database/' + data.name, function(err, data) {
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
  };

  var http = require(connection.protocol.https ? 'https' : 'http');
  var err;

  function proxy(opts, callback) {
    var authToken;
    var request;

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
      opts.headers.Authorization = 'Basic ' +
        new Buffer(authToken).toString('base64');
    }

    // if we have a body, set the content length header
    if (opts.body) {
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      opts.headers['Content-Length'] = opts.body.length;
    }

    debug('making ' + opts.method + ' request to: ' +
      opts.path + ', auth user: ' + data.username);

    // call the actual request
    request = http.request(opts, function(response) {
      var body = '', chunks = [], statusOK;
      debug('received ' + response.statusCode +
        ' response from server, ok: ' + statusOK);

      // check the status
      statusOK = response && reStatusOK.test(response.statusCode);

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
          // create an orient server error
          err = new OrientServerError(body);
        }

        // if the status is not ok, then abort
        if (! statusOK) {
          err = err || new OrientError('invalid-http-response', {
            statusCode: response.statusCode,
            method: opts.method,
            url: opts.path
          });

          err.statusCode = response.statusCode;
          err.method = opts.method;
          err.url = opts.path;
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

      return proxy(_.extend({
        method: method,
        path: path
      }, extraOpts), callback);
    };
  });

  return proxy;
}