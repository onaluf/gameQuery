var modalDialog = (function() {

    var availableDialog = [];
    
    var minMax = function (min, val , max){
        return Math.max(min, Math.min(val, max));
    }
    
    return {
        // Register a dialog with the given name
        register: function(dialogName, buttonId, okHandler) {
            if(availableDialog[dialogName] === undefined) {
                var dialog = $("#" + dialogName);
            
                // the button that triggers the display of the dialog
                var button = $("#" + buttonId);
            
                // register the event handler
                button.click(function(){ 
                    dialog.show();
                    $("#overlay").show();
                    return false;
                });
            
                //place the dialog at the right place
                var buttonOffset = button.offset();
                
                var leftPos = minMax(2, buttonOffset.left + (button.width() * 0.5) - (dialog.width() * 0.5), $(window).width() - dialog.width() - 2)
                var topPos  = buttonOffset.top + button.height() + 10 
                dialog.css({
                    left: leftPos,
                    top: topPos
                });
            
                availableDialog.push(dialog);
            
                dialog.delegate("button", "click", function(event){
                    //The event handler!
                    switch(this.name) {
                        case "ok":
                            okHandler.call(this);
                            break;
                        case "cancel":
                            // do nothing
                            break;
                    }
                    $("#overlay").hide();
                    dialog.hide();
                    return false;
                });
            
                return true;
            }
            return false;
        }
    }
})();

var animations = (function() {
	var SINGLE = 0;
	var MULTIPLE = 1;

	var fragment = $("<div class='animation'><a class='close' href='#'>x</a><span class='name'></span></div>");
	var counter  = 1;
    var type = SINGLE;
    
    return {
    	SINGLE: SINGLE,
    	MULTIPLE: MULTIPLE,
    	setType: function (newType) {
    		type = newType;
    	},
        // add a new Animation
        add: function(/* should be some arguments there*/){
        	switch (type){
        		case SINGLE:
        			$("#animations").append(fragment.clone().attr("id","animation_"+counter));
		        	$("#animation_"+counter+" .name").html("Animation "+counter); // this should be replaced with the real name
		        	counter++;
        			break;
        		case MULTIPLE:
        			$("#animations").append(fragment.clone().attr("id","animation_"+counter));
		        	$("#animation_"+counter+" .name").html("Animation "+counter); // this should be replaced with the real name
		        	counter++;
        			break;
        	}
        } 
    }
})();

$(function(){
	/* resize */
	var resize = function() {
		$("#tilemap").height(
			$(window).height()
			-$("#toolbarTile").height()
			-$("#toolbarAnimation").height()
			-$("#animations").height()-20);
	};
	resize();

	$("#animations").delegate(".animation", "click", function(event){ 
		$(this).toggleClass("selected");
	})
	
	$("#newAnimationButton").click(function(){
		if(!$(this).hasClass("disabled")){
			animations.add();
		}
	})

    
    // Help Overlay
    modalDialog.register("helpOverlay", "helpButton");
    
    // New Tilemap Overlay
    modalDialog.register("newOverlay", "newButton", function(){
    	var tileWidth  = parseInt($("#newForm_input_tile_width").val()); 
    	var tileHeight = parseInt($("#newForm_input_tile_height").val());
    	var mapWidth   = parseInt($("#newForm_input_map_width").val());
    	var mapHeight  = parseInt($("#newForm_input_map_height").val());
    	var animationType = $("#newForm_input_animations_type").val();
    	 
        var fragment = $("<div class='grid'/>").css({width: tileWidth, height: tileHeight});
		for(var i=0; i < mapHeight; i++) {
            for(var j=0; j < mapWidth; j++){
                $("#grid").append(fragment.clone().css({left: (tileWidth+1)*j, top: (tileHeight+1)*i}));
            }
        }
        switch(animationType){
        	case "simple animations" :
        		animations.setType(animations.SINGLE);
        		break;
        	case "multi-animation":
        		animations.setType(animations.MULTIPLE);
        		break;
        }
        $("#newAnimationButton").removeClass("disabled");
        $("#saveButton").removeClass("disabled");
        return false;
	});
	
	$(window).resize(resize);
	
});