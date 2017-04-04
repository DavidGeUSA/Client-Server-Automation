//server-technology-independent API - do not remove this line
//it is for providing a function named serverTaskX
//It depends on a ServerTaskX which is supposed to be implemented using supported server technologies 
//
"server-technology-independent API"
serverTaskX.prototype.RunAt = true;//run-at flag to indicate a server object
serverTaskX.prototype.ServerTypes = ['ServerTasks.ServerTaskX'];//server implement information
function serverTaskX() {
	var _serverObject;
	return {
		serverFunc1: function (var1, idx2) {
			if (!_serverObject) {
				_serverObject = new ServerTaskX();
			}
			return _serverObject.Func1(var1, idx2);
		},
		serverFunc2: function (var1, idx2, idx3) {
			if (!_serverObject) {
				_serverObject = new ServerTaskX();
			}
			return _serverObject.Func2(var1, idx2, idx3);
		}
	}
}