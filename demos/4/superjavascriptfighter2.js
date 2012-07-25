var PLAYGROUND_WIDTH = 800 ;
var PLAYGROUND_HEIGHT = 200;

$(function(){
    // This is the AI that determines the next move
    // level=0: totaly random
    // level=1: totaly "rational"

    // possible move;
    IDLE=          0;
    WALK_FORWARD=  1;
    WALK_BACKWARD= 2;
    PUNCH=         3;
    KICK=          4;
    BLOCK=         5;
    BEATEN=        6;

    //constantes:
    NEAR=         100;

    // this is a methods that returns a random element from the given array
    function or(choice){
        return choice[Math.round(Math.random()*(choice.length-1))];
    };

    // return the distance between the opponents
    function distance(a, b){
        return Math.abs(a.position().left-b.position().left);
    };

    function nextMove(level, a, b){
        if(Math.random() > level){
            return Math.round(Math.random()*5);
        }
        switch(b.data("fighter").currentState){
            // if the adversary is idle or moves away from us we get near him or attack ihm
            case IDLE:
            case WALK_BACKWARD:
            case BLOCK:
                if(distance(a,b) < NEAR){
                    return or([KICK, PUNCH, WALK_BACKWARD]);
                } else {
                    return or([WALK_FORWARD, IDLE]);
                }
                break;
            // if the adversary moves toward us we get away or attack ihm
            case WALK_FORWARD:
                if(distance(a,b) < NEAR){
                    return or([KICK, PUNCH, WALK_BACKWARD]);
                } else {
                    return or([WALK_FORWARD, IDLE]);
                }
                break;
            // if we are under attack we either block go back or try to fight back
            case PUNCH:
            case KICK:
                return or([BLOCK, PUNCH, KICK, IDLE]);
                break;
            // if beaten we block or go back
            case BEATEN:
                return or([BLOCK, WALK_BACKWARD, IDLE]);
                break;
        }
    }

    function animate(sprite){
        sprite = $(sprite);
        fighter = sprite.data("fighter");
        adversary = $(fighter.adversary);
        adversaryFighter = adversary.data("fighter");

        var nextState = nextMove(0.8, sprite, adversary);

        changeAnimation(sprite, fighter.animations, nextState, fighter.currentState);

        if(nextState == PUNCH || nextState == KICK){
            sprite.z(20);
        } else if(fighter.currentState == PUNCH || fighter.currentState == KICK){
            sprite.z(0);
        }

        fighter.currentState = nextState;
    }

    var scrollStage = function (offset){

    	if(offset > 50){
    		offset = 50;
    	} else if(offset < -50) {
    		offset = -50;
    	}
    	$("#foreground").x(-800 + offset/0.5);

        $("#ground").x(-300 + offset);
        $("#fighters").x(offset);

        $("#background1").x(50 + offset/2);
        $("#background2").x(30 + offset/4);
        $("#background3").x(90 + offset/5);

   	}

    /*replace with new*/
    var changeAnimation = function(sprite, animationArry, newAnimation , oldAnimation){
        sprite
            .setAnimation(animationArry[newAnimation].animation)
            .width(animationArry[newAnimation].width)
            .height(animationArry[newAnimation].height)
            .y(sprite.position().top  + animationArry[newAnimation].deltaY - animationArry[oldAnimation].deltaY)
            .x(sprite.position().left + animationArry[newAnimation].deltaX - animationArry[oldAnimation].deltaX);
    };

    // the game
    $("#playground").playground({height: PLAYGROUND_HEIGHT, width: PLAYGROUND_WIDTH, refreshRate: 30, keyTracker: true});

    //Playground Sprites
    var foreground 	= new $.gQ.Animation({imageURL: "./stage/foreground.png", type: $.gQ.ANIMATION_VERTICAL});
    var ground 		= new $.gQ.Animation({imageURL: "./stage/ground.png"});
    var background1 = new $.gQ.Animation({imageURL: "./stage/background1.png"});
    var background2 = new $.gQ.Animation({imageURL: "./stage/background2.png"});
    var background3 = new $.gQ.Animation({imageURL: "./stage/background3.png"});
    $.playground().addSprite(	"background3",
								{posx: 90, posy: 0,
								 height: 200, width: 534,
								 animation: background3})
					.addSprite(	"background2",
								{posx:30, posy: -50,
								 height: 180, width: 432,
								 animation: background2})
					.addSprite(	"background1",
								{posx:50, posy: -150,
								 height: 317, width: 749,
								 animation: background1})
					.addSprite(	"ground",
								{posx: -300, posy: 0,
								 height: 200, width: 1493,
								 animation: ground}).addGroup("fighters").end()
					.addSprite(	"foreground",
								{posx:-800, posy: 165,
								 height: 44, width: 2000,
								 animation: foreground});
	$("#scenegraph").css("background-color","#121423");

    //Fighters
    var cvs = {
        currentState : IDLE,
        position: 250,
        adversary: "#abobo",
        animations: [ {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_idle_59x106x6.png",
									numberOfFrame: 6,
									delta: 59,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 0, width: 59, height: 106},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_walk_forward_58x106x5.png",
									numberOfFrame: 5,
									delta: 58,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 0, width: 58, height: 106},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_walk_backward_58x106x5.png",
									numberOfFrame: 5,
									delta: 58,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 0, width: 58, height: 106},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_punch_120x104x6.png",
									numberOfFrame: 6,
									delta: 120,
									rate:120,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 2, width: 120, height: 104},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_kick_156x106x9.png",
									numberOfFrame: 9,
									delta: 156,
									rate:90,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: -20, deltaY: 0, width: 156, height: 106},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_block_69x99x2.png",
									numberOfFrame: 2,
									delta: 69,
									rate:480,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 7, width: 69, height: 99},
            {animation: new $.gQ.Animation({	imageURL: "./cvs/cvs_hit_59x103x1.png",
            						rate: 720,
                					type: $.gQ.ANIMATION_CALLBACK}),
				deltaX: 0, deltaY: 3, width: 59, height: 103}]
    }
	$("#fighters").addSprite("cvs",
								{posx: 250,
								 posy: 70,
								 height: 106,
								 width: 58,
								 animation: cvs.animations[0].animation,
                                 geometry: $.gQ.GEOMETRY_RECTANGLE,
                                 callback: animate});
    $("#cvs").data("fighter", cvs);

    var abobo = {
        currentState : IDLE,
        position: 500,
        adversary: "#cvs",
        animations: [  {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_idle_100x121x3.png",
									numberOfFrame: 3,
									delta: 100,
									rate:190,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				  deltaX: 0, deltaY: 49, width: 100, height: 121},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_walk_forward_94x126x6.png",
									numberOfFrame: 6,
									delta: 94,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				   deltaX: 0, deltaY: 44, width: 94, height: 126},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_walk_backward_94x126x6.png",
									numberOfFrame: 6,
									delta: 94,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
					deltaX: 0, deltaY: 44, width: 94, height: 126},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_punch_131x170x4.png",
									numberOfFrame: 4,
									delta: 131,
									rate:150,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				  deltaX: -30, deltaY: 0, width: 131, height: 170},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_kick_137x130x2.png",
									numberOfFrame: 2,
									delta: 137,
									rate:500,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				  deltaX: 20, deltaY: 40, width: 137, height: 130},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_block_81x130x1.png",
									rate:700,
                					type: $.gQ.ANIMATION_CALLBACK}),
	              deltaX: 0, deltaY: 40, width: 81, height: 130},
                {animation: new $.gQ.Animation({	imageURL: "./abobo/abobo_hit_108x120x3.png",
									numberOfFrame: 3,
									delta: 108,
									rate:240,
									type: $.gQ.ANIMATION_HORIZONTAL | $.gQ.ANIMATION_CALLBACK}),
				  deltaX: 0, deltaY: 50, width: 108, height: 120}]
    }
	$("#fighters").addSprite("abobo",
								{posx: 550,
								 posy: 60,
								 height: 121,
								 width: 100,
								 animation: abobo.animations[0].animation,
                                 geometry: $.gQ.GEOMETRY_RECTANGLE,
                                 callback: animate});
    $("#abobo").data("fighter", abobo);

	//register the main callback
	$.playground().registerCallback(function(){
		var cvs = $("#cvs");
        var cvsF = cvs.data("fighter");
        var cvsLeft = cvs.position().left;

        var abobo = $("#abobo");
        var aboboF = abobo.data("fighter");
        var aboboLeft = abobo.position().left;

		//hit?
		if(cvsLeft+cvsF.animations[cvsF.currentState].width - 2 > aboboLeft){
			if((cvsF.currentState == KICK || cvsF.currentState == PUNCH) && aboboF.currentState != BEATEN){
				if (aboboF.currentState == KICK || aboboF.currentState == PUNCH) {
					changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
					aboboF.currentState = BEATEN;
					changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
					cvsF.currentState = BEATEN;
				} else {
					changeAnimation(abobo, aboboF.animations, BEATEN, aboboF.currentState);
					aboboF.currentState = BEATEN;
				}
			} else if ((aboboF.currentState == KICK || aboboF.currentState == PUNCH) && cvsF.currentState != BEATEN) {
				changeAnimation(cvs, cvsF.animations, BEATEN, cvsF.currentState);
				cvsF.currentState = BEATEN;
			}
		}

		//Move
        if(cvsF.currentState == WALK_FORWARD){
        	if((cvsLeft+cvsF.animations[cvsF.currentState].width+2) < aboboLeft){
            	cvs.x(cvsLeft+2);
        	}
        } else if ((cvsLeft > 50) && (cvsF.currentState == WALK_BACKWARD)){
            cvs.x(cvsLeft-2)
        }

        if(aboboF.currentState == WALK_FORWARD){
            if((cvsLeft+cvsF.animations[cvsF.currentState].width+2) < aboboLeft){
            	abobo.x(aboboLeft - 2);
            }
        } else if ((aboboLeft < 650) && (aboboF.currentState == WALK_BACKWARD)){
            abobo.x(aboboLeft + 2);
        }

        var al = abobo.position().left - aboboF.animations[aboboF.currentState].deltaX;
        var cl = cvs.position().left - cvsF.animations[cvsF.currentState].deltaX;

        var centerPos = (al - cl)/2 + cl;
        scrollStage(-(centerPos-400)*0.5);

		return false;
	}, 30);




	//start loading!
	$.loadCallback(function(percent){
		$("#loadingBar").width(600*percent);
	});

	//initialize the start button
	$.playground().startGame(function(){
		$("#welcomMessage").fadeOut(2000, function(){$(this).remove()});
	});
});

