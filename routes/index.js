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

//Document display route
router.get("/document/:id",function(req,res){
	client.execute(basexQuery + "(//*[@xml:id='PrLBrghtn-0001'])",
		function (error, result) {
			if(error){ console.error(error)}
			else{
				console.log(result);
			}
		}
	);
});

module.exports = router;
