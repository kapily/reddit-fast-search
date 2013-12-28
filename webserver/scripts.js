var pressedEnter = false;

$( document ).ready(function() {

	$('#ac-input').bind('keyup', function(e) {
		if(e.keyCode==13){
			if(!IsShowingResults()) {
				ShowResults();
			}
		}
	});

});

function IsShowingResults() {
	return pressedEnter;
}

function ShowResults() {
	pressedEnter = true;
	PopulateResults();
	RepositionSearch();
}

function RepositionSearch() {

	$( "#logo" ).fadeTo(100 , 0, function() {
		$("#logo").css("visibility","hidden");
	});
	
	$("#search_content").animate({ 
        top: "-30px",
    }, 120, function() {
    	$("#results_content").css("display", "block");
    	$("#results_content").fadeTo(200, 1);
    } );
}

function PopulateResults() {
	alert(resultStrings[0]);
}
