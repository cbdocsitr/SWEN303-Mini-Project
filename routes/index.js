var express = require('express');
var router = express.Router();
var basex = require('basex');
var cheerio = require('cheerio');
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
if(req.query.searchString){
	var queryArray = req.query.searchString.split(" ");
	var queryString = "";
	var contains1 = "//*[. contains text '";
	var contains2 = "']";
	var i = 0;
	if(queryArray[i]==="NOT"){
		contains1 = "//*[not(. contains text '";
		contains2 = "')]";
		++i;
	}
	while(i < queryArray.length){
		queryString += queryArray[i];
		++i;
		if(i < queryArray.length){
			if(queryArray[i] ==="OR"){
				queryString += "' ftor '";
			}else if(queryArray[i] === "AND"){
				queryString += "' ftand '";
			}else{
				queryString = queryString + "' ftand '" + queryArray[i];
			}	
		}
		++i;
	}
}
client.execute(basexQuery + contains1 + queryString + contains2,
function (error, result) {
	var $;
	var list = [];
	if(error){ console.error(error)}
	else {
		if(req.query.searchString == undefined || req.query.searchString == null){
			res.render('search-text', { title: 'Colenso Databse', results: " "});
		}else{
			$  = cheerio.load(result.result, {
				xmlMode: true
			});
			$("TEI").each(function(i, elem){
				var title = $(elem).find("title").first().text();
				var id = $(elem).attr("xml:id");
				if(!id){
					return;
				}
				list.push({title: title, href: "/document/" + id});
			});
			res.render('search-text', { visited: true, number: list.length, results: list});
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
				res.render('search-text', { results: 'Colenso Databse', results: result.result});
			}
				}
				);
	}
});

//Document display route
router.get("/document/:id",function(req,res){
	client.execute(basexQuery + "(//*[@xml:id= '" + req.params.id + "' ])",
		function (error, result) {
			if(error){ console.error(error)}
			else{
				var $ = cheerio.load(result.result, {
					xmlMode: true
				});
				var title = $("title").first().text();
				var body = $("body").first().html();
				var templateData = { 
					name: title,
					body: body
				};
				res.render('document', templateData);
			}
		}
	);
});

module.exports = router;
