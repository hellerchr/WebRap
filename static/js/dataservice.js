angular.module('DataServices', ['ngResource'])
    .factory('GcodeService', [ '$resource', function ($resource) {
    return $resource('/sendgcode', {}, {
        "execute":{ method:'POST' }
    });
}])
    .factory('StorageService', [ '$resource', function ($resource) {
    return $resource('/filestore', {}, {
        "store":{ method:'POST' }
    });
}])
    .factory('PrintControlService', [ '$resource', function ($resource) {
    return $resource('/printcontrol', {}, {
        "execute":{ method:'POST' , isArray: false}
    });
}])
    .factory('StatusService', [ '$resource', function ($resource) {
    return $resource('/status', {}, {
        "get":{ method:'GET' , isArray: false}
    });
}])