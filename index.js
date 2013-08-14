/* jshint node: true */
'use strict';

var Connection = require('./lib/connection');
var OrientError = require('./lib/errors').OrientError;
var OrientRID = require('./lib/rid');
var _ = require('underscore');
var converters = require('./lib/converters');

/**
  # orienteer

  Orienteer is a library designed for working with
  [OrientDB](http://orientdb.org).  Currently it operates over the
  [REST API](https://github.com/orientechnologies/orientdb/wiki/OrientDB-REST)
  but support is also planned for the binary driver also.

  [
  ![unstable]
  (http://hughsk.github.io/stability-badges/dist/unstable.svg)
  ](http://github.com/hughsk/stability-badges)

  If you are primarily interested in working with the binary driver, however,
  I'd recommend taking a look at
  [node-orientdb](https://github.com/gabipetrovay/node-orientdb) instead.

  ## Installation

  ```
  npm install orienteer --save
  ```

  ## Getting Started

  To be completed.

  ```js
  var orienteer = require('orienteer');
  ```

  ## Reference
**/

/**
  ### orienteer(opts)

  Create a new logical OrientDB connection.
**/
var orienteer = module.exports = function(opts) {
  return new Connection(opts);
};

/**
  ### orienteer.objectTo(targetType, data)

  The objectTo function is a reimplementation of the hashToSQLSets function
  from the node-orientdb library.
*/
orienteer.objectTo = function(target, data) {
  var converter = converters['objectTo' + target];

  if (typeof converter != 'function') {
    throw new Error('Unable to convert object to ' + target);
  }

  return converter(data);
};

/**
  ### orienteer.rid(value)

  Create a new Orienteer RID object that serializes to SQL as expected.
**/
orienteer.rid = function(value) {
  return new OrientRID(value);
};

// export the error codes
_.extend(orienteer, require('./lib/errors'));
