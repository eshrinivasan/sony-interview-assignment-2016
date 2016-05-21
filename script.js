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
    init: function() {//Default seach query
        var url  = this.url + "starcraft";
        pubsub.subscribe('list-loaded', this.displayList);
		pubsub.publish('update-list', url);
		this.searchSubmit();
       	return this;
    },
    displayList: function (topic, data) {//Construct list from jsonp response
    	getElement("loading").className = "hide";
        var json, docfrag, ul, li, span, listItem, img = '';
        var ulroot = "search_list_items";
		json = data[0];
		docfrag = document.createDocumentFragment();
		ul = getElement(ulroot);
 		
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
    searchSubmit: function(){//handle form submit
    	var searchTerm, url;
    	document.forms["searchForm"].onsubmit = function(e){
			e.preventDefault();
			searchTerm = getElement("search_box").value;
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
		total = json._total;
		this.count = 1;
		twitchWeb.pager.displayCount(total);
		nextUrl = json._links.next;
		prevUrl = json._links.prev;
		getElement("prev_button").className = (prevUrl == undefined)?'hide':'';
		getElement("prev_button").onclick = function(){
			getElement("loading").className = "";
			twitchWeb.pager.prev(prevUrl, total);
		}
		getElement("next_button").onclick = function(){
			getElement("loading").className = "";
			twitchWeb.pager.next(nextUrl, total);
		}
	},
	prev:function(prevUrl, total){
		this.count--;
		getElement("prev_button").className = (prevUrl == undefined)?'hide':'';
		pubsub.publish('update-list', prevUrl);
		this.displayCount(total);
	},
	next:function(nextUrl, total){
		this.count++;
		getElement("next_button").className = (nextUrl == undefined)?'hide':'';
		pubsub.publish('update-list', nextUrl);
		this.displayCount(total);
	},
	displayCount: function(total){
		var totalPages = Math.ceil(total/10);
		getElement("total_results_count").innerText = "Total Results: "+total;
		getElement("page_indicator").innerText = this.count+"/"+totalPages;
		getElement("next_button").className = (this.count >= totalPages)?'hide':'';
	},
	count:1
}).init();

//Utility function to log to console
function debug(){
	var arglist = Array.prototype.slice.call(arguments);
	console.log(arglist);
}

function getElement(id){
	return document.getElementById(id);
}