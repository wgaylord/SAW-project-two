function Checkers(){

	checkers = new Object()

	/*
	* Returns a list of all avaiable move locations for any piece
	* location is a number between 1 and 64. Number based starting in the top left corner at 1
	* board an array of length 64 that represents the checker board
	* king if the piece is a king or not
	*/

	function avaliableMovements (location,board,king=false,opponentMarker="opponentPiece",emptyMarker="empty"){
	    var movements = [];
	    var column = location%8;
	    if(location > 8){ //If at top row can't move up!
	    
		if(column != 0){
		    if(board[location-7] == emptyMarker){ //Check diagonally up right one location
		        movements.push(location-7);
		    }else{
		        if(board[location-14] == emptyMarker){ //Check diagonally up right two locations
		            if(column != 7){
		                if(board[location-7] == opponentMarker){ //Check diagonally up right one location for opponent
		                    movements.push(location-14);
		                }
		            }
		        }
		    }
		    
		}
		if(column != 1){
		    if(board[location-9] == emptyMarker){ //Check diagonally up left one location
		        movements.push(location-9);
		    }else{
		        if(board[location-18] == emptyMarker){ //Check diagonally up left two locations
		            if(column != 2){
		                if(board[location-9] == opponentMarker){  //Check diagonally up left one location for opponent
		                    movements.push(location-18);
		                }
		            }
		        }
		    }
		}
	    }
	    if(king & location < 57){ //Check if king and also if in bottom row
		if(column != 1){
		    if(board[location+7] == emptyMarker){ //Check diagonally down left one location
		        movements.push(location+7);
		    }else{
		        if(board[location+14] == emptyMarker){ //Check diagonally down left two locations
		            if(column != 2){
		                if(board[location+7] == opponentMarker){  //Check diagonally down left one location for opponent
		                    movements.push(location+14);
		                }
		            }
		        }
		    }
		}
		if(column != 0){
		    if(board[location+9] == emptyMarker){ //Check diagonally down right one location
		        movements.push(location+9);
		    }else{
		        if(board[location+18] == emptyMarker){ //Check diagonally down right two locations
		            if(column != 7){
		                if(board[location+9] == opponentMarker){ //Check diagonally down right one location for opponent
		                    movements.push(location+18);
		                }
		            }
		        }
		    }
		}
	    }
	    
	    return movements; //Return all possible movements
	}

	
	function didCapture(oldLocation,newLocation){
	    return Math.abs(oldLocation-newLocation)>10;
	}

	//Convert remote locations ot local
	const convertSides = {63:3,61:4,59:6,57:8,56:9,54:11,52:13,50:15,47:18,45:20,43:22,41:24,40:25,38:27,36:29,34:31,31:34,29:36,27:38,25:40,24:41,22:43,20:45,18:47,15:50,13:52,11:54,9:56,8:57,6:59,4:61,2:63};

	//Game State
	var checkerState ={board:[],State:"waiting_selection",SelectedPiece:0,Moves:[],color:"",sendUpdate:function(oldLocation,newLocation){}};

	//Clear some state information
	function clearState(){
		checkerState.SelectedPiece = 0;
		checkerState.Moves = [];
		clearAvaliableMoves();
	}


	//Init Game
	function initGame(color1,sendUpdate1){
		if(color1 == "red"){
		checkerState.State = "waiting_other_player";
		}else{
			checkerState.State = "waiting_selection";
		}
		checkerState.sendUpdate = sendUpdate1;
		checkerState.color = color1;
		checkerState.board = []
		clearState();
		
		while(checkerState.board.length <= 64){
			checkerState.board.push("empty")
		}
		[2,4,6,8,9,11,13,15,18,20,22,24].forEach(function(x){checkerState.board[x] = "opponentPiece";});
		[41,43,45,47,50,52,54,56,57,59,61,63].forEach(function(x){checkerState.board[x] = "piece";});
		updateBoard();
	}
	    
	//handle Click events
	function BoardClickHandler(click_location){
		if(checkerState.State == "waiting_selection" & ["king","piece"].includes(checkerState.board[click_location])){
			checkerState.SelectedPiece = click_location;
			checkerState.State = "waiting_for_move"
			checkerState.Moves = avaliableMovements(click_location,checkerState.board,checkerState.board[click_location]=="king")
			if(checkerState.Moves == []){
				checkerState.State == "waiting_selection";
			}
			updateAvaliableMoves();
			return;
		}
		
		if(checkerState.State == "waiting_for_move"){
			if(checkerState.Moves.includes(click_location)){
				checkerState.State = "waiting_other_player";
				checkerState.board[checkerState.SelectedPiece] = "empty";
				checkerState.board[click_location] = "piece";
				checkerState.sendUpdate(checkerState.SelectedPiece,click_location);
				checkKingMe();
				if(didCapture(checkerState.SelectedPiece,click_location)){
					//TODO Handle Captures 
					console.log("Captured Piece");
				}
				clearState();
				updateBoard();
				return;
				
			}else{
				clearState();
				checkerState.State = "waiting_selection";
				BoardClickHandler(click_location);
				return;
			}
		}
	}


	//Process update from remote
	function processUpdate(oldLocation,newLocation){
		checkerState.board[convertSides[newLocation]]=checkerState.board[convertSides[oldLocation]]
		checkerState.board[convertSides[oldLocation]] = "empty"
		checkRemoteKingMe();
		if(didCapture(oldLocation,newLocation)){
			//TODO Handle Captures
		}
		//Ready to own selection
		checkerState.State = "waiting_selection";
		//Lastly update board
		updateBoard();
	}
	
	//Check for King
	function checkKingMe(){
		[2,4,6,8].forEach(function(x){if(checkerState.board[x]=="piece"){checkerState.board[x]="king"}})
	}

	function checkRemoteKingMe(){
		[57,59,61,63].forEach(function(x){if(checkerState.board[x]=="opponentPiece"){checkerState.board[x]="opponentKing"}})
	}

	//Update Board
	function updateBoard(){
		clearBoard();
	    [2,4,6,8,9,11,13,15,18,20,22,24,25,27,29,31,34,36,38,40,41,43,45,47,50,52,54,56,57,59,61,63].forEach(function(x){
		if(checkerState.board[x] == "opponentPiece"){
			if(checkerState.color == "red"){
				document.getElementById(x).classList.add("blackPiece");
			}else{
				document.getElementById(x).classList.add("redPiece");
			}
		}
		if(checkerState.board[x] == "opponentKing"){
			if(checkerState.color == "red"){
				document.getElementById(x).classList.add("blackKing");
			}else{
				document.getElementById(x).classList.add("redKing");
			}
		}
		if(checkerState.board[x] == "piece"){
			if(checkerState.color == "black"){
				document.getElementById(x).classList.add("blackPiece");
			}else{
				document.getElementById(x).classList.add("redPiece");
			}
		}
		if(checkerState.board[x] == "king"){
			if(checkerState.color == "black"){
				document.getElementById(x).classList.add("blackKing");
			}else{
				document.getElementById(x).classList.add("redKing");
			}
		}
	    })
	}
	
	//Clear all pieces from board
	function clearBoard(){
	   [2,4,6,8,9,11,13,15,18,20,22,24,25,27,29,31,34,36,38,40,41,43,45,47,50,52,54,56,57,59,61,63].forEach(function(x){
		document.getElementById(x).classList.remove("avaliableMove");
		document.getElementById(x).classList.remove("redKing");
		document.getElementById(x).classList.remove("redPiece");
		document.getElementById(x).classList.remove("blackKing");
		document.getElementById(x).classList.remove("blackPiece");
	    })
	}

	//Clear Abaliable Moves
	function clearAvaliableMoves(){
	    [2,4,6,8,9,11,13,15,18,20,22,24,25,27,29,31,34,36,38,40,41,43,45,47,50,52,54,56,57,59,61,63].forEach(function(x){
		document.getElementById(x).classList.remove("avaliableMove");
	    })
	}
	//Display all Avaliable Moves for current selected piece
	function updateAvaliableMoves(){
		checkerState.Moves.forEach(function(x){document.getElementById(x).classList.add("avaliableMove");})
	}
		
	//Register Click Handlers	
	function registerClickHandlers(){
		document.getElementById(2).addEventListener("click", function(){BoardClickHandler(2);});
		document.getElementById(4).addEventListener("click", function(){BoardClickHandler(4);});
		document.getElementById(6).addEventListener("click", function(){BoardClickHandler(6);});
		document.getElementById(8).addEventListener("click", function(){BoardClickHandler(8);});
		document.getElementById(9).addEventListener("click", function(){BoardClickHandler(9);});
		document.getElementById(11).addEventListener("click", function(){BoardClickHandler(11);});
		document.getElementById(13).addEventListener("click", function(){BoardClickHandler(13);});
		document.getElementById(15).addEventListener("click", function(){BoardClickHandler(15);});
		document.getElementById(18).addEventListener("click", function(){BoardClickHandler(18);});
		document.getElementById(20).addEventListener("click", function(){BoardClickHandler(20);});
		document.getElementById(22).addEventListener("click", function(){BoardClickHandler(22);});
		document.getElementById(24).addEventListener("click", function(){BoardClickHandler(24);});
		document.getElementById(25).addEventListener("click", function(){BoardClickHandler(25);});
		document.getElementById(27).addEventListener("click", function(){BoardClickHandler(27);});
		document.getElementById(29).addEventListener("click", function(){BoardClickHandler(29);});
		document.getElementById(31).addEventListener("click", function(){BoardClickHandler(31);});
		document.getElementById(34).addEventListener("click", function(){BoardClickHandler(34);});
		document.getElementById(36).addEventListener("click", function(){BoardClickHandler(36);});
		document.getElementById(38).addEventListener("click", function(){BoardClickHandler(38);});
		document.getElementById(40).addEventListener("click", function(){BoardClickHandler(40);});
		document.getElementById(41).addEventListener("click", function(){BoardClickHandler(41);});
		document.getElementById(43).addEventListener("click", function(){BoardClickHandler(43);});
		document.getElementById(45).addEventListener("click", function(){BoardClickHandler(45);});
		document.getElementById(47).addEventListener("click", function(){BoardClickHandler(47);});
		document.getElementById(50).addEventListener("click", function(){BoardClickHandler(50);});
		document.getElementById(52).addEventListener("click", function(){BoardClickHandler(52);});
		document.getElementById(54).addEventListener("click", function(){BoardClickHandler(54);});
		document.getElementById(56).addEventListener("click", function(){BoardClickHandler(56);});
		document.getElementById(57).addEventListener("click", function(){BoardClickHandler(57);});
		document.getElementById(59).addEventListener("click", function(){BoardClickHandler(59);});
		document.getElementById(61).addEventListener("click", function(){BoardClickHandler(61);});
		document.getElementById(63).addEventListener("click", function(){BoardClickHandler(63);});
	}
	checkers.addClickHandlers = registerClickHandlers;
	checkers.initGame = initGame;
	checkers.processUpdate = processUpdate;
	return checkers;

}

