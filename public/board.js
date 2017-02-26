angular.module('app').component('board',{
	templateUrl: '/public/board.html',
    controllerAs: 'vm',
	controller: function(firebaseFactory,$firebaseArray,$firebaseObject) {
        var vm = this;
        vm.storyStates = {
            accepted: 'accepted',
            stretch: 'stretch',
            discarded: 'discarded',
            underConsideration: 'under consideration'
        };
        //TODO getBoard key is a place holder, use current
        vm.board = firebaseFactory.getBoard('-KdwTvkimpR2Rq9YB38L');
        vm.stories = $firebaseArray(vm.board.child('stories'));
        
        vm.onClick_CreateStory = function(){
           console.log(vm.newStory);
           vm.board.child('stories').push(vm.newStory);
        }
        vm.onClick_UpdateStory = function(index){
            vm.stories[index].save()
        }
        vm.onClick_Update = function(index){
            vm.stories
        }
        console.log(vm.board);
        
        // firebaseFactory.getBoard()
        
    }
});