/*
	Client Server Automation Preprocessor

	Author: David Wei Ge
	Date  : 2015-04-08
*/
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using System.Windows.Forms;

namespace csapreproc
{
	public partial class FormCsaPreproc : Form
	{
		/// <summary>
		/// a form for showing a string in multi-line or word-wrapped.
		/// it is used to show log messages
		/// </summary>
		private FormInfo infoWindow = null;

		/// <summary>
		/// the html file to be processed. specified by /h command line parameter
		/// </summary>
		private string htmlFile = string.Empty;

		/// <summary>
		/// output folder for files to be generated. specified by /o command line parameter
		/// </summary>
		private string outputFolder = string.Empty;

		/// <summary>
		/// the URL for the web page for doing client server automation preprocessing.
		/// can be specified by a /u command line parameter
		/// </summary>
		private string csaPreprocUrl = "http://localhost/csaasp/csapre/csapreproc.html";

		/// <summary>
		/// physical folder for JavaScript files contained in the html file to be processed, if omitted then the folder for the html file is used.
		/// can be specified by a /j command line parameter
		/// </summary>
		private string javascriptFolder = string.Empty;

		/// <summary>
		/// a flag indicates whether message box should be displayed or not.
		/// this application will close on finishing the processing if silent is true.
		/// can be set to true by a /s command line parameter
		/// </summary>
		private bool silent = false;

		/// <summary>
		/// a COM-visible object for communicating between a web page loaded with csaPreprocUrl, and a web browser control webBrowser1
		/// </summary>
		private WebPageInterAction _interacter;

		/// <summary>
		/// HTML document object for analyzing and processing JavaScript code used in the HTML file represented by htmlFile
		/// </summary>
		private HtmlAgilityPack.HtmlDocument doc;

		/// <summary>
		/// JavaScript code used in the HTML file specified by htmlFile
		/// </summary>
		private HtmlAgilityPack.HtmlNodeCollection scripts;

		/// <summary>
		/// initialize controls and parse command line parameters
		/// </summary>
		public FormCsaPreproc()
		{
			InitializeComponent();
			_interacter = new WebPageInterAction(this);
			webBrowser1.AllowWebBrowserDrop = false;
			webBrowser1.IsWebBrowserContextMenuEnabled = false;
			webBrowser1.WebBrowserShortcutsEnabled = false;
			webBrowser1.ObjectForScripting = _interacter;
			parseCommandLine();
		}

		/// <summary>
		/// invoke a JavaScript function on the web page doing client server automation preprocessing
		/// </summary>
		/// <param name="cmd">name of the JavaScript function to be invoked</param>
		/// <param name="ps">parameters for the function</param>
		/// <returns>return value of the JavaScript function</returns>
		public object InvokeJs(string cmd, params object[] ps)
		{
			return webBrowser1.Document.InvokeScript(cmd, ps);
		}

		/// <summary>
		/// window.onload in csapreproc.js calls this function via WebPageInterAction
		/// </summary>
		public void OnWebPageStarted()
		{
			bool bOK = false;
			showMessage("CSA Preprocessor Web page loaded");
			object verobj = this.InvokeJs("getPreprocessorVersion");
			if (verobj == null)
			{
				showMessage("CSA Preprocessor JavaScript library version is null");
			}
			else
			{
				showMessage("CSA Preprocessor JavaScript library version: {0}", verobj);
			}
			string webname = Path.GetFileNameWithoutExtension(htmlFile);//HTML file to be processed
			//sb forms programming code to be preprocessed
			StringBuilder sb = new StringBuilder();
			List<HtmlAgilityPack.HtmlNode> processedScripts = new List<HtmlAgilityPack.HtmlNode>();
			foreach (HtmlAgilityPack.HtmlNode n in scripts)
			{
				string f = n.GetAttributeValue("src", string.Empty);
				if (!string.IsNullOrEmpty(f)) //it is a JavaScript file
				{
					showMessage("Script file:{0}", f);
					string fullpath = Path.Combine(javascriptFolder, f);
					if (File.Exists(fullpath))
					{
						StreamReader sr = new StreamReader(fullpath);
						string s = sr.ReadToEnd();
						sr.Close();
						showMessage("File contents length:{0}", s.Length);
						//use a simple flag to indicate that the file contents should be preprocessed
						//by default, a library file does not have this flag and thus it is not included in processing
						if (s.StartsWith("//Client Server Automation", StringComparison.Ordinal))
						{
							sb.Append(s);//add to code to be processed
							processedScripts.Add(n); //this node should be removed from the HTML file
						}
						else
						{
							//assume it is a JavaScript library file. load it before preprocessing custom code
							string ret = this.InvokeJs("loadProgrammingCode", s, true, Path.GetFileName(f)) as string;
							if (string.IsNullOrEmpty(ret))
							{
								showMessage("Library file loaded");
								string slib = this.InvokeJs("getLibObjMap") as string;
								showMessage("Server Side Library Object:{0}", slib);
							}
							else
							{
								showMessage("Error loading library file. Error message:{0}", ret);
							}
							//if it is a server side library file then remove it from the HTML file
							//pure client side library file should be kept in the HTML
							if (s.StartsWith("//server-technology-independent API", StringComparison.Ordinal))
							{
								processedScripts.Add(n); //this node should be removed from the HTML file
							}
						}
					}
					else
					{
						showMessage("File does not exist:{0}", fullpath);
					}
				}
				else
				{
					//it is not a JavaScript file. added to the code to be processed
					string s = n.InnerText;
					showMessage("Script length:{0}", s.Length);
					sb.Append(s);
					processedScripts.Add(n); //this node should be removed from the HTML file
				}
			}
			if (sb.Length > 0)
			{
				//load the code to be processed
				string ret = this.InvokeJs("loadProgrammingCode", sb.ToString(), false) as string;
				if (string.IsNullOrEmpty(ret))
				{
					showMessage("Programming code loaded");
					//carry out client server automation preprocessing
					ret = this.InvokeJs("processProgrammingCode", webname) as string;
					if (string.IsNullOrEmpty(ret))
					{
						//show how many server connections generated
						int n = (int)(this.InvokeJs("getServerCodeCount"));
						showMessage("Programming code processed. Server calls:{0}", n);
						//
						//generate client side JavaScript file
						string code = this.InvokeJs("getClientCode") as string;
						string f = Path.Combine(outputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_client.js", webname));
						StreamWriter sw = new StreamWriter(f, false);
						sw.Write(code);
						sw.Close();
						showMessage("Created client JS file {0}", f);
						//
						//generate server side JavaScript files
						for (int i = 0; i < n; i++)
						{
							code = this.InvokeJs("getServerCode", i) as string;
							f = Path.Combine(outputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_server{1}.js", webname, (i + 1)));
							sw = new StreamWriter(f, false);
							sw.Write(code);
							sw.Close();
							showMessage("Created server JS file {0}", f);
						}
						//
						//generate HTML file
						//1. remove processed JavaScript nodes
						foreach (HtmlAgilityPack.HtmlNode node in processedScripts)
						{
							HtmlAgilityPack.HtmlNode p = node.ParentNode;
							p.RemoveChild(node);
						}
						//2. add a "generator" meta data
						HtmlAgilityPack.HtmlNode head = doc.DocumentNode.SelectSingleNode("/html/head");
						HtmlAgilityPack.HtmlNode meta = doc.DocumentNode.SelectSingleNode("/html/head/meta[@name=\"generator\"]");
						if (meta == null)
						{
							meta = doc.CreateElement("meta");
							meta.SetAttributeValue("name", "generator");
							head.AppendChild(meta);
						}
						meta.SetAttributeValue("content", "client-server-automation preprocessor");
						//3. add client side dispatcher
						HtmlAgilityPack.HtmlNode script = doc.CreateElement("script");
						script.SetAttributeValue("src","clientjs/csa.js");
						head.AppendChild(script);
						//4. add client side JavaScript file generated
						script = doc.CreateElement("script");
						script.SetAttributeValue("src", string.Format(CultureInfo.InvariantCulture, "clientjs/{0}_client.js", webname));
						head.AppendChild(script);
						//5. save HTML to a new name
						f = Path.Combine(outputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_p.html", webname));
						doc.Save(f);
						showMessage("Created HTML file {0}", f);
						showMessage("Client server automation preprocessing completed successfully.");
						bOK = true;
					}
					else
					{
						showMessage("Error processing programming code. Error message:{0}", ret);
					}
				}
				else
				{
					showMessage("Error loading programming code. Error message:{0}", ret);
				}
			}
			else
			{
				showMessage("There is not JavaScript code to be preprocessed");
			}
			if (silent)
			{
				this.Close();
			}
			else
			{
				if (bOK)
				{
					MessageBox.Show(this, "Client server automation preprocessing completed successfully.", this.Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
				}
				else
				{
					MessageBox.Show(this, "Client server automation preprocessing failed.", this.Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
				}
			}
		}
		/// <summary>
		/// logging using a list box
		/// </summary>
		/// <param name="message">message to be logged</param>
		/// <param name="values">parameters of the message</param>
		private void showMessage(string message, params object[] values)
		{
			if (values != null && values.Length > 0)
			{
				listBox1.Items.Add(string.Format(CultureInfo.InvariantCulture, message, values));
			}
			else
			{
				listBox1.Items.Add(message);
			}
		}
		/// <summary>
		/// parse command line parameters into variables
		/// </summary>
		private void parseCommandLine()
		{
			string[] args = Environment.GetCommandLineArgs();
			if (args != null && args.Length > 0)
			{
				for (int i = 0; i < args.Length; i++)
				{
					if (!string.IsNullOrEmpty(args[i]))
					{
						string s = args[i].Trim();
						if (s.Length > 1)
						{
							string flag = s.Substring(0, 2).ToLowerInvariant();
							s = s.Substring(2);
							if (string.IsNullOrEmpty(s))
							{
								if (i < args.Length - 1)
								{
									if (!string.IsNullOrEmpty(args[i + 1]))
									{
										if (args[i + 1][0] != '/')
										{
											s = args[i + 1].Trim();
											i++;
										}
									}
								}
							}
							if (flag[0] == '/')
							{
								switch (flag[1])
								{
									case 'h':
										htmlFile = s;
										break;
									case 'o':
										outputFolder = s;
										break;
									case 'u':
										csaPreprocUrl = s;
										break;
									case 'j':
										javascriptFolder = s;
										break;
									case 's':
										silent = true;
										break;
								}
							}
						}
					}
				}
			}
		}
		/// <summary>
		/// validate command line arguments and log errors
		/// </summary>
		/// <returns>true:parameters are valid; false:some parameters are invalid</returns>
		private bool validateCommandLine()
		{
			bool bRet = true;
			if (string.IsNullOrEmpty(htmlFile))
			{
				showMessage("Missing HTML file to be processed. Use /h\"full path to html file\" to specify it.");
				bRet = false;
			}
			else if (!File.Exists(htmlFile))
			{
				showMessage("HTML file '{0}' does not exist.",htmlFile);
				bRet = false;
			}
			if (string.IsNullOrEmpty(outputFolder))
			{
				showMessage("Missing output folder. Use /o\"output folder\" to specify it.");
				bRet = false;
			}
			else if (!Directory.Exists(outputFolder))
			{
				showMessage("Output folder '{0}' does not exist.", outputFolder);
				bRet = false;
			}
			if (!Directory.Exists(javascriptFolder))
			{
				showMessage("Folder for JavaScript files does not exist:{0}", javascriptFolder);
				bRet = false;
			}
			return bRet;
		}
		/// <summary>
		/// once the form is loaded, command line parameters are validated and then the client server automation preprocessor is loaded into the web browser control.
		/// once the preprocessor is loaded into the web browser control, window.onload event will start the client server automation preprocessing.
		/// </summary>
		/// <param name="e">not used</param>
		protected override void OnLoad(EventArgs e)
		{
			base.OnLoad(e);
			if (validateCommandLine())
			{
				showMessage("Client Server Automation preprocessor Windows utility, version: {0}", Assembly.GetExecutingAssembly().GetName().Version);
				showMessage("Processing HTML file: [{0}]", htmlFile);
				showMessage("Output folder: [{0}]", outputFolder);
				showMessage("CSA Preprocessing web UI URL: [{0}]", csaPreprocUrl);
				showMessage("JavaScript file folder for the HTML file: [{0}]", javascriptFolder);
				try
				{
					//remove existing files
					string fn = Path.GetFileNameWithoutExtension(htmlFile);
					string dest = Path.Combine(outputFolder, Path.GetFileName(htmlFile));
					if (string.Compare(dest, htmlFile, StringComparison.OrdinalIgnoreCase) == 0)
					{
						throw new Exception(string.Format(CultureInfo.InvariantCulture, "Output folder [{0}] cannot be the same folder of the source HTML file [{1}]", outputFolder, htmlFile));
					}
					if (File.Exists(dest))
					{
						File.Delete(dest);
					}
					dest = Path.Combine(outputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_p.html", fn));
					if (File.Exists(dest))
					{
						File.Delete(dest);
					}
					string[] ss = Directory.GetFiles(outputFolder,string.Format(CultureInfo.InvariantCulture,"{0}_client.js",fn));
					for (int i = 0; i < ss.Length; i++)
					{
						File.Delete(ss[i]);
					}
					ss = Directory.GetFiles(outputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_server*.js", fn));
					for (int i = 0; i < ss.Length; i++)
					{
						File.Delete(ss[i]);
					}
					//load HTML file to be processed
					doc = new HtmlAgilityPack.HtmlDocument();
					doc.Load(htmlFile);
					//find JavaScript code
					scripts = doc.DocumentNode.SelectNodes("/html/head/script");
					if (scripts == null)
					{
						showMessage("No scripts found in the HTML file");
					}
					else
					{
						showMessage("Script nodes:{0}", scripts.Count);
						//load client server automation preprocessor web page, once it is loaded, processing starts when window.onload event occurs
						webBrowser1.Url = new Uri(string.Format(CultureInfo.InvariantCulture,"{0}?timestap={1}", csaPreprocUrl,Guid.NewGuid().GetHashCode().ToString("x",CultureInfo.InvariantCulture)));
						return;
					}
				}
				catch (Exception err)
				{
					showMessage("Error processing HTML. {0}", err.Message);
					showMessage("Stack trace: {0}", err.StackTrace);
				}
			}
			else
			{
				if (!silent)
				{
					MessageBox.Show(this, "command line parameters:\r\n/h\"full path of html file\" /o\"output folder\" /u\"URL of preprocessor web UI\" /j\"folder for JavaScript files contained in the HTML file\"\r\nif /j is not used then the folder for the html file is used.\r\nUse /s for silent mode, the application will close on finishing and will not show this message.", "Client Server Automation", MessageBoxButtons.OK, MessageBoxIcon.Information);
				}
			}
			if (silent)
			{
				this.Close();
			}
		}
		/// <summary>
		/// show a list box item in a new seperate information form.
		/// </summary>
		/// <param name="sender">not used</param>
		/// <param name="e">not used</param>
		private void listBox1_DoubleClick(object sender, EventArgs e)
		{
			FormInfo f = new FormInfo();
			f.SetMessage(listBox1.Text);
			f.Show(this);
			if (infoWindow == null || infoWindow.Disposing || infoWindow.IsDisposed)
			{
				infoWindow = f;
			}
		}
		/// <summary>
		/// show a list box item in current information form.
		/// </summary>
		/// <param name="sender">not used</param>
		/// <param name="e">not used</param>
		private void listBox1_SelectedIndexChanged(object sender, EventArgs e)
		{
			if (infoWindow == null || infoWindow.Disposing || infoWindow.IsDisposed)
			{
				infoWindow = new FormInfo();
				infoWindow.Show(this);
			}
			infoWindow.SetMessage(listBox1.Text);
		}
	}
}
