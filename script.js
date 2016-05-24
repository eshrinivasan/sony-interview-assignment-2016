'use strict';
var twitchWeb = twitchWeb || {};
var cache = {};
var debugMode = 1;

/*
 * Model 
 * LoadList - JSONP call to twitchWeb API
 * Cache the response
 * Clean up script tags appended to the DOM
 */
twitchWeb.model = ({
	init: function(){
		pubsub.subscribe('update-list', this.loadList, this);
		return this;
	},
	response: function(){
		var currentUrl;
		this.data = arguments;
		currentUrl = this.data[0]._links.self;
		cache[currentUrl] = this.data;
		pubsub.publish('list-loaded', this.data);
	},
	loadList: function(topic, url) {//JSONP call to twitch api
		if(!url){return;}
		if(cache[url] === undefined){
			var script = create('script');
			script.async = true;
			script.type = 'text/javascript';

			var callbackfn = 'exec'+Math.floor((Math.random()*65535)+1);
			window[callbackfn] = function(data) {
				var scr = get(callbackfn);
				scr.parentNode.removeChild(scr);
				twitchWeb.model.response(data);
				window[callbackfn] = null;
				delete window[callbackfn];
			}
			
			script.src = url+'&callback='+callbackfn;
			script.id = callbackfn;
			document.getElementsByTagName('head')[0].appendChild(script);	
		}else{	
			pubsub.publish('list-loaded', cache[url]);
		}
	},
	data:[]
}).init();

/*
 * View - Loads the initial list from twitchWeb API
 * Handles the search form submit
 * Renders the list
 */
twitchWeb.view = ({
	url:'https://api.twitch.tv/kraken/search/streams?q=',
	defaultValue:"starcraft",
    init: function() {
        var url  = this.url + this.defaultValue;
		pubsub.publish('update-list', url);
		pubsub.subscribe('list-loaded', this.displayList);
		this.searchSubmit();
       	return this;
    },
    displayList: function (topic, data) {//Construct list from jsonp response
        var json, docfrag, ul, li, span, listItem, anchor, img, total = '';
        var ulroot = "search_list_items";
		docfrag = document.createDocumentFragment();
		json = data[0];
		
    	total = data[0]._total;
		if(json.error){ //If error, return
			return;
		}
    	
		for(var k in json.streams){
			li = create('li');
			li.className = (k%2 === 0) ? "listItem striped clearfix" : "listItem clearfix";
			
			img = create('img');//create image tag
			img.src = json.streams[k].preview.medium; 
			img.className= "listThumb";
			
			anchor = create('a');//create anchor tag and wrap around img
			anchor.href = json.streams[k].channel.url;
			anchor.appendChild(img);
			li.appendChild(anchor);

			span = create('span');
			span.className = "listDescription";
			//create metadata for each item
			listItem = '<div class="displayname">'+json.streams[k].channel.display_name+
			'</div><div class="metainfo"><span class="game">'+json.streams[k].channel.game+'</span>'+
			'<span class="views">'+json.streams[k].viewers +' viewers</span>'+
			'<div class="status">Stream Description '+json.streams[k].channel.status +'</div></div>';			
			span.innerHTML = listItem;
			li.appendChild(span);
			docfrag.appendChild(li);
		}
		get("loading").className = "hide"; //hide "loading" text indicator

		ul = get(ulroot);
		if(total){//valid results 
			ul.innerHTML = '';//Clear the existing list, if any
			ul.appendChild(docfrag);
		}else{
			ul.innerHTML = "No results to display!";
		}
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
}).init();

/*
 * View 
 * View controls "Previous", "Next"
 * Makes call for Previous, Next Pages
 * Updates the Total results count and page numbers
 */
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
		if(json.error){	//Error occurred, return
			return;
		}
		get("total_results_count").innerText = "Total Results: "+total;

		twitchWeb.pager.displayCount(total);
		nextUrl = json._links.next;
		prevUrl = json._links.prev;
		get("prev_button").className = (prevUrl === undefined)?'hide':'';
		get("prev_button").onclick = function(e){
			get("loading").className = ""; //show loading text
			twitchWeb.pager.prev(prevUrl, total);
			return false;
		}
		get("next_button").onclick = function(e){
			get("loading").className = ""; //show loading text
			twitchWeb.pager.next(nextUrl, total);
			return false;
		}
	},
	prev:function(prevUrl, total){
		this.count--;
		get("prev_button").className = (prevUrl === undefined)?'hide':'';
		pubsub.publish('update-list', prevUrl);
	},
	next:function(nextUrl, total){
		this.count++;
		get("next_button").className = (nextUrl === undefined)?'hide':'';
		pubsub.publish('update-list', nextUrl);
	},
	displayCount:function(total){
		this.totalPages = Math.ceil(total/10);
		get("page_indicator").innerText = (total > 0 ) ? this.count+"/"+ this.totalPages : "";
		get("next_button").className = (this.count >= this.totalPages)?'hide':'';
	}
}).init();

//Utility function to log to console
function debug(){
	var arglist = Array.prototype.slice.call(arguments);
	if(typeof console!== undefined && debugMode)
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
