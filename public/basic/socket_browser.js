
var api_key 			= 'API_KEY'; // get from https://fcsapi.com/dashboard

/*
	With Demo API_KEY only EUR/USD, XAU/USD, BTC,LTC prices are available, 
	If you need more prices, then please enter your API KEY, Signup to get your API KEY.
	
	EXCEL LIST:  https://fcsapi.com/beta/assets/socket/socket_support_list.xlsx
		Enter your Forex/Crypto ids, set multiple ids with comma
*/
var currency_ids 	= '1,1984,80,81,7774,7778';

// Variables
var socket_re_conn,socket;

// wss:// if your application does not support WSS/SSL/HTTPS then use "ws://fcsapi.com" (http)
var ws_url 		= 'wss://fcsapi.com'; // web socket URL

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
		document.getElementById(key+"_PRICE").innerHTML = prices_data.c;
		document.getElementById(key+"_ASK").innerHTML = prices_data.a;
		document.getElementById(key+"_BID").innerHTML = prices_data.b;
		var element = document.getElementById(key+"_TIME");
		element.innerHTML = new Date().toLocaleTimeString();
  		element.classList.add("time_update");

  		setTimeout(function(){element.classList.remove("time_update");},400);

	});

	// real time join on successfully message return
	socket.on('successfully',(message)=>{
		document.getElementById("status").innerHTML = "Response From Server : "+message;
	});

	// disconnect reason message return
	socket.on('disconnect',(message)=>{
		document.getElementById("status").innerHTML = "Response From Server: "+message;
	});

	// ## heartbeat every hour ##
	/* 
		You need to connect with server once per 24 hour, else your connection will be disconnect.
		Below we set heartbeat every hour, you can increase time upto 24 hours, 
		but do not decrease this time, beucase it will slow down your speed with server
	*/
	setInterval(function(){
		socket.emit('heartbeat', api_key);
	}, (1*60*60*1000)); // hour * minutes*seconds*1000; 

	// ## heartbeat every hour END ##
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