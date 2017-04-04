/*
	Client Server Automation Preprocessor - Test Utility

	Author: David Wei Ge
	Date  : 2015-04-08
*/
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CsaTest
{
	public partial class FormCompare : Form
	{
		/// <summary>
		/// the URL for the web page for doing client server automation preprocessing.
		/// can be specified by a /u command line parameter
		/// </summary>
		private string csaPreprocUrl = "http://localhost/csaasp/csapre/csapreproc_test.html";

		/// <summary>
		/// a COM-visible object for communicating between a web page loaded with csaPreprocUrl, and a web browser control webBrowser1
		/// </summary>
		private WebPageInterAction _interacter;

		public event EventHandler WebPageLoaded;
		public FormCompare()
		{
			InitializeComponent();
			_interacter = new WebPageInterAction(this);
			webBrowser1.AllowWebBrowserDrop = false;
			webBrowser1.IsWebBrowserContextMenuEnabled = false;
			webBrowser1.WebBrowserShortcutsEnabled = false;
			webBrowser1.ObjectForScripting = _interacter;

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
		protected override void OnLoad(EventArgs e)
		{
			base.OnLoad(e);
			webBrowser1.Url = new Uri(csaPreprocUrl);
		}
		public void OnWebPageStarted()
		{
			if (WebPageLoaded != null)
			{
				WebPageLoaded(this, EventArgs.Empty);
			}
		}
	}
}
