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
			
			//when the user choose a particular position in #positionModal
			$('#positionModal .note-thumb').click(function(){
				var newNotepaperId = $(this).attr('position');
				var oldNotepaperId = $('#notepaperId').val();
				var messageId = $('#messageId').val();
				console.log("msg: " + messageId);
				Create.changePosition({newNotepaperId: newNotepaperId, oldNotepaperId: oldNotepaperId, messageId: messageId});
				$( "#positionModal" ).popup( "close" );
				return false;
			});
			
			//when the user choose a particular position in #fetchModal
			$('#fetchModal .note-thumb').click(function(){
				console.log("#fetchModal .note-thumb");
				
				return false;
			});
				
			//Process result of changePositionSuccess
			this.socket.on('changePositionSuccess', this.changePositionSuccess);
			this.socket.on('changePositionFail', this.changePositionFail);
			
			//Process incoming notepaper
			this.socket.on('occupyNotepaperResult', this.occupyNotepaperResult);
			
			//Process url scraper result
			this.socket.on('scrapeUrlResult', this.scrapeUrlResult);
			
			//Process query result
			this.socket.on('queryPositionsHandler', this.queryPositionsHandler);
			
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
			var message = {};
			message.id = parseInt($('#notepaperId').val());
			message.type = parseInt($('#type').val());
			message.content = $('#textContent').val();
			//console.log('update '+content);
			
			var url = $('#url').val();
			var url_title = $('#urlTitle').val();
			var url_summary = $('#urlSummary').val();
			var url_thumbnail = $('#urlThumbnail').val();
			var img = JSON.parse(localStorage.getItem('img'));
			var video = JSON.parse(localStorage.getItem('video'));
			
			// Check id
			if(message.id < maxId && message.id <= 0){
				return false;
			}
			// Prepare the content
			if(message.type==1){
			
			}
			else if(message.type==3){ //Gallery
				message.img = img;
			} else if(message.type==4){ //Url
				message.url = url;
				message.url_title = url_title;
				message.url_summary = url_summary;
				message.url_thumbnail = url_thumbnail;
			} else if(message.type==5){ //Video
				message.video = video;
			} else {
				console.log('Invalid type');
				return false;
			}
			// Send message
			this.socket.emit('updateMsg', [message]);
			
			return false;
		},
		
		//save message to mysql db
		saveMsg : function() {
			var message = {};
			message.id = parseInt($('#notepaperId').val());
			message.type = parseInt($('#type').val());
			message.content = $('#textContent').val();
			//console.log('update '+content);
			
			var url = $('#url').val();
			var url_title = $('#urlTitle').val();
			var url_summary = $('#urlSummary').val();
			var url_thumbnail = $('#urlThumbnail').val();
			var img = JSON.parse(localStorage.getItem('img'));
			var video = JSON.parse(localStorage.getItem('video'));
			
			// Check id
			if(message.id < maxId && message.id <= 0){
				return false;
			}
			// Prepare the content
			if(message.type==1){
			
			}
			else if(message.type==3){ //Gallery
				message.img = img;
			} else if(message.type==4){ //Url
				message.url = url;
				message.url_title = url_title;
				message.url_summary = url_summary;
				message.url_thumbnail = url_thumbnail;
			} else if(message.type==5){ //Video
				message.video = video;
			} else {
				console.log('Invalid type');
				return false;
			}
			//send save message
			this.socket.emit('saveMsg', {
				id: id,
				type: type,
				content: JSON.stringify(message)
			});
			
			return false;
		},
		
		//Ask the server side to scrape the url
		scrapeUrl: function(url) {
			this.socket.emit('scrapeUrl', url);
		},
		
		scrapeUrlResult: function(url) {
			if(url.title || url.summary){ //if the website exists
				$('#url').val(url.url);
				$('#urlTitle').val(url.title);
				$('#urlSummary').val(url.summary);
				$('#urlThumbnail').val(url.thumbnail);
				localStorage.setItem('url', JSON.stringify(url));
				
				//append the information to the link preview div
				var holder = $("#linkPreview");
				holder.empty();	
				holder.append('<button class="btn btn-link removeYoutube">&times;</button>');
				if(url.thumbnail){
					holder.append('<div class="thumbnailHolder"><img class="urlThumbnail" src="'+ url.thumbnail +'" /></div>');
				}
				holder.append('<div class="urlTitle"><h5><a target="_blank" href="'+ url.url +'">' + url.title + '</a></h5></div>');
				if(url.summary){
					holder.append('<div class="urlDescription">'+url.summary+'</div>');
				}
				// Update UI
				$('#linkPreview').css('padding','2%');
				$('#linkPreview').css('border','1px solid #CCCCCC');
				// Change option
				$('#type').val("4").attr('selected', true).siblings('option').removeAttr('selected');
				$('#type').selectmenu("refresh", true);
				console.log("scrape");
				Create.updateMsg();
			}
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
				$('div#positionModal div.note-thumb').html('<p>X</p>');
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