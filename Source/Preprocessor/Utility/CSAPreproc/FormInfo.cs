/*
	Client Server Automation Preprocessor

	Author: David Wei Ge
	Date  : 2015-04-08
*/
using System;
using System.Windows.Forms;

namespace csapreproc
{
	/// <summary>
	/// a form hosting a text-box for showing multi-line or word-wrapped text.
	/// it is used for showing full contents of a list box item.
	/// </summary>
	public partial class FormInfo : Form
	{
		public FormInfo()
		{
			InitializeComponent();
		}
		/// <summary>
		/// pass message to the text box
		/// </summary>
		/// <param name="message">a string to be displayed multi-line or word-wrapped</param>
		public void SetMessage(string message)
		{
			textBox1.Text = message;
		}
	}
}
