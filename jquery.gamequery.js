/*
 * gameQuery rev. $Revision$
 *
 * Copyright (c) 2012 Selim Arsever (http://gamequeryjs.com)
 * licensed under the MIT-License
 */

// This allows use of the convenient $ notation in a plugin
(function($) {
	
	// CSS Feature detection from: Craig Buckler (http://www.sitepoint.com/detect-css3-property-browser-support/)
	var cssTransform = false;
	
	var detectElement = document.createElement("detect"),  
    	CSSprefix = "Webkit,Moz,O,ms,Khtml".split(","),
    	All = ("transform," + CSSprefix.join("Transform,") + "Transform").split(",");  
	for (var i = 0, l = All.length; i < l; i++) {  
	    if (detectElement.style[All[i]] === "") {  
	          cssTransform = All[i];
	    }  
	}
	
    // This prefix can be use whenever needed to namespace CSS classes, .data() inputs aso.
    var gQprefix = "gQ_";
    
    // Those are the possible states of the engine
    var STATE_NEW     = 0; // Not yet started for the first time
    var STATE_RUNNING = 1; // Started and running 
    var STATE_PAUSED  = 2; // Paused
    
    /**
     * Utility function that returns the radius for a geometry.
     *
     * @param {object} elem DOM element
     * @param {float} angle the angle in degrees
     * @return {object} .x, .y radius of geometry
     */
    var proj = function (elem, angle) {
        switch (elem.geometry){
            case $.gameQuery.GEOMETRY_RECTANGLE :
                var b = angle*Math.PI*2/360;
                var Rx = Math.abs(Math.cos(b)*elem.width/2*elem.factor)+Math.abs(Math.sin(b)*elem.height/2*elem.factor);
                var Ry = Math.abs(Math.cos(b)*elem.height/2*elem.factor)+Math.abs(Math.sin(b)*elem.width/2*elem.factor);

                return {x: Rx, y: Ry};
        }
    };
    
    /**
     * Utility function that checks for collision between two elements.
     *
     * @param {object} elem1 DOM for the first element
     * @param {float} offset1 offset of the first element
     * @param {object} elem2 DOM for the second element
     * @param {float} offset2 offset of the second element
     * @return {boolean} if the two elements collide or not
     */
    var collide = function(elem1, offset1, elem2, offset2) {
        // test real collision (only for two rectangles...)
        if((elem1.geometry == $.gameQuery.GEOMETRY_RECTANGLE && elem2.geometry == $.gameQuery.GEOMETRY_RECTANGLE)){

            var dx = offset2.x + elem2.boundingCircle.x - elem1.boundingCircle.x - offset1.x;
            var dy = offset2.y + elem2.boundingCircle.y - elem1.boundingCircle.y - offset1.y;
            var a  = Math.atan(dy/dx);

            var Dx = Math.abs(Math.cos(a-elem1.angle*Math.PI*2/360)/Math.cos(a)*dx);
            var Dy = Math.abs(Math.sin(a-elem1.angle*Math.PI*2/360)/Math.sin(a)*dy);

            var R = proj(elem2, elem2.angle-elem1.angle);

            if((elem1.width/2*elem1.factor+R.x <= Dx) || (elem1.height/2*elem1.factor+R.y <= Dy)) {
                return false;
            } else {
                var Dx = Math.abs(Math.cos(a-elem2.angle*Math.PI*2/360)/Math.cos(a)*-dx);
                var Dy = Math.abs(Math.sin(a-elem2.angle*Math.PI*2/360)/Math.sin(a)*-dy);

                var R = proj(elem1, elem1.angle-elem2.angle);

                if((elem2.width/2*elem2.factor+R.x <= Dx) || (elem2.height/2*elem2.factor+R.y <= Dy)) {
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            return false;
        }
    };
    
    /** 
     * Utility function computes the offset relative to the playground of a gameQuery element without using DOM's position.
     * This should be faster than the standand .offset() function.
     * 
     * Warning: No non-gameQuery elements should be present between this element and the playground div!
     * 
     * @param {jQuery} element the jQuery wrapped DOM element representing the gameQuery object.
     * @return {object} an object {x:, y: } containing the x and y offset. (Not top and left like jQuery's .offset())  
     */
    var offset = function(element) {
        // Get the tileSet offset (relative to the playground)
        var offset = {x: 0, y: 0};
        var parent = element[0];
        
        while(parent !== $.gameQuery.playground[0] && parent.gameQuery !== undefined) {
            offset.x += parent.gameQuery.posx;
            offset.y += parent.gameQuery.posy;
            parent = parent.parentNode;
        }
        
        return offset
    }
    
    /**
     * Utility function computes the index range of the tiles for a tilemap.
     * 
     * @param {jQuery} element the jQuery wrapped DOM element representing the tilemap.
     * @param {object} offset an object holding the x and y offset of the tilemap, this is optional and will be computed if not provided.
     * @return {object} an object {firstColumn: , lastColumn: , fristRow: , lastRow: } 
     */
    var visibleTilemapIndexes = function (element, elementOffset) {
        if (elementOffset === undefined) {
            elementOffset = offset(element);   
        }
        
        var gameQuery = element[0].gameQuery;
        // Activate the visible tiles
        return {
            firstRow:    Math.max(Math.min(Math.floor(-elementOffset.y/gameQuery.height), gameQuery.sizey), 0),
            lastRow:     Math.max(Math.min(Math.ceil(($.gameQuery.playground[0].height-elementOffset.y)/gameQuery.height), gameQuery.sizey), 0),
            firstColumn: Math.max(Math.min(Math.floor(-elementOffset.x/gameQuery.width), gameQuery.sizex), 0),
            lastColumn:  Math.max(Math.min(Math.ceil(($.gameQuery.playground[0].width-elementOffset.x)/gameQuery.width), gameQuery.sizex), 0) 
        }
    }
    
    /**
     * Utility function thast computes the buffered zone of a tilemap
     * 
     * @param {jQuery} element the jQuery wrapped DOM element representing the tilemap.
     * @param {object} visible an object describing the visible zone
     * @return {object} an object {firstColumn: , lastColumn: , fristRow: , lastRow: }
     */
    var bufferedTilemapIndexes = function (element, visible) {
        var gameQuery = element[0].gameQuery;
        
        return {
            firstRow:    Math.max(Math.min(visible.firstRow - gameQuery.buffer, gameQuery.sizey), 0),
            lastRow:     Math.max(Math.min(visible.lastRow + gameQuery.buffer, gameQuery.sizey), 0),
            firstColumn: Math.max(Math.min(visible.firstColumn - gameQuery.buffer, gameQuery.sizex), 0),
            lastColumn:  Math.max(Math.min(visible.lastColumn + gameQuery.buffer, gameQuery.sizex), 0) 
        }
    }
    
    /**
     * Utility function that creates a tile in the given tilemap
     * 
     * @param {jQuery} tileSet the jQuery element representing the tile map
     * @param {integer} row the row index of the tile in the tile map
     * @param {integer} column the column index of the tile in the tile map
     */
    var addTile = function(tileSet, row, column) {
        var gameQuery = tileSet[0].gameQuery;
        var name = tileSet.attr("id");
        
        var tileDescription;
        if(gameQuery.func) {
            tileDescription = gameQuery.tiles(row,column)-1;
        } else {
            tileDescription = gameQuery.tiles[row][column]-1;
        }
        
        var animation;
        if(gameQuery.multi) {
            animation = gameQuery.animations;
        } else {
            animation = gameQuery.animations[tileDescription];
        }
        
        if(tileDescription >= 0){
            tileSet.addSprite($.gameQuery.tileIdPrefix+name+"_"+row+"_"+column,
                                  {width: gameQuery.width,
                                   height: gameQuery.height,
                                   posx: column*gameQuery.width,
                                   posy: row*gameQuery.height,
                                   animation: animation});
                                   
            var newTile = tileSet.find("#"+$.gameQuery.tileIdPrefix+name+"_"+row+"_"+column);
            if (gameQuery.multi) {
                newTile.setAnimation(tileDescription);
            } else {
                newTile[0].gameQuery.animationNumber = tileDescription;
            }
            newTile.removeClass($.gameQuery.spriteCssClass);
            newTile.addClass($.gameQuery.tileCssClass);
            newTile.addClass($.gameQuery.tileTypePrefix+tileDescription);
        }
    }
    
    // Define the list of object/function accessible through $.
    $.extend({ gameQuery: {
        /**
         * This is the Animation Object
         */
        Animation: function (options, imediateCallback) {
            // private default values
            var defaults = {
                imageURL:      "",
                numberOfFrame: 1,
                delta:         0,
                rate:          30,
                type:          0,
                distance:      0,
                offsetx:       0,
                offsety:       0
            };

            // options extends defaults
            options = $.extend(defaults, options);

            // "public" attributes:
            this.imageURL      = options.imageURL;      // The url of the image to be used as an animation or sprite
            this.numberOfFrame = options.numberOfFrame; // The number of frames to be displayed when playing the animation
            this.delta         = options.delta;         // The distance in pixels between two frames
            this.rate          = options.rate;          // The rate at which the frames change in miliseconds
            this.type          = options.type;          // The type of the animation.This is a bitwise OR of the properties.
            this.distance      = options.distance;      // The distance in pixels between two animations
            this.offsetx       = options.offsetx;       // The x coordinate where the first sprite begins
            this.offsety       = options.offsety;       // The y coordinate where the first sprite begins

            // Whenever a new animation is created we add it to the ResourceManager animation list
            $.gameQuery.resourceManager.addAnimation(this, imediateCallback);

            return true;
        },

        /**
         * "constants" for the different types of an animation
         */ 
        ANIMATION_VERTICAL:   1,  // Generated by a vertical offset of the background
        ANIMATION_HORIZONTAL: 2,  // Generated by a horizontal offset of the background
        ANIMATION_ONCE:       4,  // Played only once (else looping indefinitely)
        ANIMATION_CALLBACK:   8,  // A callback is exectued at the end of a cycle
        ANIMATION_MULTI:      16, // The image file contains many animations
        ANIMATION_PINGPONG:   32, // At the last frame of the animation it reverses (if used in conjunction with ONCE it will have no effect)

        // "constants" for the different type of geometry for a sprite
        GEOMETRY_RECTANGLE:   1,
        GEOMETRY_DISC:        2,

        // basic values
        refreshRate:          30,

        /**
         * An object to manage resource loading
         */
        resourceManager: {
            animations: [],    // List of animations / images used in the game
            sounds:     [],    // List of sounds used in the game
            callbacks:  [],    // List of the functions called at each refresh
            loadedAnimationsPointer: 0, // Keep track of the last loaded animation
            loadedSoundsPointer:    0, // Keep track of the last loaded sound

            /**
             * Load resources before starting the game.
             */
            preload: function() {
                // Start loading the images
                for (var i = this.animations.length-1 ; i >= this.loadedAnimationsPointer; i --){
                    this.animations[i].domO = new Image();
                    this.animations[i].domO.src = this.animations[i].imageURL;
                }

                // Start loading the sounds
                for (var i = this.sounds.length-1 ; i >= this.loadedSoundsPointer; i --){
                    this.sounds[i].load();
                }

                $.gameQuery.resourceManager.waitForResources();
            },

            /**
             * Wait for all the resources called for in preload() to finish loading.
             */
            waitForResources: function() {
                // Check the images
                var imageCount = 0;
                for(var i=this.loadedAnimationsPointer; i < this.animations.length; i++){
                    if(this.animations[i].domO.complete){
                        imageCount++;
                    }
                }
                // Check the sounds
                var soundCount = 0;
                for(var i=this.loadedSoundsPointer; i < this.sounds.length; i++){
                    var temp = this.sounds[i].ready();
                    if(temp){
                        soundCount++;
                    }
                }
                // Call the load callback with the current progress
                if($.gameQuery.resourceManager.loadCallback){
                    var percent = (imageCount + soundCount)/(this.animations.length + this.sounds.length - this.loadedAnimationsPointer - this.loadedSoundsPointer)*100;
                    $.gameQuery.resourceManager.loadCallback(percent);
                }
                if(imageCount + soundCount < (this.animations.length + this.sounds.length  - this.loadedAnimationsPointer - this.loadedSoundsPointer)){
                    imgWait=setTimeout(function () {
                        $.gameQuery.resourceManager.waitForResources();
                    }, 100);
                } else {
                    this.loadedAnimationsPointer = this.animations.length;
                    this.loadedSoundsPointer = this.sounds.length;
                    
                    // All the resources are loaded! We can now associate the animation's images to their corresponding sprites
                    $.gameQuery.scenegraph.children().each(function(){
                        // recursive call on the children:
                        $(this).children().each(arguments.callee);
                        // add the image as a background
                        if(this.gameQuery && this.gameQuery.animation){
                            $(this).css("background-image", "url("+this.gameQuery.animation.imageURL+")");
                            // we set the correct kind of repeat
                            if(this.gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                                $(this).css("background-repeat", "repeat-x");
                            } else if(this.gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                                $(this).css("background-repeat", "repeat-y");
                            } else {
                                $(this).css("background-repeat", "no-repeat");
                            }
                        }
                    });

                    // Launch the refresh loop
                    if($.gameQuery.state === STATE_NEW){
                        setInterval(function () {
                            $.gameQuery.resourceManager.refresh();
                        },($.gameQuery.refreshRate));
                    }
                    $.gameQuery.state = STATE_RUNNING;
                    if($.gameQuery.startCallback){
                        $.gameQuery.startCallback();
                    }
                    // Make the scenegraph visible
                    $.gameQuery.scenegraph.css("visibility","visible");
                }
            },

            /**
             * This function refresh a unique sprite here 'this' represent a dom object
             */
            refreshSprite: function() {
                // Check if 'this' is a gameQuery element
                if(this.gameQuery != undefined){
                    var gameQuery = this.gameQuery;
                    // Does 'this' has an animation ?
                    if(gameQuery.animation){
                        // Do we have anything to do?
                        if ( (gameQuery.idleCounter == gameQuery.animation.rate-1) && gameQuery.playing){

                            // Does 'this' loops?
                            if(gameQuery.animation.type & $.gameQuery.ANIMATION_ONCE){
                                if(gameQuery.currentFrame < gameQuery.animation.numberOfFrame-1){
                                    gameQuery.currentFrame += gameQuery.frameIncrement;
                                } else if(gameQuery.currentFrame == gameQuery.animation.numberOfFrame-1) {
                                    // Does 'this' has a callback ?
                                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_CALLBACK){
                                        if($.isFunction(gameQuery.callback)){
                                            gameQuery.callback(this);
                                            gameQuery.callback = false;
                                        }
                                    }
                                }
                            } else {
                                if(gameQuery.animation.type & $.gameQuery.ANIMATION_PINGPONG){
                                    if(gameQuery.currentFrame == gameQuery.animation.numberOfFrame-1 && gameQuery.frameIncrement == 1) {
                                        gameQuery.frameIncrement = -1;
                                    } else if (gameQuery.currentFrame == 0 && gameQuery.frameIncrement == -1) {
                                        gameQuery.frameIncrement = 1;
                                    }
                                }

                                gameQuery.currentFrame = (gameQuery.currentFrame+gameQuery.frameIncrement)%gameQuery.animation.numberOfFrame;
                                if(gameQuery.currentFrame == 0){
                                    // Does 'this' has a callback ?
                                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_CALLBACK){
                                        if($.isFunction(gameQuery.callback)){
                                            gameQuery.callback(this);
                                        }
                                    }
                                }
                            }
                            // Update the background
                            if((gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) && (gameQuery.animation.numberOfFrame > 1)){
                                if(gameQuery.multi){
                                    $(this).css("background-position",""+(-gameQuery.animation.offsetx-gameQuery.multi)+"px "+(-gameQuery.animation.offsety-gameQuery.animation.delta*gameQuery.currentFrame)+"px");
                                } else {
                                    $(this).css("background-position",""+(-gameQuery.animation.offsetx)+"px "+(-gameQuery.animation.offsety-gameQuery.animation.delta*gameQuery.currentFrame)+"px");
                                }
                            } else if((gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) && (gameQuery.animation.numberOfFrame > 1)) {
                                if(gameQuery.multi){
                                    $(this).css("background-position",""+(-gameQuery.animation.offsetx-gameQuery.animation.delta*gameQuery.currentFrame)+"px "+(-gameQuery.animation.offsety-gameQuery.multi)+"px");
                                } else {
                                    $(this).css("background-position",""+(-gameQuery.animation.offsetx-gameQuery.animation.delta*gameQuery.currentFrame)+"px "+(-gameQuery.animation.offsety)+"px");
                                }
                            }
                        }
                        gameQuery.idleCounter = (gameQuery.idleCounter+1)%gameQuery.animation.rate;
                    }
                }
                return true;
            },

            /**
             * This function refresh a unique tile-map, here 'this' represent a dom object
             */
            refreshTilemap: function() {
                // Check if 'this' is a gameQuery element
                if(this.gameQuery != undefined){
                    var gameQuery = this.gameQuery;
                    if($.isArray(gameQuery.frameTracker)){
                        for(var i=0; i<gameQuery.frameTracker.length; i++){
                            // Do we have anything to do?
                            if(gameQuery.idleCounter[i] == gameQuery.animations[i].rate-1){
                                // Does 'this' loops?
                                if(gameQuery.animations[i].type & $.gameQuery.ANIMATION_ONCE){
                                    if(gameQuery.frameTracker[i] < gameQuery.animations[i].numberOfFrame-1){
                                        gameQuery.frameTracker[i] += gameQuery.frameIncrement[i];
                                    }
                                } else {
                                    if(gameQuery.animations[i].type & $.gameQuery.ANIMATION_PINGPONG){
                                        if(gameQuery.frameTracker[i] == gameQuery.animations[i].numberOfFrame-1 && gameQuery.frameIncrement[i] == 1) {
                                            gameQuery.frameIncrement[i] = -1;
                                        } else if (gameQuery.frameTracker[i] == 0 && gameQuery.frameIncrement[i] == -1) {
                                            gameQuery.frameIncrement[i] = 1;
                                        }
                                    }
                                    gameQuery.frameTracker[i] = (gameQuery.frameTracker[i]+gameQuery.frameIncrement[i])%gameQuery.animations[i].numberOfFrame;
                                }
                            }
                            gameQuery.idleCounter[i] = (gameQuery.idleCounter[i]+1)%gameQuery.animations[i].rate;
                        }
                    } else {
                        // Do we have anything to do?
                        if(gameQuery.idleCounter == gameQuery.animations.rate-1){
                            // Does 'this' loops?
                            if(gameQuery.animations.type & $.gameQuery.ANIMATION_ONCE){
                                if(gameQuery.frameTracker < gameQuery.animations.numberOfFrame-1){
                                    gameQuery.frameTracker += gameQuery.frameIncrement;
                                }
                            } else {
                                if(gameQuery.animations.type & $.gameQuery.ANIMATION_PINGPONG){
                                    if(gameQuery.frameTracker == gameQuery.animations.numberOfFrame-1 && gameQuery.frameIncrement == 1) {
                                        gameQuery.frameIncrement = -1;
                                    } else if (gameQuery.frameTracker == 0 && gameQuery.frameIncrement == -1) {
                                        gameQuery.frameIncrement = 1;
                                    }
                                }
                                gameQuery.frameTracker = (gameQuery.frameTracker+gameQuery.frameIncrement)%gameQuery.animations.numberOfFrame;
                            }
                        }
                        gameQuery.idleCounter = (gameQuery.idleCounter+1)%gameQuery.animations.rate;
                    }


                    // Update the background of all active tiles
                    $(this).find("."+$.gameQuery.tileCssClass).each(function(){
                        if($.isArray(gameQuery.frameTracker)){
                            var animationNumber = this.gameQuery.animationNumber
                            if((gameQuery.animations[animationNumber].type & $.gameQuery.ANIMATION_VERTICAL) && (gameQuery.animations[animationNumber].numberOfFrame > 1)){
                                $(this).css("background-position",""+(-gameQuery.animations[animationNumber].offsetx)+"px "+(-gameQuery.animations[animationNumber].offsety-gameQuery.animations[animationNumber].delta*gameQuery.frameTracker[animationNumber])+"px");
                            } else if((gameQuery.animations[animationNumber].type & $.gameQuery.ANIMATION_HORIZONTAL) && (gameQuery.animations[animationNumber].numberOfFrame > 1)) {
                                $(this).css("background-position",""+(-gameQuery.animations[animationNumber].offsetx-gameQuery.animations[animationNumber].delta*gameQuery.frameTracker[animationNumber])+"px "+(-gameQuery.animations[animationNumber].offsety)+"px");
                            }
                        } else {
                            if((gameQuery.animations.type & $.gameQuery.ANIMATION_VERTICAL) && (gameQuery.animations.numberOfFrame > 1)){
                                $(this).css("background-position",""+(-gameQuery.animations.offsetx-this.gameQuery.multi)+"px "+(-gameQuery.animations.offsety-gameQuery.animations.delta*gameQuery.frameTracker)+"px");
                            } else if((gameQuery.animations.type & $.gameQuery.ANIMATION_HORIZONTAL)  && (gameQuery.animations.numberOfFrame > 1)) {
                                $(this).css("background-position",""+(-gameQuery.animations.offsetx-gameQuery.animations.delta*gameQuery.frameTracker)+"px "+(-gameQuery.animations.offsety-this.gameQuery.multi)+"px");
                            }
                        }
                    });
                }
                return true;
            },

            /**
             * Called periodically to refresh the state of the game.
             */
            refresh: function() {
                if($.gameQuery.state === STATE_RUNNING) {
                    $.gameQuery.playground.find("."+$.gameQuery.spriteCssClass).each(this.refreshSprite);
                    $.gameQuery.playground.find("."+$.gameQuery.tilemapCssClass).each(this.refreshTilemap);
                    var deadCallback= new Array();
                    for (var i = this.callbacks.length-1; i >= 0; i--){
                        if(this.callbacks[i].idleCounter == this.callbacks[i].rate-1){
                            var returnedValue = this.callbacks[i].fn();
                            if(typeof returnedValue == 'boolean'){
                                // If we have a boolean: 'true' means 'no more execution', 'false' means 'keep on executing'
                                if(returnedValue){
                                    deadCallback.push(i);
                                }
                            } else if(typeof returnedValue == 'number') {
                                // If we have a number it re-defines the time to the next call
                                this.callbacks[i].rate = Math.round(returnedValue/$.gameQuery.refreshRate);
                                this.callbacks[i].idleCounter = 0;
                            }
                        }
                        this.callbacks[i].idleCounter = (this.callbacks[i].idleCounter+1)%this.callbacks[i].rate;
                    }
                    for(var i = deadCallback.length-1; i >= 0; i--){
                        this.callbacks.splice(deadCallback[i],1);
                    }
                }
            },

            /**
             * Add an animation to the resource Manager 
             */
            addAnimation: function(animation, callback) {
                if($.inArray(animation,this.animations)<0){
                    //normalize the animation rate:
                    animation.rate = Math.round(animation.rate/$.gameQuery.refreshRate);
                    if(animation.rate==0){
                        animation.rate = 1;
                    }
                    this.animations.push(animation);
                    switch ($.gameQuery.state){
                        case STATE_NEW:
                        case STATE_PAUSED:
                            // Nothing to do for now 
                            break;
                        case STATE_RUNNING:
                            // immediatly load the animation and call the callback if any
                            this.animations[this.loadedAnimationsPointer].domO = new Image();
                            this.animations[this.loadedAnimationsPointer].domO.src = animation.imageURL;
                            if (callback !== undefined){
                                this.animations[this.loadedAnimationsPointer].domO.onload = callback;
                            }
                            this.loadedAnimationsPointer++;
                            break;
                    }
                }
            },
            
            /**
             * Add a sound to the resource Manager 
             */
            addSound: function(sound, callback){
                if($.inArray(sound,this.sounds)<0){
                    this.sounds.push(sound);
                    switch ($.gameQuery.state){
                        case STATE_NEW:
                        case STATE_PAUSED:
                            // Nothing to do for now 
                            break;
                        case STATE_RUNNING:
                            // immediatly load the sound and call the callback if any
                            sound.load();
                            // TODO callback....
                            this.loadedSoundsPointer++;
                            break;
                    }
                }
            },

            /**
             * Register a callback
             * 
             * @param {function} fn the callback
             * @param {integer} rate the rate in ms at which the callback should be called (should be a multiple of the playground rate or will be rounded) 
             */
            registerCallback: function(fn, rate){
                rate  = Math.round(rate/$.gameQuery.refreshRate);
                if(rate==0){
                    rate = 1;
                }
                this.callbacks.push({fn: fn, rate: rate, idleCounter: 0});
            },
            
            /**
             * Clear the animations and sounds 
             */
            clear: function(callbacksToo){
                this.animations  = [];
                this.loadedAnimationsPointer = 0;
                this.sounds = [];
                this.loadedSoundsPointer = 0;
                if(callbacksToo) {
                    this.callbacks = [];
                }
            }
        },

        /**
         * This is a single place to update the underlying data of sprites/groups/tiles after a position or dimesion modification.
         */ 
        update: function(descriptor, transformation) {
            // Did we really receive a descriptor or a jQuery object instead?
            if(!$.isPlainObject(descriptor)){
                // Then we must get real descriptor
                if(descriptor.length > 0){
                    var gameQuery = descriptor[0].gameQuery;
                } else {
                    var gameQuery = descriptor.gameQuery;
                }
            } else {
                var gameQuery = descriptor;
            }
            // If we couldn't find one we return
            if(!gameQuery) return;
            if(gameQuery.tileSet === true){
                // We have a tilemap 
                
                var visible = visibleTilemapIndexes(descriptor);
                var buffered = gameQuery.buffered;
                
                // Test what kind of transformation we have and react accordingly 
                for(property in transformation){
                    switch(property){
                        case "x":
                        
                            if(visible.lastColumn > buffered.lastColumn) {
                                
                                // Detach the tilemap
                                var parent = descriptor[0].parentNode;
                                var tilemap = descriptor.detach();
                                
                                var newBuffered = bufferedTilemapIndexes(descriptor, visible);
                                for(var i = gameQuery.buffered.firstRow; i < gameQuery.buffered.lastRow; i++){
                                    // Remove the newly invisible tiles
                                    for(var j = gameQuery.buffered.firstColumn; j < Math.min(newBuffered.firstColumn, gameQuery.buffered.lastColumn); j++) {
                                        tilemap.find("#"+$.gameQuery.tileIdPrefix+descriptor.attr("id")+"_"+i+"_"+j).remove();
                                    }
                                    // And add the newly visible tiles
                                    for(var j = Math.max(gameQuery.buffered.lastColumn,newBuffered.firstColumn); j < newBuffered.lastColumn ; j++) {
                                        addTile(tilemap,i,j);
                                    }
                                }
                                
                                gameQuery.buffered.firstColumn = newBuffered.firstColumn;
                                gameQuery.buffered.lastColumn  = newBuffered.lastColumn;
                                
                                // Attach the tilemap back
                                tilemap.appendTo(parent);
                                
                            }
                            
                            if(visible.firstColumn < buffered.firstColumn) {
                                
                                // Detach the tilemap
                                var parent = descriptor[0].parentNode;
                                var tilemap = descriptor.detach();
                                    
                                var newBuffered = bufferedTilemapIndexes(descriptor, visible);
                                for(var i = gameQuery.buffered.firstRow; i < gameQuery.buffered.lastRow; i++){
                                    // Remove the newly invisible tiles
                                    for(var j = Math.max(newBuffered.lastColumn,gameQuery.buffered.firstColumn); j < gameQuery.buffered.lastColumn ; j++) {
                                        tilemap.find("#"+$.gameQuery.tileIdPrefix+descriptor.attr("id")+"_"+i+"_"+j).remove();
                                    }
                                    // And add the newly visible tiles
                                    for(var j = newBuffered.firstColumn; j < Math.min(gameQuery.buffered.firstColumn,newBuffered.lastColumn); j++) {
                                        addTile(tilemap,i,j);
                                    }
                                }
                                
                                gameQuery.buffered.firstColumn = newBuffered.firstColumn;
                                gameQuery.buffered.lastColumn  = newBuffered.lastColumn;
                                
                                // Attach the tilemap back
                                tilemap.appendTo(parent);
                            }
                            break;
                            
                        case "y":
                        
                            if(visible.lastRow > buffered.lastRow) {
                                
                                // Detach the tilemap
                                var parent = descriptor[0].parentNode;
                                var tilemap = descriptor.detach();
                                
                                var newBuffered = bufferedTilemapIndexes(descriptor, visible);
                                for(var j = gameQuery.buffered.firstColumn; j < gameQuery.buffered.lastColumn ; j++) {
                                    // Remove the newly invisible tiles
                                    for(var i = gameQuery.buffered.firstRow; i < Math.min(newBuffered.firstRow, gameQuery.buffered.lastRow); i++){
                                        tilemap.find("#"+$.gameQuery.tileIdPrefix+descriptor.attr("id")+"_"+i+"_"+j).remove();
                                    }
                                    // And add the newly visible tiles
                                    for(var i = Math.max(gameQuery.buffered.lastRow, newBuffered.firstRow); i < newBuffered.lastRow; i++){
                                        addTile(tilemap,i,j);
                                    }
                                }
                                
                                gameQuery.buffered.firstRow = newBuffered.firstRow;
                                gameQuery.buffered.lastRow  = newBuffered.lastRow;
                                
                                // Attach the tilemap back
                                tilemap.appendTo(parent);
                                
                            }  
                            
                            if(visible.firstRow < buffered.firstRow) {
                                
                                // Detach the tilemap
                                var parent = descriptor[0].parentNode;
                                var tilemap = descriptor.detach();
                                
                                var newBuffered = bufferedTilemapIndexes(descriptor, visible);
                                for(var j = gameQuery.buffered.firstColumn; j < gameQuery.buffered.lastColumn ; j++) {
                                    // Remove the newly invisible tiles
                                    for(var i = Math.max(newBuffered.lastRow, gameQuery.buffered.firstRow); i < gameQuery.buffered.lastRow; i++){
                                        tilemap.find("#"+$.gameQuery.tileIdPrefix+descriptor.attr("id")+"_"+i+"_"+j).remove();
                                    }
                                    // And add the newly visible tiles
                                    for(var i = newBuffered.firstRow; i < Math.min(gameQuery.buffered.firstRow, newBuffered.lastRow); i++){
                                        addTile(tilemap,i,j);
                                    }
                                }
                                
                                gameQuery.buffered.firstRow = newBuffered.firstRow;
                                gameQuery.buffered.lastRow  = newBuffered.lastRow;
                                
                                // Attach the tilemap back
                                tilemap.appendTo(parent);
                            }
                            break;
                            
                        case "angle":
                            //TODO
                            break;
                            
                        case "factor":
                            //TODO
                            break;
                    }
                }

            } else {
                var refreshBoundingCircle = $.gameQuery.playground && !$.gameQuery.playground.disableCollision;

                // Update the descriptor
                for(property in transformation){
                    switch(property){
                        case "x":
                            if(refreshBoundingCircle){
                                gameQuery.boundingCircle.x = gameQuery.posx+gameQuery.width/2;
                            }
                            break;
                        case "y":
                            if(refreshBoundingCircle){
                                gameQuery.boundingCircle.y = gameQuery.posy+gameQuery.height/2;
                            }
                            break;
                        case "w":
                        case "h":
                            gameQuery.boundingCircle.originalRadius = Math.sqrt(Math.pow(gameQuery.width,2) + Math.pow(gameQuery.height,2))/2
                            gameQuery.boundingCircle.radius = gameQuery.factor*gameQuery.boundingCircle.originalRadius;
                            break;
                        case "angle": //(in degrees)
                            gameQuery.angle = parseFloat(transformation.angle);
                            break;
                        case "factor":
                            gameQuery.factor = parseFloat(transformation.factor);
                            if(refreshBoundingCircle){
                                gameQuery.boundingCircle.radius = gameQuery.factor*gameQuery.boundingCircle.originalRadius;
                            }
                            break;
                    }
                }
            }
        },
        // State of the engine
        state: STATE_NEW,
        
        // CSS classes used to mark game element 
        spriteCssClass:  gQprefix + "sprite",
        groupCssClass:   gQprefix + "group",
        tilemapCssClass: gQprefix + "tilemap",
        tileCssClass:    gQprefix + "tile",
        // Prefix for CSS Ids or Classes
        tileTypePrefix:  gQprefix + "tileType_",
        tileIdPrefix:    gQprefix + "tile_"
    },

    /** 
     * Mute (or unmute) all the sounds.
     */
    muteSound: function(muted){
        for (var i = $.gameQuery.resourceManager.sounds.length-1 ; i >= 0; i --) {
            $.gameQuery.resourceManager.sounds[i].muted(muted);
        }
    },
    
    /**
     * Accessor for the currently defined playground as a jQuery object
     */
    playground: function() {
        return $.gameQuery.playground
    },
    
    /**
     * Define a callback called during the loading of the game's resources.
     *
     * The function will recieve as unique parameter
     * a number representing the progess percentage.
     */
    loadCallback: function(callback){
        $.gameQuery.resourceManager.loadCallback = callback;
    }
    }); // end of the extensio of $


    // fragments used to create DOM element
    var spriteFragment  = $("<div class='"+$.gameQuery.spriteCssClass+"'  style='position: absolute; display: block; overflow: hidden' />");
    var groupFragment   = $("<div class='"+$.gameQuery.groupCssClass+"'  style='position: absolute; display: block; overflow: hidden' />");
    var tilemapFragment = $("<div class='"+$.gameQuery.tilemapCssClass+"' style='position: absolute; display: block; overflow: hidden;' />");


    // Define the list of object/function accessible through $("selector").
    $.fn.extend({
        /**
         * Defines the currently selected div to which contains the game and initialize it.
         * 
         * This is a non-destructive call
         */
        playground: function(options) {
            if(this.length == 1){
                if(this[0] == document){ 
                    // Old usage detected, this is not supported anymore
                    throw "Old playground usage, use $.playground() to retreive the playground and $('mydiv').playground(options) to set the div!";
                }
                options = $.extend({
                    height:        320,
                    width:        480,
                    refreshRate: 30,
                    position:    "absolute",
                    keyTracker:    false,
                    mouseTracker: false,
                    disableCollision: false
                }, options);
                // We save the playground node and set some variable for this node:
                $.gameQuery.playground = this;
                $.gameQuery.refreshRate = options.refreshRate;
                $.gameQuery.playground[0].height = options.height;
                $.gameQuery.playground[0].width = options.width;

                // We initialize the display of the div
                $.gameQuery.playground.css({
                        position: options.position,
                        display:  "block",
                        overflow: "hidden",
                        height:   options.height+"px",
                        width:    options.width+"px"
                    })
                    .append("<div id='"+gQprefix+"scenegraph' style='visibility: hidden'/>");

                $.gameQuery.scenegraph = $("#"+gQprefix+"scenegraph");

                // Add the keyTracker to the gameQuery object:
                $.gameQuery.keyTracker = {};
                // We only enable the real tracking if the users wants it
                if(options.keyTracker){
                    $(document).keydown(function(event){
                        $.gameQuery.keyTracker[event.keyCode] = true;
                    });
                    $(document).keyup(function(event){
                        $.gameQuery.keyTracker[event.keyCode] = false;
                    });
                }
                
                // Add the mouseTracker to the gameQuery object:
                 $.gameQuery.mouseTracker = {
                    x: 0,
                    y: 0};
                // We only enable the real tracking if the users wants it
                var scenegraphOffset = $.gameQuery.playground.offset();
                if(options.mouseTracker){
                    $($.gameQuery.playground).mousemove(function(event){
                        $.gameQuery.mouseTracker.x = event.pageX - scenegraphOffset.left;
                        $.gameQuery.mouseTracker.y = event.pageY - scenegraphOffset.top;
                    });
                    $(document).mousedown(function(event){
                        $.gameQuery.mouseTracker[event.which] = true;
                    });
                    $(document).mouseup(function(event){
                        $.gameQuery.mouseTracker[event.which] = false;
                    });
                }
            }
            return this;
        },

        /**
         * Starts the game.
         *
         * Resources from the resource manager are preloaded if necesary
         * Works only for the playground node.
         *
         * This is a non-destructive call
         */
        startGame: function(callback) {
            $.gameQuery.startCallback = callback;
            $.gameQuery.resourceManager.preload();
            return this;
        },
        
        /**
         * TODO
         */
        pauseGame: function() {
            $.gameQuery.state = STATE_PAUSED;
            $.gameQuery.scenegraph.css("visibility","hidden");
            return this;
        },
        
        /**
         * Resume the game if it was paused and call the callback passed in argument once the newly added ressources are loaded.
         */
        resumeGame: function(callback) {
            if($.gameQuery.state === STATE_PAUSED){
                $.gameQuery.startCallback = callback;
                $.gameQuery.resourceManager.preload();
            }
            return this;
        },

        /**
         * Removes all the sprites, groups and tilemaps present in the scenegraph
         */
        clearScenegraph: function() {
            $.gameQuery.scenegraph.empty()
            return this;
        },
        
        /**
         * Removes all the sprites, groups and tilemaps present in the scenegraph as well as all loaded animations and sounds
         */
        clearAll: function(callbackToo) {
            $.gameQuery.scenegraph.empty();
            $.gameQuery.resourceManager.clear(callbackToo)
            return this;
        },

        /**
         * Add a group to the scene graph. Works only on the scenegraph root or on another group
         *
         * This IS a destructive call and should be terminated with end()
         * to go back one level up in the chaining
         */
        addGroup: function(group, options) {
            options = $.extend({
                width:      32,
                height:     32,
                posx:       0,
                posy:       0,
                posz:       0,
                posOffsetX: 0,
                posOffsetY: 0,
                overflow:   "visible",
                geometry:   $.gameQuery.GEOMETRY_RECTANGLE,
                angle:      0,
                factor:     1,
                factorh:    1,
                factorv:    1
            }, options);

            var newGroupElement = groupFragment.clone().attr("id",group).css({
                    overflow: options.overflow,
                    height:   options.height,
                    width:    options.width
                });
            
            if(this == $.gameQuery.playground){
                $.gameQuery.scenegraph.append(newGroupElement);
            } else if ((this == $.gameQuery.scenegraph)||(this.hasClass($.gameQuery.groupCssClass))){
                this.append(newGroupElement);
            }
            newGroupElement[0].gameQuery = options;
            newGroupElement[0].gameQuery.boundingCircle = {x: options.posx + options.width/2,
                                                    y: options.posy + options.height/0,
                                                    originalRadius: Math.sqrt(Math.pow(options.width,2) + Math.pow(options.height,2))/2};
            newGroupElement[0].gameQuery.boundingCircle.radius = newGroupElement[0].gameQuery.boundingCircle.originalRadius;
            newGroupElement[0].gameQuery.group = true;
            newGroupElement.transform();
            return this.pushStack(newGroupElement);
        },

        /**
         * Add a sprite to the current node. Works only on the playground or any of its sub-nodes 
         * 
         * This is a non-destructive call
         */
        addSprite: function(sprite, options) {
            options = $.extend({
                width:          32,
                height:         32,
                posx:           0,
                posy:           0,
                posz:           0,
                posOffsetX:     0,
                posOffsetY:     0,
                idleCounter:    0,
                currentFrame:   0,
                frameIncrement: 1,
                geometry:       $.gameQuery.GEOMETRY_RECTANGLE,
                angle:          0,
                factor:         1,
                playing:        true,
                factorh:        1,
                factorv:        1
            }, options);

            var newSpriteElem = spriteFragment.clone().attr("id",sprite).css({
                     height: options.height,
                     width: options.width,
                     backgroundPosition: ((options.animation)? -options.animation.offsetx : 0)+"px "+((options.animation)? -options.animation.offsety : 0)+"px"
                });
                
            if(this == $.gameQuery.playground){
                $.gameQuery.scenegraph.append(newSpriteElem);
            } else {
                this.append(newSpriteElem);
            }

            // If the game has already started we want to add the animation's image as a background now
            if(options.animation){
                // The second test is a fix for default background    (https://github.com/onaluf/gameQuery/issues/3)
                if($.gameQuery.state === STATE_RUNNING && options.animation.imageURL !== ''){
                    newSpriteElem.css("background-image", "url("+options.animation.imageURL+")");
                }
                if(options.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                    newSpriteElem.css("background-repeat", "repeat-x");
                } else if(options.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                    newSpriteElem.css("background-repeat", "repeat-y");
                } else {
                    newSpriteElem.css("background-repeat", "no-repeat");
                }
            }


            var spriteDOMObject = newSpriteElem[0];
            if(spriteDOMObject != undefined){
                spriteDOMObject.gameQuery = options;
                // Compute bounding Circle
                spriteDOMObject.gameQuery.boundingCircle = {x: options.posx + options.width/2,
                                                            y: options.posy + options.height/2,
                                                            originalRadius: Math.sqrt(Math.pow(options.width,2) + Math.pow(options.height,2))/2};
                spriteDOMObject.gameQuery.boundingCircle.radius = spriteDOMObject.gameQuery.boundingCircle.originalRadius;
            }
            newSpriteElem.transform();
            return this;
        },

        /**
         * Add a Tile Map to the selected element.
         *
         * This is a non-destructive call. The added sprite is NOT selected after a call to this function!
         */
        addTilemap: function(name, tileDescription, animationList, options){
            options = $.extend({
                width:          32,
                height:         32,
                sizex:          32,
                sizey:          32,
                posx:           0,
                posy:           0,
                posz:           0,
                posOffsetX:     0,
                posOffsetY:     0,
                angle:          0,
                factor:         1,
                factorh:        1,
                factorv:        1,
                buffer:         1
            }, options);

            var tileSet = tilemapFragment.clone().attr("id",name).css({
                    height: options.height*options.sizey, 
                    width: options.width*options.sizex
                });
            
            if(this == $.gameQuery.playground){
                $.gameQuery.scenegraph.append(tileSet);
            } else {
                this.append(tileSet);
            }
            
            tileSet[0].gameQuery = options;
            var gameQuery = tileSet[0].gameQuery;
            gameQuery.tileSet = true;
            gameQuery.tiles = tileDescription;
            gameQuery.func = (typeof tileDescription === "function");
                
            if($.isArray(animationList)){
                var frameTracker = [];
                var idleCounter = [];
                var frameIncrement = [];
                for(var i=0; i<animationList.length; i++){
                    frameTracker[i] = 0;
                    idleCounter[i] = 0;
                    frameIncrement[i] = 1;
                }
                gameQuery.frameTracker = frameTracker;
                gameQuery.animations = animationList;
                gameQuery.idleCounter =  idleCounter;
                gameQuery.frameIncrement = frameIncrement;
                gameQuery.multi = false;
            } else {
                gameQuery.frameTracker = 0;
                gameQuery.frameIncrement = 1;
                gameQuery.animations = animationList;
                gameQuery.idleCounter =  0;
                gameQuery.multi = true;
                
            }

            // Get the tileSet offset (relative to the playground)
            var visible = visibleTilemapIndexes(tileSet);
            var buffered = bufferedTilemapIndexes(tileSet, visible);
            gameQuery.buffered = buffered;

            // For many simple animation
            for(var i = buffered.firstRow; i < buffered.lastRow; i++){
                for(var j = buffered.firstColumn; j < buffered.lastColumn ; j++) {
                    addTile(tileSet, i, j);
                }
            }
            tileSet.transform()
            return this.pushStack(tileSet);
        },
        
        /**
         * This function imports a JSON file generated by Tiled (http://www.mapeditor.org/). 
         * All the created tilemaps will be directly under the currently selected element. 
         * Their name will be made of the provided prefix followed by a number starting at 0. 
         * 
         * Only layer of type "tilelayer" are supported for now. Only one single tileset 
         * per layer is supported.
         * 
         * After the call to this function the second argument will hold two new arrays:
         * - tiles: an arrays of tilemaps wraped in jQuery.
         * - animations: an arrays of animations 
         * 
         * This is a non-destructive call
         */
        importTilemaps: function(url, prefix, generatedElements){
            var animations = [];
            var tilemaps = [];
            
            var that = this;
            
            var tilemapJsonLoaded = function(json){
                var tilesetGID = [];
                for (var i = 0; i < json.tilesets.length; i++) {
                    tilesetGID[i] = json.tilesets[i].firstgid;
                } 
                
                var getTilesetIndex = function(index){
                    var i = 0;
                    while(index >= tilesetGID[i] && i < tilesetGID.length){
                        i++;
                    }
                    return i-1;
                }
        
                var height = json.height;
                var width  = json.width;
                var tileHeight = json.tileheight; 
                var tileWidth  = json.tilewidth;
                
                var layers = json.layers;
                var usedTiles = [];
                var animationCounter = 0;
                var tilemapArrays = [];
                
                // Detect which animations we need to generate
                // and convert the tiles array indexes to the new ones
                for (var i=0; i < layers.length; i++){
                    if(layers[i].type === "tilelayer"){
                        var tilemapArray = new Array(height);
                        for (var j=0; j<height; j++){
                            tilemapArray[j] = new Array(width);
                        }
                        for (var j=0; j < layers[i].data.length; j++){
                            var tile = layers[i].data[j];
                            if(tile === 0){
                                tilemapArray[Math.floor(j / width)][j % width] = 0;
                            } else {
                                if(!usedTiles[tile]){
                                    animationCounter++;
                                    usedTiles[tile] = animationCounter;
                                    animations.push(new $.gameQuery.Animation({
                                        imageURL: json.tilesets[getTilesetIndex(tile)].image,
                                        offsetx: ((tile-1) % Math.floor(json.tilesets[getTilesetIndex(tile)].imagewidth / tileWidth)) * tileWidth,
                                        offsety: Math.floor((tile-1) / Math.floor(json.tilesets[getTilesetIndex(tile)].imagewidth / tileWidth)) * tileHeight
                                    }));
                                }
                                tilemapArray[Math.floor(j / width)][j % width] = usedTiles[tile];
                            }
                        }
                        tilemapArrays.push(tilemapArray);
                    }
                }
                // adding the tilemaps
                for (var i=0; i<tilemapArrays.length; i++){
                     tilemaps.push(that.addTilemap(
                        prefix+i, 
                        tilemapArrays[i],
                        animations,
                        {
                            sizex:  width,
                            sizey:  height,
                            width:  tileWidth,
                            height: tileHeight
                    }));
                }
            };
    
            $.ajax({
                url: url,
                async: false,
                dataType: 'json',
                success: tilemapJsonLoaded
            });
            
            if(generatedElements !== undefined){
                generatedElements.animations = animations;
                generatedElements.tilemaps = tilemaps;
            }
        
            return this;
        },

        /**
         * Stop the animation at the current frame
         * 
         * This is a non-destructive call.
         */
        pauseAnimation: function() {
            this[0].gameQuery.playing = false;
            return this;
        },

        /**
         * Resume the animation (if paused)
         * 
         * This is a non-destructive call.
         */
        resumeAnimation: function() {
            this[0].gameQuery.playing = true;
            return this;
        },

        /**
         * Changes the animation associated with a sprite.
         *
         * WARNING: no checks are made to ensure that the object is really a sprite
         *
         * This is a non-destructive call.
         */
        setAnimation: function(animation, callback) {
            var gameQuery = this[0].gameQuery;
            if(typeof animation == "number"){
                if(gameQuery.animation.type & $.gameQuery.ANIMATION_MULTI){
                    var distance = gameQuery.animation.distance * animation;
                    gameQuery.multi = distance;
                    gameQuery.frameIncrement = 1;
                    gameQuery.currentFrame = 0;
                    
                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                        this.css("background-position",""+(-distance-gameQuery.animation.offsetx)+"px "+(-gameQuery.animation.offsety)+"px");
                    } else if(gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                        this.css("background-position",""+(-gameQuery.animation.offsetx)+"px "+(-distance-gameQuery.animation.offsety)+"px");
                    }
                }
            } else {
                if(animation){
                    gameQuery.animation = animation;
                    gameQuery.currentFrame = 0;
                    gameQuery.frameIncrement = 1;

                    if (animation.imageURL !== '') {this.css("backgroundImage", "url('"+animation.imageURL+"')");}
                    this.css({"background-position": ""+(-animation.offsetx)+"px "+(-animation.offsety)+"px"});

                    if(gameQuery.animation.type & $.gameQuery.ANIMATION_VERTICAL) {
                        this.css("background-repeat", "repeat-x");
                    } else if(gameQuery.animation.type & $.gameQuery.ANIMATION_HORIZONTAL) {
                        this.css("background-repeat", "repeat-y");
                    } else {
                        this.css("background-repeat", "no-repeat");
                    }
                } else {
                    this.css("background-image", "");
                }
            }

            if(callback != undefined){
                this[0].gameQuery.callback = callback;
            }

            return this;
        },

        /**
         * Register a callback funnction
         *
         * This is a non-destructive call
         *
         * @param {Function} fn the callback function.
         * @param {Number} rate time in milliseconds between calls.
         */
        registerCallback: function(fn, rate) {
            $.gameQuery.resourceManager.registerCallback(fn, rate);
            return this;
        },

        /**
         * Retrieve a list of objects in collision with the subject.
         *
         * If 'this' is a sprite or a group, the function will retrieve the list of sprites (not groups!!!) that touch it. For now all abject are considered to be boxes.
         *
         * This IS a destructive call and should be terminated with end() to go back one level up in the chaining.
         */
        collision: function(arg1, arg2){
            var filter, override;
            if ($.isPlainObject(arg1)){
                override = arg1;
            } else if (typeof arg1 === "string") {
                filter = arg1;
            }
            if ($.isPlainObject(arg2)){
                override = arg2;
            } else if (typeof arg2 === "string") {
                filter = arg2;
            }
            
            var resultList = [];

            // Retrieve 'this' offset by looking at the parents
            var itsParent = this[0].parentNode, offsetX = 0, offsetY = 0;
            while (itsParent != $.gameQuery.playground[0]){
                    if(itsParent.gameQuery){
                    offsetX += itsParent.gameQuery.posx;
                    offsetY += itsParent.gameQuery.posy;
                }
                itsParent = itsParent.parentNode;
            }

            // Retrieve the playground's absolute position and size information
            var pgdGeom = {top: 0, left: 0, bottom: $.playground().height(), right: $.playground().width()};

            // Retrieve the gameQuery object and correct it with the override
            var gameQuery = jQuery.extend(true, {}, this[0].gameQuery);

            // Retrieve the BoundingCircle and correct it with the override
            var boundingCircle = jQuery.extend(true, {}, gameQuery.boundingCircle);
            if(override && override.w){
                gameQuery.width = override.w;
            }
            if(override && override.h){
                gameQuery.height = override.h;
            }
            boundingCircle.originalRadius = Math.sqrt(Math.pow(gameQuery.width,2) + Math.pow(gameQuery.height,2))/2
            boundingCircle.radius = gameQuery.factor*boundingCircle.originalRadius;
            
            if(override && override.x){
                boundingCircle.x = override.x + gameQuery.width/2.0;
            }
            if(override && override.y){
                boundingCircle.y = override.y + gameQuery.height/2.0;
            }
            
            gameQuery.boundingCircle = boundingCircle;
            

            // Is 'this' inside the playground ?
            if( (gameQuery.boundingCircle.y + gameQuery.boundingCircle.radius + offsetY < pgdGeom.top)    ||
                (gameQuery.boundingCircle.x + gameQuery.boundingCircle.radius + offsetX < pgdGeom.left)   ||
                (gameQuery.boundingCircle.y - gameQuery.boundingCircle.radius + offsetY > pgdGeom.bottom) ||
                (gameQuery.boundingCircle.x - gameQuery.boundingCircle.radius + offsetX > pgdGeom.right)){
                return this.pushStack(new $([]));
            }

            if(this !== $.gameQuery.playground){
                // We must find all the elements that touche 'this'
                var elementsToCheck = new Array();
                elementsToCheck.push($.gameQuery.scenegraph.children(filter).get());
                elementsToCheck[0].offsetX = 0;
                elementsToCheck[0].offsetY = 0;

                for(var i = 0, len = elementsToCheck.length; i < len; i++) {
                    var subLen = elementsToCheck[i].length;
                    while(subLen--){
                        var elementToCheck = elementsToCheck[i][subLen];
                        // Is it a gameQuery generated element?
                        if(elementToCheck.gameQuery){
                            // We don't want to check groups
                            if(!elementToCheck.gameQuery.group && !elementToCheck.gameQuery.tileSet){
                                // Does it touche the selection?
                                if(this[0]!=elementToCheck){
                                    // Check bounding circle collision
                                    var distance = Math.sqrt(Math.pow(offsetY + gameQuery.boundingCircle.y - elementsToCheck[i].offsetY - elementToCheck.gameQuery.boundingCircle.y, 2) + Math.pow(offsetX + gameQuery.boundingCircle.x - elementsToCheck[i].offsetX - elementToCheck.gameQuery.boundingCircle.x, 2));
                                    if(distance - gameQuery.boundingCircle.radius - elementToCheck.gameQuery.boundingCircle.radius <= 0){
                                        // Check real collision
                                        if(collide(gameQuery, {x: offsetX, y: offsetY}, elementToCheck.gameQuery, {x: elementsToCheck[i].offsetX, y: elementsToCheck[i].offsetY})) {
                                            // Add to the result list if collision detected
                                            resultList.push(elementsToCheck[i][subLen]);
                                        }
                                    }
                                }
                            }
                            // Add the children nodes to the list
                            var eleChildren = $(elementToCheck).children(filter);
                            if(eleChildren.length){
                                elementsToCheck.push(eleChildren.get());
                                elementsToCheck[len].offsetX = elementToCheck.gameQuery.posx + elementsToCheck[i].offsetX;
                                elementsToCheck[len].offsetY = elementToCheck.gameQuery.posy + elementsToCheck[i].offsetY;
                                len++;
                            }
                        }
                    }
                }
                return this.pushStack($(resultList));
            }
        },

/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/
/** --          Sound related functions           ------------------------------------------------------------------------------------------------------------------ **/
/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/

        /**
         * Add the sound to the resourceManager for later use and
         * associates it to the selected dom element(s).
         * 
         * This is a non-destructive call
         */
        addSound: function(sound, add) {
            // Does a SoundWrapper exist?
            if($.gameQuery.SoundWrapper) {
                var gameQuery = this[0].gameQuery;
                // Should we add to existing sounds?
                if(add) {
                    // Do we have some sound associated with 'this'?
                    var sounds = gameQuery.sounds;
                    if(sounds) {
                        // Yes, we add it
                        sounds.push(sound);
                    } else {
                        // No, we create a new sound array
                        gameQuery.sounds = [sound];
                    }
                } else {
                    // No, we replace all sounds with this one
                    gameQuery.sounds = [sound];
                }
            }
            return this;
        },

        /**
         * Play the sound(s) associated with the selected dom element(s).
         * 
         * This is a non-destructive call.
         */
        playSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].play();
                    }
                }
            });

            return this;
        },

        /**
         * Stops the sound(s) associated with the selected dom element(s) and rewinds them.
         * 
         * This is a non-destructive call.
         */
        stopSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].stop();
                    }
                }
            });
            return this;
        },


        /**
         * Pauses the sound(s) associated with the selected dom element(s).
         * 
         * This is a non-destructive call.
         */

        pauseSound: function() {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].pause();
                    }
                }
            });
            return this;
        },


        /**
         * Mute or unmute the selected sound or all the sounds if none is specified.
         * 
         * This is a non-destructive call.
         */

        muteSound: function(muted) {
            $(this).each(function(){
                var gameQuery = this.gameQuery;
                if(gameQuery.sounds) {
                    for(var i = gameQuery.sounds.length-1 ; i >= 0; i --) {
                        gameQuery.sounds[i].muted(muted);
                    }
                }
            });
            return this;
        },


/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/
/** --          Transformation functions           ----------------------------------------------------------------------------------------------------------------- **/
/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/

        /**
         * Internal function doing the combined actions of rotate and scale. 
         * 
         * Please use .rotate() or .scale() instead since they are part of the supported API!
         * 
         * This is a non-destructive call.
         */
        transform: function() {
            var gameQuery = this[0].gameQuery;

			if(cssTransform){
				var transform = "translate("+gameQuery.posx+"px, "+gameQuery.posy+"px) rotate("+gameQuery.angle+"deg) scale("+(gameQuery.factor*gameQuery.factorh)+","+(gameQuery.factor*gameQuery.factorv)+")";
				this.css(cssTransform,transform);
			} else {
                // Only apply filter if really necessary (break PNG alpha channel and is very slow)
                if (gameQuery.angle !== 0 || gameQuery.factor !== 1 || gameQuery.factorh !== 1 || gameQuery.factorv !== 1) {
                    var angle_rad = Math.PI * 2 / 360 * gameQuery.angle;
                    // try filter for IE
                    // For ie from 5.5
                    var cos = Math.cos(angle_rad) * gameQuery.factor;
                    var sin = Math.sin(angle_rad) * gameQuery.factor;
                    this.css("filter","progid:DXImageTransform.Microsoft.Matrix(M11="+(cos*gameQuery.factorh)+",M12="+(-sin*gameQuery.factorv)+",M21="+(sin*gameQuery.factorh)+",M22="+(cos*gameQuery.factorv)+",SizingMethod='auto expand',FilterType='nearest neighbor')");
                }
                var newWidth = this.width();
                var newHeight = this.height();
                gameQuery.posOffsetX = (newWidth-gameQuery.width)/2;
                gameQuery.posOffsetY = (newHeight-gameQuery.height)/2;

                this.css("left", ""+(gameQuery.posx-gameQuery.posOffsetX)+"px");
                this.css("top", ""+(gameQuery.posy-gameQuery.posOffsetY)+"px");
			}
			
            return this;
        },

        /**
         * Rotate the element(s) clock-wise.
         *
         * @param {Number} angle the angle in degrees
         * @param {Boolean} relative or not
         *
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call since the return value is the current rotation angle!
         */
        rotate: function(angle, relative){
             var gameQuery = this[0].gameQuery;
 
             if(angle !== undefined) {
             	 if(relative === true){
                    angle += gameQuery.angle;
                    angle %= 360;
            	 }
                 $.gameQuery.update(gameQuery,{angle: angle});
                 return this.transform();
             } else {
                 var ang = gameQuery.angle;
                 return ang;
             }
        },

        /**
         * Change the scale of the selected element(s). The passed argument is a ratio:
         *
         * @param {Number} factor a ratio: 1.0 = original size, 0.5 = half the original size etc.
         * @param {Boolean} relative or not
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call since the return value is the current scale factor!
         */
        scale: function(factor, relative){
             var gameQuery = this[0].gameQuery;
 
             if(factor !== undefined) {
             	if(relative === true){
                    factor *= gameQuery.factor;
            	 }
                 $.gameQuery.update(gameQuery,{factor: factor});
                 return this.transform();
             } else {
                 var fac = gameQuery.factor;
                 return fac;
             }
        },

        /**
         * Flips the element(s) horizontally.
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call since the return value is the current horizontal flipping status!
         */
        fliph: function(flip){
            var gameQuery = this[0].gameQuery;

            if (flip === undefined) {
                return (gameQuery.factorh !== undefined) ? (gameQuery.factorh === -1) : false;
            } else if (flip) {
                gameQuery.factorh = -1;
            } else {
                gameQuery.factorh = 1;
            }

            return this.transform();
        },

        /**
         * Flips the element(s) vertically.
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call since the return value is the current vertical flipping status!
         */
        flipv: function(flip){
            var gameQuery = this[0].gameQuery;

            if (flip === undefined) {
                return (gameQuery.factorv !== undefined) ? (gameQuery.factorv === -1) : false;;
            } else if (flip) {
                gameQuery.factorv = -1;
            } else {
                gameQuery.factorv = 1;
            }

            return this.transform();
        },

/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/
/** --          Position getter/setter functions           --------------------------------------------------------------------------------------------------------- **/
/** ---------------------------------------------------------------------------------------------------------------------------------------------------------------- **/

        /**
         * Main function to change the sprite/group/tilemap position on screen.
         * The three first agruments are the coordiate (double) and the last one is a flag
         * to specify if the coordinate given are absolute or relative.
         *
         * If no argument is specified then the functions act as a getter and return a
         * object {x,y,z}
         *
         * Please note that the z coordinate is just the z-index.
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call.
         */
        xyz: function(x, y, z, relative) {
             if (x === undefined) {
                 return this.getxyz();
             } else {
                 return this.setxyz({x: x, y: y, z: z}, relative);
             }
        },

        /**
         * The following functions are all all shortcuts for the .xyz(...) function.
         *
         * @see xyz for detailed documentation.
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call.
         */
        x: function(value, relative) {
             if (value === undefined) {
                 return this.getxyz().x;
             } else {
                 return this.setxyz({x: value}, relative);
             }
        },

        y: function(value, relative) {
             if (value === undefined) {
                 return this.getxyz().y;
             } else {
                 return this.setxyz({y: value}, relative);
             }
        },

        z: function(value, relative) {
             if (value === undefined) {
                 return this.getxyz().z;
             } else {
                 return this.setxyz({z: value}, relative);
             }
        },

        xy: function(x, y, relative) {
             if (x === undefined) {
                 // we return the z too since it doesn't cost anything
                 return this.getxyz();
             } else {
                 return this.setxyz({x: x, y: y}, relative);
             }
        },

        /**
         * Main function to change the sprite/group/tilemap dimension on screen.
         * The two first arguments are the width and height (double) and the last one is a
         * flag to specify if the dimensions given are absolute or relative.
         *
         * If no argument is specified then the functions act as a getter and
         *
         * return an object {w,h}
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call.
         */
        wh: function(w, h, relative) {
            if (w === undefined) {
                 return this.getwh();
             } else {
                 return this.setwh({w: w, h: h}, relative);
             }
        },

        /**
         * The following functions are all all shortcuts for the .wh(...) function.
         *
         * @see wh for detailed documentation.
         * 
         * This is a non-destructive call when called with a parameter. Without parameter it IS a destructive call.
         */
        w: function(value, relative) {
            if (value === undefined) {
                 return this.getwh().w;
             } else {
                 return this.setwh({w: value}, relative);
             }
        },

        h: function(value, relative) {
            if (value === undefined) {
                 return this.getwh().h;
             } else {
                 return this.setwh({h: value}, relative);
             }
        },

        /**
         * The following four functions are 'private', and are not supposed to
         * be used outside of the library.
         * They are NOT part of the API and so are not guaranteed to remain unchanged.
         * You should really use .xyz() and .wh() instead.
         */
        getxyz: function() {
            var gameQuery = this[0].gameQuery;
            return {x: gameQuery.posx, y: gameQuery.posy, z: gameQuery.posz};
        },

        setxyz: function(option, relative) {
            var gameQuery = this[0].gameQuery;

            for (coordinate in option) {
                // Update the gameQuery object
                switch (coordinate) {
                    case 'x':
                        if(relative) {
                            option.x += gameQuery.posx;
                        }
                        gameQuery.posx = option.x;
                        this.transform();
                        
                        //update the sub tile maps (if any), this forces to recompute which tiles are visible
                        this.find("."+$.gameQuery.tilemapCssClass).each(function(){
                            $(this).x(0, true);
                        });
                        break;

                    case 'y':
                        if(relative) {
                            option.y += gameQuery.posy;
                        }
                        gameQuery.posy = option.y;
                        this.transform();
                        
                        //update the sub tile maps (if any), this forces to recompute which tiles are visible
                        this.find("."+$.gameQuery.tilemapCssClass).each(function(){
                            $(this).y(0, true);
                        });
                        break;

                    case 'z':
                        if(relative) {
                            option.z += gameQuery.posz;
                        }
                        gameQuery.posz = option.z;
                        this.css("z-index",gameQuery.posz);
                        break;
                }
            }
            $.gameQuery.update(this, option);
            return this;
        },

        getwh: function() {
            var gameQuery = this[0].gameQuery;
            return {w: gameQuery.width, h: gameQuery.height};
        },

        setwh: function(option, relative) {
            var gameQuery = this[0].gameQuery;

            for (coordinate in option) {
                // Update the gameQuery object
                switch (coordinate) {
                    case 'w':
                        if(relative) {
                            option.w += gameQuery.width;
                        }
                        gameQuery.width = option.w;
                        this.css("width","" + gameQuery.width + "px");
                        break;

                    case 'h':
                        if(relative) {
                            option.h += gameQuery.height;
                        }
                        gameQuery.height = option.h;
                        this.css("height","" + gameQuery.height + "px");
                        break;
                }
            }
            $.gameQuery.update(this, option);
            return this;
        }
    }); // end of the extensio of $.fn

    // alias gameQuery to gQ for easier access
    $.extend({ gQ: $.gameQuery}); 
})(jQuery);
