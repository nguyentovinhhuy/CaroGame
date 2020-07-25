from channels.generic.websocket import AsyncWebsocketConsumer
import json
import random

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "game_" + self.room_name

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print (text_data)
        data = json.loads(text_data)
        message_type = data["type"]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": message_type,
                "data": data,
            }
        )
    
    async def clicked_tile(self, event):
        tileID = event["data"]["tileID"]
        tile = event["data"]["TileName"]
        coordinates = event["data"]["coordinates"]
        sender = event["data"]["username"]

        await self.send(json.dumps({
            "type": "clicked_tile_response",
            "tileID": tileID,
            "TileName": tile,
            "coordinates": coordinates,
            "sender": sender,
        }))

    async def start_request(self, event):
        print (event["data"]["start_request"])
        username = event["data"]["username"]
        first_player = random.randint(1, 2)

        await self.send(json.dumps({
            "type": "game_start_response",
            "username1": username,
            "username2": self.room_name,
            "first_player": first_player,
            "message": "Starting games for room" + self.room_name
        }))

    async def end_game(self, event):
        await self.send()
        pass