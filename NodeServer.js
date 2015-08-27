/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

//require('node-offline-debug');

var net = require('net');
var util = require('util');

var thrift = require("thrift");
var Calculator = require("./gen-nodejs/Calculator");
var ttypes = require("./gen-nodejs/tutorial_types");
var SharedStruct = require("./gen-nodejs/shared_types").SharedStruct;

var data = {};
var clients = [];

//var web_server = thrift.createWebServer({ cors: ['*'], files: '.' });

  /*
var server = net.createServer(function (data) {
  console.log(util.inspect(data));
  
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 

  // Put this new client in the list
  clients.push(socket);

  // Send a nice welcome message and announce
  socket.write("Welcome " + socket.name + "\n");
  broadcast(socket.name + " joined the chat\n", socket);

  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    broadcast(socket.name + "> " + data, socket);
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.\n");
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }
});
*/

var server = thrift.createServer(Calculator, {
  ping: function(result) {
    console.log("ping()");
    result(null);
  },

  add: function(n1, n2, result) {
    console.log("add(", n1, ",", n2, ")");
    result(null, n1 + n2);
  },

  calculate: function(logid, work, result) {
    console.log("calculate(", logid, ",", work, ")");

    var val = 0;
    if (work.op == ttypes.Operation.ADD) {
      val = work.num1 + work.num2;
    } else if (work.op === ttypes.Operation.SUBTRACT) {
      val = work.num1 - work.num2;
    } else if (work.op === ttypes.Operation.MULTIPLY) {
      val = work.num1 * work.num2;
    } else if (work.op === ttypes.Operation.DIVIDE) {
      if (work.num2 === 0) {
        var x = new ttypes.InvalidOperation();
        x.whatOp = work.op;
        x.why = 'Cannot divide by 0';
        result(x);
        return;
      }
      val = work.num1 / work.num2;
    } else {
      var x = new ttypes.InvalidOperation();
      x.whatOp = work.op;
      x.why = 'Invalid operation';
      result(x);
      return;
    }

    var entry = new SharedStruct();
    entry.key = logid;
    entry.value = ""+val;
    data[logid] = entry;

    result(null, val);
  },

  getStruct: function(key, result) {
    console.log("getStruct(", key, ")");
    result(null, data[key]);
  },

  zip: function(result) {
    console.log("zip()");
    result(null);
  }

}, { transport: thrift.TBufferedTransport});

console.log("Port requested " + process.env.PORT);

try {
  server.listen(process.env.PORT || 9090);
}
catch (ex)
{
  console.log("Error! " + ex);
}
