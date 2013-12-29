var searchRepositioned = false;

$( document ).ready(function() {

	$('#ac-input').bind('input', function() { 
    	if(!searchRepositioned) {
    		RepositionSearch();
    	}
	});

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

function OpenResult(resultTitle, resultURL) {
	$('#ac-input').attr("placeholder", resultTitle);
	setTimeout(function (){
             $("#ac-input").val('');
    }, 20);
    window.open(resultURL);
}


function RepositionSearch() {
	$("#tagline").fadeTo(200, 0);

	// Bump search up
	$("#search_content").animate({ 
        top: "-=15%",
    }, 120);

    $("#logo_center").animate({ 
        marginBottom: "-15px",
    }, 120);

    searchRepositioned = true;
}

function PopulateResults(title, url) {

	$("#title_content").fadeTo(200, 0, function() {
		$("#link").attr("href", url)
		$("#post_title").text(title);
		$("#title_content").fadeTo(200, 1);
		
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

/*
function ShowResults(resultTitle, resultURL) {
	PopulateResults(resultTitle, resultURL);
	if(!IsShowingResults()) RepositionSearch();
}

function RepositionSearch() {
	// Fade out logo
	$( "#logo_center" ).fadeTo(100 , 0, function() {
		$("#logo_center").css("visibility","hidden");
	});
	
	// Move search to top
	$("#search_content").animate({ 
        top: "-40px",
    }, 120, function() {
    	$("#title_content").css("display", "block");
    	$("#title_content").fadeTo(200, 1);

    	// Create border
    	$("#search_content").css("background-color", "#21252E");
    	$("#search_content").css("padding-bottom", "40px");
    } );

    searchRepositioned = true;
}
*/
