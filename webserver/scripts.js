var startedTyping = false;

$( document ).ready(function() {
    
    $('#ac-input').bind('input', function() { 
    	if(!startedTyping) {
    		startedTyping = true;
    	}
	});

});
