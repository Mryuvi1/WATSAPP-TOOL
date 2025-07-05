
import pywhatkit
import pyautogui
import time

class WhatsApp:
    def __init__(self, creds_path):
        print(f"✅ WhatsApp session (simulated) loaded from {creds_path}")

    def send_message(self, number, message):
        print(f"📨 Sending message to {number}...")
        try:
            # Open WhatsApp Web instantly with message
            pywhatkit.sendwhatmsg_instantly(number, message, 10, True, 5)
            time.sleep(4)
            pyautogui.press("enter")
            print("✅ Message sent!")
        except Exception as e:
            print(f"❌ Failed to send: {e}")
            raise e
