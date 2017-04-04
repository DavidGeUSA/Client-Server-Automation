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
	public partial class FormInfo : Form
	{
		private static FormInfo _f=null;
		public FormInfo()
		{
			InitializeComponent();
		}
		public void SetMessage(string msg)
		{
			textBox1.Text = msg;
		}
		public static void ShowMessage(string msg)
		{
			if (_f == null || _f.IsDisposed || _f.Disposing)
			{
				_f = new FormInfo();
			}
			_f.SetMessage(msg);
			_f.Show();
		}
	}
}
