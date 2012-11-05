angular.module('DataServices', ['ngResource'])
    .factory('GcodeService', [ '$resource', function ($resource) {
    return $resource('/gcode/:endpoint', {}, {
        "storePrint":{ method:'POST', params:{ endpoint:'storeprint' }},
        "getLastPrint":{ method:'GET', params:{ endpoint:'getlastprint' }},
        "execute":{ method:'POST', params:{ endpoint:'execute' }}
    });
}])
    .factory('PrintControlService', [ '$resource', function ($resource) {
    return $resource('/printcontrol', {}, {
        "execute":{ method:'POST' }
    });
}])
    .factory('StatusService', [ '$resource', function ($resource) {
    return $resource('/status', {}, {
        "get":{ method:'GET' }
    });
}])