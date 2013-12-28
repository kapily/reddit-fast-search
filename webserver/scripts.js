var searchRepositioned = false;

$( document ).ready(function() {

	$("#ac-input").focusin(function() {
  		FadeInSearch();
	});

	$("#ac-input").focusout(function() {
  		FadeOutSearch();
	});

});

function IsShowingResults() {
	return searchRepositioned;
}

function ShowResults(result) {
	PopulateResults(result);
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

function PopulateResults(result) {
	var title = result.raw;

	$("#results_content").fadeTo(200, 0, function() {
		$("#post_title").text(title); // replace with what was selected
		$("#results_content").fadeTo(200, 1);
		$('#ac-input').blur();
	});
	
}

function FadeInSearch() {
	$( "#ac-input" ).css("color", "#000000");
}

function FadeOutSearch() {
	$( "#ac-input" ).css("color" , "#CECECE");
}
