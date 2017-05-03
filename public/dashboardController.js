angular.module('app').component('dashboard',{
	templateUrl: '/public/dashboard.html',
	controllerAs: 'vm',
	controller: function(firebaseConnection,$firebaseArray,$location,$timeout,$cookies){
		var vm = this;
		if(demo){
			vm.currentUser = firebaseConnection.sessionStore.currentUser;
		}
		else{
			vm.currentUser = $cookies.getObject('sessionData');
		}
		vm.isAdmin = vm.currentUser.type === 'admin';
		vm.currentUserKey = vm.currentUser.key;
		vm.location = "Admin Dashboard"
		vm.search = "";
		//Menu view state flags
		vm.creatingNew = false;
		vm.showBoardBlade = true;
		vm.showUserBlade = false;
		vm.showUserDetail = false;
		vm.showBoardDetail = false;
		vm.showConfig = false;
		vm.deletedBoards = false;
		vm.showConfirm = false;
		vm.backupData = {};
		vm.activeData = {};
		//Keep entire list of active boards
		vm.boardsList = $firebaseArray(firebaseConnection.getBoards());
		//Pull active user's authorizedBoards
		if(vm.isAdmin){
			vm.boards = $firebaseArray(firebaseConnection.getBoards());
		}
		else{
			vm.boards = vm.currentUser.authorizedBoards;
		}
		vm.users = $firebaseArray(firebaseConnection.getUsers());

		//Sets state flags depending on the object selected
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
					vm.activeData.blackList = convertBlackList(vm.activeData.blackList);
          vm.activeData.statuses = $firebaseArray(firebaseConnection.getBoardByKey(vm.activeData.$id).child('statuses'));
          vm.activeData.statuses.$loaded().then(vm.statusEngine.statusesReady);
					vm.showUserDetail = false;
					vm.showBoardDetail = true;
					vm.showConfig = false;
					break;
				}
			}
		}
		//Sets state flags depending if Users or Boards is selected
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
				vm.activeData.blackList = convertBlackList(vm.activeData.blackList);
				firebaseConnection.updateBoard(vm.activeData);
			}
			else{
				resetActiveDataBoard;
				firebaseConnection.createBoard(vm.activeData);
			}
			resetActiveDataBoard();
		}
		vm.onClick_deactivateBoard = function(){
			firebaseConnection.deactivateBoard(vm.activeData.$id);
			vm.showBoardDetail = false;
			$('#confirmModal').modal('hide');

			window.setTimeout(hideDetail(),1000);
		}
		vm.onClick_reactivateBoard = function(){
			firebaseConnection.reactivateBoard(vm.activeData.$id);
			resetActiveDataBoard();
			vm.showBoardDetail = false;
		}
		vm.onClick_deleteBoard = function(){
			if(vm.activeData.confirmKey == vm.activeData.$id){
				vm.showConfirm = false;
				firebaseConnection.deleteBoard(vm.activeData.$id);
			}
			else{
				vm.showConfirmError = true;
			}
			resetActiveDataBoard();
			vm.showBoardDetail = false;
			$('#confirmBoardDelete').modal('hide');
		}
		//Shows Board delete confirmation modal or hides it if it is already open
		vm.onClick_showConfirm = function(){
			vm.showConfirm = !vm.showConfirm;
			if(!vm.showConfirm){
				$('#confirmBoardDelete').modal('hide');
			}
		}
		//Creates new user or board depending on current view state
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
		//Navigates to the selected board
		vm.onClick_openBoard = function(){
			firebaseConnection.sessionStore.currentBoardKey = vm.activeData.$id || vm.activeData.key;
			console.log("headed to " + firebaseConnection.sessionStore.currentBoardKey );
			$location.path('/board');
		}
		//Used to filter the user's authorized boards in their profile section
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
		vm.onClick_viewInactiveBoards = function(){
			$timeout(()=>{vm.boards = $firebaseArray(firebaseConnection.getInactiveBoards());});
			vm.deletedBoards = true;
			vm.showBoardDetail = false;
		}
		vm.onClick_hideInactiveBoards = function(){
			$timeout(()=>{vm.boards = $firebaseArray(firebaseConnection.getBoards());});
			vm.deletedBoards = false;
			vm.showBoardDetail = false;
		}
		vm.onClick_exportToCSV = function() {
		console.log('DELETE ME');
		firebaseConnection.getStories(vm.activeData.$id).then(function(res){
			var snap = res;
        var csvData = Array();

        //Push column headers
        csvData.push('"Name","Body","Status"');
        //Parse through each story
        snap.forEach(function(elm){
            var story = elm.val();
            //Create new line with name, body, and status as elements
            csvData.push('"'
                +story.name+'","'
                +story.body+'","'
                +story.status+'"');
        });
        //just testing
        console.log(csvData);
        //remove newlines, at this point it is in a csv format
        var csv = csvData.join("\n");

        //Test csv by downloading through the browser
        var fileName = (vm.activeData.name + ".csv");                   
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
		});
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
		//Converts the blacklist from the database array to a string for editing and vise versa
		function convertBlackList(list){
			var res = "";
			if(typeof(list) == 'object'){
				res += list[0]
				for(var x = 1;x<list.length;x++){
					res += (", "+list[x])
				}
				return res;
			}
			if(typeof(list) == "string"){
				res = list.split(",");
				for(var x = 0;x<res.length;x++){
					res[x] = res[x].trim();
				}
				return res;
      }
    }
		
    
    vm.newStatus = {
      name: '',
      color: '#FFFFFF',
      deletable: true,
      display: true,
      commit: function() {
      },
      
    }
    
    vm.saveStatus = function(status) {
      vm.activeData.statuses.$save(status);
    }
    
    vm.updateName = function(status) {
      
      var boardRef = firebaseConnection
        .getBoardByKey(vm.activeData.$id);
        
      boardRef
        .child('statuses')
        .child(status.$id)
        .once('value', function(status_snapshot) {
          var oldName = status_snapshot.child('name').val();
          boardRef
            .child('stories')
            .orderByChild('status')
            .equalTo(oldName)
            .once('value', function(snapshot) {
              snapshot.forEach(function(story) {
                boardRef
                  .child('stories')
                  .child(story.key)
                  .update({
                    status: status.name
                  });
              });
            });
        });
        
      vm.activeData.statuses.$save(status);
    }
    vm.newStatus = {
      name: null,
      color: '#FFFFFF',
      display: true,
      commit: function() {
        var boardRef = firebaseConnection
          .getBoardByKey(vm.activeData.$id);
        
        boardRef
          .child('statuses')
          .orderByChild('order')
          .endAt(999)
          .limitToLast(1)
          .once('child_added', function(p) {
            var newPosition = p.val().order + 1;
            var newRef = firebaseConnection.createStatus(boardRef, {
              name: vm.newStatus.name,
              order: newPosition,
              color: vm.newStatus.color,
              deletable: true,
              display: vm.newStatus.display,
              allow_before: true
            },
            function(ref) { 
              $timeout(()=>{
                $('#' + ref.key).droppable({
                    drop: vm.statusEngine.statusDropOnOtherStatus
                });
                $('#' + ref.key).draggable({
                    revert: true
                });
              });
            });
          });
          vm.newStatus.name = '';
          vm.newStatus.color = '#FFFFFF';
          vm.newStatus.display = true;
      }
    }
    vm.statusEngine = {
      statusesReady: function() {
        $timeout(()=>{
          $('.status-edit').droppable({
              drop: vm.statusEngine.statusDropOnOtherStatus
          });
          $('.status-edit').draggable({
              revert: true
          });
        });
      },
      enableOrdering: function(q) {
        
      },
      statusDropOnOtherStatus: function(event, ui){
        var dropOnKey = $(this).attr("id");
        var droppingKey = ui.draggable.attr("id");
        var boardRef = firebaseConnection
          .getBoardByKey(vm.activeData.$id);
      

        boardRef
          .child('statuses')
          .child(droppingKey)
          .once('value', function(dropping_snap) {
            
            if (!dropping_snap.val().allow_before)
              return;
            
            var oldOrder = dropping_snap.val().order;
            boardRef
              .child('statuses')
              .child(droppingKey)
              .update({
                order: null
              })
              .then(function() {                
                boardRef
                  .child('statuses')
                  .child(dropOnKey)
                  .once('value', function(dropOn_snap) {
                    
                    if (!dropOn_snap.val().allow_before) {
                      boardRef
                        .child('statuses')
                        .child(droppingKey)
                        .update({
                          order: oldOrder
                        })
                      return;
                    }
                    var newOrder = dropOn_snap.val().order;
                    firebaseConnection.pullStatusOrdersForward(
                      boardRef,
                      oldOrder,
                      function() {
                        firebaseConnection.shiftStatusOrdersIfConflict(
                          boardRef,
                          dropOn_snap.val().order,
                          function() {
                            boardRef
                              .child('statuses')
                              .child(droppingKey)
                              .update({
                                order: newOrder
                              });
                          });
                      });
                  });
              });
          });
      },
    }
  }
});