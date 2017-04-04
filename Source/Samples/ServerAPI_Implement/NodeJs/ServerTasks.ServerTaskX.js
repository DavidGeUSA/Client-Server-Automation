//JavaScript implementation for supporting serverA.js which is sample of “server-technology-independent API”
//It can be used in Node.js running csaServer.js.
//
function ServerTaskX() {
	return {
		Func1: function (var1, idx2) {
			//C# code: return string.Format(CultureInfo.InvariantCulture, "Server call Func1(var1={0}, idx2={1})", var1, idx2);
			return "Server call Func1(var1=" + var1 + ", idx2=" + idx2 + ")";
		},
		Func2: function (var1, idx2, idx3) {
			//C# code: return string.Format(CultureInfo.InvariantCulture, "Calling Func2 with var1={0}, idx2={1} and idx3={2}",  var1, idx2, idx3);
			return "Calling Func2 with var1=" + var1 + ", idx2=" + idx2 + " and idx3=" + idx3;
		}
	}
}
