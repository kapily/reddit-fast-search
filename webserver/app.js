/**
 * Created by kyedidi on 12/24/13.
 */
// Includes
var io = require('socket.io').listen(8080);
var sqlite3 = require('sqlite3').verbose();
var Triejs = require('triejs');
var redis = require("redis");

var trie = new Triejs();


var client = redis.createClient();
client.on("error", function (err) {
  console.log("Error " + err);
});

// console.log(trie.find("Al"));



var db = new sqlite3.Database('reddit_index.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM reddit_index;", function(err, row) {
    var word = row.word;
    // console.log(row.word + ". ");
    // TODO: add this to redis
    trie.add(word);

    // submission_ids
    var submission_ids = JSON.parse(row.submission_ids);
    // console.log("submission ids: " + submission_ids + "size: " + submission_ids.length);
    for (var i = 0; i < submission_ids.length; i++) {
      var tup = submission_ids[i];
      var submission_id = tup[0];
      var score = tup[1];

      client.zadd(word, score, submission_id);

      // console.log("submission id: " + submission + " has score: " + score);
    }
    //
    // client.sadd("bigset", "a member");
  });
});
db.close();

function get_submission_id_str(id) {

}

db = new sqlite3.Database('reddit_submissions.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM submissions;", function(err, row) {
    var id = row.id;
    var title = row.title;


    // console.log("Row id:" + id + " has title: " + title);

    client.set(id, title);
  });
  console.log("Finished processing submissions for titles.");
});
db.close();

function get_type(thing){
    if(thing===null)return "[object Null]"; // special case
    return Object.prototype.toString.call(thing);
}

io.sockets.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });

  socket.on('user_query_changed', function (data) {
    // Handle the new user query
    console.log(data);
    var query = data.query;
    // TODO: only send a few results back
    var trieResults = trie.find(query);
    // Search all keys in trieResults and sort by score

    if (trieResults) {
      // look-up first word in client
      // TODO: interect the sets first

      // Store the set intersection in a special place
      // client.zinterstore();

      var word = trieResults[0];
      var args1 = [ word, '+inf', '-inf' ];


      client.zrevrangebyscore(args1, function (err, response) {



        if (err) throw err;
        // console.log('example1', response);

        if (response) {

          // limit response to the first 5 elements
          var top_5 = response.slice(0, 5)

         // console.log("Before parsing: " + response);
          // console.log("type: " + get_type(response));
          // var submission_ids = JSON.parse(response);
          // Lookup the top 5 id's
          // Need to read all of the submission id titles
          // var keys = [ "k", 'k2', 'k3' ];
          // log.console("Submission IDs: " + response);
          client.mget(top_5, function(err, response2){
            if (err) throw err;
            console.log("response2: " + response2);
            // actually send out the response now:
            socket.emit('new_search_results', { query: query, results: response2});
          });


        } else {
          socket.emit('new_search_results', { query: query, results: null});
        }


        // write your code here
      });

    } else {
      socket.emit('new_search_results', { query: query, results: null});
    }

  });

  socket.on('disconnect', function () { });
});

// TODO: load the other stuff


