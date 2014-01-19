var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var im = require('imagemagick');
var fs = require('fs');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'public_display',
  charset  : 'utf8'
});

server.listen(8080);

io.sockets.on('connection', function (socket) {
	socket.on('msg', function (data) {
		io.sockets.emit('new', data);
	});	
	
	socket.on('send-image', function (data) {
		var fs = require('fs');

        //path to store uploaded files (NOTE: presumed you have created the folders)
        var fileName = __dirname + '/static/uploads/original/' + name;

        fs.open(fileName, 'a', 0755, function(err, fd) {
            if (err) throw err;

            fs.write(fd, buffer, null, 'Binary', function(err, written, buff) {
                fs.close(fd, function() {
                    console.log('File saved successful!');
                });
            })
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

app.get('/message/create/*', function (req, res) {
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

app.post('/upload/uploadgallery', function (req, res) {
    fs.readFile(req.files.image.path, function (err, data) {
		var imageName = req.files.image.name;

		// If there's an error
		if(!imageName){
			console.log("There was an error");
			res.redirect("/");
			res.end();
		} else {
			var newPath = __dirname + "/static/uploads/original/" + imageName;
			var thumbPath = __dirname + "/static/uploads/thumbs/" + imageName;
			// write file to uploads/fullsize folder
			fs.writeFile(newPath, data, function (err) {			
				// write file to uploads/thumbs folder
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width:   200
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 200x200px');
				});
				
				res.redirect("/uploads/fullsize/" + imageName);

			});
		}
	});
});
