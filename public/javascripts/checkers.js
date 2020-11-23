function Checkers() {
    checkers = new Object()
    /*
     * Returns a list of all avaiable move locations for any piece
     * location is a number between 1 and 64. Number based starting in the top left corner at 1
     * board an array of length 64 that represents the checker board
     * king if the piece is a king or not
     */
    function availableMovements(location, board, king = false, opponentMarker = "opponentPiece", emptyMarker = "empty") {
        let movements = [];
        let jump = false;
        let column = location % 8;
        if (location > 8) { //If at top row can't move up!
            if (column != 0) {
                if (board[location - 7] == emptyMarker) { //Check diagonally up right one location
                    movements = [location - 7];
                } else {
                    if (board[location - 14] == emptyMarker) { //Check diagonally up right two locations
                        if (column != 7) {
                            if (checkPiece(location - 7)) { //Check diagonally up right one location for opponent
                                movements = [location - 14]
                                jump = true;
                            }
                        }
                    }
                }

            }
            if (column != 1) {
                if (board[location - 9] == emptyMarker) { //Check diagonally up left one location
                    if (!jump) {
                        movements.push(location - 9);
                    }
                } else {
                    if (board[location - 18] == emptyMarker) { //Check diagonally up left two locations
                        if (column != 2) {
                            if (checkPiece(location - 9)) { //Check diagonally up left one location for opponent
                                if (!jump) {
                                    movements = []
                                }
                                movements.push(location - 18);
                                jump = true;
                            }
                        }
                    }
                }
            }
        }
        if (king & location < 57) { //Check if king and also if in bottom row
            if (column != 1) {
                if (board[location + 7] == emptyMarker) { //Check diagonally down left one location
                    if (!jump) {
                        movements.push(location + 7);
                    }
                } else {
                    if (board[location + 14] == emptyMarker) { //Check diagonally down left two locations
                        if (column != 2) {
                            if (checkPiece(location + 7)) { //Check diagonally down left one location for opponent
                                if (!jump) {
                                    movements = []
                                }
                                movements.push(location + 14);
                            }
                        }
                    }
                }
            }
            if (column != 0) {
                if (board[location + 9] == emptyMarker) { //Check diagonally down right one location
                    if (!jump) {
                        movements.push(location + 9);
                    }
                } else {
                    if (board[location + 18] == emptyMarker) { //Check diagonally down right two locations
                        if (column != 7) {
                            if (checkPiece(location + 9)) { //Check diagonally down right one location for opponent
                                if (!jump) {
                                    movements = []
                                }
                                movements.push(location + 18);
                            }
                        }
                    }
                }
            }
        }

        return movements; //Return all possible movements
    }

    function getCaptured(oldLocation, newLocation) {
        if (newLocation == oldLocation - 14) {
            return oldLocation - 7;
        }
        if (newLocation == oldLocation - 18) {
            return oldLocation - 9;
        }
        if (newLocation == oldLocation + 14) {
            return oldLocation + 7;
        }
        if (newLocation == oldLocation + 18) {
            return oldLocation + 9;
        }
        return 0;
    }

    //Convert remote locations ot local
    const convertSides = {
        63: 2,
        61: 4,
        59: 6,
        57: 8,
        56: 9,
        54: 11,
        52: 13,
        50: 15,
        47: 18,
        45: 20,
        43: 22,
        41: 24,
        40: 25,
        38: 27,
        36: 29,
        34: 31,
        31: 34,
        29: 36,
        27: 38,
        25: 40,
        24: 41,
        22: 43,
        20: 45,
        18: 47,
        15: 50,
        13: 52,
        11: 54,
        9: 56,
        8: 57,
        6: 59,
        4: 61,
        2: 63
    };

    //Game State
    var checkerState = {
        board: [],
        State: "waiting_selection",
        SelectedPiece: 0,
        Moves: [],
        color: ""
    };

    //Clear some state information
    function clearState() {
        checkerState.SelectedPiece = 0;
        checkerState.Moves = [];
        clearAvaliableMoves();
    }


    //Init Game
    function initGame(color, sendUpdate, sendCapture) {
        if (color == "red") {
            checkerState.State = "waiting_other_player"; //Black always moves first
        } else {
            checkerState.State = "waiting_selection"; //Let black start
        }
        checkerState.sendUpdate = sendUpdate; //Register the sendUpdate function.
        checkerState.sendCapture = sendCapture; //Register the sendCapture funcation
        checkerState.color = color; //Set player color
        clearState(); //Clear to known state.

        while (checkerState.board.length <= 64) {
            checkerState.board.push("empty") //Populate game board as all empty
        }
        [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24].forEach(function(x) {
            checkerState.board[x] = "opponentPiece";
        }); //Place opponents pieces
        [41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63].forEach(function(x) {
            checkerState.board[x] = "piece";
        }); //Place your pieces
        updateBoard(); //Update board on document
    }

    //handle Click events
    function BoardClickHandler(click_location) {
        if (checkerState.State == "waiting_selection" & ["king", "piece"].includes(checkerState.board[click_location])) { //If player turn and clicked on a vaild peice
            checkerState.SelectedPiece = click_location; //Save selected peice
            checkerState.State = "waiting_for_move" //Set to next state
            checkerState.Moves = availableMovements(click_location, checkerState.board, checkerState.board[click_location] == "king") //Get available moves
            if (checkerState.Moves == []) {
                checkerState.State == "waiting_selection";
            }
            updateAvaliableMoves();
            return;
        }

        if (checkerState.State == "waiting_for_move") {
            if (checkerState.Moves.includes(click_location)) {
                checkerState.State = "waiting_other_player";
                checkerState.board[click_location] = checkerState.board[checkerState.SelectedPiece];
                checkerState.board[checkerState.SelectedPiece] = "empty";
                checkKingMe();
                capturedPiece = getCaptured(checkerState.SelectedPiece, click_location)
                checkerState.sendUpdate(checkerState.SelectedPiece, click_location, capturedPiece > 0);
                if (capturedPiece > 0) {
                    checkerState.board[capturedPiece] = "empty";
                    checkerState.sendCapture(capturedPiece);
                    checkerState.State = "waiting_selection";
                }
                clearState();
                updateBoard();
                return;

            } else {
                clearState();
                checkerState.State = "waiting_selection";
                BoardClickHandler(click_location);
                return;
            }
        }
    }

    function processCapture(loc) {
        checkerState.board[convertSides[loc]] = "empty"
        updateBoard();
    }

    //Process update from remote
    function processUpdate(oldLocation, newLocation, didCapture) {
        checkerState.board[convertSides[newLocation]] = checkerState.board[convertSides[oldLocation]]
        checkerState.board[convertSides[oldLocation]] = "empty"
        checkRemoteKingMe();


        //Ready to own selection
        if (!didCapture) {
            checkerState.State = "waiting_selection";
        }
        //Lastly update board

        updateBoard();
    }

    //Check for King
    function checkKingMe() {
        [2, 4, 6, 8].forEach(function(x) {
            if (checkerState.board[x] == "piece") {
                checkerState.board[x] = "king"
            }
        })
    }

    function checkRemoteKingMe() {
        [57, 59, 61, 63].forEach(function(x) {
            if (checkerState.board[x] == "opponentPiece") {
                checkerState.board[x] = "opponentKing"
            }
        })
    }

    function checkPiece(x) {
        return checkerState.board[x] == "opponentPiece" | checkerState.board[x] == "opponentKing"
    }

    //Update Board
    function updateBoard() {
        clearBoard();
        [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24, 25, 27, 29, 31, 34, 36, 38, 40, 41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63].forEach(function(x) {
            if (checkerState.board[x] == "opponentPiece") {
                if (checkerState.color == "red") {
                    document.getElementById(x).classList.add("blackPiece");
                } else {
                    document.getElementById(x).classList.add("redPiece");
                }
            }
            if (checkerState.board[x] == "opponentKing") {
                if (checkerState.color == "red") {
                    document.getElementById(x).classList.add("blackKing");
                } else {
                    document.getElementById(x).classList.add("redKing");
                }
            }
            if (checkerState.board[x] == "piece") {
                if (checkerState.color == "black") {
                    document.getElementById(x).classList.add("blackPiece");
                } else {
                    document.getElementById(x).classList.add("redPiece");
                }
            }
            if (checkerState.board[x] == "king") {
                if (checkerState.color == "black") {
                    document.getElementById(x).classList.add("blackKing");
                } else {
                    document.getElementById(x).classList.add("redKing");
                }
            }
        })
    }

    //Clear all pieces from board
    function clearBoard() {
        [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24, 25, 27, 29, 31, 34, 36, 38, 40, 41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63].forEach(function(x) {
            document.getElementById(x).classList.remove("avaliableMove");
            document.getElementById(x).classList.remove("redKing");
            document.getElementById(x).classList.remove("redPiece");
            document.getElementById(x).classList.remove("blackKing");
            document.getElementById(x).classList.remove("blackPiece");
        })
    }

    //Clear Abaliable Moves
    function clearAvaliableMoves() {
        [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24, 25, 27, 29, 31, 34, 36, 38, 40, 41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63].forEach(function(x) {
            document.getElementById(x).classList.remove("avaliableMove");
        })
    }
    //Display all Avaliable Moves for current selected piece
    function updateAvaliableMoves() {
        checkerState.Moves.forEach(function(x) {
            document.getElementById(x).classList.add("avaliableMove");
        })
    }

    //Register Click Handlers	
    function registerClickHandlers() {
        [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 22, 24, 25, 27, 29, 31, 34, 36, 38, 40, 41, 43, 45, 47, 50, 52, 54, 56, 57, 59, 61, 63].forEach(function(x) {
            document.getElementById(x).addEventListener("click", function() {
                BoardClickHandler(x);
            });
        });
    }
    checkers.addClickHandlers = registerClickHandlers;
    checkers.initGame = initGame;
    checkers.processUpdate = processUpdate;
    checkers.processCapture = processCapture;
    return checkers;
}