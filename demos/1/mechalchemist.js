//global constant:
var numberOfColumn = 6;
var numberOfRow = 5;
var maxRow = 8; // the limit is the maxRow 8th line
var playgroundHeight = 600;
var playgroundWidth = 600;
var spriteHeight = 60;
var spriteWidth = 60;
var eraseTimeout = 800;
var pointPerBall = 10;

//global variable to store the destination ot the "player"
var sidemove = 0;
var wanapick = false;
var wanadrop = false;
var wanaexpand = false;
var wanaerase = false;
var eraseTimedout = false; 

var destination = 3;		//those value store the position of the probe for
var pickDestination = 0;	// the current action

var convertedBallx = 0;
var convertedBally = 0;

var moveDestinationX = 3;

//the describtion of the probe state
var PROBE_IDLE 	= 1; // The idle state
var PROBE_PICKING	= 3; // The probe is picking a ball
var PROBE_PICKED	= 4; // The probe is returning to it's place
var PROBE_DROPING	= 5; // some balls are begin droped
var PROBE_DROPED	= 6; // the aftermath of a ball droping
var BOARD_COLAPSE	= 8; // the board is collapsing after a reduction
var BOARD_EXPAND	= 9; // this is when a line is added on top
var BOARD_ERASING = 10; // the board is animating to show  the erasing
var BEAM_ERASING	= 11; // the animation of erasing of the beam reaction
var GAME_OVER		= 12; // the game is over ;(

var gameState		= PROBE_IDLE;
var storedColor 	= 0;
var storedNumber 	= 0;
var score			= 0;
var comboCount		= 0;
var comboMax		= 0;

//some hellper functions : 
/**
* this function simply set the eraseTimedout to true
**/
function timedEarse(){
	eraseTimedout = true;
}


/**
* This funciton returns the number of the row containing the down most, non-null 
* element of this column. The table is suposed to be square and in row x column
* ord
**/
function columnFirstElement(column){
	var downMostLine = column.length-1; 
	while(column[downMostLine] == null){
		downMostLine--;
		if(downMostLine==-1){
			break;
		}
	}
	return downMostLine;
}
/**
* This function returns a 2-dimentional array of boolean and a number.  
**/
function reduceArray(beamNumberOfBalls, beamPositionX, beamPositionY){
	
	// the value to return:
	var markedNumber = 0;
	var resultArray = new Array(numberOfColumn);
	
	for(var i=0; i<numberOfColumn; i++){
		// the value of the cells of the middle 
		// depends of the value of the ballArray
		resultArray[i] = new Array(maxRow);
		for(var j=0; j< maxRow; j++){
			if(ballsArray[i][j] == null){
				// if there is no cell here it cannot be deleted
				resultArray[i][j] = false;
			} else {
				resultArray[i][j] = null;
			}
		}
	}
	
	// this is a recurrent way to browse the array:
	// x and y are the coordinate of the cells whose
	// neighbours have to be checked.
	function markNeighborCells(x,y){
		// the column at the left of x
		if(x > 0){
			// is it the first time we check this cell
			if(resultArray[x-1][y] == null){
				// is this cell of the right color
				if(ballsArray[x-1][y] == storedColor){
					resultArray[x-1][y] = true;
					markedNumber++;
					// we check the neighbors
					markNeighborCells(x-1,y); 
				} else {
					resultArray[x-1][y] = false;
				}
				
			}
		}
		// the column of x
		if(y > 0){
			// is it the first time we check this cell
			if(resultArray[x][y-1] == null){
				// is this cell of the right color
				if(ballsArray[x][y-1] == storedColor){
					resultArray[x][y-1] = true;
					markedNumber++;
					// we check the neighbors
					markNeighborCells(x,y-1); 
				} else {
					resultArray[x][y-1] = false;
				}
			}
		}
		if(y+1 < maxRow){
			// is it the first time we check this cell
			if(resultArray[x][y+1] == null){
				// is this cell of the right color
				if(ballsArray[x][y+1] == storedColor){
					resultArray[x][y+1] = true;
					markedNumber++;
					// we check the neighbors
					markNeighborCells(x,y+1); 
				} else {
					resultArray[x][y+1] = false;
				}
			}
		}
		// the column at the right of x
		if(x+1 < numberOfColumn){
			// is it the first time we check this cell
			if(resultArray[x+1][y] == null){
				// is this cell of the right color
				if(ballsArray[x+1][y] == storedColor){
					resultArray[x+1][y] = true;
					markedNumber++;
					// we check the neighbors
					markNeighborCells(x+1,y); 
				} else {
					resultArray[x+1][y] = false;
				}
			}
		}
	}
	
	//here we startWith the element of the beam and check for neighbors:
	for(var i = 0; i < beamNumberOfBalls; i++){
		markNeighborCells(beamPositionX,beamPositionY+i);
	}
	
	return {array: resultArray, number: markedNumber};	
}

function chainReaction(){
	var result = new Array(spriteList.length) // one entry per color
	for(var i=0; i < spriteList.length; i++){
		result[i] = new Array();
	}

	// this is a recurrent way to browse the array:
	// x and y are the coordinate of the cells whose
	// neighbours have to be checked.
	function markNeighborCellsInGroup(x,y,color,group){
		var markedNumber = 0;
		// the column at the left of x
		if(x > 0){
			// is it the first time we check this cell
			if(result[color][group].array[x-1][y] == null){
				// is this cell of the right color
				if(ballsArray[x-1][y] == color){
					result[color][group].array[x-1][y] = true;
					markedNumber++;
					// we check the neighbors
					markedNumber += markNeighborCellsInGroup(x-1,y,color,group); 
				} else {
					result[color][group].array[x-1][y] = false;
				}
			}
		}
		// the column of x
		if(y > 0){
			// is it the first time we check this cell
			if(result[color][group].array[x][y-1] == null){
				// is this cell of the right color
				if(ballsArray[x][y-1] == color){
					result[color][group].array[x][y-1] = true;
					markedNumber++;
					// we check the neighbors
					markedNumber += markNeighborCellsInGroup(x,y-1,color,group); 
				} else {
					result[color][group].array[x][y-1] = false;
				}
			}
		}
		if(y+1 < maxRow){
			// is it the first time we check this cell
			if(result[color][group].array[x][y+1] == null){
				// is this cell of the right color
				if(ballsArray[x][y+1] == color){
					result[color][group].array[x][y+1] = true;
					markedNumber++;
					// we check the neighbors
					markedNumber += markNeighborCellsInGroup(x,y+1,color,group); 
				} else {
					result[color][group].array[x][y+1] = false;
				}
			}
		}
		// the column at the right of x
		if(x+1 < numberOfColumn){
			// is it the first time we check this cell
			if(result[color][group].array[x+1][y] == null){
				// is this cell of the right color
				if(ballsArray[x+1][y] == color){
					result[color][group].array[x+1][y] = true;
					markedNumber++;
					// we check the neighbors
					markedNumber += markNeighborCellsInGroup(x+1,y,color,group); 
				} else {
					result[color][group].array[x+1][y] = false;
				}
			}
		}
		return markedNumber;
	}
	
	for(var i=0; i < numberOfColumn; i++){
		//for each column we check the conected groups from the first marked element:
		if(chainReactionMarker[i] > -1){
			for(var j=chainReactionMarker[i]; j < maxRow; j++){
				if(ballsArray[i][j] != null){
					var currentGroup = 0;

					while((result[ballsArray[i][j]][currentGroup] != undefined) && (result[ballsArray[i][j]][currentGroup].array[i][j] == false)){
						currentGroup++;
					}
					if((result[ballsArray[i][j]][currentGroup] == undefined)){ // then this case has not been linked to any group of this color
						// we add a group!
						// a group is made of:
						// - a number that that reprensent the number of element in this group
						// - an array where the case belonging to the group are marked by true
						result[ballsArray[i][j]][currentGroup] = {number: 1, array: new Array(numberOfColumn)};
						for(var k=0; k < numberOfColumn; k++){
							result[ballsArray[i][j]][currentGroup].array[k] = new Array(maxRow);
							for(var l=0; l < maxRow; l++){
								if(ballsArray[k][l] == null){
									result[ballsArray[i][j]][currentGroup].array[k][l] = false
								} else {
									result[ballsArray[i][j]][currentGroup].array[k][l] = null;
								}
							}
						}
						// the current element is part of this group
						result[ballsArray[i][j]][currentGroup].array[i][j] = true;
						// we now check the neighbors:
						result[ballsArray[i][j]][currentGroup].number += markNeighborCellsInGroup(i,j,ballsArray[i][j],currentGroup);
					}
					// ELSE : this case already belongs to a group -> no need to check
				}
			}
		}
	}
	return result;
}


// This function split the array for colliding, uses the global variables and return true if 
// some splitting occured and flase otherwise.
function splitForCollide(){
	var splited = false;
	
	//for each column we search for the uper most void:
	for(var i=0; i<numberOfColumn; i++){
		var firstVoid = -1;
		
		for(var j=0; j<maxRow; j++){
			if(ballsArray[i][j] == null){
				//we just found it!
				firstVoid = j;
				break;
			}
		}
		//Is the void we found at an interesting position ?
		if((firstVoid >= 0) && (firstVoid < (maxRow-1))){
			// we find the collapsing part under the first void:
			var nextNoVoid = firstVoid+1;
			for(var j=nextNoVoid; j < maxRow; j++){
				if(ballsArray[i][j] != null){
					nextNoVoid = j;
					break;
				}
			}
			//do we have something to collapse ?
			if((nextNoVoid > firstVoid) && (ballsArray[i][nextNoVoid] != null)){
				splited = true;
				//we remove the element from the array and put them to the "mobileElement" array
				var collapsingParts = new Array(maxRow-nextNoVoid);
				$.playground().addGroup("collapse-"+i, {posx: 20+i*spriteWidth, posy:20+j*spriteHeight, height: spriteHeight*(maxRow-nextNoVoid), width: spriteWidth});
				
				for(var j=0; j < (maxRow-nextNoVoid); j++){
					collapsingParts[j] = ballsArray[i][j+nextNoVoid];
					if(collapsingParts[j] != null){
						$("#collapse-"+i).addSprite("collapseE-"+i+"-"+j,{posx: 0, posy: (spriteHeight*j), height: spriteHeight, width: spriteWidth, animation: spriteList[collapsingParts[j]]});
						$("#"+i+"-"+(nextNoVoid+j)).remove();
						ballsArray[i][j+nextNoVoid] = null;
					}
				}
				mobileElement[i] = {destination: firstVoid, array: collapsingParts}
			}
		}
	}
	return splited;
}

// This function mark  the array for the chain reaction, uses the global variables 
function markForChainReaction(){
	//for each column we search for the uper most void:
	for(var i=0; i<numberOfColumn; i++){
		// we reset the chainReactionMarker
		chainReactionMarker[i] = -1;
		for(var j=0; j<maxRow; j++){
			if(ballsArray[i][j] == null){
				chainReactionMarker[i] = j;
				break;
			}
		}
	}
}


// function to restart the game:
function restartGame(){
	window.location.reload();
};
// --------------------------------------------------------------------------------------------------------------------
// --                                      the main declaration:                                                     --
// --------------------------------------------------------------------------------------------------------------------
$(function(){
	//We declare an animation: 
	var animationBG = 			new $.gQ.Animation({	imageURL: "./background.png"});
	
	var gameOverAnimation =		new $.gQ.Animation({	imageURL: "./gameover.png"});
	
	var animationBGmask =		new $.gQ.Animation({	imageURL: "./cache.png"});
	
	var animationProbe = 		new $.gQ.Animation({	imageURL: "./probe.png"});
	
	var animationContainer =	new $.gQ.Animation({	imageURL: "./container.png"});
	
	var animationContainerSide =new $.gQ.Animation({	imageURL: "./container-side.png",
												type: $.gQ.ANIMATION_VERTICAL});
													
	var eraseAnimation =		new $.gQ.Animation({	imageURL: "./explosion.png",
												numberOfFrame: 3,
												delta: 60,
												rate: 90,
												type: $.gQ.ANIMATION_VERTICAL});
	
	var beamAnimation =			new $.gQ.Animation({	imageURL: "./beam.png"});
						
	var sparkAnimation = 		new $.gQ.Animation({	imageURL: "./spark.png",
												numberOfFrame: 5,
												delta: 19,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});
													
	var containementSparkAnimation = 
								new $.gQ.Animation({	imageURL: "./containement-spark.png",
												numberOfFrame: 5,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});

	spriteList = new Array(5); //the list of sprite for the balls
	var conversionList = new Array(5); 
	
	spriteList[0] = 	new $.gQ.Animation({	imageURL: "./coal.png"});
	conversionList[0] =	1;
	
	spriteList[1] =		new $.gQ.Animation({	imageURL: "./coper.png"});
	conversionList[1] =	4;
	
	spriteList[2] = 	new $.gQ.Animation({	imageURL: "./silver.png"});
	conversionList[2] = 2;
	
	spriteList[3] = 	new $.gQ.Animation({	imageURL: "./gold.png"});
	conversionList[3] =	4;
	
	spriteList[4] = 	new $.gQ.Animation({	imageURL: "./diamon.png"});
	conversionList[4] =	1;
	
	animatedSpriteList = new Array(5); //the list of animation for the balls
	animatedSpriteList[0] = new $.gQ.Animation({	imageURL: "./coalspark.png",
												numberOfFrame: 6,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});

	animatedSpriteList[1] = new $.gQ.Animation({	imageURL: "./coperspark.png",
												numberOfFrame: 6,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});
												
	animatedSpriteList[2] = new $.gQ.Animation({	imageURL: "./silverspark.png",
												numberOfFrame: 6,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});
												
	animatedSpriteList[3] = new $.gQ.Animation({	imageURL: "./goldspark.png",
												numberOfFrame: 6,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});
												
	animatedSpriteList[4] = new $.gQ.Animation({	imageURL: "./diamonspark.png",
												numberOfFrame: 6,
												delta: 60,
												rate: 60,
												type: $.gQ.ANIMATION_VERTICAL});
	
	//generate the initial array of "balls"
	function generateRandomColumn(){
		var tempArray = new Array(maxRow);
		// the numberOfRow gives you the initial amount of bals per column
		for(var i=0; i<numberOfRow; i++){
			tempArray[i] = Math.round(Math.random()*(spriteList.length-1));
		}
		// the rest of the array is empty
		for(var i=numberOfRow; i<maxRow; i++){
			tempArray[i] = null;
		}
		return tempArray;
	}
	//beware this array is in column x row order !!!!
	ballsArray = new Array(numberOfColumn);
	ballsToErase = new Array(numberOfColumn);
	for(var i=0; i<numberOfColumn; i++){
		ballsArray[i] = generateRandomColumn();
		ballsToErase[i] =  new Array(maxRow);
		for(var j=0; j < maxRow; j++){
			ballsToErase[i][j] = false;
		}
	}
	
	// this array contain the index of the first element for each column that 
	// has moved durring the collapse (for the chainreaction) and -1 if the 
	// column has not colided
	chainReactionMarker = new Array(numberOfColumn);
	for(var i=0; i<numberOfColumn; i++){
		chainReactionMarker[i] = -1;
	}
	
	// this array contains the mobile elemenet during colapsing
	// each element is of the folowing format:
	// {desination: index, array: list_of_color}
	mobileElement = new Array(numberOfColumn);
	
	//initialize the game screen:
	$("#playground").playground({height: playgroundHeight, width: playgroundWidth})
		.addSprite("background",{posx: 0, posy: 0, height: playgroundHeight, width: playgroundWidth, animation: animationBG})
		.addGroup("arm",{posx: 0, posy: 20, height: 580, width: 100, overflow: "visible"})
			.addSprite("probe",{posx: 20, posy: 460, height: 580, width: 60, animation: animationProbe})
			.addGroup("containerGroup",{posx:0,posy:500, height: 80, width: 100, overflow: "visible"})
				.addSprite("container",{posx: 0, posy: 0, height: 80, width: 100, animation: animationContainer});
	$.playground()
		.addGroup("board",{posx: 0, posy: 0, height: playgroundHeight, width: playgroundWidth});
	$.playground()
		.addSprite("backgroundMask",{posx: 400, posy: 482, height: 118, width: 200, animation: animationBGmask});
	$("#containerGroup").addSprite("container-left",{posx: -600, posy: 0, height: 90, width: 600, animation: animationContainerSide});
	$("#containerGroup").addSprite("container-right",{posx: 100, posy: 0, height: 90, width: 600, animation: animationContainerSide});
	$("#container").addSprite("sparkEmpty",{ posx: 20, posy: 40, height: 19, width: 59, animation: sparkAnimation});
	
	for(var i in ballsArray){
		for(var j=0; j < numberOfRow; j++){
			$("#board").addSprite(""+i+"-"+j,{posx: 20+(spriteWidth*i), posy: 20+(spriteHeight*j), height: spriteHeight, width: spriteWidth, animation: spriteList[ballsArray[i][j]]});
		}
	}

	//Here we add the sound we will use durring the game:
	/** TODO: add some sound**/
	
	// this sets the id of the loading bar:
	$.loadCallback(function(percent){
		$("#loadingBar").width(400*percent);
	});
	
	//we add a placeholder for the score:
	$.playground().append("<div style='position: absolute; top : 400px; right: 20px; width: 150px;font-weight: bold; font-size: 18pt; color: white;'><span id='score'>"+score+"</span> pts <br /> mult: <span id='combo'>"+comboCount+"</span>x</div>")
	
	storedscore = 0;
	// this is the function that control the expanding of the board
	$.playground().registerCallback(function(){
		if(gameState!=GAME_OVER){
			wanaexpand = true;
			// we generate a new line and add it to the board 
			newLine = new Array(numberOfColumn)
			for(var i=0; i < numberOfColumn; i++){
				newLine[i] = Math.round(Math.random()*(spriteList.length-1));
				$("#board").addSprite(""+i+"-n",{posx: 20+(spriteWidth*i), posy: -40, height: spriteHeight, width: spriteWidth, animation: spriteList[newLine[i]]});
			}
			if(score-storedscore > 399){
				storedscore = score;
				return 8000-1000*(score/400)*0.7;
			}
			return false; // we want this function to loop
		} else {
			return true; // the game is over ! no more line to add....
		}
	}, 8000); // triggered every 8 sec.
	
	//this is the function that takes care of the probe movement
	$.playground().registerCallback(function(){
		
		//cache for the arm div
		if(this.armdiv == undefined){
			this.armdiv = $("#arm");
		}
		
		//the probe can move always but when it's picking a ball
		if(gameState!=PROBE_PICKING){
			var incremant = 15;
			//Do we had some move in the buffer ?
			if(((moveDestinationX + sidemove)>=0)&&((moveDestinationX + sidemove) < numberOfColumn)){
				moveDestinationX += sidemove;
			}
			sidemove = 0;
			
			//what direction the prob is moving to?
			var currentPos = this.armdiv.x();
			if(currentPos < ((moveDestinationX*spriteWidth))){ // we need to go to the right
				if(currentPos+incremant < (moveDestinationX*spriteWidth)){
					this.armdiv.x(incremant, true);
				} else {
					this.armdiv.x(moveDestinationX*spriteWidth);
				}
			} else if (currentPos > (moveDestinationX*spriteWidth)) { //we need to go to the left
				if(currentPos-incremant > (moveDestinationX*spriteWidth)){
					this.armdiv.x(-incremant, true);
				} else {
					this.armdiv.x(moveDestinationX*spriteWidth);
				}
			}
		}
	}, 30);
	
	
	
	//this is the function to control the probe action except the left-right movement
	$.playground().registerCallback(function(){
		//we update the score: and combo multiplier
		if(this.combodiv == undefined){
			this.combodiv = $("#combo");
		}
		if(this.scorediv == undefined){
			this.scorediv = $("#score");
		}
		if(this.armdiv == undefined){
			this.armdiv = $("#arm");
		}
		this.scorediv.html(""+score);
		this.combodiv.html(""+comboCount);
		
		switch(gameState){
			//This state is when the probe is idle and don't do a thing
			case PROBE_IDLE:
				if(wanaexpand){
					gameState = BOARD_EXPAND;
					wanaexpand = false;
					break;
				}
								
				var incremant = 15;
				var currentPos = this.armdiv.x();
				// Are we at a stop ?
				if(moveDestinationX*spriteWidth == currentPos) {
						if(wanapick){ //the user ask for a pick!
							destination = moveDestinationX;
							//we determine the position of the pick 
							var destLine = columnFirstElement(ballsArray[destination]);
							var downMostElement = ballsArray[destination][destLine];
							//and if it is allowed:
							if((destLine >= 0)&&(downMostElement != null)&&((storedNumber<=0)||(downMostElement==storedColor))){
								pickDestination = destLine;
								storedColor = downMostElement;
								gameState = PROBE_PICKING;
							} else {
								wanapick = false;
							}
						} else if(wanadrop) { //the user asked for a drop!
							//we turn all balls of the same color to their "standard state"
							for(var i=0; i < numberOfColumn; i++){
								for(var j=0; j < maxRow-1; j++){
									if(ballsArray[i][j]==storedColor){
										$("#"+i+"-"+j).setAnimation(spriteList[storedColor]);
									}	
								}	
							}
							
							destination = moveDestinationX;
							// we create a place holder for the balls to drop
							$.playground().addGroup("dropBeam",{posx: 20+spriteWidth*destination, posy: 480, height: (spriteHeight*storedNumber > 400)?(spriteHeight*storedNumber):400, width: 60});
							// store  the name of the sprite depending on the color:
							var dropedSprite = spriteList[storedColor];
							//and add each ball
							for(var k=0; k<storedNumber; k++){
								$("#dropBeam").addSprite("dropBeam-"+k,{posx: 0, posy: (spriteHeight*k), height: spriteHeight, width: spriteWidth, animation: dropedSprite});
							}
							$("#dropBeam").addSprite("glowBeam",{posx: 0, posy: 0, height: 400, width: 60, animation:beamAnimation});
							$("#contained").remove(); // we remove the ball from the container
							$("#sparkFull").remove();
							$("#container").addSprite("sparkEmpty",{ posx: 20, posy: 40, height: 19, width: 59, animation: sparkAnimation});
							pickDestination = columnFirstElement(ballsArray[destination])+1;
							gameState = PROBE_DROPING;
							wanadrop = false;
						} else { // nothing to do...
							gameState = PROBE_IDLE;
						}
				}
				break;
			
			// This state is when the prob is going UP to take a ball
			case PROBE_PICKING:
				var incremant = 45;
				var currentPos =  $("#probe").y();
				if(currentPos-incremant > pickDestination*60){
					$("#probe").y(currentPos-incremant);
				} else {
					//we reached the ball!
					$("#probe").y(pickDestination*60);
					$("#"+destination+"-"+pickDestination).remove();
					$("#probe").addSprite("pickedBall",{posx: 0, posy: 0, width: spriteWidth, height: spriteHeight, animation: spriteList[storedColor]})
					ballsArray[destination][pickDestination] = null;
					storedNumber++;
					//we turn all balls of the same color to their "excited state"
					if(storedNumber==1){
						for(var i=0; i < numberOfColumn; i++){
							for(var j=0; j < maxRow-1; j++){
								if(ballsArray[i][j]==storedColor){
									$("#"+i+"-"+j).setAnimation(animatedSpriteList[storedColor]);
								}	
							}	
						}
					}
					gameState = PROBE_PICKED;
				}
				wanapick=false;
				break;
				
			// this state is when the prob is going down from taking a ball
			case PROBE_PICKED:
				var incremant = 45;
				var currentPos =  $("#probe").y();
				if(currentPos + incremant < 460){
					$("#probe").y(currentPos+incremant);
				} else {
					$("#probe").y(460);
					// we add a ball to the container:
					$("#pickedBall").remove();
					if(storedNumber == 1){
						$("#sparkEmpty").remove();
						$("#container").addSprite("contained",{posx: 20, posy: 20, width: spriteWidth, height: spriteHeight, animation: spriteList[storedColor]});
						$("#container").addSprite("sparkFull",{ posx: 20, posy: 20, height: 60, width: 59, animation: containementSparkAnimation});
					}
					gameState = PROBE_IDLE;
				}
				break;
			
			//this state is when the prob is going up to drop all the balls it contain
			case PROBE_DROPING:
				var incremant = 45;
				var currentPos =  $("#dropBeam").y();
				if(currentPos - incremant > pickDestination*spriteHeight+20){
					$("#dropBeam").y(currentPos-incremant);
				} else {
					$("#dropBeam").y(pickDestination*spriteHeight+20);
					$("#glowBeam").remove();
					gameState = PROBE_DROPED;
				}
				wanadrop=false;
				break;
			//this state is when the prob is going down from droping a ball
			case PROBE_DROPED:
				// does the beam conects a least the right number of
				// balls to triger a fusion ?
				var result = reduceArray(storedNumber, destination, pickDestination);
				if((result.number + storedNumber) > conversionList[storedColor]){
					// add the right amount of points to the score
					score += (result.number+storedNumber)*pointPerBall;
					comboCount++;
					
					// we mark the balls for removing
					for(var i=0; i<result.array.length; i++){
						for(var j=0; j<result.array[i].length; j++){
							if(result.array[i][j]){
								ballsToErase[i][j] = true;
							}
						}
					}
					//we add the converted one:
					if((storedColor+1) < spriteList.length){
						ballsArray[destination][pickDestination] = storedColor+1;
						$("#board").addSprite(""+destination+"-"+pickDestination, {posx: 20+(spriteWidth*destination), posy: 20+(spriteHeight*pickDestination), height: spriteHeight, width: spriteWidth, animation: spriteList[storedColor+1]});
						$("#dropBeam-0").remove();
					}
					wanaerase = true;
					gameState = BEAM_ERASING;
					
				} else {
					// if not do we get outside of the limit ?
					// then it's game over
					if(pickDestination + storedNumber > maxRow-1){
						gameState = GAME_OVER;
						$.playground().addSprite("gameover",{posx: 0, posy: 0, animation: gameOverAnimation, width: 600, height: 600});
						$("#gameover").append('<div style="position: absolute; top: 340px; width: 600px; color: white;"><center><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
						$("#restartbutton").click(restartGame);
					
					} else { 
					// we need to get the balls out of the beam
					// into the grid
						for(var i=0; i<storedNumber; i++){
							ballsArray[destination][pickDestination + i] = storedColor;
							$("#board").addSprite(""+destination+"-"+(pickDestination + i),{posx: 20+(spriteWidth*destination), posy: 20+(spriteHeight*(pickDestination + i)), height: spriteHeight, width: spriteWidth, animation: spriteList[storedColor]});
						}
						$("#dropBeam").remove();
						gameState = PROBE_IDLE;
					}
				}
				oldstoredNumber = storedNumber;
				storedNumber = 0;
				break;
				
			case BEAM_ERASING:
				// Does the earsing begins ?
				if(wanaerase){
					for(var i=0; i < numberOfColumn; i++){
						for(var j=0; j < maxRow; j++){
							if(ballsToErase[i][j]){
								$("#"+i+"-"+j).setAnimation(eraseAnimation);
							}
						}
					}
					if((storedColor+1) == spriteList.length){
						$("#dropBeam-0").setAnimation(eraseAnimation);
					}
					for(var i=1; i < oldstoredNumber; i++){
						$("#dropBeam-"+i).setAnimation(eraseAnimation);
					}
					wanaerase = false;
					setTimeout("timedEarse()", eraseTimeout);
				}
				//cheack for the erasing timeout
				if(eraseTimedout){
					for(var i=0; i < numberOfColumn; i++){
						for(var j=0; j < maxRow; j++){
							if(ballsToErase[i][j]){
								// we erase this ball
								$("#"+i+"-"+j).remove();
								ballsArray[i][j] = null;
								ballsToErase[i][j] = false;
							}
						}
					}
					$("#dropBeam").remove();
					markForChainReaction();
					if(chainReactionMarker[destination]>pickDestination){
						chainReactionMarker[destination] = pickDestination; // we add the new element from the bean to the chainreaction
					}
					splitForCollide();
					eraseTimedout = false;
					gameState = BOARD_COLAPSE;
				}
				break;
				
			case BOARD_COLAPSE:
				var incremant = 16;
				var movedCount = 0;
				for(var i=0; i < numberOfColumn; i++){
					if(mobileElement[i] != null){
						var currentPos = $("#collapse-"+i).y();
						if(currentPos - incremant > (mobileElement[i].destination*spriteWidth+20)){
							$("#collapse-"+i).y(currentPos - incremant);
							movedCount++;
						} else {
							// the collapsing block is at its desitnation
							// we put the balls back in the array:
							$("#collapse-"+i).remove();
							for(var j=0; j < mobileElement[i].array.length; j++){
								ballsArray[i][j+mobileElement[i].destination] = mobileElement[i].array[j];
								if(mobileElement[i].array[j] != null){
									$("#board").addSprite(""+i+"-"+(j+mobileElement[i].destination),{posx: 20+(spriteWidth*i), posy: 20+(spriteHeight*(j+mobileElement[i].destination)), height: spriteHeight, width: spriteWidth, animation: spriteList[mobileElement[i].array[j]]});
								}
							}
							mobileElement[i] = null;
						}
					}
				}
				if(movedCount==0){
					if(!splitForCollide()){
						// We trigger the chainreaction:
						var chainGroups = chainReaction();
						var removed = false;
						for(var color=0; color < chainGroups.length; color++){ // the colors
							for(var group=0; group < chainGroups[color].length; group++){ // the groups
								var firstElement = true;
								if(chainGroups[color][group].number > conversionList[color]){
									//we have to erase this group!
									
									//add the right amount of point to the score and update the combo count:
									comboCount++;
									score += chainGroups[color][group].number*pointPerBall*(comboCount);
									
									for(var k=0; k < numberOfColumn; k++){
										for(var l=0; l < maxRow; l++){
											if(chainGroups[color][group].array[k][l]){
												// store the converted ball if it's the first of the group:
												if(firstElement){
													if(color+1 < spriteList.length){
														ballsArray[k][l] = color+1;
														$("#"+k+"-"+l).setAnimation(spriteList[color+1]);
														convertedBallx = k;
														convertedBally = l;
													} else{
														ballsToErase[k][l] = true;
													}
													firstElement = false;
												} else { // else we set this ball to be deleted
													ballsToErase[k][l] = true;
												}
											}
										}
									}
									removed = true;
								}
							}
						}
						if(removed){
							wanaerase = true;
							gameState = BOARD_ERASING;
						} else {
							if(comboCount > comboMax){
								comboMax = comboCount;
							}
							comboCount  = 0;
							gameState = PROBE_IDLE;
						}
					}
				}
				break;
			case BOARD_EXPAND:
				var incremant = 16;
				var currentPos =  $("#board").y();
				if(currentPos + incremant < 50){
					//we slide down to make place to the new line
					$("#board").y(currentPos+incremant);
				} else {
					// There we have first to test if the displacement have make a ball cross the line
					var overflow = false;
					for(var i=0; i<numberOfColumn; i++){
						if(ballsArray[i][maxRow-2] != null){
							overflow = true;
							break;
						}
					}
					if(overflow){
						gameState = GAME_OVER;
						$.playground().addSprite("gameover",{posx: 0, posy: 0, animation: gameOverAnimation, width: 600, height: 600});
						$("#gameover").append('<div style="position: absolute; top: 340px; width: 600px; color: white;"><center><a style="cursor: pointer;" id="restartbutton">Click here to restart the game!</a></center></div>');
						$("#restartbutton").click(restartGame);
					} else { // nop! we'r good we can add a lline
						// now we can hidde the board and start working on it
						$("#board").contents( ).remove();
						$("#board").y(0);
						// shift the balls arrays line down and add a new line:
						for(var i=0; i<numberOfColumn; i++){
							for(var j=maxRow-2; j > 0; j--){
								ballsArray[i][j] = ballsArray[i][j-1];
								if(ballsArray[i][j] != null){
									if((storedNumber > 0) && (storedColor == ballsArray[i][j])){ //is the ball in "excited state"
										$("#board").addSprite(""+i+"-"+j,{posx: 20+(spriteWidth*i), posy: 20+(spriteHeight*j), height: spriteHeight, width: spriteWidth, animation: animatedSpriteList[ballsArray[i][j]]});
									} else {
										$("#board").addSprite(""+i+"-"+j,{posx: 20+(spriteWidth*i), posy: 20+(spriteHeight*j), height: spriteHeight, width: spriteWidth, animation: spriteList[ballsArray[i][j]]});
									}
								}
							}
							ballsArray[i][0] = newLine[i];
							//if(ballsArray[i][j] != null){
							if((storedNumber > 0) && (storedColor == ballsArray[i][0])){ //is the ball in "excited state"
								$("#board").addSprite(""+i+"-0",{posx: 20+(spriteWidth*i), posy: 20, height: spriteHeight, width: spriteWidth, animation: animatedSpriteList[ballsArray[i][0]]});
							} else {
								$("#board").addSprite(""+i+"-0",{posx: 20+(spriteWidth*i), posy: 20, height: spriteHeight, width: spriteWidth, animation: spriteList[ballsArray[i][0]]});
							}
							//}
						}
						gameState = PROBE_IDLE;
					}
				}
				break;
			case BOARD_ERASING:
				// Does the earsing begins ?
				if(wanaerase){
					for(var i=0; i < numberOfColumn; i++){
						for(var j=0; j < maxRow; j++){
							if(ballsToErase[i][j]){
								$("#"+i+"-"+j).setAnimation(eraseAnimation);
							}
						}
					}
					wanaerase = false;
					setTimeout("timedEarse()", eraseTimeout);
				}
				//cheack for the erasing timeout
				if(eraseTimedout){
					for(var i=0; i < numberOfColumn; i++){
						for(var j=0; j < maxRow; j++){
							if(ballsToErase[i][j]){
								// we erase this ball
								$("#"+i+"-"+j).remove();
								ballsArray[i][j] = null;
								ballsToErase[i][j] = false;
							}
						}
					}
					markForChainReaction();
					if(chainReactionMarker[convertedBallx]>convertedBally){
						chainReactionMarker[convertedBallx] = convertedBally;
					}
					
					splitForCollide()
					eraseTimedout = false;
					gameState = BOARD_COLAPSE;
				}
				break;
		}
		return false;
		}, 30);
	//this is the function to control the pickup movement
	
	//initialize the start button
	$("#startbutton").click(function(){
		$.playground().startGame(function(){
			$("#welcomeScreen").remove();
		});
	})
	
	//this is where the keybinding occurs
	$(document).keydown(function(e){
	switch(e.keyCode){
		case 65: //this is left! (a)
			sidemove--;
			break;
		case 87: //this is up! (w)
			wanadrop = true;
			break;
		case 68: //this is right (d)
			sidemove++;
			break;
		case 83: //this is down! (s)
			wanapick = true;
			break;
	}
});
	
});

