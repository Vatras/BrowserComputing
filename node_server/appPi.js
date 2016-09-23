var express = require('express'),
session = require('express-session'),
socketIO = require('socket.io')
var server = require('http').Server(app);
var Big = require('big.js')
var	fs = require('fs');
var util = require('util');

var logFile = fs.createWriteStream('logs/logs.txt', {flags: 'a'}); //use {flags: 'w'} to open in write mode
var app = express();
var io = socketIO(server);
var logStdout = process.stdout;

app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'XYZ11233@11'}));
console.log = function () {
	logFile.write(util.format.apply(null, arguments) +'\n'+ (new Date().toString())+'\n');
	logStdout.write(util.format.apply(null, arguments) + '\n');
}

numOfSentIterations=0;

var points_inside=new Big(0);
var points_total=new Big(0);
var currentPiValue= new Big(0);
var sessionMap={};
var userId=0;
var numOfIterationUntilDump=10;

function writeResultToFile(result)
{
	var resultFile = fs.createWriteStream('logs/resultPI.txt', {
		flags: "a",
		mode: 0744
	})
	var dateOfPi=new Date().toString();
	resultFile.write(result+" "+dateOfPi+"\r\n");
}

//disconnect clients with duplicate tabs
function checkIfClientExists(socket)
{
	if(socket.request.headers.cookie==null)
		return true;
	var idd=socket.request.headers.cookie;
	var charNumber=idd.indexOf("connect.sid");
	var sessionId=idd.substr(charNumber+12,idd.length)
	if(sessionMap[sessionId]==null)
	{
		socket.sessionId=sessionId;
		socket.userId=userId;
		userId++;
		sessionMap[sessionId]=true; //someone just connectedx
		return true;
	}
	else
	{
		socket.disconnect(); //someone alrady connected at another tab
		return false;
	}
}

function setNewPiValue(pointsInside,pointsTotal)
{
	var pointsInsideDecimal = new Big(pointsInside);
	points_inside=points_inside.add(pointsInsideDecimal);
	var pointsTotalDecimal = new Big(pointsTotal);
	points_total=points_total.add(pointsTotalDecimal);
	currentPiValue = (new Big(4).times(points_inside.div(points_total))).toFixed(20);
	if(numOfSentIterations%numOfIterationUntilDump==0)
		writeResultToFile(4 * points_inside / points_total);
}

function sendPiToAllHosts()
{
	io.sockets.emit("currentPiValue",{"currentPiValue":currentPiValue});
	console.log("computed: "+currentPiValue)
}

//sending current calculated value to all users
var interval = setInterval(sendPiToAllHosts,1000); 

io.sockets.on('connection',function(socket)
{
	if(checkIfClientExists(socket))
		socket.emit("connectionMade",{"version":"0.05"});//this message starts computing at client side
	
	socket.on("getNewIterations",function(temp){
		numOfSentIterations++;
		console.log("received "+temp.points_inside+" "+temp.points_total+" it: "+numOfSentIterations)

		setNewPiValue(temp.points_inside,temp.points_total);
	});

	socket.on('disconnect',function(temp){
		sessionMap[socket.sessionId]=null;
		console.log("Client disconnected "+socket.sessionId);
	});
})

server.listen(3000);
app.listen(3001);