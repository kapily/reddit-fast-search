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
// var Triejs = require('triejs');
var _ = require('lodash');



// Hack to include trie for now
// http://stackoverflow.com/questions/5797852/in-node-js-how-do-i-include-functions-from-my-other-files

var fs = require('fs');
// trie-knuth.js:
// https://raw.github.com/mikedeboer/trie/master/trie.js
//eval(fs.readFileSync('trie-knuth.js')+'');
// http://odhyan.com/blog/2010/11/trie-implementation-in-javascript/
eval(fs.readFileSync('trie.js')+'');
// file is included here:



var RESULT_LIMIT_SIZE = 7;


// var dbTrie = new Triejs();  // trie of all the words in the corpus (possible optimization: make this client-side)
var dbTrie = new Trie();
var dbIdToSubmissionInfo = {};  // {'id' : ['Title of Reddit Submission', url], 'id2' : ['...'] }
var dbWordToIdObj = {};  // {'word': {'id1' : 42, 'id2' : 93}, 'word2' : {...} }

// Load the index into dbWordToIdObj
var db = new sqlite3.Database('reddit_index.sqlite');
db.serialize(function() {
  db.each("SELECT * FROM reddit_index;", function(err, row) {
    var word = row.word;
    // console.log(row.word + ". ");
    // TODO: add this to redis
    // dbTrie.add(word);
    dbTrie.insert(word);

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

function ExtendSortedArrays(a1, a2) {
  if (a1 == null) return a2;
  if (a2 == null) return a1;

  var result = [];
  var a1_pointer = 0;
  var a2_pointer = 0;
  // Loop until both of the array pointer falls off the end
  while (a1_pointer < a1.length || a2_pointer < a2.length) {

    /* Begin handling case where one of those pointers is off the edge */
    if (a1_pointer == a1.length) {
      result.push(a2[a2_pointer]);
      a2_pointer++;
      continue;
    }
    if (a2_pointer == a2.length) {
      result.push(a1[a1_pointer]);
      a1_pointer++;
      continue;
    }
    /* End handling case where one of those pointers is off the edge */

    var a1_obj = a1[a1_pointer];
    var a2_obj = a2[a2_pointer];
    //console.error("a1_pointer: " + a1_pointer + "| obj: " | a1_obj);
    //console.error("a2_pointer: " + a2_pointer + "| obj: " | a2_obj);
    var a1_id = a1_obj[0];
    var a2_id = a2_obj[0];
    var a1_score = a1_obj[1];
    var a2_score = a2_obj[1];

    /* End copy over the remaining entries when one array is done */

    // Scores are stored in decrementing order. If score of a1 > a2,
    // then it means we need to advance a1 to find lower scores
    if (a1_score > a2_score) {
      result.push(a1_obj);
      a1_pointer++;
      continue;
    }
    if (a1_score < a2_score) {
      result.push(a2_obj);
      a2_pointer++;
      continue;
    }

    // If execution comes here it means that a1_score == a2_score
    // Now, check to see that the submission is the same:
    //console.log("a1_score: " + a1_score);
    //console.log("a2_score: " + a2_score);
    if (a1_score != a2_score) {
      throw "a1_score != a2_score";
    }
    if (a1_id > a2_id) {
      result.push(a1_obj);
      a1_pointer++;
    } else if (a1_id < a2_id) {
      result.push(a2_obj);
      a2_pointer++;
    } else if (a1_id == a2_id) {
      // both contain the same object, so we keep only one
      result.push(a1_obj);
      a1_pointer++;
      a2_pointer++;
    }
    continue;

  }
  return result;

}

// Input submissions sorted by their score.
// Limit = number of entries before we return a result. (termiate quickly)
// Arrays look like: [["32442", 4], ...]
// Arrays are sorted two ways: first by the score, and then by the id(largest first)
// Sorting by id has the side-effect of sorting by most recent score
// Max runtime O(len(a1) + len(a2))
function IntersectSortedArrays(a1, a2, limit) {
  if (a1 == null) return a2;
  if (a2 == null) return a1;

  //console.log("Trying to intersect (a1): " + JSON.stringify(a1));
  //console.log("Trying to intersect (a2): " + JSON.stringify(a2));

  // TODO: need to actually complete this logic
  var result = [];
  var a1_pointer = 0;
  var a2_pointer = 0;
  // Loop until one of the array pointer falls off the end
  var entries_stored = 0;
  while (a1_pointer < a1.length && a2_pointer < a2.length) {

    // We only want to intersect until we hit the imit
    if (entries_stored >= limit) {
      return result;
    }

    var a1_obj = a1[a1_pointer];
    var a2_obj = a2[a2_pointer];
    var a1_id = a1_obj[0];
    var a2_id = a2_obj[0];
    var a1_score = a1_obj[1];
    var a2_score = a2_obj[1];

    // console.log("Checking a1: " + JSON.stringify(a1_obj) + " vs a2: " + JSON.stringify(a2_obj));

    // Scores are stored in decrementing order. If score of a1 > a2,
    // then it means we need to advance a1 to find lower scores
    if (a1_score > a2_score) {
      a1_pointer++;
      continue;
    }
    if (a1_score < a2_score) {
      a2_pointer++;
      continue;
    }

    // If execution comes here it means that a1_score == a2_score
    // Now, check to see that the submission is the same:
    if (a1_id == a2_id) {
      result.push(a1_obj);
      entries_stored++;
      a1_pointer++;
      a2_pointer++;
      continue;
    }

    // If the id's are not equal to one another
    // This code is pretty identical to the score checking code because
    // both have values stored in descending order
    if (a1_id > a2_id) {
      a1_pointer++;
      continue;
    }
    if (a2_id > a1_id) {
      a2_pointer++;
      continue;
    }

    // if
    // Neeed to advance one of the pointers
  }
  return result;

  // return null;
  /*
  var smallest_object = (_.size(o1) < _.size(o2)) ? o1 : o2;
  var largest_object = (smallest_object == o2) ? o1: o2;

  var output = {};
  _.forEach(smallest_object, function(val, key) { if (key in largest_object) {output[key] = val;} });
  return output;
  */
}


io.sockets.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });

  socket.on('user_query_changed', function (data) {
    // Handle the new user query
    // console.log(data);
    var query = data.query;

    console.log("--------------------------------------------------------------------");
    // console.log("Received query: " + query);

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
        completed_word_ids = IntersectSortedArrays(completed_word_ids, dbWordToIdObj[completed_words[i]], Infinity);
        //console.log("completed_words.length: " + completed_words.length);
        //console.log("completed_word_ids: " + JSON.stringify(completed_word_ids));
      }
      // console.log("Completed word is not empty.");
    }



    if (incomplete_word) {
      //console.log("Before incomplete word, completed_word_ids = " + JSON.stringify(completed_word_ids));
      // Modify the results
      // Get a list of the possible words it could be
      // var possible_words = dbTrie.find(incomplete_word);
      var possible_words = dbTrie.autoComplete(incomplete_word);
      // TODO: LOTS of room for improvement. Do NOT need to traverse the entire list of possible_words



      // console.log("possible words: " + JSON.stringify(possible_words));
      var possible_suggestions = [];
      _.each(possible_words, function(possible_word){
        // We insert into sorted order each time
        possible_suggestions = ExtendSortedArrays(dbWordToIdObj[possible_word], possible_suggestions);
        // _.extend(possible_suggestions, dbWordToIdObj[possible_word])
      });
      // console.log("possible suggestions: " + JSON.stringify(possible_suggestions));
      // console.log("completed_word_ids: " + JSON.stringify(completed_word_ids));

      completed_word_ids = IntersectSortedArrays(completed_word_ids, possible_suggestions, Infinity);
      // console.log("After Intersection = " + JSON.stringify(completed_word_ids));
    }

    /*
    var completed_word_ids_arr = _.map(completed_word_ids, function(elem) {
      var key = elem[0];
      var val = elem[1]
      return [key, val];
    });
    */

    /*
    var completed_word_ids_arr_sorted = _.sortBy(completed_word_ids, function(obj){
      var score = obj[1];
      return score * -1;  // multiply by -1 to get reverse sort
    });
    console.log('completed_word_ids_arr_sorted: ' + JSON.stringify(completed_word_ids_arr_sorted));
    */

    // TODO: sort these the array by the value in the objects
    var results = _.map(completed_word_ids, function(obj) {
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
    console.log('Results (limited to 7) : ' + JSON.stringify(results));
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


