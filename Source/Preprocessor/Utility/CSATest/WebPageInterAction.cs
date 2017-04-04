/*
	Client Server Automation Preprocessor - Test Utility

	Author: David Wei Ge
	Date  : 2015-04-08
*/

using System;
using System.Runtime.InteropServices;
using System.Security.Permissions;

namespace CsaTest
{
	/// <summary>
	/// carry out communications between a web browser control and a web page doing client server automation preprocessing
	/// </summary>
	[PermissionSet(SecurityAction.Demand, Name = "FullTrust")]
	[ComVisible(true)]
	public class WebPageInterAction
	{
		/// <summary>
		/// this form hosts a web browser control to load csapreproc.html to do client server automation preprocessing
		/// </summary>
		private FormCompare _csapreform;
		/// <summary>
		/// constructing an object with a communication destination
		/// </summary>
		/// <param name="csapreprocForm">a form hosting a web browser control</param>
		public WebPageInterAction(FormCompare csapreprocForm)
		{
			_csapreform = csapreprocForm;
		}
		/// <summary>
		/// window.onload in csapreproc.js calls this function
		/// to notify the web browser that it is ready to perform client server automation preprocessing
		/// </summary>
		public void OnWebPageStarted()
		{
			_csapreform.OnWebPageStarted();
		}
	}
}
