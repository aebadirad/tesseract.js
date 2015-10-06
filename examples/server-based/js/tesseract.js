var Tesseract = function () {};
	Tesseract = {

	//https://cdn.rawgit.com/naptha/tesseract.js/master/worker/worker.js
	//https://rawgit.com/naptha/tesseract.js/master/worker/worker.js   for testing
	//https://cdn.rawgit.com/naptha/tesseract.js/master/worker/worker.js
	//Where am I? Let's find out!
	root : window.location.protocol + '//' + window.location.host,
	
	//set as relative path to root if you want a local tessdata, starting and trailing slash required
	//example /data/Tessdata/
	tessdataPath : false,
	//set as relative path to root if you want a local worker file rather than the most recent, starting and trailing slash required
	//example /js/tesseractjs/worker.js
	workerJSPath : false,
	bigworker: false,
	worker : false,
	index : 0,
	handlers : [],
	
	//initialize the base object
	init: function(options){
	var self = this;
	
	//Check for options object
	if(options){
		this.setPaths(options);
	}
	
	//Case check for local vs. remote 
	var workerPath;
	if(this.workerJSPath){
	workerPath = this.root+this.workerJSPath;
	}else{
	workerPath = "https://cdn.rawgit.com/naptha/tesseract.js/master/lib/worker.2015.07.26.js"; // changed on build
	}
	var blob = new Blob(["importScripts('"+workerPath+"');"]);
	this.worker = new Worker(window.URL.createObjectURL(blob));
	this.worker.postMessage({init: {mem: 16777216*6}, rootURL : this.root, localTessdata: this.tessdataPath })



	this.worker.onmessage = function(e){
		var handler = self.handlers[e.data.index]
		if(e.data.progress){
			handler.progress(e.data.progress)
		}
		else if(e.data.err){
			handler.reject(e.data.err)
			handler.callback(e.data.err)
		}
		else {
			handler.resolve(e.data.result)
			handler.callback(null,e.data.result)
		}
	}
},


	 convertToImageData: function(image){
		if(image.getContext){
			image = image.getContext('2d');
		}else if(image.tagName == "IMG" || image.tagName == "VIDEO"){
			var c = document.createElement('canvas');
			if(image.tagName == "IMG"){
				c.width  = image.naturalWidth;
				c.height = image.naturalHeight;
				if(c.width === 0){
					c.width = image.width;
					c.height = image.height;
				}
			}else if(image.tagName == "VIDEO"){
				c.width  = image.videoWidth;
				c.height = image.videoHeight;
			}
			var ctx = c.getContext('2d');
			ctx.drawImage(image, 0, 0);
			image = ctx;
		}
		
		if(image.getImageData) image = image.getImageData(0, 0, Math.round(image.canvas.width), Math.round(image.canvas.height));
		return image	
	},
	
	setPaths : function(paths) {
		if(paths.tessdataPath){
		this.tessdataPath = paths.tessdataPath;
		}
		if(paths.workerJSPath){
		this.workerJSPath = paths.workerJSPath;
		}
		
	},
	
	detect : function(image, progress, callback){
		var self = this;
		image = this.convertToImageData(image)

		if(typeof progress === "undefined"){
			progress = callback = new Function()
		}

		if (typeof callback === "undefined"){
			callback = progress
			progress = new Function()
		}

		var i = this.index++

		this.handlers[i] = {
			resolve: new Function(),
			reject: new Function()
		}
		this.handlers[i].callback = callback
		this.handlers[i].progress = progress
		
		return new Promise(function(resolve, reject){
			self.handlers[i].resolve = resolve
			self.handlers[i].reject = reject
			self.worker.postMessage({index: i, fun: 'detect', image: image})
		})

	},

	recognize: function(image, options, callback){
		var lang = options.lang
		var self = this;
		if (typeof lang === "undefined"){
			lang = 'eng'
		}

		if (!this.bigworker && ['chi_sim', 'chi_tra', 'jpn'].indexOf(lang) != -1){
			this.worker.postMessage({init: {mem: 16777216*10}})
			this.bigworker = true
			console.log('started big worker')
		}

		if (typeof options === 'string') {
			lang = options
			options = {}
		}

		if (typeof options === "function") {
			callback = options
			options = {}
		}
		image = this.convertToImageData(image)


		var i = this.index++

		this.handlers[i] = {
			resolve: new Function(),
			reject: new Function()
		}
		this.handlers[i].callback = callback || new Function()
		this.handlers[i].progress = (function(){
			if(typeof options.progress === 'function'){
				var p = options.progress
				delete options.progress
				return p
			}
			return function(){}
		})()

		return new Promise(function(resolve, reject){
			self.handlers[i].resolve = resolve
			self.handlers[i].reject = reject
			var messageW = {index: i, fun: 'recognize', image: image, lang: lang, options: {lang: lang}};
			self.worker.postMessage(messageW);
		})
	
	}
};