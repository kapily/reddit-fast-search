
// Globals
var socket = null;
var currentQuery = null;
var resultsCallback = null;
var socket = null;
var resultStrings;
var titleToUrl = null;

// We use locache to store cached results of complete words

function result_strings_from_result_and_set_titleToUrl(results) {
  titleToUrl = {};
  resultStrings = _.map(results, function(elem){
    var title = elem[0];
    var url = elem[1];  // TODO: use url later
    titleToUrl[title] = url;
    // While I am using a _.each below, it always only has one iteration:
    // there is just one key and value.
    //anotherResultString.push(title);
    return title;

    // return elem.title;
  });
  return resultStrings;
}

$(document).ready(function() {
  locache.flush();

    // var colors = ["red", "blue", "green", "yellow", "brown", "black"];

    /*
  $('#queryInput').typeahead({
  name: 'accounts',
  local: ['timtrueman', 'JakeHarding', 'vskarich']
    });
    */

  // Initialize typeahead
  // $('.typeahead').typeahead();

  var socket = io.connect('http://localhost:8080');
  socket.on('new_search_results', function (data) {
    console.log("Received search results! ");
    // also check data.query to see what the original query was for
    // console.log(data.results);

    // make sure results are for the same query
    if (data.query != currentQuery) {
      return;
    }

    if (data.complete_results) {
      // console.log("Complete results: " + JSON.stringify(data));
      // Set the cache
      // Split up query into complete and incomplete words
      /* Begin code that must be moved to a function */
      var completed_words = data.query.split(" ");
      var incomplete_word = null;
      var last_character = data.query.slice(-1);
      // var completed_words = console.log();
      if (last_character != " ") {
        incomplete_word = completed_words.pop();
      } else {
        // for some reason, a trailing space is being left in
        completed_words.pop();
      }
      var completed_words_str = completed_words.join(' ');
      /* End code that must be moved to a function */

      console.log("Putting: " + completed_words_str + " in cache.");
      locache.set(completed_words_str, data.results);
    }


    // console.log("Setting new results.");
    //var anotherResultString = [];
    resultStrings = result_strings_from_result_and_set_titleToUrl(data.results);

    //
    //console.log("anotherResultString: " + JSON.stringify(anotherResultString));
    if (!resultStrings) {
      resultStrings = [];
    }
    // console.log("resultStrings: " + JSON.stringify(resultStrings));
    resultsCallback(resultStrings);
    // check currentQuery
    // socket.emit('user_query_changed', { my: 'data' });
  });

  /*
  $('#queryInput').bind('input', function() {
    // $(this).val() // get the current value of the input field.
    var newQueryValue = $(this).val();
    console.log('Value: ' + newQueryValue);
    socket.emit('user_query_changed', { my: newQueryValue });
  });
  */

  // Put Yahoo load inside Jquery??
  YUI().use('autocomplete', 'autocomplete-filters', 'autocomplete-highlighters', function (Y) {
    Y.one('#ac-input').plug(Y.Plugin.AutoComplete, {
      maxResults: 7,
      resultFilters    : 'subWordMatch',
      resultHighlighter: 'subWordMatch',
      activateFirstItem: true,
      on               : {
        select  :  function(e) {
          //console.log("e is:" + JSON.stringify(titleToUrl[e.result.raw]));
          //ShowResults(e.result.raw, titleToUrl[e.result.raw]); // call to front-end scripts.js
          OpenResult(e.result.raw, titleToUrl[e.result.raw]);

        }
      },
      source           : function (query, callback) {
        query = query.toLowerCase();
        // console.log("Source is being called.");



        // Try to get from cache locache.get("key")

        // Split up query into complete and incomplete words
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
        var so_far = [];
        var possible_completed_strings = [];
        for (var j = 0; j < completed_words.length; j++) {
          so_far.push(completed_words[j]);
          possible_completed_strings.push(so_far.join(' '));
        }
        // var completed_words_str = completed_words.join(' ');
        console.log("possible things in cache: " + possible_completed_strings);
        var cached_val = null;
        for (var j = 0; j < possible_completed_strings.length; j++) {
          // lookup possible_completed_strings[j] in cache
          cached_val = locache.get(possible_completed_strings[j]);
          if (cached_val) break;
        }


        // check the cache for the results
        // TODO: need to check to see if each expanding phrase part is in the cache
        // Exmaple: "the green car was in the garage", check:
        // "the", "the green", "the green car", "the green car was", ...., "the green car was in the garage"


        // var cached_val = locache.get(completed_words_str);


        if (cached_val) {
          console.log("Object in cache!");
          // console.log("cached_val: " + JSON.stringify(cached_val));
          resultStrings = result_strings_from_result_and_set_titleToUrl(cached_val);
          // console.log("resultStrings: " + JSON.stringify(resultStrings));

          //
          //console.log("anotherResultString: " + JSON.stringify(anotherResultString));
          if (!resultStrings) {
            resultStrings = [];
          }
          // console.log("resultStrings: " + JSON.stringify(resultStrings));
          callback(resultStrings);
          return;

        } else {
          // Make the actual query

          currentQuery = query;
          resultsCallback = callback;

          // TODO: implement cacheing using one of the following frameworks:
          // jStorage, lscache, or locache

          socket.emit('user_query_changed', { query: query });
        }

        /*
        // Wait a little while without blocking execution, then provide results.
        // This simulates a non-blocking operation such as a JSONP or XHR request.
        setTimeout(function () {
          callback(['foo', 'bar', 'baz']);
        }, 100);
        // Note that the source function doesn't return a value.
        */
      }
    });
  });
});

/*
// Create a new YUI instance and populate it with the required modules.
YUI().use('autocomplete', 'autocomplete-highlighters', function (Y) {
    // AutoComplete is available and ready for use. Add implementation
    // code here.
    Y.one('#queryInput').plug(Y.Plugin.AutoComplete, {
        source: ['foo', 'bar', 'baz']
    });
});
*/


