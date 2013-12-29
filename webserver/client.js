
// Globals
var socket = null;
var currentQuery = null;
var resultsCallback = null;
var socket = null;
var resultStrings;
var titleToUrl = null;

$(document).ready(function() {

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
    console.log("Received search results: ");
    // also check data.query to see what the original query was for
    console.log(data.results);

    // make sure results are for the same query
    if (data.query != currentQuery) {
      return;
    }

    console.log("Setting new results.");
    //var anotherResultString = [];
    titleToUrl = {};
    resultStrings = _.map(data.results, function(elem){
      var title = elem[0];
      var url = elem[1];  // TODO: use url later
      titleToUrl[title] = url;
      // While I am using a _.each below, it always only has one iteration:
      // there is just one key and value.
      //anotherResultString.push(title);
      return title;

      // return elem.title;
    });
    //
    //console.log("anotherResultString: " + JSON.stringify(anotherResultString));
    if (!resultStrings) {
      resultStrings = [];
    }
    console.log("resultStrings: " + JSON.stringify(resultStrings));
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
      resultFilters    : 'subWordMatch',
      resultHighlighter: 'subWordMatch',
      activateFirstItem: true,
      on               : {
        select  :  function(e) {
          //console.log("e is:" + JSON.stringify(titleToUrl[e.result.raw]));
          ShowResults(e.result.raw, titleToUrl[e.result.raw]); // call to front-end scripts.js
        }
      },
      source           : function (query, callback) {
        console.log("Source is being called.");
        currentQuery = query;
        resultsCallback = callback;

        // TODO: implement cacheing using one of the following frameworks:
        // jStorage, lscache, or locache

        socket.emit('user_query_changed', { query: query });

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


