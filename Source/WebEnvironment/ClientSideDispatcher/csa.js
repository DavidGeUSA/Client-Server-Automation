/*
	Description: Client Side Dispatcher for Client Server Automation
	Author: David Ge
	Date: 2015-01-18
*/
var CSA = CSA || {
	AjaxTimeout:30000,
	//for PHP server side dispatcher, use 'csa.php'
	//for ASPX server side dispatcher, use 'csa.aspx'
	//for Node.js server side dispatcher, use 'node'
	//for other kinds of server side dispatcher, specify corresponding value
	ServerFile: 'csa.aspx',
	DebugLevel: 1,
	Debug: true,
	debugWindow:null,
	values:{},
	serverresponse: {
		downloads: {}
	},
	startsWith: function (container, starts) {
		if (container && starts) {
			if (container.length >= starts.length) {
				var c = container.substr(0, starts.length);
				return (c == starts);
			}
		}
		return false;
	},
	getPageFilename: function() {
		var s = window.location.href; //http://localhost/filename.html?parameters
		s = s.replace(/^.*(\\|\/|\:)/, '');
		return s;
	},
	getWebSitePath: function() {
		var s = window.location.href;
		var f = CSA.getPageFilename();
		var w = s.replace(f, '');
		return w;
	},
	formFleURL: function (serverFolder, filename) {
		var webpath = CSA.getWebSitePath();
		if (serverFolder && serverFolder.length > 0) {
			if (serverFolder[serverFolder.length - 1] == '\\')
				serverFolder[serverFolder.length - 1] = '/';
			else if (serverFolder[serverFolder.length - 1] != '/')
				serverFolder += '/';
			return webpath + serverFolder + filename;
		}
		else {
			return webpath + filename;
		}
	},
	datetime: {
		isValidDate: function (d) {
			if (typeof d != 'undefined' && d != null) {
				if (d instanceof Date) {
					return !isNaN(d.getTime());
				}
			}
			return false;
		},
		parseIso: function (iso) {
			if (iso) {
				var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
				  "([T]|[ ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
				  "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
				var d = iso.match(new RegExp(regexp));
				if (typeof d != 'undefined' && d != null) {
					if (d.length > 1) {
						var date = new Date(d[1], 0, 1);
						if (d[3]) { date.setMonth(d[3] - 1); }
						if (d[5]) { date.setDate(d[5]); }
						if (d[7]) { date.setHours(d[7]); }
						if (d[8]) { date.setMinutes(d[8]); }
						if (d[10]) { date.setSeconds(d[10]); }
						if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
						return date;
					}
				}
			}
		},
		toDate: function (d) {
			if (typeof d != 'undefined' && d != null) {
				var d0;
				if (CSA.datetime.isValidDate(d)) {
					d0 = d;
				}
				else {
					d0 = new Date(d);
					if (!CSA.datetime.isValidDate(d0)) {
						d0 = CSA.datetime.parseIso(d);
						if (!CSA.datetime.isValidDate(d0)) {
							return null;
						}
					}
				}
				return d0;
			}
			return null;
		},
		toIso: function (d0) {
			if (typeof d0 != 'undefined' && d0 != null) {
				var d = CSA.datetime.toDate(d0);
				if (d instanceof Date) {
					var mo = d.getMonth() + 1;
					var dy = d.getDate();
					var hh = d.getHours();
					var mi = d.getMinutes();
					var s = d.getSeconds();
					return ''.concat(d.getFullYear(), '-', (mo > 9 ? mo : '0' + mo), '-', (dy > 9 ? dy : '0' + dy), ' ', (hh > 9 ? hh : '0' + hh), ':', (mi > 9 ? mi : '0' + mi), ':', (s > 9 ? s : '0' + s));
				}
			}
		}
	},
	SetDebugWindow: function (debugWinObj) {
		CSA.debugWindow = debugWinObj;
	},
	OpenDebugWindow: function () {
		if (CSA.debugWindow) {
			if (CSA.debugWindow.closed) {
				CSA.debugWindow = null;
			}
		}
		if (!CSA.debugWindow) {
			CSA.debugWindow = window.top.open("", "debugWindow");
		}
		return CSA.debugWindow;
	},
	ShowDebugInfoLine: function (msg) {
		if (CSA.DebugLevel > 0) {
			var winDebug = CSA.OpenDebugWindow();
			if (winDebug == null) {
				alert('Debug information cannot be displayed. Your web browser has disabled pop-up window');
			}
			else {
				winDebug.document.write(CSA.datetime.toIso(new Date()));
				winDebug.document.write(' - ');
				winDebug.document.write(msg);
				winDebug.document.write('<br>');
			}
		}
	},
	callServer: function (data, form, execAttrs, callback, filelist) {
		var DEBUG_SYMBOL = "F3E767376E6546a8A15D97951C849CE5";
		var state = {};
		if (data) {
			data.callId = Math.random();
		}
		function loadjsfile(f) {
			var head = document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = f;
			head.appendChild(script);
			return script;
		}
		function _getFormMaxSizeHolder(form) {
			if (form) {
				function getfc(f) {
					for (var i = 0; i < f.children.length; i++) {
						if (f.children[i].getAttribute('name') == 'MAX_FILE_SIZE') {
							return f.children[i];
						}
						else {
							var e = getfc(f.children[i]);
							if (e)
								return e;
						}
					}
				}
				return getfc(form);
			}
		}
		function _getFormClientHolder(form) {
			if (form) {
				function getfc(f) {
					for (var i = 0; i < f.children.length; i++) {
						if (f.children[i].getAttribute('name') == 'clientRequest') {
							return f.children[i];
						}
						else {
							var e = getfc(f.children[i]);
							if (e)
								return e;
						}
					}
				}
				var d = getfc(form);
				if (d)
					return d;
			}
			return document.clientRequest;
		}
		function _imitateScope(vs) {
			for (var n in vs) {
				if (vs.hasOwnProperty(n)) {
					CSA.values[n] = vs[n];
					//assign download value to a variable for imitating client code scope
					eval(n + '=' + JSON.stringify(vs[n]) + ';');
				}
			}
		}
		function _processServerResponse(r, state, reportError) {
			var v, winDebug;
			var raw0 = r;
			var pos = r.indexOf(DEBUG_SYMBOL);
			if (pos >= 0 || CSA.Debug || reportError) {
				var debug;
				if (pos >= 0) {
					debug = r.substring(0, pos);
					r = r.substring(pos + DEBUG_SYMBOL.length);
				}
				else {
					debug = r;
				}
				winDebug = CSA.OpenDebugWindow();
				if (winDebug == null) {
					alert('Debug information cannot be displayed. Your web browser has disabled pop-up window');
				}
				else {
					winDebug.document.write('<h1>Debug Information from ');
					winDebug.document.write(window.location.pathname);
					winDebug.document.write('</h1>');
					winDebug.document.write('<h2>Client request</h2><p>');
					winDebug.document.write('Client page:');
					winDebug.document.write(window.location.href);
					winDebug.document.write('<br>');
					winDebug.document.write(debug);
					winDebug.document.write('</p>');
					winDebug.document.write('<h2>Server response</h2><p>');
					winDebug.document.write('Server page:');
					if (state && state.serverPage) {
						winDebug.document.write(state.serverPage);
					}
					winDebug.document.write('<br>');
					winDebug.document.write(r);
					winDebug.document.write('</p>');
				}
			}
			if (typeof r != 'undefined' && r != null && r.length > 6) {
				var signCC = r.substr(0, 6).toLowerCase();
				if (signCC != '<html>') {
					signCC = r.substr(0, 14).toLowerCase();
					if (signCC != '<!doctype html') {
						signCC = null;
					}
				}
				if (signCC) {
					winDebug = CSA.OpenDebugWindow();
					if (winDebug == null) {
						alert('Debug information cannot be displayed. Your web browser has disabled pop-up window');
					}
					else {
						winDebug.document.write('<div>');
						winDebug.document.write(r);
						winDebug.document.write('</div>');
					}
				}
				else {
					for (var k = 0; k < r.length; k++) {
						//remove 65279 
						if (r.charAt(k) == '{') {
							r = r.substring(k);
							break;
						}
					}
					pos = r.length - 1;
					while (r.charAt(pos) != '}') {
						pos--;
						if (pos <= 0) {
							r = '{}';
							break;
						}
					}
					if (pos > 0 && pos < r.length - 1) {
						r = r.substr(0, pos + 1);
					}
					try {
						v = JSON.parse(r);
					}
					catch (err) {
						winDebug = CSA.OpenDebugWindow();
						if (winDebug == null) {
							alert('Debug information cannot be displayed. Your web browser has disabled pop-up window');
						}
						else {
							winDebug.document.write('<h1>Exception Information from ');
							winDebug.document.write(window.location.pathname);
							winDebug.document.write('</h1>');
							winDebug.document.write('Client page:');
							winDebug.document.write(window.location.href);
							winDebug.document.write('<br>');
							winDebug.document.write('Server page:');
							if (state && state.serverPage) {
								winDebug.document.write(state.serverPage);
							}
							winDebug.document.write('<br>');
							if (pos < 0) {
								winDebug.document.write('<h2>Client request</h2><p>');
								if (state && state.Data) {
									winDebug.document.write(JSON.stringify(state.Data));
								}
								else {
									var formCust = _getFormClientHolder(CSA.SubmittedForm);
									if (formCust && formCust.value) {
										pos = formCust.value.indexOf(DEBUG_SYMBOL);
										var data;
										if (pos >= 0) {
											data = formCust.value.substring(pos + DEBUG_SYMBOL.length);
										}
										else {
											data = formCust.value;
										}
										winDebug.document.write(data);
									}
								}
								winDebug.document.write('</p>');
								winDebug.document.write('<h2>Server response</h2><p>');
								winDebug.document.write(r);
								winDebug.document.write('</p>');
							}
							winDebug.document.write('<h2>Json exception</h2><p>');
							winDebug.document.write('<table>');
							for (var p in err) {
								winDebug.document.write('<tr><td>');
								winDebug.document.write(p);
								winDebug.document.write('</td><td>');
								winDebug.document.write(err[p]);
								winDebug.document.write('</td></tr>');
							}
							winDebug.document.write('</table>');
							winDebug.document.write('</p>');
							winDebug.document.write('Server response:<br><textarea readonly  rows="30" style="width:90%; ">');
							winDebug.document.write(raw0);
							winDebug.document.write('</textarea><br>Json data:<br><textarea readonly  rows="30" style="width:90%; ">');
							winDebug.document.write(r);
							winDebug.document.write('</textarea>');
						}
					}
					if (v) {
						_imitateScope(v.values);
						var serverFailure = CSA.values.serverFailure;
						if (typeof CSA.values.serverFailure != 'undefined') {
							delete CSA.values.serverFailure;
						}
						if (CSA.SubmittedForm) {
							if (CSA.values.SavedFiles) {
								CSA.SubmittedForm.SavedFilePaths = CSA.values.SavedFiles;
							}
						}
						if (typeof v.Calls != 'undefined' && v.Calls.length > 0) {
							var cf = function () {
								for (var i = 0; i < v.Calls.length; i++) {
									eval(v.Calls[i]);
								}
							}
							cf.call(v);
						}
						//user closes web page before server responds
						if (typeof CSA == 'undefined') return;
					}
				}
			}
			if (!CSA.AbortEvent && state && state.Data && state.Data.values && state.Data.values.nextBlock) {
				state.Data.values.nextBlock();
			}
			if (!CSA.AbortEvent && callback) {
				callback();
			}
		}
		state.Data = data;
		CSA.pageMoveout = false;
		if (data.values) {
			for (var nm in data.values) {
				if (data.values[nm] && typeof (data.values[nm].toTimeString) == 'function') {
					data.values[nm] = data.values[nm].toTimeString();
				}
			}
		}
		if (form) {
			if (form.submit) {
				var sizeInput = _getFormMaxSizeHolder(form);
				if (sizeInput) {
					var msize = sizeInput.getAttribute('value');
					if (typeof msize != 'undefined' && msize != null && msize > 0) {
						if (!data.values)
							data.values = {};
						data.values.allowedFileSize = msize;
					}
				}
				if (typeof CSA.Debug != 'undefined' && CSA.Debug) {
					_getFormClientHolder(form).value = DEBUG_SYMBOL + JSON.stringify(data);
				}
				else {
					_getFormClientHolder(form).value = JSON.stringify(data);
				}
				CSA.SubmittedForm = form;
				state.serverPage = form.action;
				CSA.SubmittedForm.state = state;
				form.submit();
				return;
			}
		}
		state.serverPage = CSA.ServerFile;
		if (CSA.ServerFile == 'node') {
			function checkSocketIo() {
				if (typeof (io) == 'undefined') {
					loadjsfile('https://cdn.socket.io/socket.io-1.2.0.js');
					setTimeout(checkSocketIo, 100);
				}
				if (!CSA.socket) {
					CSA.socket = io();
					CSA.socket.on('csa', function (msg) {
						_processServerResponse(msg, state);
					});
				}
				if (CSA.Debug) {
					CSA.socket.emit('csa', DEBUG_SYMBOL + JSON.stringify(data));
				}
				else {
					CSA.socket.emit('csa', JSON.stringify(data));
				}
			}
			checkSocketIo();
		}
		else {
			var xmlhttp;
			var ajaxWatcher;
			if (window.XMLHttpRequest) {
				// code for IE7+, Firefox, Chrome, Opera, Safari
				xmlhttp = new XMLHttpRequest();
			}
			else {
				// code for IE6, IE5
				xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
			}
			var ajaxCanceled = false;
			xmlhttp.onreadystatechange = function () {
				if (filelist) {
					if (filelist.onreadystatechange) {
						filelist.onreadystatechange(xmlhttp);
					}
				}
				if (xmlhttp.readyState == 4) {
					if (typeof (ajaxWatcher) != 'undefined') {
						clearTimeout(ajaxWatcher);
					}
					if (xmlhttp.status == 200 || xmlhttp.status == 500) {
						_processServerResponse(xmlhttp.responseText, state);
						if (CSA.startsWith(xmlhttp.responseText, 'PHP ')) {
							var s = xmlhttp.responseText.substr(4).trim();
							var idx = s.indexOf(':');
							if (idx > 0) {
								s = s.substr(idx + 1).trim();
								if (CSA.startsWith(s, 'Maximum execution time of')) {
									onajaxtimeout();
								}
								else {
									if (document.onPhpFatalError) {
										CSA.values.ServerError = xmlhttp.responseText;
										document.onPhpFatalError();
									}
								}
							}
						}
					}
					else {
						if (!CSA.pageMoveout) {
							if (xmlhttp.status != 0 || CSA.Debug) {
								if (!ajaxCanceled) {
									_processServerResponse((xmlhttp.status == 0 ? 'This web page must be served by a web server, not from a local file system. ' : '') + 'server call failed with status ' + xmlhttp.status + '. ' + xmlhttp.responseText, state, true);
									onajaxtimeout();
								}
							}
						}
					}
				}
			}
			var url = CSA.ServerFile + '?timeStamp=' + new Date().getTime();
			if (CSA.Debug) {
				CSA.ShowDebugInfoLine('send to :' + url);
			}
			xmlhttp.open('POST', url, true);
			if (execAttrs && execAttrs.headers) {
				for (var i = 0; i < execAttrs.headers.length; i++) {
					xmlhttp.setRequestHeader(execAttrs.headers[i].name, execAttrs.headers[i].value);
				}
			}
			if (CSA.AjaxTimeout > 0) {
				function onajaxtimeout() {
					ajaxCanceled = true;
					xmlhttp.abort();
					if (document.onAjaxTimeout) {
						document.onAjaxTimeout();
					}
				}
				ajaxWatcher = setTimeout(onajaxtimeout, CSA.AjaxTimeout * 1000);
			}
			var raw;
			if (CSA.Debug) {
				raw = DEBUG_SYMBOL + JSON.stringify(data);
			}
			else {
				raw = JSON.stringify(data);
			}
			if (filelist && filelist.length > 0) {
				var formData = new FormData();
				xmlhttp.setRequestHeader('Content-Type', 'multipart/form-data');
				if (filelist && filelist.length > 0) {
					if (filelist.onprogress) {
						xmlhttp.upload.onprogress = function (e) {
							filelist.onprogress(e);
						}
					}
					for (var i = 0; i < filelist.length; i++) {
						formData.append(filelist[i].name + '_9303UPLOADFILES', filelist[i]);
					}
				}
				formData.append('clientRequest', raw);
				xmlhttp.send(formData);
			}
			else {
				xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xmlhttp.send(raw);
			}
		}
	}
};