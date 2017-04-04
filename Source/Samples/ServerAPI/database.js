//server-technology-independent API - do not remove this line
//it is for providing database function, it depends on a DbExecuter which is supposed to be implemented using supported server technologies
//
Database.prototype.RunAt = true;//run-at flag to indicate a server object
Database.prototype.ServerTypes = ['Database.STI_DbExecuter'];//server implement information
function Database(connectionID) {
	//object code here
	var _cmd;
	var _err;
	var _paramDefs;
	var _lastAutoNum;
	return {
		setCommand: function (cmd) {
			_cmd = cmd;
		},
		clearParameters: function () {
			_paramDefs = null;
		},
		addParameter: function (pname, ptype, psize, pvalue) {
			if (!_paramDefs) {
				_paramDefs = [];
			}
			_paramDefs.push({ name: pname, type: ptype, size: psize, value: pvalue });
		},
		execute: function () {
			_err = '';
			var db = new STI_DbExecuter();
			db.SetConnect(connectionID);
			if (_paramDefs) {
				for (var i = 0; i < _paramDefs.length; i++) {
					db.AddParamValue(_paramDefs[i].name, _paramDefs[i].type, _paramDefs[i].size, _paramDefs[i].value);
				}
			}
			_err = db.Execute(_cmd);
			_lastAutoNum = db.LastAutoNumber();
			return _err;
		},
		LastAutoNumber: function () {
			return _lastAutoNum;
		},
		LastErrorMessage: function () {
			return _err;
		}
	}
}
