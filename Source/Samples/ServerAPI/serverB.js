//server-technology-independent API - do not remove this line
//
//it provides a function named simulatedObject
//
var simulatedObject = simulatedObject || {
	name1: 'AAA',
	name2: 'BBB',
	name3: 88,
	fun1: function (var1) {
		var d = new Date();
		return 'var1="' + var1 + '", at server time:' + d.getFullYear() + '-' + d.getMonth() + '-' + d.getDay() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds();
	}
};
simulatedObject.GetRunAt = function () {
	return {
		RunAt: true,//run-at flag to indicate a server object
		ServerTypes: []//server implement information is empty, it does not depend on other server technologies
	};
};

