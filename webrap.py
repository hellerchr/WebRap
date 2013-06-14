from flask import *
import json
import time
import settings
import sys
import os

from pronterface import printcore
from pronterface.printrun import gcoder

GCODE_TEMP_FILE = './temp.gcode'

app = Flask(__name__)

temperature = 0

@app.route('/')
def index():
    return send_file('index.html')


@app.route('/gcode/storeprint', methods=['POST'])
def gcode_storeprint():
    data = json.loads(request.data)
    f = open(GCODE_TEMP_FILE, 'w+')
    f.write(data["data"])
    f.close()
    return "OK"


@app.route('/gcode/getlastprint')
def gcode_getlastprint():
    gcode = ""
    if (os.path.isfile(GCODE_TEMP_FILE)):
        gcode = open(GCODE_TEMP_FILE).read()

    response = {
        'gcode': gcode
    }
    return json.dumps(response)


@app.route('/gcode/execute', methods=['POST'])
def gcode_execute():
    # todo: not thread save..
    printer.received = []

    response = {
        'message': 'OK',
        'success': True
    }

    commands = request.data.split(";")
    for command in commands:
        printer.send_now(command.strip())

    time.sleep(0.2)

    response['message'] = '\n'.join(printer.received)
    return json.dumps(response)


@app.route('/status')
def status():
    progress = "00.0"
    if (printer.printing):
        progress = "%02.1f" % (100 * float(printer.queueindex) / len(printer.mainqueue))

    response = {
        'printing': printer.printing,
        'progress': progress,
        'temperature': temperature
    }
    return json.dumps(response)


@app.route('/printcontrol', methods=['POST'])
def printcontrol():
    # todo: not thread save..
    printer.received = []

    response = {
        'message': 'OK',
        'success': True
    }

    if (request.data == 'start'):
        gcode = gcoder.GCode(open(GCODE_TEMP_FILE))
        printer.startprint(gcode)

    elif (request.data == 'stop'):
        printer.pause()
        time.sleep(0.2)
        printer.send_now("M104 S0")
        time.sleep(0.2)
        printer.send_now("G91")
        time.sleep(0.1)
        printer.send_now("G1 Z5 F300")
        time.sleep(0.1)
        printer.send_now("G90")
        time.sleep(0.2)
        printer.send_now("G28 X0 Y0")

    elif (request.data == 'connect'):
        printer.connect(settings['USB_PORT'], settings['BAUD_RATE'])
        printer.tempcb = setTemperature

    elif (request.data == 'disconnect'):
        printer.disconnect()

    time.sleep(0.15)

    response['message'] = '\n'.join(printer.received)
    return json.dumps(response)


def setTemperature(newTemp):
    global temperature
    temperature = newTemp

if __name__ == '__main__':
    if (len(sys.argv) == 2):
        if (sys.argv[1] == 'dev'):
            settings = settings.development
            app.debug = True
    else:
        settings = settings.standard

    printer = printcore.printcore(settings['USB_PORT'], settings['BAUD_RATE'])
    printer.loud = True
    printer.tempcb = setTemperature
    time.sleep(5)
    app.run(host='0.0.0.0')
