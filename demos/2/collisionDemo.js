var PLAYGROUND_WIDTH = 600 ;
var PLAYGROUND_HEIGHT = 300;
var NUMBER_OF_REDS = 50;
var bluePosX = 285;
var bluePosY = 135;
	
soundManager.debugMode = false;

/**
 * This object represents a moving red square
 **/
function updateSquare(jQueryNode,deltaT){
	var new_posX = jQueryNode.x() + deltaT*jQueryNode[0].gameQuery.speedx;
	var new_posY = jQueryNode.y() + deltaT*jQueryNode[0].gameQuery.speedy;
	
	if(new_posX<0 || (new_posX+30) > PLAYGROUND_WIDTH){
		jQueryNode[0].gameQuery.speedx = -jQueryNode[0].gameQuery.speedx;
		jQueryNode.x(deltaT*jQueryNode[0].gameQuery.speedx, true);
	} else {
		jQueryNode.x(new_posX);
	}
	
	if(new_posY < 0 || (new_posY+30) > PLAYGROUND_HEIGHT){
		jQueryNode[0].gameQuery.speedy = -jQueryNode[0].gameQuery.speedy;
		jQueryNode.y(deltaT*jQueryNode[0].gameQuery.speedy, true);
	} else {
		jQueryNode.y(new_posY);
	}
	jQueryNode.rotate(jQueryNode.rotate()+3);

}


// --------------------------------------------------------------------------------------------------------------------
// --                                      the main declaration:                                                     --
// --------------------------------------------------------------------------------------------------------------------

$(function(){
	//We declare an animation: 
	var red = new $.gQ.Animation({imageURL: "./red.png"});
	var redExplosion = new $.gQ.Animation({	imageURL: "./explosion.png",
									numberOfFrame: 10,
									delta: 60,
									rate: 60,
									distance: 60,
									type: $.gQ.ANIMATION_VERTICAL | $.gQ.ANIMATION_CALLBACK});
	var blue =	new $.gQ.Animation({	imageURL: "./blue.png"});
	
    //And sounds
    var music = new $.gQ.SoundWrapper("./music.mp3", true);
    
	//set the playground
	$("#playground").playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, refreshRate: 30, keyTracker: true});
	
	//create a blue square
	$.playground().addSprite(	"blue",
								{posx: bluePosX,
								 posy: bluePosY,
								 height: 30,
								 width: 30,
								 animation: blue,
                                 geometry: $.gQ.GEOMETRY_RECTANGLE/*GEOMETRY_DISC GEOMETRY_RECTANGLE*/});
	$("#blue").scale(3).rotate(10).addSound(music);
	//creates the moving red square 
	var listOfReds = new Array();
	var redinit = NUMBER_OF_REDS;
	while(redinit--){
		$.playground().addSprite(	"red_"+redinit,
											{posx: Math.random()*(PLAYGROUND_WIDTH-30),
											 posy: Math.random()*(PLAYGROUND_HEIGHT-30),
											 height: 30,
											 width: 30,
							 				 animation: red,
                                             geometry: $.gQ.GEOMETRY_RECTANGLE});
		var newSprite = $("#red_"+redinit);
        newSprite.scale(Math.random()+0.5).rotate(Math.random()*360);
		newSprite[0].gameQuery.speedx = Math.random()*2;
		newSprite[0].gameQuery.speedy = Math.random()*2;
		newSprite[0].gameQuery.dead = false;
		newSprite[0].gameQuery.indexinlist = listOfReds.length;
		listOfReds.push(newSprite);
	}
	
    
	//register the main callback
	$.playground().registerCallback(function(){
		//Update the position of the red dots
		var rediter = NUMBER_OF_REDS;
		while(rediter--){ 
			if(listOfReds[rediter]){
				updateSquare(listOfReds[rediter], 3);
			}
		}
		
		//Update the position of the blue dot:
        //this is where the keybinding occurs
        if($.gQ.keyTracker[65]){ //this is left! (a)
            bluePosX -= 3;
        }
        if($.gQ.keyTracker[87]){ //this is up! (w)
            bluePosY -= 3;
        }
        if($.gQ.keyTracker[68]){ //this is right (d)
            bluePosX += 3;
        }
        if($.gQ.keyTracker[83]){ //this is down! (s)
            bluePosY += 3;
        }
        
		$("#blue").xy(bluePosX, bluePosY).rotate($("#blue").rotate()-3).scale(2+Math.cos($("#blue").rotate()/180*Math.PI));
		
		//check if some red blocks touch the blue square
		$("#blue").collision().each(function(){
			// make them explode:
			if(!this.gameQuery.dead){
				$(this).setAnimation(redExplosion, function(me){
						listOfReds[$(me)[0].gameQuery.indexinlist] = undefined;
						$(me).remove();
					}).w(60).h(60);
				$(this).xy(-15, -15, true);
				this.gameQuery.speedx = this.gameQuery.speedx/3;
				this.gameQuery.speedy = this.gameQuery.speedy/3;
				this.gameQuery.dead = true;
			}
		});
        
		return false;
	}, 30);
    
    $.loadCallback(function(percent){
		$("#loadingBar").width(400*percent);
	});
	
	//initialize the start button
	$("#startbutton").click(function(){
		$.playground().startGame(function(){
			$("#welcomMessage").remove();
            $.playground().append("<div id='mutebutton' class='muteButton' style='position: absolute; top: 0px; z-index:1000'></div>");
            //$.playground().append("<div style='position: absolute; top: 0px; z-index:1000'><a id='mutebutton' href='#' style='color: white;'>mute/unmute</a></div>");
            $("#blue").playSound();
            $("#mutebutton").click(function(){
                $this = $(this);
                $this.toggleClass("muteButton");
                $this.toggleClass("unmuteButton");
                if($this.data("muted")){
                    $.muteSound(false);
                    $this.data("muted", false);
                } else {
                    $.muteSound(true);
                    $this.data("muted", true);
                }
                return false;
            });
		});
	})
});	
