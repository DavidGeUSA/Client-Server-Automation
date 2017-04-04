//server-technology-independent API - do not remove this line
/*
	Server part of FILE API as a sample Server Technology Independent API
	Bob Limnor (bob@limnor.com)
	Set. 17 2016

	Server Technology support:
	1. create a STI_ServerFileAPI class
	2. implement STI_ServerFileAPI.SaveTo(TmpPath, targetFolder, filename)
*/

FileDescription.prototype.RunAt = true;//run-at flag to indicate a server object
FileDescription.prototype.ServerTypes = ['FileAPI.STI_ServerFileAPI'];//server implement information
//it is a server side data replication of a client side File object
function FileDescription() {
	return {
		lastModifiedDate:'',
		name: '',
		size: 0,
		type: '',
		filepath: '',
		URL:''
	}
}
var _FILES_ = []; //a global variable holding uploaded files which is an array of FileDescription
//////////////////////////////////////////////////////////////////////////////
//it returns _FILES_
//CSA preprocessor should translate a FileList.Upload call to this call
/////////////////////////////////////////////////////////////////////////////
function GetUploadedFiles(serverFolder) {
	var fileapi = new STI_ServerFileAPI(); //STI_ServerFileAPI should be implemented by a server technology
	_FILES_ = [];
	if (typeof (httpUploadedFiles) != 'undefined') {
		//if a server technology can add uploaded file list to JavaScript scope then the list should be named as httpUploadedFiles
		for (var i = 0; i < httpUploadedFiles.length; i++) {
			var f = new FileDescription();
			f.name = httpUploadedFiles[i].filename;
			f.size = httpUploadedFiles[i].filesize;
			f.type = httpUploadedFiles[i].filetype;
			f.filepath = httpUploadedFiles[i].filepath;
			_FILES_.push(f);
		}
	}
	else {
		var files = fileapi.GetUploadedFiles();
		if (files && files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				var f = new FileDescription();
				f.lastModifiedDate = files[i].lastModifiedDate;
				f.name = files[i].name;
				f.size = files[i].size;
				f.type = files[i].type;
				f.filepath = files[i].filepath;
				_FILES_.push(f);
			}
		}
	}
	var target = serverFolder;
	if (typeof (rootFolder) != 'undefined') {
		target = rootFolder + serverFolder;
	}
	for (var i = 0; i < _FILES_.length; i++) {
		_FILES_[i].URL = serverFolder + _FILES_[i].Filename;
		var f = fileapi.SaveTo(_FILES_[i].filepath, target, _FILES_[i].name);
		if (f && f.length > 0) {
			_FILES_[i].filepath = f;
		}
	}
	return _FILES_;
}
function retrieveFileList() {
	if (clientvalues && clientvalues._FILES_) {
		_FILES_ = clientvalues._FILES_;
	}
}
