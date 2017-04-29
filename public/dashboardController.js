angular.module('app').component('dashboard',{
	templateUrl: '/public/dashboard.html',
	controllerAs: 'vm',
	controller: function(firebaseConnection,$firebaseArray,$location,$timeout,$cookies){
		var vm = this;
		vm.currentUser = $cookies.getObject('sessionData');
		vm.isAdmin = vm.currentUser.type === 'admin';
		vm.currentUserKey = vm.currentUser.key;
		vm.location = "Admin Dashboard"
		vm.search = "";
		vm.creatingNew = false;
		vm.showBoardBlade = true;
		vm.showUserBlade = false;
		vm.showUserDetail = false;
		vm.showBoardDetail = false;
		vm.showConfig = false;
		vm.backupData = {};
		vm.activeData = {};
		vm.boardsList = $firebaseArray(firebaseConnection.getBoards());
		if(vm.isAdmin){
			vm.boards = $firebaseArray(firebaseConnection.getBoards());
		}
		else{
			vm.boards = vm.currentUser.authorizedBoards;
		}
		vm.users = $firebaseArray(firebaseConnection.getUsers());

		vm.onClick_viewChild = function(type,data){
			vm.creatingNew = false;
			vm.activeData = angular.copy(data);
			vm.backupData = angular.copy(data);
			switch(type){
				case 'user':{
					vm.showUserDetail = true;
					vm.showBoardDetail = false;
					vm.showConfig = false;
					break;
				}
				case 'board':{
					vm.showUserDetail = false;
					vm.showBoardDetail = true;
					vm.showConfig = false;
					break;
				}
			}
		}

		vm.onClick_selectBlade = function(blade){
			vm.creatingNew = false;
			vm.activeData = {};
			vm.backupData = {};
			switch(blade){
				case 'boards':{
					vm.showBoardBlade = true;
					vm.showBoardDetail = false;
					vm.showUserBlade = false;
					vm.showUserDetail = false;
					vm.showUserConfig = false;
					vm.search = "";
					break;
				}
				case 'users':{
					vm.showBoardBlade = false;
					vm.showBoardDetail = false;
					vm.showUserBlade = true;
					vm.showUserDetail = false;
				    vm.showUserConfig = false;
					vm.search = "";
					break;
				}
				case 'config':{
					vm.activeData = vm.currentUser;
					vm.showBoardBlade = false;
					vm.showBoardDetail = false;
					vm.showUserBlade = false;
					vm.showUserDetail = false;
					vm.showUserConfig = true;
					break;
				}
			}
		}
		vm.onClick_authorizeBoard = function(board){
			var boardData = {
				name: board.name,
				key: board.$id
			};
			if(vm.activeData.authorizedBoards){
				vm.activeData.authorizedBoards.push(boardData);
			}
			else{
				vm.activeData.authorizedBoards = [];
				vm.activeData.authorizedBoards.push(boardData);
			}
		}
		vm.onClick_deAuthorizeBoard = function(board){
			var index = vm.activeData.authorizedBoards.findIndex(function(element){
				return element.key == board.$id;
			});
			vm.activeData.authorizedBoards.splice(index,1);
		}
		vm.onClick_deleteUser = function(){
			if(vm.activeData.$id){
				firebaseConnection.deleteUser(vm.activeData);
			}
			else{
				resetActiveDataUser()
			}
			vm.showUserDetail = false;
			$('#confirmModal').modal('hide');
		}
		vm.onClick_saveUser = function(){
			if(vm.activeData.authorizedBoards){
				var formattedBoards = []
				vm.activeData.authorizedBoards.forEach(function(element) {
					var formattedBoard = {
						key: element.key,
						name: element.name
					};
					formattedBoards.push(formattedBoard);
				});	
				vm.activeData.authorizedBoards = formattedBoards;
			}
			firebaseConnection.updateUser(vm.activeData);
			if(vm.activeData.$id){
				vm.backupData = vm.activeData;
			}
			else{
				resetActiveDataUser()
			}
		}
		vm.onClick_saveBoard = function(){
			if(vm.activeData.$id){
				var temp = vm.activeData.blackList.split(",");
				temp.forEach(function(string){
					string = string.trim(" ");
				});
				vm.activeData.blackList = temp;
				firebaseConnection.updateBoard(vm.activeData);
			}
			else{
				resetActiveDataBoard;
				firebaseConnection.createBoard(vm.activeData);
			}
			resetActiveDataBoard();
		}
		vm.onClick_deleteBoard = function(){
			firebaseConnection.deactivateBoard(vm.activeData);
			vm.showBoardDetail = false;
			$('#confirmModal').modal('hide');

			window.setTimeout(hideDetail(),1000);
		}
		vm.onClick_addNew = function(){
			resetActiveDataUser()
			vm.creatingNew = true;
			if(vm.showUserBlade){
				vm.showUserDetail = true;
			}
			if(vm.showBoardBlade){
				vm.showBoardDetail = true;
			}
		}
		vm.onClick_openBoard = function(){
			firebaseConnection.sessionStore.currentBoardKey = vm.activeData.$id || vm.activeData.key;
			$location.path('/board');
		}
		vm.checkUserAuthorization = function(boardId){
			if(vm.activeData.authorizedBoards && vm.activeData.authorizedBoards != 'null'){
			return vm.activeData.authorizedBoards.findIndex(function(element){
				return element.key == boardId;
			});
			}
			else{
				return -1;
			}
		}
		function resetActiveDataUser(){
			vm.backupData = {}
			vm.activeData = {
				password: "password1",
				authorizeForAllBoards: true
			};
		}
		function resetActiveDataBoard(){
			vm.backupData = {};
			vm.activeData = {};
		}
		function hideDetail(){
			if(vm.showUserDetail){
				vm.showUserDetail = false;
			}
			else{
				vm.showBoardDetail = false;
			}
		}
		
	}
});