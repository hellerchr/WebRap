angular.module('PollingService', []).
    factory('PollingWrapper', ['$timeout', '$http', function($timeout, $http) {
        function Poller(serviceObj, method, pollInterval, params) {
            this.serviceObj = serviceObj;
            this.method = method;
            this.params = params;

            this.pollInterval = pollInterval;

            this.pollerStarted = false;

            this.requestRunning = false;
            this.requestCounter = 0;
            this.updateTimer = undefined;

            this.successFunc = undefined;
            this.errorFunc = undefined;

            // If the object has been called like a serice (i.e. with success/failure handlers as last two parameters),
            //  store those in the right place and remove them from the arguments.
            var len = params.length;
            
            if(len >= 2 && typeof(params[len-2]) == 'function' && typeof(params[len-1]) == 'function') {
                this.successFunc = params[len-2];
                this.errorFunc = params[len-1];
                this.params.splice(-2, 2);
            } else if(len >= 1 && typeof(params[len-1]) == 'function') {
                this.successFunc = params[len-1];
                this.params.splice(-1, 1);
            }

            this._this = this;
        };

        Poller.prototype.poll = function() {
            this.requestCounter++;
            var requestNumber = this.requestCounter;

            var succ = angular.bind(this._this, function(data){
                if(this.requestCounter != requestNumber) {
                    return;
                }

                if(this.successFunc) {
                    this.successFunc(data);
                }
                this.requestRunning = false;
            });

            var fail = angular.bind(this._this, function(data) {
                if(this.errorFunc) {
                    this.errorFunc(data);
                }
                this.requestRunning = false;
            });

            // Do the poll and add success/error handler.
            if(this.serviceObj == $http) {
                this.serviceObj[this.method].apply(this.serviceObj, this.params).success(succ).error(fail);
            } else {
                // Don't modify the object-member. This would be done with every poll...
                var loc_param = this.params.slice(0);
                loc_param.push(succ, fail);
                this.serviceObj[this.method].apply(this.serviceObj, loc_param);
            }
        };

        Poller.prototype.do_polling = function() {
            if(!this.requestRunning) {
                this.requestRunning = true;
                this.poll();
            }
            this.updateTimer = $timeout(angular.bind(this._this, function(){ this.do_polling(); }), this.pollInterval);
        }

        Poller.prototype.start = function() {
            if(!this.pollerStarted) {
                this.pollerStarted = true;
                this.do_polling();
            }
        };

        Poller.prototype.stop = function() {
            $timeout.cancel(this.updateTimer)
            this.requestRunning = false;
            this.pollerStarted = false;
        };

        Poller.prototype.restart = function(startIfNotStarted) {
            // Default is to start the poller, even if it was not running before. However, this is not always wanted.
            // So, if startIfNotStarted == false, don't (re-)start the poller if it was not started before.
            if(startIfNotStarted === false && !this.pollerStarted) {
                return;
            }

            this.stop();
            this.start();
        };

        Poller.prototype.success = function(func) {
            this.successFunc = func;
            return this;
        };

        Poller.prototype.error = function(func) {
            this.errorFunc = func;
            return this;
        };

        var PollingWrapper = {};
        PollingWrapper.createPoller = function(serviceObj, method, pollInterval) {
            // Pass all additional arguments to the poller. We have to remove serviceObj & method though.
            var params = Array().slice.call(arguments, 3);
            return new Poller(serviceObj, method, pollInterval, params);
        };

        return PollingWrapper;
    }]);
