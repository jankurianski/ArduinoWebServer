var http = require('http');
var url = require('url');
var fs = requre('fs');
var port = process.env.PORT || 1337;

// client ID -> true
var knownClients = {};

// client ID -> command character
var nextCmds = {};

// client ID -> response object
var wantCmds = {};

// Web browser has sent us a command to forward to
// the Arduino client.  Try to process it immediately
// or remember it for when the client next connects.
function setNextCmd(req_url, res) {
  var id = req_url.query.id;
  res.writeHead(200, {'Content-Type': 'text/plain'});
  if (knownClients[id]) {
    nextCmds[id] = req_url.query.cmd;
    var processed = processCmds(id);
    res.end('Command ' + (processed ? 'processed' : 'queued') + '.\n');
  } else {
    res.end('Command ignored (Arduino not listening).\n');
  }
}

// If Arduino client asking for command, add the
// response object to be returned later when web
// client has issued command.
function wantCmd(req_url, res) {
  var id = req_url.query.id;
  knownClients[id] = true;
  wantCmd[id] = res;
  processCmds(id);
}

// Check if there is a command to send to the client,
// and the client is waiting for a command.
function processCmds(id) {
  var cmd = nextCmds[id];
  if (cmd) {
    var res = wantCmds[id];
    if (res) {
      delete wantCmds[id];
      delete nextCmds[id];
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(cmd);
    }
  }
}

http.createServer(function (req, res) {
  var req_url = url.parse(req.url, true);

  if (req_url.pathname == '/wantCmd')
    wantCmd(req_url, res);
  else if (req_url.pathname == '/setNextCmd')
    setNextCmd(req_url, res);
  else if (req_url.pathname == '/') {
    fs.readFile('./index.html', function(err, data) {
      res.end(data);
    });
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not found\n');
  }
}).listen(port);
