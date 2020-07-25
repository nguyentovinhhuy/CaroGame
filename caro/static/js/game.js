console.log("Username: " + username)
console.log("Elo: " + elo)

// Number of X or O in a row for winning condition
var win_len = 3
var clicked_tile = []

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Temporary init all tile clicked as None
var i = 0
var j = 0
for (i = 0; i < 5; i++){
    var temp = []
    for (j = 0; j < 5; j++){
        temp.push(null)
    }
    clicked_tile.push(temp)
}

// Game socket
var game_socket = new WebSocket(
    'ws://' +
    window.location.host +
    '/ws/game/' +
    username +
    '/'
);

var app = new Vue({
    el: '#app',
    data: {
        isPlayerTurn: 1,
        clicked_tile: clicked_tile,
        tile: "X",
        username: username,
        elo: elo,
        opponent_name: null,
        InGameStatus: 0,
    },
    methods: {
        // All types of messages to send via websockets, all stored in message.type
        // "start_request": Make a request to start a game
        // "clicked_tile": Send the id of the clicked tile from a player to another player
        // "end_game": A player won, send the status of win and lose to all players and the name of the player won
        OnTileClick: function (tileID) {
            if (this.isPlayerTurn){
                var x = (tileID - 1) % 5
                var y = Math.floor((tileID - 1) / 5)
                var coordinates = [x, y]
                clicked_tile[x][y] = this.tile
                document.querySelector("#cell" + tileID).innerHTML = this.tile
                console.log(isWinner(coordinates, this.clicked_tile, win_len, this.tile))
                if (isWinner(coordinates, this.clicked_tile, win_len, this.tile)){
                    game_socket.send(JSON.stringify({
                        "type": "end_game",
                        "tileID": tileID, 
                        "winner": true, 
                        "TileName": this.tile,
                        "coordinates": coordinates,
                        "username": this.username
                    }))
                    this.isPlayerTurn = 0
                }else{
                    game_socket.send(JSON.stringify({
                        "type": "clicked_tile",
                        "tileID": tileID, 
                        "TileName": this.tile,
                        "coordinates": coordinates,
                        "username": this.username,
                        "opponent_name": this.opponent_name
                    }))
                    this.isPlayerTurn = 0
                }
            }else{
                console.log("This is not your turn")
            }
        },
        FindMatch: function(event) {
            var opponent_name = document.querySelector("#match-id").value
            console.log("Username entered: " + opponent_name)
            var username = this.username
            if (opponent_name == username){
                window.alert("You cannot enter your own username")
            }else{
                this.opponent_name = opponent_name
                game_socket = new WebSocket(
                    'ws://' +
                    window.location.host +
                    '/ws/game/' +
                    opponent_name +
                    '/'
                )       
                
                game_socket.onopen = function (){
                    console.log(username)
                    game_socket.send(JSON.stringify({
                        "type": "start_request",
                        "start_request": true,
                        "username": username,
                    }))
                }

                game_socket.onmessage = onMessage
            }
        }, 
    },
    computed: {

    },
})
function onMessage(msg){
    var msg = JSON.parse(msg.data)
    var message_type = msg["type"]
    if (message_type == "clicked_tile_response"){
        var IDclicked = msg["tileID"]
        var coordinates = msg["coordinates"]
        var TileName = msg["TileName"]
        var sender = msg["sender"]
        var tile = document.querySelector("#cell" + IDclicked)
        console.log("Tile clicked: ", IDclicked)
        console.log("Cooridnates of tile clicked: ", coordinates)
        console.log("Name of tile clcked: ", TileName)
        tile.innerHTML = TileName
        app.$data.clicked_tile[coordinates[1]][coordinates[0]] = TileName
        console.log("Current username: ", app.$data.username)
        console.log("Sender of the message: ", sender)
        if (sender != app.$data.username){
            app.$data.isPlayerTurn = 1
            console.log("It is now your turn")
        }else{
            app.$data.isPlayerTurn = 0
            console.log("It is now the opponent's turn")
        }
    }else if (message_type == "game_start_response"){
        var username1 = msg["username1"]
        var username2 = msg["username2"]
        var first_player = msg["first_player"]
        if (app.$data.username == username1 || app.$data.username == username2){
            if (app.$data.InGameStatus){
                console.log("User already in game")
                return
            }
            var user_number
            clear_all_tiles()
            if (app.$data.username == username1){
                user_number = 1
            }else{
                user_number = 2
            }
            if (first_player == user_number){
                app.$data.isPlayerTurn = 1
                app.$data.tile = "X"
                console.log("Game start!")
                console.log("You are the first player")
            }else{
                app.$data.isPlayerTurn = 0
                app.$data.tile = "O"
                console.log("Game start!")
                console.log("You are the secoond player")
            }
            app.$data.InGameStatus = 1
        }else{
            console.log("You are not in the game")
        }
    }else if (message_type == "end_game"){

    }else{
        console.error("Invalid type of response")
    }
}

game_socket.onmessage = onMessage

// Determine if this is a winner with an array of all checked tiles
// Input:
// tile_clicked: array of x and y coordinates [x, y]
// checked_tiles: array of tiles clicked and content (X, O or None)
// win_num: length needed to win the game (example: 3)
// symbol: X or O
function isWinner(tile_clicked, checked_tiles, win_num, symbol) {
    var x = tile_clicked[0]
    var y = tile_clicked[1]
    console.log(x, y)
    var i, j
    var n = win_num
    var temp = 0
    // Check horizontal line
    for (i = x - win_num + 1; i <= x + win_num - 1; i++){
        if (i < 0 || i > 4) {continue}
        if (checked_tiles[y][i] == symbol){
            temp++
            if (temp == win_num){
                return true
            }
        }else{
            temp = 0
        }
    }
    temp = 0
    // Check vertical line
    for (i = x - win_num + 1; i <= x + win_num - 1; i++){
        if (i < 0 || i > 4) {continue}
        if (checked_tiles[i][x] == symbol){
            temp++
            if (temp == win_num){
                return true
            }
        }else{
            temp = 0
        }
    }
    temp = 0
    // Check diagnal, from north west to south east
    for (i = x - win_num + 1, j = y - win_num + 1; i <= x + win_num - 1 || j <= y + win_num - 1; i++, j++){
        if (i < 0 || j < 0 || i > 4 || j > 4) {continue}
        if (checked_tiles[j][i] == symbol){
            temp++
            if (temp == win_num){
                return true
            }
        }else{
            temp = 0
        }
    }
    temp = 0
    // Check diagnal, from north east to south west
    for (i = x + win_num - 1, j = y - win_num + 1; i >= x - win_num + 1 || j <= y + win_num - 1; i--, j++){
        if (i < 0 || j < 0 || i > 4 || j > 4) {continue}
        if (checked_tiles[j][i] == symbol){
            temp++
            if (temp == win_num){
                return true
            }
        }else{
            temp = 0
        }
    }
    temp = 0
    return false
}

// Clear all tiles 
function clear_all_tiles() {
    var i = 1
    for (i = 1; i <= 25; i++){
        document.querySelector("#cell" + i.toString()).innerHTML = ""
        var y = Math.floor((i - 1) / 5)
        var x = (i - 1) % 5
        app.$data.clicked_tile[y][x] = null
    }
}
