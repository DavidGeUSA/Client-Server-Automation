/*
	Client Server Automation Preprocessor

	Author: David Wei Ge
	Date  : 2015-04-08
*/
using System;
using System.Windows.Forms;

namespace csapreproc
{
	static class Program
	{
		/// <summary>
		/// The main entry point for the application.
		/// command line parameters:
		///   /h"full path of html file"
		///   /o"output folder"
		///   /u"URL of preprocessor web UI"
		///   /j"folder for JavaScript files contained in the HTML file"
		///   
		/// if /j is not used then the folder for the html file is used.
		/// Use /s for silent mode, the application will close on finishing and will not show message boxes
		/// 
		/// example:
		///   csapreprocs /h"c:\projects\loop\loop.html" /o"c:\projects\distributes\loop" /u"http://localhost/CSAPreproc/csapreproc.html" /j"c:\projects\JavaScripts"
		///   following files will be generated in folder "c:\projects\distributes\loop": loop_p.html, loop_client.js, loop_server1.js, loop_server2.js,..., loop_servern.js
		///   where n is the number of server connections needed by JavaScript code contained in loop.html as determined by the client server automation preprocessor
		/// </summary>
		[STAThread]
		static void Main(string[] args)
		{
			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(false);
			Application.Run(new FormCsaPreproc());
		}
	}
}
