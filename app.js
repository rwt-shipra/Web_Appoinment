
var mainApp = angular.module("qorql_app", ['ngRoute','ui.bootstrap','ngAnimate', 'ngSanitize','ui-notification']);
var baseTemplate = './app/templates/';
var baseImages = './images/';

function getImage(image) {
  return baseImages + image;
}

function getTemplate(template) {
  return baseTemplate + template;
}
mainApp.config(['$routeProvider', '$locationProvider',
function($routeProvider, $locationProvider) {
  $routeProvider
  .when('/', {
    templateUrl: getTemplate('master.html'),
    controller: 'DoctorController'
  })

  .when('/add_user/', {
    templateUrl: getTemplate('add_user.html'),
    controller: 'AppointmentController'
  })
  .when('/confirmationPopUp/', {
    templateUrl: getTemplate('confirmationPopUp.html'),
    controller: 'BrandInstanceCtrl'
  });
}
]);
mainApp.factory('homeService', ['$http', '$rootScope', function ($http, $rootScope) {
  var homeService = {};
  //var mainurl = "http://192.168.1.128:8080/web-book";
 var mainurl = "http://test.qorql.com/health-trace";
  //var mainurl = "http://192.168.1.136:8080/health-trace-api";
  homeService.getDoctors = function (callback) {
    $http.get(mainurl + '/v2/doctor/web?doctorid=54954d29e4b0ae1169ec2731').then(function (response) {
      callback(response);
    }, function (response) {
      callback(null);
    }
  );
};

/////// getting unique id to upload on s3
homeService.slots = function (date,doctorId,clinicsid,callback) {
  //alert();
  return $http.get(mainurl +'/v2/session/web?doctor='+doctorId+'&clinics='+clinicsid+'&startdate='+date+'&enddate='+date).then(function (response) {
    callback(response);
  }, function (response) {
    callback(null);
  }
);
};
homeService.Bookedslots = function (date,doctorId,clinicsid,callback) {
  //alert();
  return $http.get(mainurl +'/v2/appointment/web?date='+date+'&clinicsid='+clinicsid+'&numberofdays=1&doctorid='+doctorId).then(function (response) {
    callback(response);
  }, function (response) {
    callback(null);
  }
);
};

homeService.sendotps = function (mobile, callback) {

  $http.get(mainurl + '/v2/appointment/web/'+mobile+'/otp').then(function (response) {
    callback(response);
  }, function (response) {
    callback(null);
  }
);
};

homeService.verifyotps = function (mobile,otp,temp,callback) {

  $http.get(mainurl + '/v2/appointment/web/'+mobile+'/otp/'+otp+'?token='+temp).then(function (response) {
    callback(response);
  }, function (response) {
    callback(null);
  }
);
};

homeService.bookingappointment= function (pateindetial,callback) {

  $http.post(mainurl + '/v2/appointment/web',pateindetial).then(function (response) {
    callback(response);
  }, function (response) {
    callback(null);
  }
);
};


return homeService;

}]);

//Main Controller
mainApp.controller('MainController', ['$route', '$routeParams', '$location', '$scope', function($route, $routeParams, $location, $scope) {

  this.$route = $route;
  this.$routeparams = $routeParams;
  this.$location = $location;
}]);

//App controller

//.................................Add_user Controller.............................
mainApp.controller('AddUserController', function($scope) {

  $scope.timeChoise = 0;
  $scope.appfix =function(time)
  {
    $scope.timeChoise = time;
  };

});

//..............................appointment Controller.............................
mainApp.directive('loading', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="loading"><img src="https://www.wordbee.com/Content/Wordbee/Images/loading1.gif" width="55" height="55" />....Uploading File</div>',
            link: function (scope, element, attr) {
                scope.$watch('loading', function (val) {
                    if (val)
                        $(element).show();
                    else
                        $(element).hide();
                });
            }
        }
    })

//.......................................doc controller.....................................
mainApp.controller('DoctorController',['$scope','$uibModal', '$log', '$filter', '$window','homeService',function($scope,$uibModal, $log, $filter, $window,homeService) {

  var maxDate=moment().add(30,'days');
  var minDate=moment(new Date());
  
  $scope.isFirst=function(first,second){
      return first===0 && second==0
  }

  $scope.dateOptions = {
    maxDate: maxDate.toDate(),
    minDate: minDate.toDate()
  };

  $scope.isDateOpen=false;
  $scope.BookedInSession=[];
  $scope.openDate=function(){
    $scope.isDateOpen = !$scope.isDateOpen;
  }

  $scope.current=new Date();

  $scope.Date=moment(new Date()).format("DD-MM-YYYY");
  //Calendar Logic
  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();
 
  $scope.next = function() {
      if(maxDate.isSame($scope.dt,'day'))
    {
      console.log("Can't select more than 30 days");
      return;
    }
    var tmp=moment($scope.dt).add(1, 'days');
    $scope.dt=tmp.toDate();
  };

  $scope.prev = function() {
    if(minDate.isSame($scope.dt,'day'))
    {
      console.log("Can't select back date");
      return;
    }
    var tmp=moment($scope.dt).subtract(1, 'days');
    $scope.dt=tmp.toDate();
  };




  //Show Cla

  //Calendar Logic End


  homeService.getDoctors(function (response) {
    if (response && response.status === 200) {

      $scope.doctors= response.data.response;

      // $scope.project.doctor = $scope.Doctors[0].id + "+" + $scope.Doctors[0].name;
      console.log($scope.doctors);

      $scope.doctors.doctorId="54954d29e4b0ae1169ec2731";

      $scope.clinicsid=[];


      for(var i=0;i<$scope.doctors.clinics.length;i++){

        $scope.clinicsid.push($scope.doctors.clinics[i].id);

      }

      console.log($scope.clinicsid);
      $scope.showSlot();
    }
    else {
      console.log("Error in fetching Doctor data");
      // Notification({message: "Network Error! \n Please refresh the page."}, 'error')
    }


  });

  // var _date = $filter('date')(new Date(input), 'MMM dd yyyy');
  //console.log($scope.Date);
  $scope.$watch('dt', function (newValue, oldValue, scope) {
    //Do anything with $scope.letters
      if( $scope.clinicsid!=null){
        if( $scope.clinicsid.length>0)
          $scope.showSlot(); 
      }
});

  //Functions to Call Slots According to date Selected
      $scope.showSlot=function(currDate)
      {

      $scope.Date= moment($scope.dt).format("DD-MM-YYYY");
      console.log("Current Date:"+$scope.Date);
          homeService.slots($scope.Date,$scope.doctors.doctorId,$scope.clinicsid,function (response) {
            if (response && response.status === 200) {

              var sessionArray= response.data.response;

              //merge two arrays
              for(var j in $scope.doctors.clinics){
                for(var i in sessionArray)
                {
                  if($scope.doctors.clinics[j].id==sessionArray[i].clinicId)
                  angular.extend(sessionArray[i],$scope.doctors.clinics[j]);
                }
              }

              $scope.items=sessionArray;


              //  console.log(sessionArray);
              // $scope.project.doctor = $scope.Doctors[0].id + "+" + $scope.Doctors[0].name;
              //console.log(JSON.stringify($scope.items));
              ////Getting    Booked slots
              homeService.Bookedslots($scope.Date,$scope.doctors.doctorId,$scope.clinicsid,function (response) {
                if (response && response.status === 200) {
                  var ClinicBooked=response.data.response.clinics;
                  if(ClinicBooked.length>0)
                  {
                    for(i in $scope.items)
                    {
                      for(j in ClinicBooked)
                      {
                        if($scope.items[i].clinicId ===ClinicBooked[j].clinicid && ClinicBooked[j].appointments.length>0)
                        {

                          var Booked= ClinicBooked[j].appointments[0].appointments;

                          console.log(JSON.stringify(Booked));

                          var session=$scope.items[i].sessionsList[0].sessions;

                          for(var k in session){
                            for(var l in Booked){

                              if ( (session[k].startTime<=Booked[l].slotStartTime)&&(session[k].endTime>=Booked[l].slotEndTime )){
                                for(var m in session[k].slots)
                                {
                                  if ( (Booked[l].slotStartTime===session[k].slots[m].startTime)&&(Booked[l].slotEndTime === session[k].slots[m].endTime)){
                                    session[k].slots[m].isbooked=true;
                                    console.log(JSON.stringify($scope.items));
                                  }
                                }
                              }

                            }
                          }
                        }

                      }}
                    }
                  else{

                    console.log("Doc Has No CliniC available");
                  }
                    // $scope.project.doctor = $scope.Doctors[0].id + "+" + $scope.Doctors[0].name;
                    // console.log($scope.Doctors);
                }
                else {

                    console.log(response.status) ;
                    console.log(response.error);
                    // Notification({message: "Network Error! \n Please refresh the page."}, 'error')
                }
              });

              }
              else {
                console.log(response.status) ;
                console.log(response.error);
                // Notification({message: "Network Error! \n Please refresh the page."}, 'error')
              }
            });
      };




      //Functions to Call Slots According to date Selected  End

      

      // Appointment Slots according to session

      $scope.addItem = function() {
        var newItemNo = $scope.items.length + 1;
        $scope.items.push('Item ' + newItemNo);
      };



        $scope.Slottime={
          "clinicid":"5494082ae4b0ae1169ec26c9",
          "ClinicNAme":"sadargunjh",
          "doctorid":"54940e21e4b0ae1169ec26d0",
          "DoctorName":"Shipra",
          "date":"23-12-2016",
          "slotStartTime":2500,
          "slotEndTime":3000,
          "slot":"0",
          "patientProfile":{
            "name":"string",
            "mobileNumber":9205264310

          }
        }

      //Fuction to Book Slots
      $scope.bookSlot=function(time,clinicid,name){
        $scope.Slottime.doctorid= $scope.doctors.doctorId;
        $scope.Slottime.clinicid=clinicid;
        $scope.Slottime.ClinicNAme=name;
        $scope.Slottime.DoctorName=$scope.doctors.name;
        $scope.Slottime.date=$scope.Date;
        $scope.Slottime.slotStartTime= time.startTime;
        $scope.Slottime.slotEndTime= time.endTime;
        $scope.Slottime.slot= time.slotNumber;


        console.log("in Book Slot function"+$scope.Slottime);

        //console.log($scope.Slottime);

        // console.log($scope.dataformat);

        var modalBrand = $uibModal.open({
          templateUrl: './app/templates/confirmationPopUp.html',
          backdrop: 'true',
          controller: 'BrandInstanceCtrl',
          resolve: {
            Slottime: function () {
              return $scope.Slottime;
            }
          }
        });

        modalBrand.result.then(function () {
        }, function () {
          $log.info('Modal dismissed');

        });

      };
    }]);
  
    mainApp.controller('BrandInstanceCtrl', function ($scope,homeService, $uibModalInstance, $location, Slottime,Notification) {
      $scope.patientProfileRegistration={};
      $scope.mainDiv=true;
      $scope.Registration = Slottime;

      $scope.sendotpverify=false;

      $scope.pateintProfile=false;

      console.log ($scope.Registration);
       
            $scope.sendotp=function(valid){
         //$scope.loading = true;
          homeService.sendotps($scope.patientProfileRegistration.mobileNumber,function (response) {
          if (response && response.status === 200) {
            console.log($scope.patientProfileRegistration);
            $scope.sendotpverify=true;
           $scope.temp= response.data.response.temp;    
              }
              else {
                console.log("Error in fetching Doctor data");
                // Notification({message: "Network Error! \n Please refresh the page."}, 'error')
              }


           });

      }
      
     $scope.otpverify=function(valid){
       homeService.verifyotps($scope.patientProfileRegistration.mobileNumber,$scope.otp,$scope.temp,function (response) {
         
          if (response && response.status === 200&&response.data.status===200) {
              $scope.Registration.patientProfile.name=$scope.patientProfileRegistration.name;
              $scope.Registration.patientProfile.mobileNumber=$scope.patientProfileRegistration.mobileNumber;
                homeService.bookingappointment(JSON.stringify($scope.Registration),function (response) {
                  
                if (response && response.status === 200&&response.data.status===200) {

                  $scope.pateintProfile=true;
                  $scope.mainDiv=true;
                  Notification({message: "Appointment Suceesfully Booked"}, 'Success')
              
                  }
                  else {
                      console.log("registration Failed");
                      Notification({message: "Booking Failed"}, 'error')
                      // Notification({message: "Network Error! \n Please refresh the page."}, 'error')
                    }


                 });
           // Notification({message: "Appointment Suceesfully Booked"}, 'Success');

             }

           });

     }

     $scope.pateintRegistration=function(valid){
      $scope.close();
     }

      $scope.close = function () {
        $uibModalInstance.dismiss('cancel');
      };
    });
