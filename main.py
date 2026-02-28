import requests
import json

def send_discord_invite():
    # 1. Paste your copied URL here
    WEBHOOK_URL = "discord webhook url"
    
    # 2. This is the dummy data simulating an event from your database
    event_data = {
        "title": "Midnight Coding Session",
        "host": "CodeMaster99",
        "status": "Public"
    }

    # 3. Format the message for Discord
    message = {
        "content": f"🎉 **New Event Alert!** 🎉\n**{event_data['title']}** is being hosted by {event_data['host']}!\n*Head to the Event Board to request Vault access.*",
        "username": "EventBoard Alerts"
    }
    
    # 4. Send the POST request to Discord
    response = requests.post(
        WEBHOOK_URL, 
        data=json.dumps(message), 
        headers={"Content-Type": "application/json"}
    )
    
    # 5. Check if it worked
    if response.status_code == 204:
        print("Success! Check your Discord channel.")
    else:
        print(f"Failed with status code: {response.status_code}")
        print(response.text)

# Run the function
send_discord_invite()
