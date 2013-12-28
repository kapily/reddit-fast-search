var searchRepositioned = false;

$( document ).ready(function() {

	$('#ac-input').bind('keyup', function(e) {
		if(e.keyCode==13){
			ShowResults();
		}
	});

});

function IsShowingResults() {
	return searchRepositioned;
}

function ShowResults() {
	PopulateResults();
	if(!IsShowingResults()) RepositionSearch();
}

function RepositionSearch() {
	// Fade out logo
	$( "#logo" ).fadeTo(100 , 0, function() {
		$("#logo").css("visibility","hidden");
	});
	
	// Move search to top
	$("#search_content").animate({ 
        top: "-30px",
    }, 120, function() {
    	$("#results_content").css("display", "block");
    	$("#results_content").fadeTo(200, 1);
    } );

    searchRepositioned = true;
}

function PopulateResults() {
	$("#results_content").fadeTo(200, 0, function() {
		$("#post_title").text(resultStrings[0]); // replace with what was selected
		$("#results_content").fadeTo(200, 1);
	});
	
}
