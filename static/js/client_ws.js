// Define all types of messages
(function () {
	var maxId = 8;
	window.Create = {		
		socket : null,
  
		// Initialisation
		initialize : function(socketURL) {
			this.socket = io.connect(socketURL);

			//send out message when type change
			$( "#type" ).on("change", function() {
				Create.updateMsg();
				return false;
			});	
			
			//save message to mysql db
			$('#saveBtn').click(function(){
			
				var text = $('#textContent').val();
				localStorage.setItem('text', text);
				var type = $('#type').val();
				localStorage.setItem('type', type);
				
        		Create.saveMsg();
				return false;
    		});
			
			//when the user choose a particular position
			$('.note-thumb').click(function(){
				var newNotepaperId = $(this).attr('position');
				var oldNotepaperId = $('#notepaperId').val();
				var messageId = $('#messageId').val();
				console.log("msg: " + messageId);
				Create.changePosition({newNotepaperId: newNotepaperId, oldNotepaperId: oldNotepaperId, messageId: messageId});
				return false;
			});
				
			//Process result of changePositionSuccess
			this.socket.on('changePositionSuccess', this.changePositionSuccess);
			this.socket.on('changePositionFail', this.changePositionFail);
			
			//Process incoming notepaper
			this.socket.on('occupyNotepaperResult', this.occupyNotepaperResult);
			
			//Process query result
			this.socket.on('queryPositionsHandler', this.queryPositionsHandler);
			
			//Check whether the user has been occupied a notepaper before
			var notepaperId = localStorage.getItem('notepaperId');
			var messageId = localStorage.getItem('messageId');
			
			if(notepaperId==null || messageId==null){ //fetch a empty notepaper from server
				this.occupyNotepaper();
			}
			else { //use the original notepaper
				$('#notepaperId').val(notepaperId);
				$('#messageId').val(messageId);
			}
		},
		
		// Sends a message to the server
		updateMsg : function() {
			var content = {};
			var id = parseInt($('#notepaperId').val());
			var type = parseInt($('#type').val());
			var uploads = JSON.parse(localStorage.getItem('uploads'));
			
			// Check id
			if(id < maxId && id <= 0){
				return false;
			}
			// Prepare the content
			if(type == 1){ //Text
				content.content = $('#textContent').val();
			} else if(type==3){ //Gallery			
				content.content = $('#textContent').val();
				content.img = uploads.imageName;
			} else if(type==4){ //Youtube
				content.content = $('#textContent').val();
				content.videoId = uploads.videoId;
			} else if(type==5){ //Video
				content.content = $('#textContent').val();
				content.video = uploads.videoName;
			} else if(type==6){ //Canvas
				content.content = $('#textContent').val();
			} else {
				console.log('Invalid type');
				return false;
			}
			// Send message
			this.socket.emit('updateMsg', {
				id: id,
				type: type,
				content: JSON.stringify(content)
			});
			
			return false;
		},
		
		//save message to mysql db
		saveMsg : function() {
			console.log('save begin');
			var content = {};
			var id = parseInt($('#notepaperId').val());
			var type = parseInt($('#type').val());
			var uploads = JSON.parse(localStorage.getItem('uploads'));
			
			// Check id
			if(id < maxId && id <= 0){
				return false;
			}
			// Prepare the content
			if(type == 1){ //Text
				content.content = $('#textContent').val();
			} else if(type==3){ //Gallery
			
				content.content = $('#textContent').val();
				content.img = uploads.imageName;
			} else if(type==4){ //Youtube
			
			} else if(type==5){ //Video
			
			} else if(type==6){ //Canvas
			
			} else {
				console.log('Invalid type');
				return false;
			}
			 
			//send save message
			this.socket.emit('saveMsg', {
				id: id,
				type: type,
				content: JSON.stringify(content)
			});
			
			return false;
		},
		
		occupyNotepaper: function() {
			this.socket.emit('occupyNotepaper', {});
		},
		
		occupyNotepaperResult: function(notepaper) {
			$('#notepaperId').val(notepaper.notepaperId);
			localStorage.setItem('notepaperId', notepaper.notepaperId);
			$('#messageId').val(notepaper.messageId);
			localStorage.setItem('messageId', notepaper.messageId);
		},
		
		changePosition: function(data) {
			this.socket.emit('changePosition', data);
		},
		
		changePositionSuccess: function(notepaper) {
			$('#notepaperId').val(notepaper.newNotepaperId);
			localStorage.setItem('notepaperId', notepaper.newNotepaperId);
			Create.updateMsg();
			$('#positionModal').modal('hide')
		},
		
		changePositionFail: function(notepaper) {
			alert('The notepaper is already occupied.');
		},
		
		queryPositions: function(){
			this.socket.emit('queryPositions', {});
		},
		
		queryPositionsHandler: function(data){			
			if(data.notepapers && data.status == 'ok'){
				data.notepapers = JSON.parse(data.notepapers);
				$('div#positionModal div.note-thumb').addClass('occupied');
				$('div#positionModal div.note-thumb').html('X');
				for(var i = 0; i < data.notepapers.length; i++){
					$('div.note-thumb[position=\'' + data.notepapers[i].id + '\']').removeClass('occupied');
					$('div.note-thumb[position=\'' + data.notepapers[i].id + '\']').html('');
				}
			} else {
				console.log('[ERROR] Cannot query position of notepapers.');
			}
		}
	};
}());