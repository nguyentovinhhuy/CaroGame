function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

var game_key = makeid(5)
console.log("Random key: " + game_key)
console.log("Username: " + username)
console.log("Elo: " + elo)

// Number of X or O in a row for winning condition
var win_len = 3
var clicked_tile = []

// Temporary init all tile clicked as None
var i = 0
var j = 0
for (i = 0; i <= 5; i++){
    var temp = []
    for (j = 0; j <= 5; j++){
        temp.push(null)
    }
    clicked_tile.push(temp)
}

var app = new Vue({
    el: '#app',
    data: {
        isPlayerTurn: 1,
        clicked_tile: clicked_tile,
        tile: "X",
        username: username,
        elo: elo,
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
                        "username": this.username
                    }))
                    //this.isPlayerTurn = 0
                }
            }else{
                console.log("This is not your turn")
            }
        },
        FindMatch: function(event) {
            var room_name = document.querySelector("#match-id").value
            console.log("RoomID entered: " + room_name)
            if (room_name == game_key){
                window.alert("You cannot enter your own game key")
            }else{
                game_socket = new WebSocket(
                    'ws://' +
                    window.location.host +
                    '/ws/game/' +
                    room_name +
                    '/'
                )       

                game_socket.send(JSON.stringify({
                    "type": "start_request",
                    "start_request": true,
                    "username": this.username,
                }))
            }
        }, 
    },
    computed: {

    },
})

// Game socket
var game_socket = new WebSocket(
    'ws://' +
    window.location.host +
    '/ws/game/' +
    game_key +
    '/'
);

game_socket.onmessage = function(msg){
    var msg = JSON.parse(msg.data)
    var message_type = msg["type"]
    if (message_type == "clicked_tile_response"){
        var IDclicked = msg["tileID"]
        var coordinates = msg["coordinates"]
        var TileName = msg["TileName"]
        var tile = document.querySelector("#cell" + IDclicked)
        console.log("Tile clicked: ", IDclicked)
        console.log("Cooridnates of tile clicked: ", coordinates)
        console.log("Name of tile clcked: ", TileName)
        tile.innerHTML = app.$data.tile
        app.$data.clicked_tile[coordinates[1]][coordinates[0]] = TileName
    }else if (message_type == "game_start_response"){
        clear_all_tiles()
    }
}


document.querySelector("#start-match").onclick = function () {
    var element = document.createElement("p");
    element.innerHTML = "Your game key is " + game_key + ". Share this key to your opponent";
    var game_details = document.querySelector("#get-match-id")
    game_details.innerHTML = " "
    game_details.appendChild(element)
}

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
        document.querySelector("#tile" + i).innerHTML = ""
        var y = (i - 1) / 5
        var x = (i - 1) % 5
        app.$data.clicked_tile[y][x] = null
    }
}
