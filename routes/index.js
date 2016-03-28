var express = require('express');
var router = express.Router();
var basex = require('basex');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");

var basexQuery = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';";

/* GET home page. */
router.get("/",function(req,res){
client.execute(basexQuery + " (//name[@type='place'])[1] ",
function (error, result) {
	if(error){ console.error(error);}
	else {
		res.render('index', { title: 'Colenso Databse', place: result.result });
	}
		}
		);
});

//SEARCH TEXT
router.get('/search-text', function(req, res) {
client.execute(basexQuery + "//*[. contains text '" + req.query.searchString + "' ]",
function (error, result) {
	if(error){ console.error(error)}
	else {
		if(req.query.searchString == undefined || req.query.searchString == null){
			res.render('search-text', { title: 'Colenso Databse', results: " "});
		}else{
			console.log(result);
			var r = result.result;
			var resultArray = r.split("\n");
			var n = resultArray.length;
			res.render('search-text', { title: 'Colenso Databse', results: resultArray, number: n});
		}
	}
		}
		);
});

//SEARCH MARKUP
router.get('/search-markup', function(req, res) {
	if(req.query.searchString == undefined || req.query.searchString == null){
		res.render('search-markup', { title: 'Colenso Databse', results: " "});
	}else{
		client.execute(basexQuery + req.query.searchString,
		function (error, result) {
			if(error){ console.error(error)}
			else {
				res.render('search-markup', { title: 'Colenso Databse', results: result.result});
			}
				}
				);
	}
});

router.get("/letters",function(req,res){
res.render('letters', { title: 'Colenso Database'});
});

router.get("/diary-entries",function(req,res){
res.render('diary-entries', { title: 'Colenso Database'});
});

router.get("/colenso-diary",function(req,res){
res.render('colenso-diary', { title: 'Colenso Database'});
});

router.get("/private-letters",function(req,res){
res.render('private-letters', { title: 'Colenso Database'});
});

router.get("/newspaper-letters",function(req,res){
res.render('newspaper-letters', { title: 'Colenso Database'});
});

router.get("/publications",function(req,res){
res.render('publications', { title: 'Colenso Database'});
});

router.get("/william-broughton-1840",function(req,res){
client.execute("XQUERY doc('Colenso/Broughton/private_letters/PrLBrghtn-0001.xml')",
function (error, result) {
	if(error){ console.error(error);}
	else {
		res.render('william-broughton-1840', { title: 'Colenso Database', letter: result.result});
	}
		}
		);
});

router.get("/Broughton/private_letters/PrLBrghtn-0001",function(req,res){
client.execute("XQUERY doc('Colenso/Broughton/private_letters/PrLBrghtn-0001.xml')",
function (error, result) {
	if(error){ console.error(error);}
	else {
		res.render('Broughton/private_letters/PrLBrghtn-0001', { title: 'Colenso Database', letter: result.result});
	}
		}
		);
});

module.exports = router;
