// Enter your API KEY here, with API_KEY only EUR/USD, XAU/USD are allow free.
var api_key 			= 'API_KEY'; // get from https://fcsapi.com/dashboard


/*
	With Demo API_KEY only EUR/USD, XAU/USD, BTC,LTC prices are available, 
	If you need more prices, then please enter your API KEY, Signup to get your API KEY.
	
	EXCEL LIST:  https://fcsapi.com/beta/assets/socket/socket_support_list.xlsx
		Enter your Forex/Crypto ids, set multiple ids with comma
*/
var currency_ids 	= '1,1984,80,81,7774,7778';

// Variables
var socket_re_conn,socket,heart_interval;

// wss:// if your application does not support WSS/SSL/HTTPS then use "ws://fcsapi.com" (http)
var main_url 		= 'wss://fcsapi.com'; // web socket URL
var backup_url		= 'wss://fxcoinapi.com'; // web socket backup URL
var ws_url 			= main_url; // Web Socket


// Use backup server incase our main server is not accessible
// Note: Only use it for backup.
function backup_server(){
	ws_url = backup_url; // backup URL
	socket_connection();

	// keep try to connect with main server after 10 minute.
	// To test if backup is working for you or not, just use wrong URL in main WebSocket URL
	setTimeout(function(){
		ws_url = main_url;
		socket_connection();
	},10*60*1000); // minute * seconds * 1000
}

// start socket connection function
function socket_connection(){
	// if connection recall, then destroy old if exist. 
	if(socket !== undefined){
		socket.disconnect();
		socket.destroy();
	}

	document.getElementById("status").innerHTML = "Connection Request send. Waiting response";

	// require connect with fxpricing
	socket = io.connect(ws_url,{
		transports: ['websocket'],
		path : "/v3/"
	});

	// socket heartbeat require once every hour, if your heartbeat stop so you will disconnect
	socket.emit('heartbeat', api_key);

	// connect your required IDs with server
	socket.emit('real_time_join', currency_ids);

	// PRICES Real time data received  from server
	socket.on('data_received',function(prices_data){
		//console.log(prices_data);
		var key = prices_data['s']; // get currency key name e.g: EUR-USD
		key = key.replace("/","-");
		// Set prices
		document.getElementById(key+"_LASTC").innerHTML = prices_data.lc;
		document.getElementById(key+"_PRICE").innerHTML = prices_data.c;
		document.getElementById(key+"_HIGH").innerHTML = prices_data.h;
		document.getElementById(key+"_LOW").innerHTML = prices_data.l;
		document.getElementById(key+"_ASK").innerHTML = prices_data.a;
		document.getElementById(key+"_BID").innerHTML = prices_data.b;
		document.getElementById(key+"_CHANGE").innerHTML = prices_data.ch;
		document.getElementById(key+"_CHANGEP").innerHTML = prices_data.cp;
		document.getElementById(key+"_SPREAD").innerHTML = prices_data.sp;
		if(typeof prices_data.v === 'undefined')
			document.getElementById(key+"_VOL").innerHTML = "-";
		else
			document.getElementById(key+"_VOL").innerHTML = prices_data.v;
		//document.getElementById(key+"_TIME").innerHTML = new Date(prices_data.t*1000).toLocaleTimeString();
		var element = document.getElementById(key+"_TIME");
		element.innerHTML = new Date().toLocaleTimeString();
  		element.classList.add("time_update");

  		setTimeout(function(){element.classList.remove("time_update");},400);
	});

	// real time join on successfully message return
	socket.on('successfully',(message)=>{
		console.log("Connect successfully at "+new Date().toLocaleString());
		document.getElementById("status").innerHTML = "Response From Server : "+message;
		// auto re-connection destroy, when we connect with server
		if(socket_re_conn !== undefined)
			clearTimeout(socket_re_conn);
	});

	// disconnect reason message return
	socket.on('disconnect',(message)=>{
		console.log("FCS SOCKET: "+message);
		document.getElementById("status").innerHTML = "Response From Server: "+message;
		
		// If your network is down, or in any case, if you disconnect with server then you will auto re-connect
		socket_re_connection();
	});

	socket.on('message',(message)=>{
		// any log message from server will received here.
		console.log("FCS SOCKET: "+message);
	});

	// if connection error then connect with backup.
	socket.on('connect_error', function(){
		backup_server(); // conenct with backup server
		console.log('Connection error. If you see this message for more then 15 minutes then contact us. ');
	});

	// ## heartbeat every hour ##
	/* 
		You need to connect with server once per 24 hour, else your connection will be disconnect.
		Below we set heartbeat every hour, you can increase time upto 24 hours, 
		but do not decrease this time, beucase it will slow down your speed with server
	*/
	if(heart_interval !== undefined)
		clearTimeout(heart_interval);

	heart_interval = setInterval(function(){
		socket.emit('heartbeat', api_key);
	}, (1*60*60*1000)); // hour * minutes*seconds*1000; 

	// ## heartbeat every hour END ##
}


/* Reconnect if socket disconnect. 
	
	Note: You don't need to decrease re-connect time in setTimeout.
		in case of any socket failure, Socket has its own auto reconnect functionality, so it will quick reconnect with server.
		Below function is extra security, if socket auto reconnect fail, then this function will do its work.
*/
function socket_re_connection(){
	if(socket_re_conn !== undefined)
		clearTimeout(socket_re_conn);

	// keep trying reconnect until connect successfully
	// reconnect after every 15 minute
	socket_re_conn = setTimeout(function(){ 
		socket_connection();
		socket_re_connection();
	}, (15*60*1000));  // minute * seconds * 1000
}


/* Call this Function when you want to disconnect */
function disconnect() {
	if(socket !== undefined && !socket.disconnected){
		socket.disconnect();
		socket.destroy();
	}
	else
		document.getElementById("status").innerHTML = "You are not connected with Server";
}