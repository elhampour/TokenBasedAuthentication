var myApp = angular.module("myApp", ['ngRoute']);
//config routing
myApp.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when("/", {
        redirectTo: '/home'
    })
    .when("/home", {
        templateUrl: '/template/home.html',
        controller: 'homeController'
    })
    .when("/authenticated", {
        templateUrl: '/template/authenticate.html',
        controller: 'authenticateController'
    })
    .when("/authorized", {
        templateUrl: '/template/authorize.html',
        controller: 'authorizeController'
    })
    .when("/login", {
        templateUrl: '/template/login.html',
        controller: 'loginController'
    })
    .when("/unauthorized", {
        templateUrl: '/template/unauthorize.html',
        controller: 'unauthorizeController'
    })
}]);
//global variable for store service base path
myApp.constant("serviceBasePath", 'http://localhost:5337/');
//controllers
myApp.controller('homeController', ['$scope', 'dataSerivce', function ($scope, dataSerivce) {
    //FETCH DATA 
    $scope.data = "";
    dataSerivce.getAnonymousData().then(function (data) {
        $scope.data = data;
    });
}]);
myApp.controller('authenticateController', ['$scope', 'dataSerivce', function ($scope, dataSerivce) {
    //FETCH DATA 
    $scope.data = "";
    dataSerivce.getAuthenticateData().then(function (data) {
        $scope.data = data;
    });
}]);
myApp.controller('authorizeController', ['$scope', 'dataSerivce', function ($scope, dataSerivce) {
    //FETCH DATA 
    $scope.data = "";
    dataSerivce.getAuthorizeData().then(function (data) {
        $scope.data = data;
    });
}]);
myApp.controller('loginController', ['$scope', 'accountService', '$location', function ($scope, accountService, $location) {
    //FETCH DATA 
    $scope.account = {
        username: '',
        password: ''
    };
    $scope.message = '';
    $scope.login = function () {
        accountService.login($scope.account).then(function (data) {
            $location.path('/home');
        }, function (error) {
            $scope.message = error.error_description;
        });
    };
}]);
myApp.controller('unauthorizeController', ['$scope', function ($scope) {
    //FETCH DATA 
    $scope.data = 'Sorry your are not authorize to see this page.';
}]);
//services
myApp.factory('dataSerivce', ['$http', 'serviceBasePath', function ($http, serviceBasePath) {
    var fac = [];
    fac.getAnonymousData = function () {
        return $http.get(serviceBasePath + "/api/data/forall").then(function (response) {
            return response.data;
        });
    };
    fac.getAuthenticateData = function () {
        return $http.get(serviceBasePath + "/api/data/authenticate").then(function (response) {
            return response.data;
        });
    };
    fac.getAuthorizeData = function () {
        return $http.get(serviceBasePath + "/api/data/authorize").then(function (response) {
            return response.data;
        });
    };
    return fac;
}]);
myApp.factory('userService', function () {
    var fac = [];
    fac.currentUser = null;
    fac.setCurrentUser = function (user) {
        fac.currentUser = user;
        sessionStorage.user = angular.toJson(user);
    };
    fac.getCurrentUser = function () {
        fac.currentUser = angular.fromJson(sessionStorage.user);
        return fac.currentUser;
    };
    return fac;
});
myApp.factory('accountService', ['$http', '$q', 'serviceBasePath', 'userService', function ($http, $q, serviceBasePath, userService) {
    var fac = [];
    fac.login = function (user) {
        var obj = { 'username': user.username, 'password': user.password, 'grant_type': 'password' };
        Object.toparams = function ObjectToParams(obj) {
            var p = [];
            for (var key in obj) {
                p.push(key + '=' + encodeURIComponent(obj[key]));
            }
            return p.join("&");
        };

        var defer = $q.defer();
        $http({
            method: 'post',
            url: serviceBasePath + '/token',
            data: Object.toparams(obj),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).then(function (response) {
            userService.setCurrentUser(response.data);
            defer.resolve(response.data);
        }, function (error) {
            defer.reject(error.data);
        });

        return defer.promise;
    };
    fac.logout = function () {
        userService.currentUser = null;
        userService.setCurrentUser(userService.currentUser);
    };
    return fac;
}]);
//http interceptor
myApp.config(['$httpProvider', function ($httpProvider) {
    var interceptor = function (userService, $q, $location) {
        return {
            request: function (config) {
                var currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    config.headers['Authorization'] = "Bearer " + currentUser.access_token;
                }
                return config;
            },
            responseError: function (rejection) {
                if(rejection.status === 401){
                    $location.path('/login');
                    return $q.reject(rejection);
                }
                if (rejection.status === 403) {
                    $location.path('/unauthorized');
                    return $q.reject(rejection);
                }

                return $q.reject(rejection);
            }
        };
    };
    var params = ['userService', '$q', '$location'];
    interceptor.$inject = params;
    $httpProvider.interceptors.push(interceptor);
}]);