function mainCtrl($scope, GcodeService, StorageService, PrintControlService, StatusService) {

    $scope.command = ''
    $scope.consoleHistory = [];
    $scope.cmdHistory = [];
    selectedCommand = 0;

    StatusService.get(function (status) {
        $scope.printing = status.printing;
        createObjectFromGCode(status.lastGcode);
    });

    $scope.userCommands = {

    };

    $scope.commands = {
        'clear':function (params, callback) {
            $scope.consoleHistory = [];
            $scope.command = '';
        },
        /*'def':function (params, callback) {

         if (params.length >= 2) {
         console.log(params);
         var name = params[0];
         console.log(!$scope.commands.hasOwnProperty(name));
         if (/\w+/.test(name) && !$scope.commands.hasOwnProperty(name)) {
         $scope.userCommands[name] = params.slice(1).join(" ");
         callback("user command: " + name + " has been set. type: del " + name + " to delete.");
         }
         else {
         callback("illegal name: " + name);
         }
         }
         },
         'del':function (params, callback) {
         delete $scope.userCommands[params[0]];
         callback("user command: " + params[0] + " has been deleted.")
         },*/
        'home':function (params, callback) {
            if (callback)
                GcodeService.execute("G28 X0 Y0 Z0", callback);
            else
                GcodeService.execute("G28 X0 Y0 Z0");
        },
        'print':function (params, callback) {
            if (params.length == 1) {
                console.log(params[0]);
                if ((params[0] === 'start')) $scope.printing = true;
                if ((params[0] === 'stop')) $scope.printing = false;
                if (callback)
                    PrintControlService.execute(params[0], callback);
                else
                    PrintControlService.execute(params[0]);
            }
        },
        'temp':function (params, callback) {
            if (params == undefined || params.length == 0)
                GcodeService.execute("M105", function (data) {
                    if (data)
                        $scope.extruderTemp = data.message.match(/T:(\d+.\d)/)[0];

                    if (callback)
                        callback(data);
                });
            else if (params.length == 1)
                GcodeService.execute("M104 S" + params[0], callback);
        },
        'connect':function (params, callback) {
            PrintControlService.execute('connect', callback);
        },
        'disconnect':function (params, callback) {
            PrintControlService.execute('disconnect', callback);
        },
        'fan':function (params, callback) {
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
        },
        'move':function (params, callback) {
            var speed = 0;

            if (params.length == 1) {
                var axis = params[0].toUpperCase()[0];
                if (axis == 'X' || axis == 'Y')
                    speed = 2000;
                if (axis == 'Z')
                    speed = 300;
            }
            else if (params.length == 2)
                speed = params[1];

            if (callback)
                GcodeService.execute('G91;G1 ' + params[0].toUpperCase() + ' F' + speed + ';G90', callback);
            else
                GcodeService.execute('G91;G1 ' + params[0].toUpperCase() + ' F' + speed + ';G90');
        },
        'help':function (params, callback) {
            var cmds = [];
            for (key in $scope.commands)
                cmds.push(key);

            cmds.sort();

            var list = '';
            for (key in cmds)
                list += (cmds[key] + ', ');

            callback('available commands: ' + list.substr(0, list.length - 2));
        },
        'extrude':function (params, callback) {
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
    }

    $scope.sendCommand = function (command) {
        command = command.trim();

        var commands = undefined;

        //special case: 'def' don't tread semicolon as followup command
        if (command.split(" ")[0] == 'def')
            var commands = [command];
        else
            commands = command.split(";")

        for (var i = 0; i < commands.length; i++) {
            var commandWord = commands[i].split(" ")[0];

            if ($scope.commands.hasOwnProperty(commandWord)) {
                var params = commands[i].split(" ").slice(1);
                $scope.commands[commandWord](params, saveCommand);
            }
            else if ($scope.userCommands.hasOwnProperty(commandWord)) {
                $scope.sendCommand($scope.userCommands[commandWord]);
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
        if ($scope.command) {

            $scope.cmdHistory.push($scope.command);

            if ($scope.command != "clear") {
                $scope.consoleHistory.push($scope.command);
            }

            if (response) {
                if (response.hasOwnProperty("message")) {
                    $scope.consoleHistory.push('» ' + response.message);
                }
                else
                    $scope.consoleHistory.push('» ' + response);
            }

            //scroll console down
            setTimeout(function () {
                $('#console').scrollTop($('#console')[0].scrollHeight);
            }, 5);

            $scope.command = '';
            selectedCommand = $scope.cmdHistory.length;
        }
    }

    $scope.storeFile = function (fileName, data) {
        var data = { 'name':fileName, 'data':data }
        $scope.
            StorageService.store(data);
    }
}