/*
* Returns a list of all avaiable move locations for any piece
* location is a number between 1 and 64. Number based starting in the top left corner at 1
* board an array of length 64 that represents the checker board
* king if the piece is a king or not
*/

function avaliableMovements(location,board,king=false,opponentMarker="opponent"){
    movements = []
    column = location%8
    if(location > 8){ //If at top row can't move up!
    
        if(column != 0){
            if(board[location-7] == null){ //Check diagonally up right one location
                movements.push(location-7)
            }else{
                if(board[location-14] == null){ //Check diagonally up right two locations
                    if(board[location-7] == opponentMarker){ //Check diagonally up right one location for opponent
                        movements.push(location-14)
                    }
                }
            }
            
        }
        if(column != 1){
            if(board[location-9] == null){ //Check diagonally up left one location
                movements.push(location-9)
            }else{
                if(board[location-18] == null){ //Check diagonally up left two locations
                    if(board[location-9] == opponentMarker){  //Check diagonally up left one location for opponent
                        movements.push(location-18)
                    }
                }
            }
        }
    }
    if(king & location < 57){ //Check if king and also if in bottom row
        if(column != 1){
            if(board[location+7] == null){ //Check diagonally down left one location
                movements.push(location+7)
            }else{
                if(board[location+14] == null){ //Check diagonally down left two locations
                    if(board[location+7] == opponentMarker){  //Check diagonally down left one location for opponent
                        movements.push(location+14)
                    }
                }
            }
        }
        if(column != 0){
            if(board[location+9] == null){ //Check diagonally down right one location
                movements.push(location+9)
            }else{
                if(board[location+18] == null){ //Check diagonally down right two locations
                    if(board[location+9] == opponentMarker){ //Check diagonally down right one location for opponent
                        movements.push(location+18)
                    }
                }
            }
        }
    }
    
    return movements //Return all possible movements
}
