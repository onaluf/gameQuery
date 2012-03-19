var ANIMATION_NS = "animation";
var TILE_NS = "tile";
var GRID_NS = "grid";

var tilemap = {
	width: undefined,
	height: undefined,
	tileWidth: undefined,
	tileHeight: undefined,
	animations: [],
	tiles: [] 
}

var minMax = function (min, val , max){
    return Math.max(min, Math.min(val, max));
}

var generateBackground = function(animation) {
	var background = "url('"+animation.url+"') "+animation.offsetx+" "+animation.offsety;
	return background
}

var modalDialog = (function() {

    var availableDialog = [];
    
    return {
        // Register a dialog with the given name
        register: function(dialogName, buttonId, okHandler) {
            if(availableDialog[dialogName] === undefined) {
                var dialog = $("#" + dialogName);
            
                // the button that triggers the display of the dialog
                var button = $("#" + buttonId);
            
                // register the event handler
                button.click(function(){
                	if(!button.hasClass("disabled")){
                		
	                    dialog.show();
	                    $("#overlay").show();
	                    
	                    //place the dialog at the right place
		                var buttonOffset = button.offset();
		                
		                var leftPos = minMax(2, buttonOffset.left + (button.width() * 0.5) - (dialog.width() * 0.5), $(window).width() - dialog.width() - 2);
		                var topPos  = minMax(2, buttonOffset.top + button.height() + 10,  $(window).height() - dialog.height() - 2);
		                dialog.css({
		                    left: leftPos,
		                    top: topPos
		                });
		                
		                
                	}
                    return false;
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
        	var animation = {
				name:         $("#addAnimationForm_input_name").val(),
	        	url:          $("#addAnimationForm_input_url").val(),
	        	nbframes:     parseInt($("#addAnimationForm_input_nbframes").val()),
	        	rate:         parseInt($("#addAnimationForm_input_rate").val()),
	        	offsetx:      parseInt($("#addAnimationForm_input_offsetx").val()),
	        	offsety:      parseInt($("#addAnimationForm_input_offsety").val()),
	        	delta:        parseInt($("#addAnimationForm_input_delta").val()),
	        	nbanimations: parseInt($("#addAnimationForm_input_nbanimations").val()),
	        	distance:     parseInt($("#addAnimationForm_input_distance").val()),
	        	type:         $("#addAnimationForm_input_type").val(),
	        	multiple:     false
        	};

        	
        	switch (type){
        		case SINGLE:
        			fragment.css({left: 8+120*(counter-1), top: 5});
        			
        			$("#animations").append(fragment.clone().attr("id","animation_"+counter));
        			var doma = $("#animation_"+counter);
		        	$("#animation_"+counter+" .name").html(animation.name);
		        	doma.data(ANIMATION_NS, animation);
		        	doma.append("<div class='animationthumb' style=\"height: "+minMax(0,tilemap.tileHeight,70)+"px; width: "+minMax(0,tilemap.tileWidth,70)+"px; background: "+generateBackground(animation)+";\"></div>");
		        	
		        	tilemap.animations.push(animation);
		        	
		        	counter++;
        			break;
        		case MULTIPLE:
        			tilemap.multiple = true;
        			tilemap.animations.push(animation);
        			for (var i  = 0; i < animation.nbanimations; i++){
        				fragment.css({left: 8+120*(counter-1), top: 5});
        				
        				var currentAnimation = jQuery.extend({}, animation);
        				currentAnimation.name = animation.name  + " " + counter;
        				if(animation.type === 'ANIMATION_VERTICAL'){
        					currentAnimation.offsetx = animation.offsetx + (animation.distance * i);
        				} else if(animation.type === 'ANIMATION_HORIZONTAL'){
        					currentAnimation.offsety = animation.offsety + (animation.distance * i);
        				}
        				
	        			$("#animations").append(fragment.clone().attr("id","animation_"+counter));
			        	$("#animation_"+counter+" .name").html(currentAnimation.name);
			        	var doma = $("#animation_"+counter);
			        	doma.data(ANIMATION_NS, currentAnimation);
			        	doma.append("<div class='animationthumb' style=\"height: "+minMax(0,tilemap.tileHeight,70)+"px; width: "+minMax(0,tilemap.tileWidth,70)+"px; background: "+generateBackground(currentAnimation)+";\"></div>");
			        	
			        	tilemap.animations.push(currentAnimation);
			        	
 			        	counter++;
        			}
        			
        			$("#addAnimationButton").addClass("disabled");

        			break;
        	}
        } 
    }
})();

$(function(){
	/* resize */
	var resize = function() {
		//resize elements
		$("#tilemap").height(
			$(window).height()
			-$("#toolbarTile").height()
			-$("#toolbarAnimation").height()
			-$("#animations").height()-20);
	};
	resize();

	$("#animations").delegate(".animation", "click", function(event){ 
		if($(this)[0] === $(".animation.selected")[0]) {
			$(".animation.selected").removeClass("selected");
		} else {
			$(".animation.selected").removeClass("selected");
			$(this).toggleClass("selected");
		}
	});
	
	// Handle the click on a tile
	$("#grid").delegate(".grid", "click", function(event){ 
		$(".grid.selected").removeClass("selected");
		$(this).toggleClass("selected");

		var animation = $(".animation.selected").data(ANIMATION_NS);
		if(animation) {
			var coordinate = $(this).data(GRID_NS);
			var tile = $("#tile_"+coordinate.x+"_"+coordinate.y);
			if(tile.size() > 0){
				tile.css("background", generateBackground(animation));
				tile.data(TILE_NS, animation.name);
			} else {
				tile = $("<div class='tile' id='tile_"+coordinate.x+"_"+coordinate.y+"'/>").css({width: tilemap.tileWidth, height: tilemap.tileHeight,left: (tilemap.tileWidth)*coordinate.x, top: (tilemap.tileHeight)*coordinate.y, background: generateBackground(animation)}).data(TILE_NS, animation.name);
				$("#tiles").append(tile);
			}
		}
	})
	
	// Handle the backspace key
	$(window).keyup(function(event){ 
		if(event.keyCode == '8') {
			var coordinate = $(".grid.selected").data(GRID_NS);
			if(coordinate !== undefined){
				var tile = $("#tile_"+coordinate.x+"_"+coordinate.y);
				if(tile.size() > 0){
					tile.css("background", "");
					tile.removeData(TILE_NS);
				}
			}
			return false;
		}
	})
    
    // grid on/off button
    var gridVisible = true;
    $("#gridButton").click(function(){
    	if(!$(this).hasClass("disabled")){
    		if(gridVisible){
    			$("#grid").css("opacity",0);
    			gridVisible = false;
    		} else {
		    	$("#grid").css("opacity",1);
		    	gridVisible = true;
    		}
    	}
    });
    
    // Help dialog
    modalDialog.register("helpOverlay", "helpButton");
    
    // Add animation dialog
    modalDialog.register("addAnimationOverlay", "addAnimationButton", function(){
    	animations.add();
        return false;
	});
	
	// Add the export dialog
	modalDialog.register("exportOverlay","saveButton");
	$("#saveButton").click(function(){
		var exportText = "// Generated with gQ's Tiles map editor\n\n";
		var reverseAnimationMap = []; //contains an index number for each animation name
	
		// generate the animation(s)
		if(tilemap.multiple){
			var animation = tilemap.animations[0]; // we take the first animation as example, they are all the same anyway
			exportText += "var animations =  new $.gameQuery.Animation({\n";
			exportText += "    imageURL:      '"+animation.url+"',\n";
			exportText += "    type:          $.gameQuery.ANIMATION_MULTI | $.gameQuery."+animation.type+",\n";
			exportText += "    numberOfFrame: "+animation.nbframes+",\n";
			exportText += "    delta:         "+animation.delta+",\n";
			exportText += "    distance:      "+animation.distance+",\n";
			exportText += "    rate:          "+animation.rate+",\n";
			exportText += "    offsetx:       "+animation.offsetx+",\n";
			exportText += "    offsety:       "+animation.offsety+"\n";
			exportText += "});";
			
			for (i = 0; i < tilemap.animations.length; i++){
				reverseAnimationMap[tilemap.animations[i].name] = i+1;
			}
			
		} else {
			exportText += "var animations = [];\n"
			for (i = 0; i < tilemap.animations.length; i++){
				reverseAnimationMap[tilemap.animations[i].name] = i+1;
				var animation = tilemap.animations[i];
				
				exportText += "animations["+i+"] =  new $.gameQuery.Animation({\n";
				exportText += "    imageURL:      '"+animation.url+"',\n";
				exportText += "    type:          $.gameQuery."+animation.type+",\n";
				exportText += "    numberOfFrame: "+animation.nbframes+",\n";
				exportText += "    delta:         "+animation.delta+",\n";
				exportText += "    rate:          "+animation.rate+",\n";
				exportText += "    offsetx:       "+animation.offsetx+",\n";
				exportText += "    offsety:       "+animation.offsety+"\n";
				exportText += "});\n";
			}	
		}
		
		
		
		// generate the map
		exportText += "\n\n // the tilemap array\n";
		exportText += "var map = [";
		var firstLine = true;
		for(i = 0; i < tilemap.height; i++) {
			var firstColumn = true;
			if(!firstLine) {
				exportText += ",\n           ";
			} else {
				firstLine = false;
			}
			exportText += "[";
			for(j = 0; j < tilemap.width; j++){
				if(!firstColumn){
					exportText += ", ";
				} else {
					firstColumn = false;
				}
				var tileDom = $("#tile_"+j+"_"+i);
				if(tileDom.size() > 0) {
					var name = tileDom.data(TILE_NS);
					if(name !== undefined){
						exportText += reverseAnimationMap[name];
					}
				} else {
					exportText += "0";
				}
			}
			exportText += "]";
		}
		exportText += "]\n\n";
		
		// add the tilemap
		
		exportText += "// $('TODO:select the playground here').playground({height: 64, width: 350});\n";
        exportText += "$.playground()\n";
        exportText += "       .addTilemap('tilemap', map,  animations, {width: "+tilemap.tileWidth+", height: "+tilemap.tileHeight+", sizex: "+tilemap.width+", sizey: "+tilemap.height+"});";
		
		$("#exportArea").val(exportText);
	});
    
    // New Tilemap Overlay
    modalDialog.register("newOverlay", "newButton", function(){
    	var tileWidth  = parseInt($("#newForm_input_tile_width").val()); 
    	var tileHeight = parseInt($("#newForm_input_tile_height").val());
    	var mapWidth   = parseInt($("#newForm_input_map_width").val());
    	var mapHeight  = parseInt($("#newForm_input_map_height").val());
    	var animationType = $("#newForm_input_animations_type").val();
    	
    	tilemap.width = mapWidth;
    	tilemap.height = mapHeight;
    	tilemap.tileWidth = tileWidth;
    	tilemap.tileHeight = tileHeight;
    	 
        var fragment = $("<div class='grid'/>").css({width: tileWidth-1, height: tileHeight-1});
		for(var i=0; i < mapHeight; i++) {
            for(var j=0; j < mapWidth; j++){
            	var grid = fragment.clone().css({left: (tileWidth)*j, top: (tileHeight)*i});
                $("#grid").append(grid);
            	grid.data(GRID_NS,{x:j, y: i});
            }
        }
        switch(animationType){
        	case "simple animations" :
        		animations.setType(animations.SINGLE);
        		$(".multianimation").hide();
        		break;
        	case "multi-animation":
        		animations.setType(animations.MULTIPLE);
        		$(".multianimation").show();
        		break;
        }
        $("#addAnimationButton").removeClass("disabled");
        $("#gridButton").removeClass("disabled");
        $("#saveButton").removeClass("disabled");
        
        return false;
	});
	
	$(window).resize(resize);
	
});