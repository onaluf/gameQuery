/* constants */
var ANIMATION_NS = "animation";
var TILE_NS = "tile";
var GRID_NS = "grid";

/* utility functions */
var minMax = function (min, val , max){
    return Math.max(min, Math.min(val, max));
}

var toInt = function(value){
	if (value === "" || value === undefined) {
		throw "Not a number!"
	}
	var result = parseInt(value);
	if(result === NaN){
		throw "Not a number!"
	}
	return result;
}
	
var generateBackground = function(animation) {
	var background = "url('"+animation.url+"') -"+animation.offsetx+"px -"+animation.offsety+"px";
	return background
}

/* global objects */
var tilemap = {
	width: undefined,
	height: undefined,
	tileWidth: undefined,
	tileHeight: undefined,
	animations: []
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
                	var success = false;
                    //The event handler!
                    switch(this.name) {
                        case "ok":
                            success = (okHandler !== undefined) ? okHandler.call(this) : true;
                            break;
                        case "cancel":
                            success = true;
                            break;
                    }
                    if (success){
                    	$("#overlay").hide();
                    	dialog.hide();
                    }
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
        			fragment.css({left: 8+120*tilemap.animations.length, top: 5});

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
        			for (var i  = 0; i < animation.nbanimations; i++){
        				fragment.css({left: 8+120*i, top: 5});
        				
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
        	return true;
        }
    }
})();

$(function(){
	// Resize the elements of the page
	var resize = function() {
		//resize elements
		$("#tilemap").height(
			$(window).height()
			-$("#toolbarTile").height()
			-$("#toolbarAnimation").height()
			-$("#animations").height()-20);
	};
	resize();
	$(window).resize(resize);

	// Allow the selection of one and only one animation as well as it's deselection 
	$("#animations").delegate(".animation", "click", function(event){ 
		if($(this)[0] === $(".animation.selected")[0]) {
			$(".animation.selected").removeClass("selected");
		} else {
			$(".animation.selected").removeClass("selected");
			$(this).toggleClass("selected");
		}
	}); 
	
	// Handle the validation of input containing int value
	var validateIntInput = function (event) {
		var inputValue = $(this).val(); 
		var failed = false;
		
		try{
			var intValue = toInt(inputValue);
			if(inputValue != (""+intValue)){
				failed = true;
			}
		}
		catch (event){
			failed = true;	
		}
		
		if(failed){
			$(this).addClass("failedValidation");
		} else {
			$(this).removeClass("failedValidation");
		}
	};
	$(".intValue").keyup(validateIntInput);
	
	// validate the name field of the add animation dialog
	var validateUniqueName = function(){
		// check that the name don't already exist
		var unique = true;
		for (var i = 0; i < tilemap.animations.length; i++){
			if(tilemap.animations[i].name === $(this).val()){
				unique = false;
				break;
			}
		}
		
		if(unique){
			$(this).removeClass("failedValidation");
		} else {
			$(this).addClass("failedValidation");
		}
		return true;
	};
	$("#addAnimationForm_input_name").keyup(validateUniqueName); 
	
	// Handle the interactive part of the 'add animation' dialog
	var isAddAnimationOverlayVisible = function (){
		var display = $("#addAnimationOverlay").css("display")
		return display !== "none";
	}
	$("#addAnimationForm_input_url").change(function(event){
		if(isAddAnimationOverlayVisible()){
			var url = "url('"+$(this).val()+"')";
			$("#addAnimationImage").css("background", url);
			$("#addAnimationSelectionBox").css("width", tilemap.tileWidth - 6);
			$("#addAnimationSelectionBox").css("height", tilemap.tileHeight - 6);
		}
	});
	var updateSelectionBoxes = function(){
		var offsetx, offsety, delta, frameNb, animationType;
		try {
			$(".selelectionBoxes").remove();
			
			offsetx = toInt($("#addAnimationForm_input_offsetx").val());
			offsety = toInt($("#addAnimationForm_input_offsety").val());
			
			$("#addAnimationSelectionBox").css("left",offsetx);
			$("#addAnimationSelectionBox").css("top",offsety);

			delta = toInt($("#addAnimationForm_input_delta").val());
			frameNb = toInt($("#addAnimationForm_input_nbframes").val());
			animationType = $("#addAnimationForm_input_type").val();
			
			for(var i = 1; i < frameNb; i++) {
				var left, top;
				var removedBorder = "";
				switch(animationType){
		        	case "ANIMATION_VERTICAL" :
		        		left = offsetx;
		        		top  = offsety + (i)*delta;
		        		break;
		        	case "ANIMATION_HORIZONTAL":
		        		left = offsetx + (i)*delta;
		        		top  = offsety;
		        		break;
		        }
				$("#addAnimationImage").append("<div class='selelectionBoxes' style='width: "+(tilemap.tileWidth - 6)+"; height: "+(tilemap.tileHeight - 6)+"; left: "+left+"; top: "+top+removedBorder+"'></div>");
			}
			
		} catch (exception) {/* fail silently */};
		return true;
	};
	$("#addAnimationForm_input_offsetx").keyup(updateSelectionBoxes);
	$("#addAnimationForm_input_offsety").keyup(updateSelectionBoxes);
	$("#addAnimationForm_input_delta, #addAnimationForm_input_nbframes, #addAnimationForm_input_type").change(updateSelectionBoxes);
	
	// Handle the click on a tile
	$("#grid").delegate(".grid", "click", function(event){ 
		$(".grid.selected").removeClass("selected");
		$(this).toggleClass("selected");

		var animation = $(".animation.selected").data(ANIMATION_NS);
		if(animation) {
			var coordinate = $(this).data(GRID_NS);
			var tile = $(".tile.col_"+coordinate.x+".row_"+coordinate.y);
			if(tile.size() > 0){
				tile.css("background", generateBackground(animation));
				tile.data(TILE_NS, animation.name);
			} else {
				tile = $("<div class='tile' />")
					.css({
						width: tilemap.tileWidth, 
						height: tilemap.tileHeight, 
						left: (tilemap.tileWidth)*coordinate.x, 
						top: (tilemap.tileHeight)*coordinate.y, 
						background: generateBackground(animation)})
					.data(TILE_NS, animation.name)
					.addClass("row_"+coordinate.y+" col_"+coordinate.x);
				$("#tiles").append(tile);
			}
		}
	});
	
	// Handle the add/remove row/column buttons
	$("#grid").delegate("#plusH", "click", function(event){
		// update the global object
		tilemap.width ++;
		
		// add a collumn of grid element
		var fragment = $("<div class='grid'/>").css({width: tilemap.tileWidth-1, height: tilemap.tileHeight-1});
		for(var i=0; i < tilemap.height; i++) {
            	var grid = fragment.clone().css({left: tilemap.tileWidth*(tilemap.width - 1), top: (tilemap.tileHeight)*i}).addClass("row_"+i+" col_"+(tilemap.width - 1));
                $("#grid").append(grid);
            	grid.data(GRID_NS,{x:tilemap.width - 1, y: i});
        }
        
		// move the +/- buttons
		$("#minusH").css({left: tilemap.tileWidth*tilemap.width-20});
        $("#plusH").css({left: tilemap.tileWidth*tilemap.width});
	});
	$("#grid").delegate("#minusH", "click", function(event){
		if (tilemap.width > 1){
			// update the global object
			tilemap.width --;
			
			// remove a collumn of grid element
			$(".col_"+(tilemap.width)).remove();
	        
			// move the +/- buttons
			$("#minusH").css({left: tilemap.tileWidth*tilemap.width-20});
	        $("#plusH").css({left: tilemap.tileWidth*tilemap.width});
		}
	});
	$("#grid").delegate("#plusV", "click", function(event){
		// update the global object
		tilemap.height ++;
		
		// add a collumn of grid element
		var fragment = $("<div class='grid'/>").css({width: tilemap.tileWidth-1, height: tilemap.tileHeight-1});
		for(var i=0; i < tilemap.width; i++) {
            	var grid = fragment.clone().css({left: tilemap.tileWidth*i, top: tilemap.tileHeight*(tilemap.height-1)}).addClass("col_"+i+" row_"+(tilemap.height - 1));
                $("#grid").append(grid);
            	grid.data(GRID_NS,{x:i, y: tilemap.height-1});
        }
        
		// move the +/- buttons
		$("#minusV").css({top: tilemap.tileHeight*tilemap.height-20});
        $("#plusV").css({top: tilemap.tileHeight*tilemap.height});
	});
	$("#grid").delegate("#minusV", "click", function(event){
		if (tilemap.height > 1){
			// update the global object
			tilemap.height --;
			
			// remove a collumn of grid element
			$(".row_"+(tilemap.height)).remove();
	        
			// move the +/- buttons
		$("#minusV").css({top: tilemap.tileHeight*tilemap.height-20});
        $("#plusV").css({top: tilemap.tileHeight*tilemap.height});
		}
	});
	
	// Handle the delete animation button
	$("#animations").delegate("a.close", "click", function(event){
		if(tilemap.multiple){
			// if we have multiple animation the delete button just remove all animations and tiles
			$(".tile").remove();
			tilemap.animations = [];
			$(".animation").remove();
			$("#addAnimationButton").removeClass("disabled");
		} else {
			var animationDom = $(this).parent();
			var animation = animationDom.data(ANIMATION_NS);
			// remove tile to which this animation was applied
			
			// remove the animation
			$(".tile").each(function(){
				if($(this).data(TILE_NS) === animation.name){
					$(this).remove();
				}
			});
			var animationIndex = tilemap.animations.indexOf(animation);
			tilemap.animations.splice(animationIndex, 1);
			animationDom.remove();
			
			// shift all the animations right to this one
			for (var i = animationIndex + 1 ; i < tilemap.animations.length + 1; i++){
				$("#animation_"+(i+1)).css("left",8+120*(i-1));
			}
		}
	});
	
	// Handle the backspace key
	$(document).keydown(function(event){
		if(event.keyCode == '8' && event.srcElement.tagName !== "input") {
			var coordinate = $(".grid.selected").data(GRID_NS);
			if(coordinate !== undefined){
				var tile = $(".tile.col_"+coordinate.x+".row_"+coordinate.y);
				if(tile.size() > 0){
					tile.removeData(TILE_NS);
					tile.remove();
				}
				event.preventDefault();
			}
		}
	});
    
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
    
    /** ------------------------------------------------------------
     *  ------------------- Configure the dialogs ------------------
        ------------------------------------------------------------  */ 
    
    // Help dialog
    modalDialog.register("helpOverlay", "helpButton");
    
    // Add animation dialog
    modalDialog.register("addAnimationOverlay", "addAnimationButton", function(){
    	// is there a validation error, then we don't accept the form
    	$("#addAnimationForm").find(".intValue").each(validateIntInput);
    	$("#addAnimationForm_input_name").each(validateUniqueName);
    	
    	if(tilemap.multiple) {
	    	if($("#addAnimationForm").find(".failedValidation").size() > 0) return false;
    	} else {
    		if($("#addAnimationForm").find("tr:not(.multianimation) .failedValidation").size() > 0) return false;
    	}
    	return animations.add();
	});
	
	// Add the export dialog
	modalDialog.register("exportOverlay","saveButton");
	$("#saveButton").click(function(){
		var exportText = "// Generated with gQ's Tiles map editor\n\n";
		var reverseAnimationMap = []; //contains an index number for each animation name
	
		// generate the animation(s)
		if(tilemap.multiple && tilemap.animations.length > 0){
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
				var tileDom = $(".tile.col_"+j+".row_"+i);
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
    	// is there a validation error, then we don't accept the form
    	$("#newForm").find(".intValue").each(validateIntInput);
        if($("#newForm").find(".failedValidation").size() > 0) return false;
    	
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
            	var grid = fragment.clone().css({left: (tileWidth)*j, top: (tileHeight)*i}).addClass("row_"+i+" col_"+j);
                $("#grid").append(grid);
            	grid.data(GRID_NS,{x:j, y: i});
            }
        }
        // add the +/- button
        $("#grid").append("<button class='gridButton' id='minusH' style='top: 10px; left: "+(tileWidth*j-20)+"px'>-</button>");
        $("#grid").append("<button class='gridButton' id='plusH' style='top: 10px; left: "+(tileWidth*j)+"px'>+</button>");
        $("#grid").append("<button class='gridButton' id='minusV' style='top: "+(tileHeight*i-20)+"px; left: 10px'>-</button>");
        $("#grid").append("<button class='gridButton' id='plusV' style='top: "+(tileHeight*i)+"px; left: 10px'>+</button>");
        
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
        $("#newButton").addClass("disabled");
        return true;
	});
});
