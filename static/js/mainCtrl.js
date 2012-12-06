function mainCtrl($scope, GcodeService, PrintControlService, StatusService, PollingWrapper) {

    $scope.command = ''
    $scope.consoleHistory = [];
    $scope.cmdHistory = [];
    $scope.printing = false;
    $scope.gcodeAvailable = false;
    selectedCommand = 0;
    $scope.loadText = "LOADING..";

    function init() {
        //update temperature
        GcodeService.execute("M105");

        PollingWrapper.createPoller(StatusService, 'get', 5000).success(function (status) {
            $scope.printing = status.printing;
            $scope.progress = status.progress;
            $scope.extruderTemp = parseExtruderTemp(status.temperature);
        }).start();

        GcodeService.getLastPrint(function (print) {
            if (print.gcode) {
                openGCodeFromText(print.gcode);
                $scope.gcodeAvailable = true;
            }
            else
                $scope.loadText = "DROP GCODE HERE..";
        });
    }

    $scope.commands = {
        'clear':{
            'help':'clears the console',
            'function':function (params, callback) {
                $scope.consoleHistory = [];
                $scope.command = '';
            }},
        'home':{
            'help':'homes all the axes \n syntax: home',
            'function':function (params, callback) {
                if (callback)
                    GcodeService.execute("G28 X0 Y0 Z0", callback);
                else
                    GcodeService.execute("G28 X0 Y0 Z0");
            }},
        'print':{
            'help':'starts/stops the print \n syntax: print [start][stop] \n example: print start',
            'function':function (params, callback) {
                if (params.length == 1) {
                    if ((params[0] === 'start')) $scope.printing = true;
                    if ((params[0] === 'stop')) $scope.printing = false;
                    if (callback)
                        PrintControlService.execute(params[0], callback);
                    else
                        PrintControlService.execute(params[0]);
                }
            }},
        'temp':{
            'help':'sets or shows the temperature \n syntax: temp [<temperature>] \n example: temp 200',
            'function':function (params, callback) {
                if (params == undefined || params.length == 0)
                    GcodeService.execute("M105", function (data) {
                        if (data)
                            $scope.extruderTemp = parseExtruderTemp(data.message);

                        if (callback)
                            callback(data);
                    });
                else if (params.length == 1)
                    GcodeService.execute("M104 S" + params[0], callback);
            }},
        'connect':{
            'help':'connects to the printer',
            'function':function (params, callback) {
                PrintControlService.execute('connect', callback);
            }},
        'disconnect':{
            'help':'disconnects from the printer',
            'function':function (params, callback) {
                PrintControlService.execute('disconnect', callback);
            }},
        'fan':{
            'help':'sets the speed of the fan \n syntax1: fan <speed> \n syntax2: fan [on][off] \n example: fan on',
            'function':function (params, callback) {
                if (params.length == 1) {
                    if (params[0] == 'on') {
                        GcodeService.execute('M106 S255', callback);
                    }
                    else if (params[0] == 'off') {
                        GcodeService.execute('M107', callback);
                    }
                    else {
                        GcodeService.execute('M106 S' + parseInt(params[0]), callback);
                    }
                }
                else {
                    callback("wrong number of arguments");
                }
            }},
        'move':{
            'help':'move the printhead \n syntax: move <axis><distance> [<speed>] \n example: move x10',
            'function':function (params, callback) {

                if (params.length > 0) {
                    var speed = 0;
                    var axisMove = params[0].toUpperCase();

                    if (params.length == 1) {
                        var axis = axisMove[0];
                        if (axis == 'X' || axis == 'Y')
                            speed = 2000;
                        if (axis == 'Z')
                            speed = 300;
                    }
                    else if (params.length == 2)
                        speed = params[1];

                    if (callback)
                        GcodeService.execute('G91;G1 ' + axisMove + ' F' + speed + ';G90', callback);
                    else
                        GcodeService.execute('G91;G1 ' + axisMove + ' F' + speed + ';G90');
                }
            }},
        'help':{
            'help':'I like you, you\'ve got humor :-)',
            'function':function (params, callback) {
                //list all commands
                if (params.length == 0) {
                    var cmds = [];
                    for (key in $scope.commands)
                        cmds.push(key);

                    cmds.sort();

                    var list = '';
                    for (key in cmds)
                        list += (cmds[key] + ', ');

                    callback('available commands: \n' + list.substr(0, list.length - 2) + "\n type 'help <command>' for more information");
                }

                //help for specific command
                else {
                    var helpText = "";

                    if ($scope.commands[params[0]])
                        helpText = $scope.commands[params[0]].help;

                    callback(helpText);
                }
            }},
        'extrude':{
            'help':'extrudes n millimeter plastic \n syntax: extrude <distance in mm> \n example: extrude 5',
            'function':function (params, callback) {
                if (params && params.length == 1) {
                    var length = parseInt(params[0]);
                    var cmd = 'G91;G1 E' + length + ' F300' + ';G90';
                    GcodeService.execute(cmd, callback);
                }
                else {
                    if (callback)
                        GcodeService.execute('G91;G1 E5 F300' + ';G90', callback);
                    else
                        GcodeService.execute('G91;G1 E5 F300' + ';G90');
                }
            }
        }}

    $scope.sendCommand = function (command) {
        var commands = command.trim().split(";")

        for (var i = 0; i < commands.length; i++) {
            var commandWord = commands[i].split(" ")[0];

            if ($scope.commands.hasOwnProperty(commandWord)) {
                var params = commands[i].split(" ").slice(1);
                $scope.commands[commandWord].function(params, saveCommand);
            }
            else
                GcodeService.execute(command, saveCommand);
        }
    }

    $scope.lastCommand = function (e) {
        if (selectedCommand > 0) {
            selectedCommand -= 1;
            $scope.command = $scope.cmdHistory[selectedCommand];
        }
    }

    $scope.nextCommand = function (e) {
        if (selectedCommand < $scope.cmdHistory.length - 1) {
            selectedCommand += 1;
            $scope.command = $scope.cmdHistory[selectedCommand];
        }
        else {
            $scope.command = '';
            selectedCommand = $scope.cmdHistory.length;
        }
    }

    function saveCommand(response) {

        function addToConsole(text) {
            if (text) {
                var lines = text.trim().split("\n");
                for (var i = 0; i < lines.length; i++) {
                    $scope.consoleHistory.push('» ' + lines[i].trim());
                }
            }
        }

        if ($scope.command) {

            $scope.cmdHistory.push($scope.command);

            if ($scope.command != "clear")
                $scope.consoleHistory.push($scope.command);

            if (response) {
                if (response.hasOwnProperty("message"))
                    addToConsole(response.message);
                else
                    addToConsole(response);
            }

            //scroll console down
            setTimeout(function () {
                $('#console').scrollTop($('#console')[0].scrollHeight);
            }, 5);

            $scope.command = '';
            selectedCommand = $scope.cmdHistory.length;
        }
    }

    function parseExtruderTemp(message) {
        if (message)
            return message.match(/T:(\d+.\d)/)[1];
    }

    $scope.storeFile = function (fileName, data, callback) {
        var data = { 'name':fileName, 'data':data }
        $scope.gcodeAvailable = false;
        GcodeService.storePrint(data, function () {
            $scope.gcodeAvailable = true;
            callback();
        });
    }

    init();
}

