WebRap
======
A webinterface for controlling your gcode based 3d printer.
I started this project to transform my reprap into a wireless 3d printer by using a raspberry pi (with wifi dongle), that runs this webinterface.

Features
--------
- movement control
- temperature control
- extrusion control
- "console" interface for both, native gcode commands plus little webrap specific simplifications (e.g. move x10)
- upload & printcontrol of .gcode files (workflow: slice at your pc, print via webinterface)

Warning
-------
This tool is in an early stage. So at the moment the target audience are experienced users.
Use at your own risk ;-).

Installation
============

1. install git + pip
    
  `sudo apt-get install python-pip git-core`

2. install required python libs
    
  `sudo pip install flask werkzeug pyserial`

3. clone the code
    
  `git clone https://github.com/cheller/WebRap.git`

4. run it, make sure to adapt settings.py before
    
  `python ./webrap.py`
