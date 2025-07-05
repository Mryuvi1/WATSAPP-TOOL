
class WhatsApp:
    def __init__(self, creds_path):
        print(f"🟢 WhatsApp session loaded from {creds_path}")

    def send_message(self, number, message):
        print(f"📨 Sending '{message}' to {number} via creds.json...")
        # Simulate success
