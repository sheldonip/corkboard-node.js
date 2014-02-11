var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var im = require('imagemagick');
var fs = require('fs');

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
		var post  = {type: parseInt(data.type), content: data.content};
		var query = connection.query('INSERT INTO message SET ?', post, function(err, result) {
			msgId = result.insertId;
			
			var query2 = connection.query('UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?', [msgId, parseInt(data.id)], function(err2, result2) {
				console.log(query2.sql);
			});
		
		});
		
	});
	
	//forward the message to the corkboard
	socket.on('updateMsg', function (data) {
		io.sockets.emit('updateMsg', data);
	});
	
	//client fetch empty notepaper
	socket.on('occupyNotepaper', function (data) {
		console.log('[DEBUG] emptyMessages');
		var msgId, notepaperId;
		connection.query('SELECT * FROM notepaper WHERE occupied = 0 limit 1', function(err, rows) {
			// return JSON response
				if(rows.length>0){
				
					notepaperId = rows[0].id;
				
				} else {
					//if full, random a notepaper
					notepaperId = Math.floor(Math.random()*8) + 1;
					
				}
				console.log('[DEBUG] notepaperId' + notepaperId);
				var message  = {type: 1};
				connection.query('INSERT INTO message SET ?', message, function(err, result) {
					msgId = result.insertId;
					console.log('[DEBUG] messageId' + msgId);
					
					connection.query('UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?', [msgId, notepaperId], function(err2, result2) {
						socket.emit('occupyNotepaperResult', {notepaperId: notepaperId, messageId: msgId});
					});
		
				});
		});
	});
	
	socket.on('changePosition', function (data) {
		console.log('[DEBUG] changeposition '+data.newNotepaperId);
		
		//check whether the notepaper is empty
		connection.query('SELECT * FROM notepaper WHERE occupied = 0 AND id = ?', [parseInt(data.newNotepaperId)], function(err, rows) {
			if(rows.length > 0){
				//occupy another notepaper
				var query = connection.query('UPDATE notepaper SET occupied = 1, message_id = ? WHERE id = ?', [parseInt(data.messageId), parseInt(data.newNotepaperId)], function(err2, result2) {
					console.log(query.sql);
				});
		
				//release the original notepaper
				connection.query('UPDATE notepaper SET occupied = 0, message_id = NULL WHERE id = ?', [parseInt(data.oldNotepaperId)], function(err2, result2) {
			
				});
		
			//signal the corkboard to clear the original notepaper
				io.sockets.emit('clearMsg', { notepaperId : parseInt(data.oldNotepaperId) });
				socket.emit('changePositionSuccess', data);
			} else {
				socket.emit('changePositionFail', {});
			}
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

app.get('/message/choosepos', function (req, res) {
    res.sendfile(__dirname + '/static/choosePos.html');
});

app.get('/process/updateNotepapers', function (req, res) {
    var objToJson = {};	
	console.log('[DEBUG] updateNotepapers');
	
	// Use the connection
	connection.query('SELECT * FROM notepaper', function(err, rows){	
		objToJson = JSON.stringify(rows);
		// return JSON response
		res.json(objToJson);
	});	
});

app.get('/process/updateMessages', function (req, res) {
    var objToJson = {};	
	console.log('[DEBUG] updateMessages');
	
	// Use the connection
	connection.query('SELECT * FROM message M, notepaper N WHERE M.id = N.message_id', function(err, rows){	
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
	var imageName = Math.round(new Date().getTime() / 1000) + "-" + Math.floor(Math.random() * 2147483); //generate the filename for the image
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