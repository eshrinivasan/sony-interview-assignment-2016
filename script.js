'use strict';
var twitchWeb = twitchWeb || {};
twitchWeb.model = ({
	init: function(){
		pubsub.subscribe('update-list', this.loadList, this);
		return this;
	},
	response: function(){
		this.data = arguments;
	    pubsub.publish('list-loaded', this.data);
	},
	loadList: function(topic, url) {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.src = url+'&callback=twitchWeb.model.response';
		var h = document.getElementsByTagName('script')[0];
		h.parentNode.insertBefore(s, h);
	},
	data:[]
}).init();

twitchWeb.view = ({
	url:'https://api.twitch.tv/kraken/search/streams?q=',
    init: function() {
        var url  = this.url + "starcraft";
        pubsub.subscribe('list-loaded', this.displayList);
       
		pubsub.publish('update-list', url);
		this.searchSubmit();
       	return this;
    },
    displayList: function (topic, data) {
    	document.getElementById("loading").className = "hide";
        var json, docfrag, ul, li, span, listItem, img = '';
        var ulroot = "search_list_items";
		json = data[0];
		docfrag = document.createDocumentFragment();
		ul = document.getElementById(ulroot);
 		
		for(var k in json.streams){
			li = document.createElement('li');
			li.className = "listItem clearfix";
			img = document.createElement('img');
			img.src = json.streams[k].preview.medium; 
			img.className="listThumb";
			li.appendChild(img);

			span = document.createElement('span');
			span.className = "listDescription";
			listItem = '<div class="displayname">'+json.streams[k].channel.display_name+
			'</div><div class="metainfo"><span class="game">'+json.streams[k].channel.game+'</span>'+
			'<span class="views">'+json.streams[k].channel.views +' views</span>'+
			'<div class="status">Stream Description '+json.streams[k].channel.status +'</div></div>';			
			span.innerHTML = listItem;

			li.appendChild(span);
			docfrag.appendChild(li);
		}
		ul.innerHTML = '';//Clear the list
		ul.appendChild(docfrag);
    },
    searchSubmit: function(){
    	document.forms["searchForm"].onsubmit = function(e){
			e.preventDefault();
			var searchTerm = document.getElementById("search_box").value;
			if(searchTerm){
				var url  = twitchWeb.view.url + searchTerm;
				debug("searchSubmit", url);
				pubsub.publish('update-list', url);	
			}else{
				alert("Please enter a search query!");
				return;
			}
		}
    }
}).init(); // Initialize the view

twitchWeb.pager = ({
	init: function(){
		this.count = 1;
		pubsub.subscribe('list-loaded', this.pageList, this);
		return this;
	},
	pageList: function(topic, data){
		var json = data[0];
		var total = json._total;
		this.count = 1;
		twitchWeb.pager.displayCount(total);

		var nextUrl = json._links.next;
		var prevUrl = json._links.prev;
		document.getElementById("prev_button").className = (prevUrl == undefined)?'hide':'';
		document.getElementById("prev_button").onclick = function(){
			document.getElementById("loading").className = "";
			twitchWeb.pager.prev(prevUrl, total);
		}
		document.getElementById("next_button").onclick = function(){
			document.getElementById("loading").className = "";
			twitchWeb.pager.next(nextUrl, total);
		}
	},
	prev:function(prevUrl, total){
		this.count--;
		document.getElementById("prev_button").className = (prevUrl == undefined)?'hide':'';
		pubsub.publish('update-list', prevUrl);
		this.displayCount(total);
	},
	next:function(nextUrl, total){
		this.count++;
		debug("next", nextUrl);
		document.getElementById("next_button").className = (nextUrl == undefined)?'hide':'';
		pubsub.publish('update-list', nextUrl);
		this.displayCount(total);
	},
	displayCount: function(total){
		var totalPages = Math.ceil(total/10);
		document.getElementById("total_results_count").innerText = "Total Results: "+total;
		document.getElementById("page_indicator").innerText = this.count+"/"+totalPages;
		document.getElementById("next_button").className = (this.count >= totalPages)?'hide':'';
	},
	count:1
}).init();

function debug(){
	var arglist = Array.prototype.slice.call(arguments);
	console.log(arglist);
}

//To do:
//Clean up code
//Add spinner or loading text
//Add noscript tag
/*
Use JSONP
vanilla JS with XHR to hit the API
code to a github repo and send us the link.  
You can host the running app on github.io

Error handling
Code comments
Use promises
Object oriented pattern
Responsive layout
Unit testing
Performance consideration, quick to load
Cross browser compatibility(check IE)
Cross device
*/