// Define all types of messages
(function () {
	var maxId = 8;
	window.Create = {		
		socket : null,
  
		// Initialisation
		initialize : function(socketURL) {
			this.socket = io.connect(socketURL);

			// Upload text messages
			$('#textContent').keyup(function(evt) {
				if ((evt.keyCode || evt.which) == 13) {
					// 2 identical messages are sent, don't know why
					Create.send();
					return false;
				}	
			});
			
			// Upload gallery
			/*$('body').on('submit', '.galleryForm', function(evt) { 
				evt.preventDefault();
				console.dir(evt.target);
				var files = evt.target.files || evt.dataTransfer.files;
				var reader = new FileReader();
				
				reader.onload = function(e){
					var buffer = e.target.result;
					socket.emit('send-file', file.name, buffer);
				};
				reader.readAsBinaryString(file);
				
				return false();
			});*/
			
			//Process any incoming messages
			this.socket.on('new', this.add);
		},
		
		// Adds a new message
		add : function(notepaper) {
			var id = parseInt(notepaper.id);
			var type = parseInt(notepaper.type);
			var content = JSON.parse(notepaper.content);
			var notepaperInner = [];
			
			console.log('[DEBUG] id: ' + id + '; type:' + type);
			// Check id
			if(id > maxId && id <= 0){
				return false;
			}
			
			// Bug: cannot replace \\n by \<br>
			content.content = content.content.replace('\n','<br>'); 			
			
			if(type==1){
				
				//notepaperInner.push('<div class="image-title">'+content.title+'</div>');
				notepaperInner.push('<div class="text">'+content.content+'</div>');
												
			} else if(type==2){
				
				//notepaperInner.push('<div class="image">');
				notepaperInner.push('<img class="notepaper-img" src="'+base_url+'uploads/resized/'+ content.img +'">');
				notepaperInner.push('<div class="text">'+content.content+'</div>');
				//notepaperInner.push('</div>');
				
			} else if(type==3){
				
				notepaperInner.push('<div id="album-1" class="album">');
				notepaperInner.push('<ul>');
				
				for(var j = 0; j < content.img.length; j++){
					notepaperInner.push('<li>');
					notepaperInner.push('<div id="album-1-1">');
					notepaperInner.push('<img class="notepaper-img" src="'+ base_url +'uploads/resized/'+ content.img[j] +'">');
					notepaperInner.push('</div>');
					notepaperInner.push('</li>');
				}
				
				notepaperInner.push('</ul>');
			   notepaperInner.push('</div>');
			   notepaperInner.push('<div class="text">'+content.content+'</div>');
			   
			} else if(type==4){
				
				notepaperInner.push('<div class="notepaper-youtube">');
				notepaperInner.push('<iframe id="ytplayer-1" class="ytplayers" type="text/html" src="https://www.youtube.com/embed/'+content.videoId+'?autoplay=1&controls=0&loop=1&playlist='+content.videoId+'&rel=0&showinfo=0&theme=light&enablejsapi=1" frameborder="0" allowfullscreen></iframe>');                  
				notepaperInner.push('</div>');
				notepaperInner.push('<div class="text">'+content.content+'</div>');
				
			} else if(type==5){
				
				notepaperInner.push('<video class="notepaper-video" autoplay loop muted>');
				notepaperInner.push('<source src="'+ base_url +'uploads/video/'+content.video+'" type="video/mp4">');                  
				notepaperInner.push('</video>');
				notepaperInner.push('<div class="text">'+content.content+'</div>');
												
			} else if(type==6){
				notepaperInner.push('<img class="canvas-img" src="'+base_url+'uploads/canvas/'+content.img+'">');
				notepaperInner.push('<div class="text">'+content.content+'</div>');
				
			} else { // the message is expired or deleted
				//notepaperInner.push('<img class="notepaper-qrCode" src="'+ base_url +'img/qrcode/' + qrUrls[notepaper.id] + '">');
			}
			
			$('#note-'+id).find('.content-container').html(notepaperInner.join(''));			
			
			notepaperInner = [];
		},
		
		// Sends a message to the server
		send : function() {
			var content = {};
			// Check id
			if($('#notepaperId').val() < maxId && $('#notepaperId').val() > 0){
				content.content = $('#textContent').val();
				this.socket.emit('msg', {
					id: $('#notepaperId').val(),
					type: $('#type').val(),
					content: JSON.stringify(content)
				});
			}
			
			return false;
		}
		
	};
}());