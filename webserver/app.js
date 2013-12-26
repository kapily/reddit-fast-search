/**
 * Created by kyedidi on 12/24/13.
 */
// Includes
var io = require('socket.io').listen(8080);
var sqlite3 = require('sqlite3').verbose();
var Triejs = require('triejs');

var trie = new Triejs();

// console.log(trie.find("Al"));



var db = new sqlite3.Database('reddit_index.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM reddit_index;", function(err, row) {
    // console.log(row.word + ". ");
    // TODO: add this to redis
    trie.add(row.word);
  });
});
db.close();


io.sockets.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });

  socket.on('user_query_changed', function (data) {
    // Handle the new user query
    console.log(data);
    var query = data.query;
    // TODO: only send a few results back
    var trieResults = trie.find(query;
    socket.emit('new_search_results', { query: query, results: trieResults});
  });

  socket.on('disconnect', function () { });
});

// TODO: load the other stuff


