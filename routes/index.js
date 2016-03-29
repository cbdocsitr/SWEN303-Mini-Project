var express = require('express');
var router = express.Router();
var basex = require('basex');
var cheerio = require('cheerio');
var http = require('http');
var path = require('path');
var mime = require('mime');
var fs = require('fs');
var client = new basex.Session("127.0.0.1", 1984, "admin", "admin");
client.execute("OPEN Colenso");

var basexQuery = "XQUERY declare default element namespace 'http://www.tei-c.org/ns/1.0';";

/* GET home page. */
router.get("/",function(req,res){
	res.render('index', { title: 'Colenso Database'});
});

//SEARCH TEXT
router.get('/search-text', function(req, res) {
if(req.query.searchString){
	//the following section handles logical operators and wildcard input
	var queryArray = req.query.searchString.split(" ");
	var queryString = "";
	var contains1 = "//TEI[. contains text '";
	var contains2 = "']";
	var wildcard = false;
	var firstElement = queryArray[0];
	var firstElementArray = firstElement.split("");
	var lastChar = firstElementArray[firstElementArray.length-1];
	var i = 0;
	if(firstElement==="NOT"){
		contains1 = "//*[not(. contains text '";
		contains2 = "')]";
		++i;
	}else if(lastChar==="*"){
		queryArray[0].replace("*", "");
		wildcard = true;
		contains1 = "//*[starts-with(., '";
		contains2 = "')]";
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
if(wildcard){
	contains1 = "//TEI[.]";
	queryString = "";
	contains2 = "";
}
//the actual query begins here
client.execute(basexQuery + contains1 + queryString + contains2,
function (error, result) {
	var $;
	var list = [];
	if(error){ console.error(error)}
	else {
		if(req.query.searchString == undefined || req.query.searchString == null){
			res.render('search-text', { title: 'Colenso Database', results: " "});
		}else{
			//if the user has actually inputed something, and no error has occured:
			$  = cheerio.load(result.result, {
				xmlMode: true
			});
			$("TEI").each(function(i, elem){
				var title = $(elem).find("title").first().text();
				var id = $(elem).attr("xml:id");
				if(!id){
					return;
				}
				//Note: the href property is used to link to the document's "view" page
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
		res.render('search-markup', { title: 'Colenso Database', results: " "});
	}else{
		//this query finds the actual data the user wants
		client.execute(basexQuery + req.query.searchString, function (error, result) {
			var list = [];
			var results = result.result.split("\n");
			//this query finds the database path of the documents the data is from
			client.execute(basexQuery + "for $n in (collection('Colenso/')" + req.query.searchString + ")\n" +
			"return db:path($n)", function (error2, resultDB) {
				var paths = resultDB.result.split("\n");
				//this modifies the database path to give the id of the document
				//Note: this does not work in all cases (sometimes the file name is different to the id)...
				//...so will give some dead links. Should have better implementation
				for(i = 0; i <paths.length; i++){
					var id = paths[i].replace(".xml", "");
					id = id.split("/")[2];
					if(id[0]==="N"){
						id = "Colenso-"+id;
					}
					var title = results[i];
					list.push({title: title, href: "/document/" + id});
				}
				res.render('search-markup', { visited: true, number: list.length, results: list});
			});
		});
	}
});

router.get("/browse",function(req,res){
	res.render('browse', { title: "Colenso Database"});
});

//author display
router.get("/browse-author/:author",function(req,res){
	//this section constructs the author string to be searched
	var authorArray = req.params.author .split("-");
	var authorQuery = "";
	for(i = 0; i < authorArray.length; i++){
		var nextWord = authorArray[i];
		nextWord[0] = nextWord[0].toUpperCase();
		authorQuery = authorQuery + " " + nextWord;
	}
	//query to find doctuments matching the author string
	client.execute(basexQuery + "(//TEI[. contains text '" + authorQuery +"' ])", 
		function (error, result) {
			var list = [];
		if(error){ console.error(error)}
		else{
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
			res.render('browse', { visited: true, results: list});		
		}
	});
});

//Document display route
router.get("/document/:id",function(req,res){
	//searches for document containing that id
	client.execute(basexQuery + "(//TEI[@xml:id= '" + req.params.id + "' ])",
		function (error, result) {
			if(error){ console.error(error)}
			else{
				var $ = cheerio.load(result.result, {
					xmlMode: true
				});
				var title = $("title").first().text();
				var author = $("author").first().text();
				var body = $("body").first().html();
				var templateData = { 
					name: title,
					author: author,
					body: body,
					href: "/download/" + req.params.id
				};
				res.render('document', templateData);
			}
		}
	);
});

//Document download route
router.get("/download/:id",function(req,res){
	var _dirname = 'Colenso_TEIs/';
	client.execute(basexQuery + "for $n in (collection('Colenso/')//TEI[@xml:id='" + req.params.id + "'])\n" +
		"return db:path($n)", function (error, resultDB) {
			
			var file =  _dirname + resultDB.result;
			res.download(file);
			
		});
	
});

module.exports = router;
