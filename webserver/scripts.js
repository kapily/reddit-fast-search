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
        top: "-40px",
    }, 120, function() {
    	$("#results_content").css("display", "block");
    	$("#results_content").fadeTo(200, 1);

    	// Create border
    	$("#search_content").css("background-color", "#21252E");
    	$("#search_content").css("padding-bottom", "40px");
    } );

    searchRepositioned = true;
}

function PopulateResults(result) {
	var title = result.raw;

	$("#results_content").fadeTo(200, 0, function() {
		$("#post_title").text(title);
		$("#results_content").fadeTo(200, 1);
		
		// Swith input to Placeholder
		$('#ac-input').attr("placeholder", title);
		$("#ac-input").val('');
		//$('#ac-input').blur();
	});
	
}

function FadeInSearch() {
	$( "#ac-input" ).css("color", "#000000");
}

function FadeOutSearch() {
	$( "#ac-input" ).css("color" , "#CECECE");
}
