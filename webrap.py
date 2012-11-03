from flask import *
import json
import time
import settings
import sys
from pronterface import printcore

GCODE_TEMP_FILE = './temp.gcode'

app = Flask(__name__)

printer = printcore.printcore()
printer.loud = True

@app.route('/')
def hello_world():
    return send_file('index.html')


@app.route('/filestore', methods=['POST'])
def store():
    data = json.loads(request.data)
    f = open(GCODE_TEMP_FILE, 'w+')
    f.write(data["data"])
    f.close()
    return "OK"


@app.route('/status')
def status():
    response = {
        'printing': printer.printing,
        'lastGcode': open(GCODE_TEMP_FILE).read()
    }
    return json.dumps(response)


@app.route('/printcontrol', methods=['GET','POST'])
def printcontrol():
    # todo: not thread save..
    printer.received = []

    response = {
        'message': 'OK',
        'success': True
    }

    if (request.data == 'start'):
        gcode = [i.replace("\n", "") for i in open(GCODE_TEMP_FILE)]
        printer.startprint(gcode)

    elif (request.data == 'stop'):
        printer.pause()
        time.sleep(0.5)
        printer.reset()
        time.sleep(0.5)
        printer.send_now("M104 0")
        printer.send_now("G91")
        printer.send_now("G1 Z10 F300")
        printer.send_now("G90")
        printer.send_now("G28 X0 Y0")


    elif (request.data == 'connect'):
        printer.reset()
        printer.connect(settings['USB_PORT'], settings['BAUD_RATE'])

    elif (request.data == 'disconnect'):
        printer.disconnect()

    time.sleep(0.15)

    response['message'] = '\n'.join(printer.received)
    return json.dumps(response)


@app.route('/sendgcode', methods=['POST'])
def send_gcode():
    # todo: not thread save..
    printer.received = []

    response = {
        'message': 'OK',
        'success': True
    }

    commands = request.data.split(";")
    for command in commands:
        printer.send_now(command.strip())

    time.sleep(0.15)

    response['message'] = '\n'.join(printer.received)
    return json.dumps(response)

if __name__ == '__main__':
    if (len(sys.argv) == 2):
	if (sys.argv[1] == 'dev'):
        	settings = settings.development
        	app.debug = True
    else:
        settings = settings.standard

    printer.connect(settings['USB_PORT'], settings['BAUD_RATE'])
    app.run(host='0.0.0.0')
