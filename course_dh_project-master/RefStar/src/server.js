const path = require('path');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const server = express();
server.use(bodyParser.json())
server.use(cors());
server.set('view engine', 'ejs');  
server.set('views', path.join(__dirname, 'dev/'));
const port = 5900

const MongoClient = require('mongodb').MongoClient;
const mongo = require('mongodb');
const assert = require('assert');
const url = 'mongodb://localhost:27017';
const dbName = 'RefStar';
const collectName = 'documents'
const client = new MongoClient(url);


client.connect(function(err) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
});


server.listen( port , () => {
    console.log('listening on port',port);
});

server.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, '/dist/HomePage.html'));
    res.render('index.ejs', {  
        title: '首頁',  
        data: {a: "abc", b: {c: 34, d: 0.9, e: 'hello'}}
       });  
});

server.get('/bundle.js', (req, res) => {
    res.sendFile(path.join(__dirname, '/dist/bundle.js'));
});

server.post('/upload', (req, res) => {
    
    const db = client.db(dbName);
    const col = db.collection(collectName);

    col.insert(req.body, function(err, result) {
        assert.equal(err, null);
        console.log("Inserted!");
        console.log(result);
        console.log();
        res.send(
            "http://cml0.csie.ntu.edu.tw:30194/id/" + 
            result.insertedIds[0]);
    });
});

server.post('/name/:name', (req, res) => {
    const db = client.db(dbName);
    const col = db.collection(collectName);

    col.find({abc: req.params.name}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Query with %s", req.params.name);
        console.log(docs);
        console.log();
        res.send(docs);
    });
});

server.get('/id/:id', (req,res) => {
    const db = client.db(dbName);
    const col = db.collection(collectName);
    col.find({_id: new mongo.ObjectID(req.params.id)}).toArray(function(err, docs){
        assert.equal(err, null);
        console.log("Query with %s", req.params.id);
        console.log(docs);
        console.log();
        res.send(docs);
    });
});

server.get('*', (req, res) => {
    res.sendStatus(404);
});
