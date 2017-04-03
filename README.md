# Client-Server-Automation
## What is Client Server Automation?

Client Server Automation (CSA) makes web application development the same as desktop application development. This repository includes CSA for JavaScript, including source code and documentation for CSA, including a preprocessor, run time files, and sample code. It also includes test utility and test cases, and debugging utility.
This project adds CSA to JavaScript and thus creates a new programming paradigm with following distinctive features.
1.	It completely removes client/server related programming tasks from JavaScript programming. All server side functionalities are used in programming as if they were client side functionalities. Web programming is done in a same way as doing local programming.
2.	It provides a freedom of choosing runtime server side handling technology without affecting web programming. For example, the user may switch between PHP, ASP.NET, Node.js, etc., without affecting web programming.
For example, the following JavaScript code uses values and files entered via a web page to send an email, display results on the web page and record the process in a database. You can see that there is not a distinguishing of client operations and server operations.
```javascript
var barHolder = document.getElementById('divBarHolder');
	var bar = document.getElementById('bar');
	document.getElementById('file1').files.onreadystatechange = function (request) {
		if (request.readyState == 4 && request.status == 200) {
			//show full progress bar
			bar.style.width = barHolder.style.width;
			document.getElementById('lblstt').innerHTML = 'file(s) uploaded. ';
		}
	};
	document.getElementById('file1').files.onprogress = function (e) {
		//show file upload progress
		bar.style.width = (barHolder.offsetWidth * (e.loaded / e.total)) + 'px';
	}
	var subject = document.getElementById('inputSubject').value;
	var mailbody = document.getElementById('textareaBody').value;
	var recipients = document.getElementById('inputRecipients').value;
	document.getElementById('file1').files.Upload('uploads/');//upload files to be attached to the email
	//create a server object which is defined in database.js
	var Db1 = new Database('database1');
	//execute a few server functions
	Db1.setCommand('Insert into EmailRecord (Subject, Body, Recipients, RequestTime, AttachFiles) Values (@Subject, @Body, @Recipients, @RequestTime, @AttachFiles)');
	Db1.addParameter('@Subject', 0, 200, subject);
	Db1.addParameter('@Body', 16, 2000, mailbody);
	Db1.addParameter('@Recipients', 16, 2000, recipients);
	Db1.addParameter('@RequestTime', 6, 8, Date());
	var filepaths = '';
	if (document.getElementById('file1').files.length > 0) {
		filepaths = document.getElementById('file1').files[0].filepath;
		for (var i = 1; i < document.getElementById('file1').files.length; i++) {
			filepaths += ';';
			filepaths += document.getElementById('file1').files[i].filepath;
		}
	}
	Db1.addParameter('@AttachFiles', 16, filepaths.length, filepaths);
	var dberr = Db1.execute();
	//code branching using a server expression and involving client and server execution paths
	if (dberr.length == 0) {
		//create a server object which is defined in mailtool.js
		var Email1 = new SendMail('webMail1');
		//execute a server function
		Email1.send(subject, mailbody, recipients, "myname@myhost.com", document.getElementById('file1').files);
		//create a server object which is defined in database.js
		var Db2 = new Database('database1');
		//execute a few server functions
		Db2.setCommand('update EmailRecord set ErrorMessage=@message where EmailRecID=@mailId');
		Db2.addParameter('@message', 16, 2000, Email1.ErrorMessage());
		Db2.addParameter('@mailId', 11, 8, Db1.LastAutoNumber());
		dberr = Db2.execute();
		if (dberr.length > 0) {
			dberr = 'Database error:' + dberr;
		}
		if (Email1.ErrorMessage().length > 0) {
			dberr = 'Mail error:' + Email1.ErrorMessage() + '. ' + dberr;
		}
		//excute a client operation
		document.getElementById('labelMessage').innerHTML = dberr;
		//code branching using a server function call
		if (Db1.LastAutoNumber() > 0) {
			//create a server object which is defined in database.js
			var Db3 = new Database('database1');
			//execute a few server functions
			Db3.setCommand('update EmailRecord set FinishTime=@time where EmailRecID=@mailId');
			Db3.addParameter('@time', 6, 8, Date());
			Db3.addParameter('@mailId', 11, 8, Db1.LastAutoNumber());
			var dberr2 = Db3.execute();
			//code branching on a server expression, involving client execution path
			if (dberr2.length > 0) {
				//a client operation involving server value
								document.getElementById('labelMessage').innerHTML = ' Database error setting finish time:' + dberr2;
			}
		}
	}
	else {
		//a client operation involving server value
		document.getElementById('labelMessage').innerHTML = 'Database error:' + dberr;
	}  

```
The above JavaScript code uses server side objects and functionalities in the same way as client side objects and functionalities are used. They are also included in a web page in the same way as client side libraries are included, as shown below:
```html
		<script src = "serverjs/database.js"></script>
		<script src ="serverjs/mailtool.js"></script>
		<script src = "clientjs/FileAPIclient.js"></script>
```
## How Client Server Automation Works?
This project implements CSA via two parts of work: 1. a CSA preprocessor to refactor web programming made by human developers; 2. runtime support files to handle client server related functionalities weaved into web programming by the CSA preprocessor.
![alt text](https://github.com/Limnor/Client-Server-Automation/master/CSA.png "Use CSA")
