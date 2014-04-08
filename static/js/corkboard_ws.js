// Define all types of messages
(function () {
	var maxId = 8;
	window.Corkboard = {		
		socket : null,
  
		// Initialisation
		initialize : function(socketURL) {
			this.socket = io.connect(socketURL);

			//Process any incoming messages
			this.socket.on('updateMsg', this.add);
			
			//Clear message
			this.socket.on('clearMsg', this.clear);
			
			//Fetch all notepapers from db
			this.socket.emit('fetchAllNotepapers', {});
		},
		
		// Adds a new message
		add : function(data) {
			
			var id, type, notepaperInner = [];
			
			for(var i=0 ; notepaper = data[i] ; i++){
			
			id = parseInt(notepaper.id);
			type = parseInt(notepaper.type);
			
			console.log('[DEBUG] id: ' + id + '; type:' + type);
			// Check id
			if(id > maxId && id <= 0){
				return false;
			}
			
			// Bug: cannot replace \\n by \<br>
			//content.content = content.content.replace('\n','<br>');'
			
			if(type==1){

				notepaperInner.push('<div class="text">'+notepaper.content+'</div>');
												
			} else if(type==3){
				notepaperInner.push('<div class="text">'+notepaper.content+'</div>');
				notepaperInner.push('<div id="album-1" class="album">');
				notepaperInner.push('<ul>');
				
				for(var j = 0; j < notepaper.img.length; j++){
					notepaperInner.push('<li>');
					notepaperInner.push('<div id="album-1-1">');
					notepaperInner.push('<img class="notepaper-img" src="'+ base_url +'uploads/resized/'+ notepaper.img[j] +'">');
					notepaperInner.push('</div>');
					notepaperInner.push('</li>');
				}
				
				notepaperInner.push('</ul>');
			   notepaperInner.push('</div>');
			   
			   
			} else if(type==4){
				
				notepaperInner.push('<div class="notepaper-youtube">');
				var youtubeMatch = notepaper.url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
				if(youtubeMatch){
					var videoId = youtubeMatch[1];
					notepaperInner.push('<iframe id="ytplayer-1" class="ytplayers" type="text/html" src="https://www.youtube.com/embed/'+videoId+'?autoplay=1&controls=0&loop=1&playlist='+videoId+'&rel=0&showinfo=0&theme=light&enablejsapi=1" frameborder="0" allowfullscreen></iframe>');                  
					notepaperInner.push('</div>');
				}else{
					notepaperInner.push('<div class="boardLinkPreview">');
					if(notepaper.url_thumbnail){
						notepaperInner.push('<div class="thumbnailHolder">');
						notepaperInner.push('<img class="boardUrlThumbnail" src="'+notepaper.url_thumbnail+'">');
						notepaperInner.push('</div>');
					}
					notepaperInner.push('<div class="urlTitle"><h5><a target="_blank" href="'+notepaper.url+'">'+notepaper.url_title+'</a></h5></div>');
					notepaperInner.push('<div class="urlDescription">'+notepaper.url_summary || '' +'</div>');
					notepaperInner.push('</div>');
					notepaperInner.push('</div>');
				}
				notepaperInner.push('<div class="text">'+notepaper.content+'</div>');
				
			} else if(type==5){
				
				notepaperInner.push('<video class="notepaper-video" autoplay loop muted>');
				notepaperInner.push('<source src="'+ base_url +'uploads/video/'+notepaper.video+'" type="video/mp4">');                  
				notepaperInner.push('</video>');
				notepaperInner.push('<div class="text">'+notepaper.content+'</div>');
												
			} else { // the message is expired or deleted
				//notepaperInner.push('<img class="notepaper-qrCode" src="'+ base_url +'img/qrcode/' + qrUrls[notepaper.id] + '">');
			}
			
			$('#note-'+id).find('.content-container').html(notepaperInner.join(''));	
			if(!notepaper.bgcolor){ notepaper.bgcolor = '#FFF'; }
			$('#note-'+id).css('background-color',notepaper.bgcolor);				
			
			notepaperInner = [];
			}
		},
		
		clear : function(notepaper){
			$('#note-'+notepaper.notepaperId).find('.content-container').html("");
			$('#note-'+notepaper.notepaperId).css('background-color','#FFF');
			
		}
		
	};
}());