var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var im = require('imagemagick');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;
var request = require('request');
var cheerio = require("cheerio");

// Include the express body parser
app.configure(function () {
  app.use(express.bodyParser());
});

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'public_display',
  charset  : 'utf8'
});

server.listen(8888);

io.sockets.on('connection', function (socket) {
	socket.on('msg', function (data) {
		io.sockets.emit('msg', data);
	});
	
	//save message to mysql db
	socket.on('saveMsg', function (data) {
		var objToJson = {};	
		var msgId;
		console.log('[DEBUG] saveMessages');
	// Use the connection
		var post  = {type: parseInt(data.type), content: data.content, img: data.img, video: data.video, url: data.url, url_title: data.url_title, url_summary: data.url_summary, url_thumbnail: data.url_thumbnail };
		var query = connection.query('INSERT INTO message SET ?', post, function(err, result) {
			msgId = result.insertId;
			
			var query2 = connection.query('UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?', [msgId, parseInt(data.id)], function(err2, result2) {
				console.log(query2.sql);
			});
		
		});
		
	});
	
	//fetch all messages
	socket.on('fetchAllNotepapers', function (data) {
		var notepapers = {};	
		console.log('[DEBUG] fetchAllNotepapers');
	
		// Use the connection
		connection.query('SELECT * FROM message M, notepaper N WHERE M.id = N.message_id', function(err, rows){	
			if (err) throw err;
			// return JSON response
			socket.emit('updateMsg', rows);
		});	
	
	
	});
	
	//forward the message to the corkboard
	socket.on('updateMsg', function (data) {
		io.sockets.emit('updateMsg', data);
	});
	
	
	//scrape the information of an url
	socket.on('scrapeUrl', function (url) {
		var urlMatch = url.match(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
		
		var youtubeMatch = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
		
		var preview = {};
		
		if(youtubeMatch){
			console.log("youtube matched");
			var videoId = youtubeMatch[1];
			request('http://gdata.youtube.com/feeds/api/videos/'+videoId+'?v=2&alt=jsonc', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var youtubeObject = JSON.parse(body);
					preview.thumbnail = youtubeObject.data.thumbnail.sqDefault;
					preview.title = youtubeObject.data.title;
					preview.summary = youtubeObject.data.description.substr(0, 100);
					preview.duration = parseInt(youtubeObject.data.duration);
					preview.url = url;
					socket.emit('scrapeUrlResult', preview);
				}
			});
		}
		else if (urlMatch) {
			console.log("url matched "+ url);
			
			request({
				uri: url,
			}, function(error, response, body) {
				console.log("url fetched ");
				var $ = cheerio.load(body);
				var meta = $('meta')
				var keys = Object.keys(meta)
				var summary = null;
				var title = null;
				var thumbnail = null;
	
				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:title') {
					title = meta[key].attribs.content;
				}
				});

				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:description') {
					summary = meta[key].attribs.content;
				}
				});
	
				keys.forEach(function(key){
				if (  meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:image') {
					thumbnail = meta[key].attribs.content;
				}
				});

				preview.title = (title) ? title : $('title').html();
				preview.summary = (summary) ? summary : $('meta[name=description]').attr("content");
				preview.thumbnail = (thumbnail) ? thumbnail : null;
				preview.url = url;
				socket.emit('scrapeUrlResult', preview);
				
			});
			
		}
	});
	
	//client fetch empty notepaper
	socket.on('occupyNotepaper', function (data) {
		console.log('[DEBUG] emptyMessages');
		var msgId, notepaperId;
		connection.query('SELECT notepaper_id, COUNT(*) AS numberOfMsg FROM message GROUP BY notepaper_id ORDER BY numberOfMsg LIMIT 1;', function(err, rows) {
			// return JSON response
				notepaperId = rows[0].notepaper_id;
				var message  = {type: 1, notepaper_id: notepaperId};
				connection.query('INSERT INTO message SET ?', message, function(err, result) {
					msgId = result.insertId;
					socket.emit('occupyNotepaperResult', {notepaperId: notepaperId, messageId: msgId});
				});
		});
	});
	
	socket.on('changePosition', function (data) {
		console.log('[DEBUG] changeposition '+data.newNotepaperId);

		// Occcupy another notepaper and release the original notepaper		
		var query = connection.query('UPDATE message SET notepaper_id = ? WHERE id = ?', [parseInt(data.newNotepaperId), parseInt(data.messageId)], function(err2, result2) {
				console.log('query: ' + query.sql);
				if(err2){
					socket.emit('changePositionFail', data);
				}

				//signal the corkboard to clear the original notepaper
				io.sockets.emit('clearMsg', { notepaperId : parseInt(data.oldNotepaperId), msgId : parseInt(data.messageId) });
				socket.emit('changePositionSuccess', data);

		});		
			

		
	});
	
	socket.on('queryPositions', function (data) {
		var objToJson = {};	
		
		//get all id of empty notepapers
		connection.query('SELECT id FROM notepaper WHERE occupied = 0', function(err, rows) {
			if(rows.length > 0){
				objToJson.notepapers = JSON.stringify(rows);
				objToJson.status = 'ok';
			} else {
				objToJson.status = 'error';
			}
			// return JSON response
			socket.emit('queryPositionsHandler', objToJson);
		});
		
	});
	
});

app.use("/css/", express.static(__dirname + '/static/css'));
app.use("/img/", express.static(__dirname + '/static/img'));
app.use("/js/", express.static(__dirname + '/static/js'));
app.use("/uploads/", express.static(__dirname + '/static/uploads'));
app.use("/fonts/", express.static(__dirname + '/static/fonts'));

// ----------------------------------extras

app.get('/', function (req, res) {	
    res.sendfile(__dirname + '/static/index.html');
});

app.get('/message/create', function (req, res) {
    res.sendfile(__dirname + '/static/create.html');
});

/*
app.get('/message/choosepos', function (req, res) {
    res.sendfile(__dirname + '/static/choosePos.html');
});
*/

/*app.get('/process/updateNotepapers', function (req, res) {
    var objToJson = {};	
	console.log('[DEBUG] updateNotepapers');
	
	// Use the connection
	connection.query('SELECT * FROM notepaper', function(err, rows){	
		objToJson = JSON.stringify(rows);
		// return JSON response
		res.json(objToJson);
	});	
});*/

app.get('/process/updateMessages', function (req, res) {
    var objToJson = {};	
	console.log('[DEBUG] updateMessages');
	
	// Use the connection
	connection.query('SELECT * FROM message M, notepaper N WHERE M.id = N.message_id', function(err, rows){	
		if (err) throw err;
		objToJson.notepapers = JSON.stringify(rows);
		// return JSON response
		res.json(objToJson);
	});	
});

app.post('/process/occupyNotepaper', function (req, res) {
	console.log('[DEBUG]');
	var id = req.body.id;
	connection.query('SELECT * FROM notepaper WHERE occupied = 0 AND id = ?', [id], function(err, rows) {
		// return JSON response
		console.log(rows.length);
		if(rows.length>0){
			
			connection.query('UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?', [msgId, parseInt(data.id)], function(err2, result2) {
				console.log(query2.sql);
			});
			
		}
		else{
			res.json({result : 0});
		}
	});
});

app.get('/process/resetNotepapers', function (req, res) {
    var objToJson = {};	
	console.log('[DEBUG] resetNotepapers');
	
	// Use the connection
	connection.query('UPDATE notepaper SET occupied = 0, message_id = NULL', function(err, rows){		
		objToJson.status = 'notepapers reset';
		if(err){
			objToJson.status = 'error';
		}
		// return JSON response
		res.json(objToJson);
	});	
});

//***TO-DO: Handle messages with null expire date

// ----------------------------------uploads' logic

app.post('/upload/uploadgallery', function (req, res) {
	var objToJson = {};
    fs.readFile(req.files.messageImg.path, function (err, data) {	
		var imageName = req.files.messageImg.name;

		// If there's an error
		if(!imageName){
			console.log("There was an error");
			res.end();
		} else {
			var newPath = __dirname + "\\static\\uploads\\original\\" + imageName;
			var thumbPath = __dirname + "\\static\\uploads\\thumbnail\\" + imageName;
			var resizedPath = __dirname + "\\static\\uploads\\resized\\" + imageName;
			objToJson.status = 'error';
			// write file to uploads/fullsize folder
			fs.writeFile(newPath, data, function (err) {
				// write file to uploads/thumbs folder
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width: 128
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 128x128px');
				});
				
				im.resize({
					srcPath: newPath,
					dstPath: resizedPath,
					width: 538
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 538x538px');
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
				});
				
			});
		}
	});
});

//upload canvas sketch

app.post('/upload/uploadsketch', function (req, res) {
	var objToJson = {};
	var imageName = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483) + '.png'; //generate the filename for the image
	var newPath = __dirname + "\\static\\uploads\\original\\" + imageName;
	var thumbPath = __dirname + "\\static\\uploads\\thumbnail\\" + imageName;
	var resizedPath = __dirname + "\\static\\uploads\\resized\\" + imageName;
	
	
	var imgData = req.body.imgData;
	var base64data = imgData.replace(/^data:image\/\w+;base64,/, "");// strip off the data: url prefix to get just the base64-encoded bytes
	var buf = new Buffer(base64data, 'base64');
	
	fs.writeFile(newPath, buf, function (err) {
				// write file to uploads/thumbs folder
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width: 128
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 128x128px');
				});
				
				im.resize({
					srcPath: newPath,
					dstPath: resizedPath,
					width: 538
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 538x538px');
					objToJson.imageName = imageName;
					objToJson.status = 'ok';
					// return JSON response
					res.json(objToJson);
				});
				
	});
			
});

// upload video
app.post('/upload/uploadVideo', function (req, res) {
	var objToJson = {};
	var videoName = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483); //generate the filename for the image
	var filePath = __dirname + "\\static\\uploads\\video\\";	//ffmpeg path
	var newPath = __dirname + "\\static\\uploads\\video\\" + videoName;
	
	fs.readFile(req.files.messageVideo.path, function (err, data) {		
		if(err){
			objToJson.status = 'error';
			objToJson.msg = err;
			// return JSON response
			res.json(objToJson);
		} else {
			var messageVideo = req.files.messageVideo.name;
			var extension = getExtension(messageVideo);
			objToJson.debug = req.files.messageVideo;
			
			// write file to uploads/video folder
			fs.writeFile(newPath+'.'+extension, data, function (err) {
				if(err){
					objToJson.status = 'error';
					objToJson.msg = err;
					// return JSON response
					res.json(objToJson);
				}
				var command, command2;
				
				// Check and prepare to convert files to mp4
				if(extension == 'mp4'){
					command = "\n";
				} else if(extension == 'avi'){
					command = filePath + 'ffmpeg -i ' + (newPath+'.'+extension) + ' -c:v libx264 -crf 19 -preset slow -c:a libfaac -b:a 192k -ac 2 ' + (newPath+'.mp4');
				} else if(extension == 'mov'){
					command = filePath + 'ffmpeg -i ' + (newPath+'.'+extension) + ' -vcodec h264 ' + (newPath+'.mp4');
				} else if(extension == '3gp'){
					command = filePath + 'ffmpeg -i ' + (newPath+'.'+extension) + ' -qscale 0 -ab 64k -ar 44100 ' + (newPath+'.mp4');
				} else {
					objToJson.status = 'error';
					objToJson.msg = 'Invalid file type';
					// return JSON response
					res.json(objToJson);
				}
				// Execute the convert command
				exec(command, function (error, stdout, stderr) {
					sys.print('command stdout: ' + stdout + "\n");
					sys.print('command stderr: ' + stderr + "\n");
					if (error !== null) {
						objToJson.status = 'error';
						objToJson.msg = error;
						// return JSON response
						res.json(objToJson);
					}
					
					// Delete original video file
					if(extension != 'mp4'){
						fs.unlink(newPath+'.'+extension, function (err) {
						  if (err){
							console.log('Failed to delete original video');
						  }
						});
					}
					
					// Create a thumbnail
					command2 = filePath + "ffmpeg -itsoffset -3 -i " + (newPath+'.mp4') + " -vcodec mjpeg -vframes 1 -an -f rawvideo -s 320x240 " + (newPath+'.jpg');
					exec(command2, function (error, stdout, stderr) {
						sys.print('command2 stdout: ' + stdout + "\n");
						sys.print('command2 stderr: ' + stderr + "\n");
						if (error !== null) {
							objToJson.status = 'error';
							objToJson.msg = error;
							// return JSON response
							res.json(objToJson);
						}
						
						objToJson.status = 'ok';
						objToJson.msg = videoName + '.mp4';
						objToJson.thumbnail = videoName + '.jpg';
						// return JSON response
						res.json(objToJson);
					});	
				});			
						
			});			
		}
	});	
});

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i+1);
}