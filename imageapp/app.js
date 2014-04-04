
/**
 * Module dependencies.
 */

var express = require('express');
var fs = require('fs');
var formidable = require('formidable')
var http = require('http');
var path = require('path');
var sqlite3 = require('sqlite3').verbose();

//var imageList = new Array('dice.png');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//DB Setup for imageapp
var db = new sqlite3.Database('image_store.sqlite');
init_img = fs.readFileSync(__dirname+'/public/images/dice.png');
db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS image_store \
          (i INTEGER PRIMARY KEY AUTOINCREMENT, image BLOB)"
        );
  var s = db.prepare("INSERT INTO image_store (image) VALUES(?)");
  s.run(init_img);
  s.finalize();
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
  res.render('index', { title: 'Imageapp', imgurl: '/latest'});
});

app.get('/upload', function(req, res){
  res.render('upload', { title: 'Imageapp' });
});

app.post('/submit', function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		var s = db.prepare("INSERT INTO image_store (image) VALUES(?)");
		data = fs.readFileSync(files.displayImage.path);
		s.run(data);
		s.finalize();
		res.redirect('/image');
	});
});

app.get('/image', function(req, res) {
	res.render('image', { title: 'Imageapp', fp: '/latest'});
});

app.get('/latest', function(req, res) {
	db.serialize(function() {
		db.each("SELECT i,image FROM image_store ORDER BY i DESC LIMIT 1", 
			function(err, row) {
				res.send(row.image);
		});
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
