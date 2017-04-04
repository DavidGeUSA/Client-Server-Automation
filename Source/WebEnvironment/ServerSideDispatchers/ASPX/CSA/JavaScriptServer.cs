/*
	Client Server Automation Server Side Dispatcher for Aspx
	Author: David Ge
	Date: 2015-02-10
	Description: it is a server side dispatcher for client server automation. csa.js connects to this file via Ajax/csa.aspx
*/

using Microsoft.ClearScript.Windows;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using System.Web;
using System.Web.UI;

namespace JScriptInterface
{
	/// <summary>
	/// this class represent an aspx web page. actually it is only used for csa.aspx
	/// </summary>
	public class JavaScriptServer:Page
	{
		#region fields and constructors
		/// <summary>
		/// debug mode identifier
		/// </summary>
		public const string DEBUG_SYMBOL = "F3E767376E6546a8A15D97951C849CE5";

		/// <summary>
		/// JavaScript engine for executing server side JavaScript code
		/// </summary>
		private JScriptEngine _js;

		/// <summary>
		/// client request made by the client side dispatcher
		/// </summary>
		private WebClientRequestEx clientRequest;

		/// <summary>
		/// server response to be sent to the client side dispatcher
		/// </summary>
		private WebServerResponse serverResponse;

		/// <summary>
		/// physical folder for DLL files implementing server functionality libraries
		/// </summary>
		private static string _currentDllFolder;

		/// <summary>
		/// physical folder for web URL for csa.aspx
		/// </summary>
		private static string _webFolder;

		/// <summary>
		/// event handler for resolving types
		/// </summary>
		private ResolveEventHandler reh;

		/// <summary>
		/// create a JavaScript engine in the constructor
		/// </summary>
		public JavaScriptServer()
		{
			this.AsyncMode = false;
			_js = new JScriptEngine("jsServer");
		}
		#endregion
		#region Properties
		/// <summary>
		/// gets and sets a Boolean indicating wether the web page is in debug mode
		/// </summary>
		public bool DEBUG { get; set; }
		#endregion
		#region interface to be used by hosted objects
		public void AddHostType(string name, Type t)
		{
			_js.AddHostType(name, t);
		}
		public void AddHostObject(string name, object v)
		{
			_js.AddHostObject(name, v);
		}
		#endregion
		#region JavaScript Interface to be used by JavaScript code
		/// <summary>
		/// client server automation preprocessor uses this function to arrange download values
		/// </summary>
		/// <param name="name">object name</param>
		/// <param name="value">object value</param>
		public void AddDownloadValue(string name, object value)
		{
			if (serverResponse != null)
			{
				if (serverResponse.values == null)
				{
					serverResponse.values = new JsonDataStringDictionary(null);
				}
				if (serverResponse.values.ContainsKey(name))
				{
					serverResponse.values[name] = value;
				}
				else
				{
					serverResponse.values.Add(name, value);
				}
			}
		}
		public void DisableCallback(bool disable)
		{
			if (serverResponse != null)
			{
				serverResponse.disableCallback = disable;
			}
		}
		#endregion
		#region private methods
		/// <summary>
		/// setup event handler for resolving types
		/// </summary>
		/// <param name="folder">if it is not null then it is the DLL folder for resolving types</param>
		private void SetupExternalDllResolve(string folder)
		{
			if (!string.IsNullOrEmpty(folder))
			{
				_currentDllFolder = folder;
			}
			if (reh == null)
			{
				reh = new ResolveEventHandler(CurrentDomain_AssemblyResolve);
				AppDomain.CurrentDomain.AssemblyResolve += reh;
			}
		}
		/// <summary>
		/// event handler for resolving types. it tries to load the DLL file containing the type to be resolved
		/// </summary>
		/// <param name="sender">not used</param>
		/// <param name="args">type name to be resolved</param>
		/// <returns>Assembly containing the type</returns>
		private Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs args)
		{
			Response.Write("CurrentDomain_AssemblyResolve<br>");
			if (!string.IsNullOrEmpty(dllFolder) && !string.IsNullOrEmpty(args.Name))
			{
				int pos = args.Name.IndexOf(",", StringComparison.Ordinal);
				string s;
				if (pos >= 0)
				{
					s = args.Name.Substring(0, pos);
				}
				else
				{
					s = args.Name;
				}
				if (!string.IsNullOrEmpty(s))
				{
					s = Path.Combine(_currentDllFolder, string.Format(CultureInfo.InvariantCulture, "{0}.dll", s));
					if (File.Exists(s))
					{
						return Assembly.LoadFrom(s);
					}
				}
			}
			return null;
		}
		/// <summary>
		/// get a type via its name
		/// </summary>
		/// <param name="typename">name of the type</param>
		/// <returns>type resolved from the name</returns>
		private Type getType(string typename)
		{
			if (!string.IsNullOrEmpty(typename))
			{
				Type t = Type.GetType(typename);
				if (t == null)
				{
					int n = typename.IndexOf('.');
					if (n > 0)
					{
						string dllName = typename.Substring(0, n);
						string name = typename.Substring(n + 1);
						string dllFile = Path.Combine(dllFolder, string.Format(CultureInfo.InvariantCulture, "{0}.dll", dllName));
						if (File.Exists(dllFile))
						{
							Assembly a = Assembly.LoadFrom(dllFile);
							if (a == null)
							{
								Response.Write(string.Format(CultureInfo.InvariantCulture, "Cannot load assembly:{0}<br>", dllFile));
							}
							else
							{
								Type[] tps = a.GetExportedTypes();
								if (tps != null && tps.Length > 0)
								{
									for (int i = 0; i < tps.Length; i++)
									{
										if (string.CompareOrdinal(name, tps[i].Name) == 0)
										{
											t = tps[i];
											break;
										}
									}
								}
								if (t == null)
								{
									Response.Write(string.Format(CultureInfo.InvariantCulture, "Type [{0}] not found in assembly:{1}<br>", name, dllFile));
								}
							}
						}
						else
						{
							Response.Write(string.Format(CultureInfo.InvariantCulture, "File not found:{0}<br>", dllFile));
						}
					}
				}
				return t;
			}
			return null;
		}
		#endregion
		#region private properties
		/// <summary>
		/// gets a physical folder where DLL files for server libraries are located
		/// </summary>
		private string dllFolder
		{
			get
			{
				if (string.IsNullOrEmpty(_currentDllFolder))
				{
					_currentDllFolder = Path.GetDirectoryName(Assembly.GetExecutingAssembly().CodeBase);
					if (_currentDllFolder.StartsWith("file:\\"))
					{
						_currentDllFolder = _currentDllFolder.Substring(6);
					}
				}
				return _currentDllFolder;
			}
		}
		/// <summary>
		/// gets a physical folder where the server side JavaScript files is in a "serverjs" folder under this folder
		/// </summary>
		private string webFolder
		{
			get
			{
				if (string.IsNullOrEmpty(_webFolder))
				{
					_webFolder = dllFolder;
					if (_webFolder.EndsWith(@"\bin", StringComparison.OrdinalIgnoreCase) || _webFolder.EndsWith(@"/bin", StringComparison.OrdinalIgnoreCase))
					{
						_webFolder = _webFolder.Substring(0, _webFolder.Length - 4);
					}
				}
				return _webFolder;
			}
		}
		/// <summary>
		/// gets a physical folder where server side JavaScript files are located
		/// </summary>
		private string jsFolder
		{
			get
			{
				return Path.Combine(webFolder, "serverjs");
			}
		}
		#endregion
		#region Methods
		/// <summary>
		/// show an exception on the web page
		/// </summary>
		/// <param name="e">exception to be displayed</param>
		public void OutputException(Exception e)
		{
			if (e != null)
			{
				Response.Write("Exception type:");
				Response.Write(e.GetType().AssemblyQualifiedName);
				Response.Write("<br>");
				Response.Write("Exception message:");
				Response.Write(e.Message);
				Response.Write("<br>");
				Response.Write("Stack trace:");
				if (!string.IsNullOrEmpty(e.StackTrace))
				{
					Response.Write(e.StackTrace);
				}
				Response.Write("<br>");
				Response.Write("Source:");
				if (!string.IsNullOrEmpty(e.Source))
				{
					Response.Write(e.Source);
				}
				Response.Write("<br>");
				if (e.InnerException != null)
				{
					Response.Write("Inner exception:<br>");
					OutputException(e.InnerException);
				}
			}
		}
		#endregion
		#region overrides
		/// <summary>
		/// csa.aspx executes this function to carry out functionality of a server side dispatcher 
		/// </summary>
		/// <param name="e">not used</param>
		protected override void OnLoad(EventArgs e)
		{
			Response.Clear();
			Response.ContentType = "text/plain";
			serverResponse = new WebServerResponse();//create server response
			//get raw data sent by the client side dispatcher
			string rawData = string.Empty;
			if (Request.Files != null && Request.Files.Count > 0)
			{
				rawData = Request.Form["clientRequest"];
				if (rawData == null)
				{
					Response.Write("clientRequest is null.");
					rawData = string.Empty;
				}
			}
			else
			{
				using (StreamReader sr = new StreamReader(Request.InputStream))
				{
					rawData = sr.ReadToEnd();
				}
			}
			if (rawData.StartsWith(DEBUG_SYMBOL, StringComparison.Ordinal))
			{
				DEBUG = true;
				rawData = rawData.Substring(DEBUG_SYMBOL.Length);
			}
			if (DEBUG)
			{
				Response.Write("client request:");
				Response.Write(rawData);
				Response.Write("<br />");
				if (Request.Files != null && Request.Files.Count > 0)
				{
					Response.Write("File uploaded:");
					Response.Write(Request.Files.Count);
					Response.Write("\r\n");
					for (int i = 0; i < Request.Files.Count; i++)
					{
						Response.Write(" File ");
						Response.Write(i);
						Response.Write(" File name:");
						Response.Write(Request.Files[i].FileName);
						Response.Write(" File size:");
						Response.Write(Request.Files[i].ContentLength);
						Response.Write("\r\n");
					}
				}
			}
			try
			{
				//parse the raw data into a client requets object
				clientRequest = new WebClientRequestEx();
				clientRequest.FromJsonText(rawData);
				if (DEBUG)
				{
					Response.Write("Number of client commands:");
					Response.Write(clientRequest.GetNumberOfCalls());
					Response.Write("<br>");
				}
				//add server side dispatcher to the JavaScript engine so that functions such as AddDownloadValue can be used
				_js.AddHostType("JavaScriptServer", this.GetType());
				_js.AddHostObject("jsServer", this);
				//loading types to be used by JavaScript code, according to server library references information
				if (clientRequest.ServerTypes != null && clientRequest.ServerTypes.Length > 0)
				{
					SetupExternalDllResolve(null);//assume all DLL files are in the same location
					for (int i = 0; i < clientRequest.ServerTypes.Length; i++)
					{
						if (DEBUG)
						{
							Response.Write("Adding server type:");
							Response.Write(clientRequest.ServerTypes[i]);
							Response.Write("<br>");
						}
						//each item of ServerTypes is treated as a full name of a type
						Type t = getType(clientRequest.ServerTypes[i]);
						if (t == null)
						{
							Response.Write("Error resolving server type:");
							Response.Write(clientRequest.ServerTypes[i]);
							Response.Write("<br>");
						}
						else
						{
							//make the type available to the JavaScript engine. this is how DbExecuter in database.js is loaded 
							_js.AddHostType(t.Name, t);
						}
					}
				}
				//throw new Exception("App path=" + Request.PhysicalPath);
				//form server JavaScript code to be executed
				StringBuilder sevrercode = new StringBuilder();
				//add uploaded files to JavaScript scope
				HttpFileCollection hfc = Request.Files;
				sevrercode.Append("var rootFolder='");
				sevrercode.Append(Path.GetDirectoryName(Request.PhysicalPath).Replace("\\","/"));
				sevrercode.Append("/';");
				sevrercode.Append("var httpUploadedFiles = [];");
				if (hfc != null && hfc.Count > 0)
				{
					string tmpFolder = Path.GetTempPath();
					for (int i = 0; i < hfc.Count; i++)
					{
						HttpPostedFile f = hfc[i];
						string tmp = Path.Combine(tmpFolder, f.FileName);
						f.SaveAs(tmp);
						sevrercode.Append("var f = {};");
						sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "f.filename = '{0}';", f.FileName));
						sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "f.filesize = {0};", f.ContentLength));
						sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "f.filetype = '{0}';", f.ContentType));
						sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "f.filepath = '{0}';", tmp.Replace("\\","/")));
						sevrercode.Append("httpUploadedFiles.push(f);");
						if (DEBUG)
						{
							Response.Write("File saved to:");
							Response.Write(tmp);
							Response.Write("<br>");
						}
					}
				}
				if (DEBUG)
				{
					Response.Write("values:");
					Response.Write(clientRequest.ClientValues.JavaScript);
					Response.Write("<br>");
				}
				//make upload values available for the server code
				sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "var clientvalues = {0};", clientRequest.ClientValues.JavaScript));
				//for supporting server value enumerations
				if (clientRequest.UsedKeys != null)
				{
					sevrercode.Append("clientvalues.usedkeys=[];");
					for (int i = 0; i < clientRequest.UsedKeys.Length; i++)
					{
						if (!string.IsNullOrEmpty(clientRequest.UsedKeys[i]))
						{
							sevrercode.Append(string.Format(CultureInfo.InvariantCulture, "clientvalues.usedkeys.push('{0}');", clientRequest.UsedKeys[i].Replace("'", "\\'")));
						}
					}
				}
				//load server side js files
				if (clientRequest.ServerFiles != null && clientRequest.ServerFiles.Length > 0)
				{
					if (DEBUG)
					{
						Response.Write("Server file count:");
						Response.Write(clientRequest.ServerFiles.Length);
						Response.Write("<br>");
					}
					string JsDir = jsFolder;
					for (int i = 0; i < clientRequest.ServerFiles.Length; i++)
					{
						string jsfile = Path.Combine(JsDir, clientRequest.ServerFiles[i]);
						if (DEBUG)
						{
							Response.Write("Reading server javascript file:");
							Response.Write(jsfile);
							Response.Write("<br>");
						}
						if (File.Exists(jsfile))
						{
							sevrercode.Append(File.ReadAllText(jsfile));
						}
						else
						{
							Response.Write("Server side JavaScript file does not exist:");
							Response.Write(jsfile);
							Response.Write("<br>");
						}
					}
				}
				//this feature is not used currently
				if (!string.IsNullOrEmpty(clientRequest.Code))
				{
					sevrercode.Append(clientRequest.Code);
				}
				//execute server side JavaScript code
				string sj = sevrercode.ToString();
				if (DEBUG)
				{
					Response.Write("Server side JavaScript:");
					Response.Write(sj);
					Response.Write("<br>");
				}
				_js.Execute(sj);
				if (DEBUG)
				{
					Response.Write(DEBUG_SYMBOL);
				}
				//send server response
				Response.Write(serverResponse.ToJsonText());
			}
			catch (Exception err0)
			{
				OutputException(err0);
				Response.Write(DEBUG_SYMBOL);
				if (serverResponse != null)
				{
					Response.Write(serverResponse.ToJsonText());
				}
			}
		}
		#endregion
	}
	public interface IRequestHandler
	{
		void SetRequest(HttpRequest request);
	}
}
