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

### orienteer(opts)

Create a new logical OrientDB connection.

### orienteer.rid(value)

Create a new Orienteer RID object that serializes to SQL as expected.

## orienteer http protocol driver

### command(connection, data, callback)

Issue an SQL command against the specified connection.

### describeClass(connection, data, callback)

Describe the specified class.

### describeDb

Issue a connect request against the specified database.

### dbCreate

Create a new database instance.

### dbDelete

Delete the specified db

### dbExist

Check to see if the requested db exists.
