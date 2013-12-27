/**
 * Created by kyedidi on 12/24/13.
 */
// Possible optimizations:
// - make the trie client-side
// - use an in-memory sqlite table

// Includes
var io = require('socket.io').listen(8080);
io.set('log level', 1); // reduce logging
var sqlite3 = require('sqlite3').verbose();
var Triejs = require('triejs');
var _ = require('lodash');


var dbTrie = new Triejs();  // trie of all the words in the corpus (possible optimization: make this client-side)
var dbIdToSubmissionInfo = {};  // {'id' : ['Title of Reddit Submission', url], 'id2' : ['...'] }
var dbWordToIdObj = {};  // {'word': {'id1' : 42, 'id2' : 93}, 'word2' : {...} }

// Load the index into dbWordToIdObj
var db = new sqlite3.Database('reddit_index.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM reddit_index;", function(err, row) {
    var word = row.word;
    // console.log(row.word + ". ");
    // TODO: add this to redis
    dbTrie.add(word);

    // submission_ids
    var submissionIdObj = JSON.parse(row.submission_ids);
    dbWordToIdObj[row.word] = submissionIdObj;
  });
});
db.close();

db = new sqlite3.Database('reddit_submissions.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM submissions;", function(err, row) {
    var id = row.id;
    var title = row.title;
    var url = row.permalink;

    dbIdToSubmissionInfo[id] = [title, url];
    // console.log("Row id:" + id + " has title: " + title);
  });
  console.log("Finished processing submissions for titles.");
});
db.close();

function get_type(thing){
  if(thing===null)return "[object Null]"; // special case
  return Object.prototype.toString.call(thing);
}

// If one of the objects is null, returns the other object
function IntersectTwoObjects(o1, o2) {
  if (o1 == null) return o2;
  if (o2 == null) return o1;

  var smallest_object = (_.size(o1) < _.size(o2)) ? o1 : o2;
  var largest_object = (smallest_object == o2) ? o1: o2;

  var output = {};
  _.forEach(smallest_object, function(val, key) { if (key in largest_object) {output[key] = val;} });
  return output;
}

io.sockets.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });

  socket.on('user_query_changed', function (data) {
    // Handle the new user query
    // console.log(data);
    var query = data.query;

    console.log("--------------------------------------------------------------------");
    console.log("Received query: " + query);

    // split the query into completed words and incomplete word
    if (!query || query == "") {
      return;
    }
    var completed_words = query.split(" ");
    var incomplete_word = null;
    var last_character = query.slice(-1);
    // var completed_words = console.log();
    if (last_character != " ") {
      incomplete_word = completed_words.pop();
    } else {
      // for some reason, a trailing space is being left in
      completed_words.pop();
    }

    console.log("Completed word: " + completed_words);
    console.log("Incomplete word: " + incomplete_word);

    // TODO: Get all of the
    var completed_word_ids = null;
    // console.log("completed_words: " + JSON.stringify(completed_words));
    if (completed_words.length > 0) {
      for (var i = 0; i < completed_words.length; i++) {
        // TODO: need to intersect, NOT extend
        completed_word_ids = IntersectTwoObjects(completed_word_ids, dbWordToIdObj[completed_words[i]]);
        //console.log("completed_words.length: " + completed_words.length);
        //console.log("completed_word_ids: " + JSON.stringify(completed_word_ids));
      }
      // console.log("Completed word is not empty.");
    }



    if (incomplete_word) {
      console.log("Before incomplete word, completed_word_ids = " + JSON.stringify(completed_word_ids));
      // Modify the results
      // Get a list of the possible words it could be
      var possible_words = dbTrie.find(incomplete_word);
      console.log("possible words: " + JSON.stringify(possible_words));
      var possible_suggestions = {};
      _.each(possible_words, function(possible_word){_.extend(possible_suggestions, dbWordToIdObj[possible_word])});
      // console.log("possible suggestions: " + JSON.stringify(possible_suggestions));
      completed_word_ids = IntersectTwoObjects(completed_word_ids, possible_suggestions);
      console.log("After incomplete word, completed_word_ids = " + JSON.stringify(completed_word_ids));
    }

    var completed_word_ids_arr = _.map(completed_word_ids, function(val, key) {
      return [key, val];
    });

    var completed_word_ids_arr_sorted = _.sortBy(completed_word_ids_arr, function(obj){
      var score = obj[1];
      return score * -1;  // multiply by -1 to get reverse sort
    });
    console.log('completed_word_ids_arr_sorted: ' + JSON.stringify(completed_word_ids_arr_sorted));

    // TODO: sort these the array by the value in the objects
    var results = _.map(completed_word_ids_arr_sorted, function(obj) {
      var key = obj[0];
      var val = obj[1];
      // lookup the key and link
      var obj = {};
      obj[key] = val;
      // Temporary, for testing. Need to just return output after debug
      var output = dbIdToSubmissionInfo[key];
      return [output[0] + " [SCORE: " + parseInt(val) + "]", output[1]];
    });
    // console.log('Results: ' + JSON.stringify(results));
    results = results.slice(0, Math.min(7, results.length));  // max 7 results

    // TODO: need to sort the results based on the score of the objects
    // TODO: need to limit results to 5 or so


    // var results_sorted_with_score = _.map(results_sorted, function(elem){return ;});
    // console.log("results_sorted: " + JSON.stringify(results_sorted));
    // If there is an incomplete_word:

    // return; // for now will ignore


    console.log("--------------------------------------------------------------------");
    socket.emit('new_search_results', { query: query, results: results});

    /*
    // TODO: only send a few results back
    var trieResults = dbTrie.find(query);
    // Search all keys in trieResults and sort by score

    if (trieResults) {
      // look-up first word in client
      // TODO: interect the sets first

      // Store the set intersection in a special place
      // client.zinterstore();

      var word = trieResults[0];
      var args1 = [ word, '+inf', '-inf' ];


      // socket.emit('new_search_results', { query: query, results: null});

     //  socket.emit('new_search_results', { query: query, results: null});
    }
    */

  });

  socket.on('disconnect', function () { });
});

// TODO: load the other stuff


