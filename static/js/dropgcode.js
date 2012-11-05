scene = undefined;
object = undefined;

function allowDrop(ev) {
    if (ev)
        ev.preventDefault();
}

function drop(ev) {
    $("#renderArea").find("canvas").hide();
    ev.preventDefault();
    var data = ev.dataTransfer.getData("Text");
    var files = ev.dataTransfer.files;
    if (files.length > 0) {
        var reader = new FileReader();
        reader.onload = function () {
            openGCodeFromText(reader.result);
            var bodyScope = angular.element($("body")).scope();
            bodyScope.$apply(function (scope) {
                scope.storeFile(files[0].name, reader.result, function() {
                    $("#renderArea").find("canvas").fadeIn('slow');
                });
            });
        };
        reader.readAsText(files[0]);
    }
}

function openGCodeFromText(gcode) {
    if (!scene)
        scene = createScene($('#renderArea'));

    if (object)
        scene.remove(object);

    object = createObjectFromGCode(gcode);
    scene.add(object);
}