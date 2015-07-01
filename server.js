// Méthodes communes client/serveur
var common = require('./js/common');
var bodyParser= require("body-parser"); // pour recuperer le contenu de requetes POST 

// contrôle chargement coté serveur
var commonTest = common.test();
console.log(commonTest + " correctement chargé coté serveur !!!");

var app = require('express')(),
    server = require('http').createServer(app),
    //server = require('https').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

// variables d'environnement en variables globale pour les passer à la méthode websocket
ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP ||"127.0.0.1";
port      = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 2000;

// affectation du port
app.set('port', port);

// Pour que nodejs puisse servir correctement 
// les dépendances css du document html
var express = require('express');
app.use(express.static(__dirname));

//Utiliser body-parser pour la gestion de requete POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

var HttpStatus = require('http-status-codes'); // le module qui recupère les status des requetes HTTP



// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});



// Routing IHM >>>> TODO coté clients
app.get('/pilote/', function (req, res) {
    res.sendFile(__dirname + '/pilote.html');
});

app.get('/robot/', function (req, res) {
    res.sendFile(__dirname + '/robot.html');
});


app.get('/visiteur/', function (req, res) {
    res.sendFile(__dirname + '/visiteur.html');
});


/*******************envoi de requetes POST pour les mouvements du robot***********************************/

// Routing Envoi de requetes POST pour la partie des commande STEP pg 40 - 45 RobuBox et voir page 70 --> Translate , relative , absolute , stop 
app.post('/lokarria/step/translate', function (req, res) {
    var x = req.body.X;
    var y = req.body.Y;

    console.log('héhé je veux me deplacer ');
    res.send( 'héhé je veux me deplacer de : [ x ' +  x + ' , y : ' + y + ' ]');
    res.end();
 });

app.post('/lokarria/step/relative', function (req, res) {
    var distance = req.body.distance ;
    var maxSpeed = req.body.maxSpeed ;

    console.log('héhé je veux faire une rotation relative ');
    res.send(' je me suis tourné dune rotation relative de  ' + distance + ' rad  avec une vitesse de : ' + maxSpeed + ' rad/s' );
    res.end();
 });

app.post('/lokarria/step/absolute', function (req, res) {
    var distance = req.body.distance ;
    var maxSpeed = req.body.maxSpeed ;

    console.log('héhé je veux faire une rotation absolue ');
    res.send(' je me suis tourné dune rotation absolue de  ' + distance + ' rad  avec une vitesse de : ' + maxSpeed + 'rad/s');
    res.end();
 });

app.post('/lokarria/step/stop', function (req, res) {
    console.log('héhé je veux me stopper ');
    res.send('requette post reçue pour me stopper et le http status : ' + HttpStatus.OK);
    res.end();
 });

/******************************************************/

// Lancement du serveur
server.listen(app.get('port'),ipaddress);

// Pour débugg : Contrôle de la version de socket.io
var ioVersion = require('socket.io/package').version;
var expressVersion = require('express/package').version;
// On affiche ces éléments coté serveur
console.log("**Socket.IO Version: " + ioVersion);
console.log("**Express Version: " + expressVersion);
console.log("**ipAdress = " + ipaddress );
console.log("**port = " + port );


// liste des users
var users = {};
var nbUsers = 0;

// Historique des connexions
var histoUsers = {};
var placeHisto = 0;
histoPosition = 0;


// --- idem mais pour la version Objet

// liste des users
var users2 = {};
var nbUsers2 = 0;

// Historique des connexions
var histoUsers2 = {};
var placeHisto2 = 0;
histoPosition2 = 0;


// contrôle des connectés coté serveur
// Ecouteur de connexion d'un nouveau client
function onSocketConnected(socket){
   console.log ("-------------------------------");
   console.log("connexion nouveau client :"+ socket.pseudo + "(ID : " + socket.id + ")");
}

var debugNbOffer =0;


io.sockets.on('connection', function (socket, pseudo) {
 
   	// Quand un User rentre un pseudo (version objet), 
    // on le stocke en variable de session et on informe les autres Users
    socket.on('nouveau_client2', function(data) {

        // On lui attribue un numéro correspondant a sa position d'arrivée dans la session:
        // var placeListe = lastPosition +1; // WTF LastPosition ne s'incrémente pas... 
        // Même en modifiant la portée de la variable (placeliste déclaré sans "var" devant...)
        // var placeListe = nbUsers +1; // Par contre là ca marche ! PKOI ?
        // Il semblerai que seuls les objets soient persistants, pas les valeurs de types primitifs...
        // A creuser + tard (tester si c'est pareil avec un type "string" )....
        
        // Plan B: On passe par un objet contenant tous les users connectés
        // depuis le début de la session (comme une sorte de log, d'historique..)
        // et on comptera simplement le nombre de propriétés de l'objet.
        histoUsers2[socket.id] = data.pseudo + " timestamp:" + Date.now();
        var userPlacelist = common.lenghtObject(histoUsers2);
        // On crée un User - Fonction de référence ds la librairie common:
        // exports.client = function client (id,pseudo,placeliste,typeClient,connectionDate,disConnectionDate){
        var p1 = socket.id;
        var p2 = ent.encode(data.pseudo);
        var p3 = userPlacelist;
        var p4 = data.typeUser;
        var p5 = Date.now();
        var p6 = null;
        var objUser = new common.client(p1,p2,p3,p4,p5,p6);
       
        // On ajoute l'User à la liste des connectés
        users2[socket.id] = objUser; 

        /*
        console.log("--version Objet---");
        console.log(objUser); 
        console.log("--------------");
        console.log(users2);
        console.log("/--version Objet---/"); 
        /**/

        // On renvoie l'User crée au nouveau connecté
        // pour l'informer entre autre de son ordre d'arrivée ds la session
        io.to(socket.id).emit('position_liste2', objUser);
        
        // 2 - on signale à tout le monde l'arrivée de l'User
		socket.broadcast.emit('nouveau_client2', objUser);

        
 		// 3 - on met a jour le nombre de connectés coté client"
        nbUsers2 = common.lenghtObject(users2);
        io.sockets.emit('updateUsers',{listUsers: users2});

        // 4 - on met à jour la liste des connectés cotés clients
        // ... TODO... EST-ce bien nécéssaire ????

    });

  	// Quand un user se déconnecte (V2)
    socket.on('disconnect', function(){  
        
		var dUser = users2[socket.id]; 


		//console.log ("-------------------------------");
		var message = "Vient de se déconnecter !";
		// console.log(message + "( ID : " + socket.id + ")");
        
		
		
		// on retire le connecté de la liste des utilisateurs
		delete users2[socket.id]; 
		socket.broadcast.emit('disconnected', {listUsers: users2});
		//socket.broadcast.emit('disconnected', "WTF");
        // On prévient tout le monde
        socket.broadcast.emit('message2',{objUser: dUser, message: message});
        
        // on retire le connecté de la liste des utilsateurs
        // et on actualise le nombre de connectés  
        // delete users2[socket.id]; 
        nbUsers = common.lenghtObject(users2)

        // contrôle liste connectés coté serveur
		console.log (users2);
		
        console.log ("Il reste " + nbUsers + " connectés");
        // TODO: Mise à jour de la liste coté client...

        // io.sockets.emit('users', users);           
        // socket.leave(socket.room);  /: On quitte la Room

        // envoi d'un second message destiné au signaling WebRTC
        // socket.broadcast.emit('disconnected', { pseudo:"SERVER", message: message, placeListe: "-"});
        // socket.broadcast.emit('disconnected', {listUsers: users2});
    });  

    // Transmission de messages générique V2 objet
    socket.on('message2', function (data) {
        console.log(data);
        if (data.message){
            message = ent.encode(data.message); // On vire les caractères html...
            socket.broadcast.emit('message2',{objUser: data.objUser, message: message});
    	}
        console.log ("@ message2 from "+data.objUser.placeliste+"-"+data.objUser.pseudo+ ": "+ message);
    }); 


    // Transmission de commande générique V2 objet
    socket.on('moveOrder', function (data) {
        console.log(data);
        if (data.moveOrder){
            moveOrder = ent.encode(data.moveOrder); // On vire les caractères html... ???????
            socket.broadcast.emit('moveOrder',{objUser: data.objUser, moveOrder: moveOrder});
        }
        console.log ("@ moveOrder from "+data.objUser.placeliste+"-"+data.objUser.pseudo+ ": "+ moveOrder);
    }); 


    // ----------------------------------------------------------------------------------
    // Partie 'signaling'. Ces messages transitent par websocket 
    // mais n'ont pas vocation à s'afficher dans le tchat...

    socket.on('signaling', function (message) {
        //console.log ("@ signaling from "+socket.placeListe+socket.pseudo);
        console.log ("@ signaling...");
        socket.broadcast.emit('signaling', message);
    }); 

    // Quand est balancé un message 'candidate'
    // il est relayé à tous les autres connectés sauf à celui qui l'a envoyé
    socket.on('candidate', function (message) {
        // console.log ("@ candidate from "+socket.placeListe+socket.pseudo+" timestamp:" + Date.now());
        // socket.broadcast.emit('candidate', {pseudo: socket.pseudo, message: message, placeListe: socket.placeListe});
        socket.broadcast.emit('candidate', {message: message});
    }); 

    // Quand est balancé un message 'offer'
    // il est relayé à tous les autres connectés sauf à celui qui l'a envoyé
    socket.on('offer', function (message) {
        socket.broadcast.emit('offer', {message: message});
    }); 

    // Quand est balancé un message 'answer'
    // il est relayé à tous les autres connectés sauf à celui qui l'a envoyé
    socket.on('answer', function (message) {
        socket.broadcast.emit('answer', {message: message});
    }); 

    // ----------------------------------------------------------------------------------
    // Phase pré-signaling ( selections caméras et micros du robot par l'IHM pilote)

    // Robot >> Pilote: Offre des cams/micros disponibles coté robot
    socket.on('remoteListDevices', function (data) {
    	socket.broadcast.emit('remoteListDevices', {objUser:data.objUser, listeDevices:data.listeDevices});
    	/*// Contrôle >>
    	var place = data.objUser.placeliste;
    	var login = data.objUser.pseudo;
    	var role = data.objUser.typeClient;
    	console.log ("@ remoteListDevices from: "+place+"-"+login+" ("+role+") timestamp:" + Date.now());
    	console.log(data.objUser);
    	console.log(data.listeDevices);
    	/**/   
    }); 


    // Pilote >> Robot: cams/micros sélectionnés par le Pilote
    socket.on('selectedRemoteDevices', function (data) {
    	socket.broadcast.emit('selectedRemoteDevices', {objUser:data.objUser, listeDevices:data.listeDevices});
    	/*// Contrôle >>
    	var place = data.objUser.placeliste;
    	var login = data.objUser.pseudo;
    	var role = data.objUser.typeUser;
    	console.log ("@ selectedRemoteDevices from: "+place+"-"+login+" ("+role+") timestamp:" + Date.now());
    	console.log(data);
    	/**/
    }); 

    // Robot >> Pilote: Signal de fin pré-signaling...
    socket.on('readyForSignaling', function (data) {
        socket.broadcast.emit('readyForSignaling', {objUser:data.objUser, message:data.message});
    }); 
});
