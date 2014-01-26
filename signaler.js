var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var im = require('imagemagick');
var fs = require('fs');
var url = require('url');
var request = require('request');
var crypto = require('crypto');

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
		io.sockets.emit('new', data);
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

// ----------------------------------uploads' logic

app.post('/upload/uploadgallery', function (req, res) {
	var objToJson = {};
    fs.readFile(req.files.messageImg.path, function (err, data) {	
		var imageName = req.files.messageImg.name;

		// If there's an error
		if(!imageName){
			objToJson.msg = "Upload error!";
			objToJson.status = 'error';	
			// return JSON response
			res.json(objToJson);
		} else {
			var newPath = __dirname + "\\static\\uploads\\original\\" + imageName;
			var thumbPath = __dirname + "\\static\\uploads\\resized\\" + imageName;			
			objToJson.status = 'error';
			// write file to uploads/original folder
			fs.writeFile(newPath, data, function (err) {
				// write file to uploads/resized folder
				im.resize({
					srcPath: newPath,
					dstPath: thumbPath,
					width: 256	// auto height
				}, function(err, stdout, stderr){
					if (err) throw err;
					console.log('resized image to fit within 256x256px');
					objToJson.imageName = imageName;
					objToJson.status = 'success';
					// return JSON response
					res.json(objToJson);
				});
				
			});
		}
	});
});

app.post('/upload/uploadCanvas', function (req, res) {
	var objToJson = {};	
	var newPath = __dirname + "\\static\\uploads\\canvas\\";
	var thumbPath = __dirname + "\\static\\uploads\\thumbs\\";	
	var unencodedData, new_file_name;
	var imgData = req.body.imgData; //Canvas data
	var filteredData = imgData.split(',');	
	
	if(filteredData[0] == 'data:image/png;base64'){
		unencodedData =  new Buffer(filteredData[1], "base64");
		
		// Generate new file name
		try {
			var buf = crypto.randomBytes(10);
			new_file_name = buf.toString('hex').substring(0,10);
			new_file_name = new_file_name.concat('.png');
			newPath	= newPath.concat(new_file_name);
			thumbPath = thumbPath.concat(new_file_name);
		} catch (ex) {
			// handle error
			new_file_name = "";
			objToJson.msg = "Server error!";
			objToJson.status = 'error';	
			// return JSON response
			res.json(objToJson);
		}
		// write file to uploads/original folder
		fs.writeFile(newPath, unencodedData, function (err) {
			// write file to uploads/resized folder
			im.resize({
				srcPath: newPath,
				dstPath: thumbPath,
				width: 256	// auto height
			}, function(err, stdout, stderr){
				if (err) throw err;
				console.log('resized image to fit within 256x256px');
				objToJson.imageName = new_file_name;
				objToJson.status = 'success';
				// return JSON response
				res.json(objToJson);
			});
			
		});
	} else {	
		objToJson.msg = "Invalid Canvas!";
		objToJson.status = 'error';	
		// return JSON response
		res.json(objToJson);
	}
});

// ----------------------------------video's logic

app.get('/video/getYoutube/', function (req, res) {
	var objToJson = {};
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var youtubeLink = query.url;
	var pattern1 = new RegExp('^((http://)|(https://)){0,1}(www\.){0,1}youtube\.com');
	var pattern2 = new RegExp('^((http://)|(https://)){0,1}(www\.){0,1}youtu\.be');
	var videoId, embedUrl, jsonUrl;
	
	if(!pattern1.test(youtubeLink) && !pattern2.test(youtubeLink)){
		objToJson.msg = "Invalid youtube URL!";
		objToJson.status = 'error';	
		// return JSON response
		res.json(objToJson);
	} else {
		if(pattern1.test(youtubeLink)){	//youtube.com
			youtubeLink = url.parse(youtubeLink, true);
			videoId = youtubeLink.query.v;
		} else if(pattern2.test(youtubeLink)) {	//youtu.be
			youtubeLink = url.parse(youtubeLink, true);
			videoId = youtubeLink.path.substring(1,12);
		} else {
			objToJson.msg = "Invalid youtube URL!";
			objToJson.status = 'error';	
			// return JSON response
			res.json(objToJson);
		}
		
		embedUrl = 'https://www.youtube.com/embed/' + videoId + '?rel=0&showinfo=0&color=white&theme=light';	
		jsonUrl = 'http://gdata.youtube.com/feeds/api/videos/' + videoId + '?v=2&alt=jsonc';
		
		request(jsonUrl, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				objToJson.title = jsonContent.data.title;
				objToJson.description = jsonContent.data.description.substring(0,125);
				objToJson.description = objToJson.description.concat('...');
				objToJson.thumbnail = jsonContent.data.thumbnail.sqDefault;
				objToJson.id = jsonContent.data.id;
				objToJson.videoId = videoId;
				objToJson.status = 'success';
			} else {
				objToJson.msg = "Network error!";
				objToJson.status = 'error';				
			}
			// return JSON response
			res.json(objToJson);
		});
	}
	
});