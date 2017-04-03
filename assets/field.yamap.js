(function($){
  
    angular.module('cockpit.fields').run(['Contentfields', function(Contentfields) {

        Contentfields.register('yamap', {
            label: 'Yandex map',
            template: function(model, options) {
              	var balloonOptions = false;
              	try {
                  	balloonOptions = angular.fromJson(options.balloonOptions);
                } catch(e) {}
                return '<yamap-field class="uk-width-1-1" options=\''+JSON.stringify(balloonOptions || false)+'\' ng-model="'+model+'"></yamap>';
            }
        });

    }]);
 
  	angular.module('cockpit.fields').directive("yamapField", ['$timeout', function($timeout, yamapFieldCounter) {      	
 		return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
          	templateUrl: App.base('/modules/addons/yamap/assets/tpl/yamap.html'),
          	compile: function(tElement, tAttrs) {
                return {
                    pre: function(scope, elm, attrs, ngModel) {
                      	scope.templateFactory = false;                      	
                        scope.balloonEdit = {
                            build: function (data) {
                                var BalloonContentLayout = scope.templateFactory.get('labelTpl');
                                BalloonContentLayout.superclass.build.call(this);
                              	this.htmlContainer = $(this._element);
                                this.htmlContainer.find('.uk-button').bind('click', {$this: this}, this.onSaveClick);
                            },

                            clear: function () {
                                this.htmlContainer.find('.uk-button').unbind('click', this.onSaveClick);
                                var BalloonContentLayout = scope.templateFactory.get('labelTpl');
                                BalloonContentLayout.superclass.clear.call(this);
                            },

                            onSaveClick: function (event) {
                              	var $this = event.data.$this;
                                angular.forEach($this.htmlContainer.find('[name]'), function(input, key) {
                                  	input = $(input);
                                    $this._data.properties._data.balloonOptions[input.attr('name')].value = input.val();
                                  	
                                  	if (input.attr('name') == "title") {
                                      	$this._data.properties._data.iconContent = input.val();
                                    }
                                });
								scope.map.balloon.close();
                              	scope.$apply();
                              	return false;
                            }
                        };
                    },
                    post: function (scope, elm, attrs, ngModel) {
                      	var balloonOptions = angular.fromJson(attrs.options);

                        var geoObject = function(coord) {
                            var geoObjectProps = {};
                            if (angular.isArray(balloonOptions)) {
                                for (opt in balloonOptions) {
                                    var prop = {
                                        label: balloonOptions[opt].label,
                                    };
                                    if (angular.isDefined(balloonOptions[opt].default)) prop.value = balloonOptions[opt].default; else prop.value = "";
                                    geoObjectProps[balloonOptions[opt].name] = prop;
                                }
                            } else {
                                geoObjectProps.title = {
                                    label: "Название",
                                    value: "Новая точка"
                                }
                            }
                          	var default_title = "";
                          	if (angular.isDefined(geoObjectProps.title)) default_title = geoObjectProps.title.value;
                            this.point = {
                                geometry: {
                                    type: "Point",
                                    coordinates: coord
                                },
                                properties: {
                                    iconContent: default_title,
                                  	balloonOptions: geoObjectProps
                                }
                            };
                          	this.setTitle = function(title) {
                              	this.point.properties.iconContent = title;
                            };
                            this.setCoords = function(coords) {
                              	this.point.geometry.coordinates = coords;
                            };
                          	this.setBalloonOptions = function(options) {
                              	for (var prop in options) {
                                  	if (angular.isDefined(this.point.properties.balloonOptions[prop])) {
                                      	this.point.properties.balloonOptions[prop].value = options[prop];
                                    }
                                }
                            };
                            this.getData = function() {
                              	var result = {
                                  	title: this.point.properties.iconContent,
                                  	coords: this.point.geometry.coordinates
                                };
                              	var props = {};
                              	for (var key in this.point.properties.balloonOptions) {
                                  	var prop = this.point.properties.balloonOptions[key];
                                  	props[key] = prop.value;
                                }
                              	if (Object.keys(props).length > 0) result.options = props;
                              	return result;
                            };
                        };
                        var addMode = false;
                        scope.showLoader = true;
                        scope.addBtn = function(e) {
                            addMode = e.originalEvent.target._selected;
                        };
                        scope.addPoint = function(e) {
                            if (addMode) {
                                var coords = e.get('coords');
                                scope.geoObjects.push(new geoObject(coords));
                            }
                        };
                      	scope.moveCenter = function(e) {
                          	scope.center = e.get('newCenter');
                          	scope.zoom = e.get('newZoom');
                        }
                        scope.delPoint = function(e, i) {
                            scope.geoObjects.splice(i,1);
                        };
                      	scope.movePoint = function(objScope, index) {
                          	scope.geoObjects[index].setCoords(objScope.getCoord());
                        }
                      	
                        $timeout(function(){
                            if (!ngModel.$viewValue) {
                                ngModel.$setViewValue({
                                    geoObjects: [],
                                    zoom: 10,
                                    center: [37.64,55.76]
                                });
                            }
                          
                            scope.center = ngModel.$viewValue.center;
                            scope.zoom = ngModel.$viewValue.zoom;
                          
                          	scope.geoObjects = [];
                            for (var i in ngModel.$viewValue.geoObjects) {
                              	if (angular.isDefined(ngModel.$viewValue.geoObjects[i].coords)) {
                              		var obj = new geoObject(ngModel.$viewValue.geoObjects[i].coords);
                                  	if (angular.isDefined(ngModel.$viewValue.geoObjects[i].title)) obj.setTitle(ngModel.$viewValue.geoObjects[i].title);
                                  	if (angular.isDefined(ngModel.$viewValue.geoObjects[i].options)) obj.setBalloonOptions(ngModel.$viewValue.geoObjects[i].options);
                              		scope.geoObjects.push(obj);
                                }
                            }
                          
                            scope.$watch('center', function() {
                                var value = ngModel.$viewValue;
                                value.center = scope.center;
                                ngModel.$setViewValue(value);
                            });

                            scope.$watch('zoom', function() {
                                var value = ngModel.$viewValue;
                                value.zoom = scope.zoom;
                                ngModel.$setViewValue(value);
                            });

                            scope.$watch('geoObjects', function() {
                                var value = ngModel.$viewValue;
                                value.geoObjects = [];
                                for (var i in scope.geoObjects) {
                                  	value.geoObjects.push(scope.geoObjects[i].getData());
                                }
                                ngModel.$setViewValue(value);
                            }, true);
                        });                      
                      
                        scope.afterInit = function(map) {
                          	scope.map = map;
                          	map.setZoom(scope.zoom);
                            scope.showLoader = false;
                        };                      
                      
                    } // link
            	}
            } // compile
        }
    }]);
      
})(jQuery);