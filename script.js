'use strict';
var twitchWeb = twitchWeb || {};
twitchWeb.model = ({
	init: function(){
		pubsub.subscribe('update-list', this.loadList, this);
		return this;
	},
	response: function(){//JSONP callback to handle response
		this.data = arguments;
	    pubsub.publish('list-loaded', this.data);
	},
	loadList: function(topic, url) {//JSONP call to twitch api
		var s = create('script');
		s.type = 'text/javascript';
		s.src = url+'&callback=twitchWeb.model.response';
		var h = document.getElementsByTagName('script')[0];
		h.parentNode.insertBefore(s, h);
	},
	data:[]
}).init();

twitchWeb.view = ({
	url:'https://api.twitch.tv/kraken/search/streams?q=',
    init: function() {//Default seach query
        var url  = this.url + "starcraft";
        pubsub.subscribe('list-loaded', this.displayList);
		pubsub.publish('update-list', url);
		this.searchSubmit();
       	return this;
    },
    displayList: function (topic, data) {//Construct list from jsonp response
    	json = data[0];
		if(json.error){ //If error, return
			return;
		}
		//debug("json", json.streams);
    	get("loading").className = "hide";
        var json, docfrag, ul, li, span, listItem, anchor, img = '';
        var ulroot = "search_list_items";
		docfrag = document.createDocumentFragment();
		ul = get(ulroot);
 		
		for(var k in json.streams){
			li = create('li');
			li.className = "listItem clearfix";
			img = create('img');//create image tag
			img.src = json.streams[k].preview.medium; 
			img.className= "listThumb";
			
			anchor = create('a');//create anchor tag
			anchor.href = json.streams[k].channel.url;
			anchor.appendChild(img);
			li.appendChild(anchor);

			span = create('span');
			span.className = "listDescription";
			listItem = '<div class="displayname">'+json.streams[k].channel.display_name+
			'</div><div class="metainfo"><span class="game">'+json.streams[k].channel.game+'</span>'+
			'<span class="views">'+json.streams[k].viewers +' viewers</span>'+
			'<div class="status">Stream Description '+json.streams[k].channel.status +'</div></div>';			
			span.innerHTML = listItem;
			li.appendChild(span);
			docfrag.appendChild(li);
		}
		ul.innerHTML = '';//Clear the list
		ul.appendChild(docfrag);
    },
    searchSubmit: function(){//handle form submit
    	var searchTerm, url;
    	document.forms["searchForm"].onsubmit = function(e){
			e.preventDefault();
			searchTerm = get("search_box").value.trim();
			searchTerm = searchTerm.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');//sanitize
			if(searchTerm){
				url = twitchWeb.view.url + searchTerm;
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
		var json, total, nextUrl, prevUrl;
		json = data[0];
		total = json._total || 0;
		if(json.error){	//Error occurred, display message
			get("search_results_area").innerHTML = "<h2>No results to display for the search query. Enter a different search query!</h2>";
			return;
		}
		this.count = 1;
		twitchWeb.pager.displayCount(total);
		nextUrl = json._links.next;
		prevUrl = json._links.prev;
		get("prev_button").className = (prevUrl === undefined)?'hide':'';
		get("prev_button").onclick = function(){
			get("loading").className = "";
			twitchWeb.pager.prev(prevUrl, total);
		}
		get("next_button").onclick = function(){
			get("loading").className = "";
			twitchWeb.pager.next(nextUrl, total);
		}
	},
	prev:function(prevUrl, total){
		this.count--;
		get("prev_button").className = (prevUrl === undefined)?'hide':'';
		pubsub.publish('update-list', prevUrl);
		this.displayCount(total);
	},
	next:function(nextUrl, total){
		this.count++;
		get("next_button").className = (nextUrl === undefined)?'hide':'';
		pubsub.publish('update-list', nextUrl);
		this.displayCount(total);
	},
	displayCount: function(total){
		var totalPages = Math.ceil(total/10);
		get("total_results_count").innerText = "Total Results: "+total;
		get("page_indicator").innerText = this.count+"/"+totalPages;
		get("next_button").className = (this.count >= totalPages)?'hide':'';
	},
	count:1
}).init();

//Utility function to log to console
function debug(){
	var arglist = Array.prototype.slice.call(arguments);
	console.log(arglist);
}
//Wrapper for getElementById
function get(id){
	return document.getElementById(id);
}
//Wrapper for createElement
function create(element){
	return document.createElement(element);
}