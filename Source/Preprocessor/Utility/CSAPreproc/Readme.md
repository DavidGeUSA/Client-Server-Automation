# Client Server Automation Preprocessor Utility

## What is this utility?

For motivation and explanation of Client Server Automation, see https://www.researchgate.net/publication/304461598_Client_Server_Automation_for_JavaScript

This utility processes an HTML file by processing JavaScript code used in the HTML file, analyzing the JavaScript code to detect client/server related tasks and refactoring the JavaScript code to fulfil client server tasks.
For example, by processing an HTML file named page1.html, following files could be generated:
page1_client.js – client side JavaScript code generated
page1_server<n>.js – server side JavaScript code generated for each asynchronous server connection arranged by Client Server Automation, <n> can be 1, 2, … , number of server connections
page1_p.html – a new HTML file generated from page1.html by adjusting inclusions of JavaScript code using generated client side file page1_client.js, and adding a client side dispatcher for doing asynchronous client server connections and executing server side functionality.

## How this utility is coded?

The parsing and modifying of HTML files is based on HTML Agility Pack (http://htmlagilitypack.codeplex.com/).
The parsing and generating of JavaScript code is based on Esprima (https://github.com/ariya/esprima).
The Client Server Automation Preprocessing is coded in JavaScript file csapreproc.js.
A web page csapreproc.html provides a web UI for the Client Server Automation Preprocessing. This web UI must be installed on "http://localhost/{a web name of your choice}" using following files and folder structure.
{parent web folder}
	esprima.js
	escodegen.browser.js
	<DIR> assets
		style.css
		<DIR> orion
			built-editor.css
			built-editor.min.js
			customeditor.js
		<DIR>  foundation
			foundation.min.css
	<DIR> {web UI folder}
		csapreproc.html
		csapreproc.js

This utility is a C# Windows Forms project; it uses a web browser control to load “http://localhost/{a web name of your choice}/csapreproc.html”, and invokes functionality provided by csapreproc.js to carry out client server automation preprocessing.

## Usages

Command line parameters:
	/h"full path of html file"
	/o"output folder"
	/u"URL of preprocessor web UI"
	/j"folder for JavaScript files contained in the HTML file"
	/s

/j and /s are optional.
If /j is not used then the folder for the html file is used.
Use /s for silent mode, the application will close on finishing and will not show message boxes

Example:
	csapreprocs /h"c:\projects\loop\loop.html" /o"c:\projects\distributes\loop" /u"http://localhost/CSAPreproc/csapreproc.html" /j"c:\projects\JavaScripts"

Following files will be generated in folder "c:\projects\distributes\loop": loop_p.html, loop_client.js, loop_server1.js, loop_server2.js,..., loop_servern.js
where n is the number of server connections needed by JavaScript code contained in loop.html as determined by the client server automation preprocessor


Examples

Following example web applications show that Client Server Automation takes away client server related tasks from developers. In these examples, developers do not treat server side functionality differently than client side functionality.
1.	mailPage.html – it involves web mail and database operations. Developers use web mail and database as if they were client side functionality.
2.	Loop.html -- it involves using server functionality in a loop. 
3.	enumClient.html – it involves using server functionality when enumerating client side values.
4.	enumServer.html – it involves mixing client functionality and server functionality when enumerating server side values
5.	callAsync.html – it shows calling a function which uses server functionality.
