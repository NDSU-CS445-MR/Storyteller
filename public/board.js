angular.module('app').component('board',{
	templateUrl: '/public/board.html',
    controllerAs: 'vm',
	controller: function(firebaseFactory,$firebaseArray,$firebaseObject,$log) {
        var vm = this;
        vm.storyStates = ['accepted','stretch','under consideration', 'discarded'];
        vm.newStory = {};
	vm.newStory.status = vm.storyStates[0];
	vm.board = firebaseFactory.getBoard(firebaseFactory.sessionStore.currentBoardKey);
        vm.stories = $firebaseArray(vm.board.child('stories'));
        vm.onClick_CreateStory = function(){
           vm.board.child('stories').push(vm.newStory);
           vm.newStory = {status:vm.storyStates[0]};
        };
        vm.onChange_updateStory = function(story){
           vm.board.child('stories').child(story.$id).update({body: !(story.body) ?'':story.body, name: !(story.name) ? '':story.name,status: story.status});
        };
        // todo how do I get the name of the board?
	//You have to asynchronously retrieve it from the Firebase object reference
        vm.temp = $firebaseObject(vm.board.child('name'));
	vm.temp.$loaded().then(function(){
            vm.boardname = vm.temp.$value;
            $log.log(vm.boardname);
	});
        // vm.onClick_ = function(index){
            
        // };
    }
});
