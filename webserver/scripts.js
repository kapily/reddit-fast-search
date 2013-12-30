var searchPosition = "center";
var sampleText;
var typingIntervalId;
var suggestions;
var searchBox;

$( document ).ready(function() {
	searchBox = $("#ac-input");
    PrepareSuggestions();
	
	// sampleText updater:
	$(function(){
      $("#sample_text").typed({
        strings: suggestions,
        typeSpeed: 5,
        backDelay: 1000,
        callback: function(){ 
        	StopUpdatingPlaceholder();
        }
      });
  	});

	// Set sampleText as placeholder:
  	typingIntervalId = setInterval(function () {
		UpdatePlaceholder();
    }, 10);

  	// User input listener
	searchBox.bind('input', function() {
    	RepositionSearch();
    	StopUpdatingPlaceholder();
	});
});

function shuffle(o){ // Shuffle function courtesy Google
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function UpdatePlaceholder() {
	sampleText = $("#sample_text").text();
	searchBox.attr("placeholder", sampleText);
}

function StopUpdatingPlaceholder() {
	clearInterval(typingIntervalId);
	searchBox.attr("placeholder", "");
}

function OpenResult(resultTitle, resultURL) {
	searchBox.attr("placeholder", "");
	setTimeout(function (){
             searchBox.val('');
             RepositionSearch();
    }, 20);
    window.open(resultURL);
}

function RepositionSearch() {
	if(searchPosition == "center" && !SearchIsEmpty()) {
		searchPosition = "top";
		$("#tagline").fadeTo(200, 0);

		// Bump search up
		$("#search_content").animate({ 
	        top: "-=15%",
	    }, 120);

	    $("#logo_center").animate({ 
	        marginBottom: "-15px",
	    }, 120);
	}

	else if(searchPosition == "top" && SearchIsEmpty()) {
		searchPosition = "center";

		// Bump search down
		$("#search_content").animate({ 
	        top: "30%",
	    }, 120);
	}
}

function SearchIsEmpty() {
	return (document.getElementById('ac-input').value.length < 1);
}

function PrepareSuggestions() {
	suggestions = [ "Obama", 
        			"DIY",
        			"Best stories",
        			"Why do cats like boxes?",
        			"Apple CEO",
        			"Crafts",
        			"Brewing Beer",
        			"Astronomy",
        			"Super Collider",
        			"Green Tea",
        			"San Francisco"
        			];
    shuffle(suggestions);
    suggestions.push("");
}
