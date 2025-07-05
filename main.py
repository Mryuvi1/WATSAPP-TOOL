
from flask import Flask, request, render_template
from whatsapp import WhatsApp

app = Flask(__name__)
wp = WhatsApp('creds.json')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send', methods=['POST'])
def send():
    number = request.form['number']
    message = request.form['message']

    try:
        wp.send_message(number, message)
        return f"<h2>✅ Message Sent to {number} Successfully by KING MAKER YUVI</h2><a href='/'>Go Back</a>"
    except Exception as e:
        return f"<h2>❌ Error: {str(e)}</h2><a href='/'>Try Again</a>"

if __name__ == '__main__':
    app.run(debug=True)
