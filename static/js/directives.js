angular.module('components', [])
    .directive('buttonsActive', function () {

        return function (scope, element, attrs) {
            scope.$watch(attrs.buttonsActive, function (newVal, oldVal) {
                $(element).find(".btn").each(function () {

                    if (newVal) {
                        if (!$(this).hasClass("disabled"))
                            $(this).addClass("disabled");
                    }
                    else
                        $(this).removeClass("disabled");
                })
            });
        }
    });