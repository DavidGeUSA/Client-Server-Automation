//server-technology-independent API - do not remove this line
//it is for providing file-writing function, it depends on a STI_FileWriter class which is supposed to be implemented using supported server technologies
//
FileWriter.prototype.RunAt = true;//run-at flag to indicate a server object
FileWriter.prototype.ServerTypes = ['File.STI_FileWriter'];//server implement information
function FileWriter(file) {
	return {
		append: function (contents) {
			var fObj = new STI_FileWriter();
			fObj.SetFile(file);
			fObj.append(contents);
		}
	}
}
