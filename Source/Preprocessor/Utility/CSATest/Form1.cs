/*
	Client Server Automation Preprocessor - Test Utility

	Author: David Wei Ge
	Date  : 2015-04-08
*/
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml;

namespace CsaTest
{
	public partial class Form1 : Form
	{
		#region fields and constructors
		private bool _cancel;
		private Thread _th = null;
		private TestConfig _testCfg = null;
		private FormCompare _webForm = null;
		private bool _webFormLoaded = false;
		public Form1()
		{
			InitializeComponent();
			loadconfig();
			_webForm = new FormCompare();
			_webForm.WebPageLoaded += _webForm_WebPageLoaded;
			_webForm.Show();
		}

		void _webForm_WebPageLoaded(object sender, EventArgs e)
		{
			_webFormLoaded = true;
			btStart.Enabled = true;
			this.TopMost = true;
			this.BringToFront();
		}
		#endregion
		#region configuration
		private string getconfigpath()
		{
			return Path.Combine(Path.GetDirectoryName(Application.ExecutablePath), "config.xml");
		}
		private void loadconfig()
		{
			string file = getconfigpath();
			if (File.Exists(file))
			{
				XmlDocument doc = new XmlDocument();
				doc.Load(file);
				XmlNode root = doc.DocumentElement;
				if (root != null)
				{
					XmlNode node = root.SelectSingleNode("PreprocUtil");
					if (node != null)
					{
						txtPreproc.Text = node.InnerText;
					}
					node = root.SelectSingleNode("TestFileFolder");
					if (node != null)
					{
						txtSampleFolder.Text = node.InnerText;
					}
					node = root.SelectSingleNode("OutputFolder");
					if (node != null)
					{
						txtOutput.Text = node.InnerText;
					}
					node = root.SelectSingleNode("PreprocURL");
					if (node != null)
					{
						txtPreprocURL.Text = node.InnerText;
					}
					node = root.SelectSingleNode("StandardFileFolder");
					if (node != null)
					{
						txtStandardFolder.Text = node.InnerText;
					}
					node = root.SelectSingleNode("WebFileFolder");
					if (node != null)
					{
						txtWebFolder.Text = node.InnerText;
					}
				}
			}
			
		}
		private void saveconfig(string name, string value)
		{
			XmlDocument doc=new XmlDocument();
			string file = getconfigpath();
			if (File.Exists(file))
			{
				doc.Load(file);
			}
			XmlNode root = doc.DocumentElement;
			if (root == null)
			{
				root = doc.CreateElement("Root");
				doc.AppendChild(root);
			}
			XmlNode node = root.SelectSingleNode(name);
			if (node == null)
			{
				node = doc.CreateElement(name);
				root.AppendChild(node);
			}
			node.InnerText = value;
			doc.Save(file);
		}
		#endregion
		#region UI event handlers
		private void btPreproc_Click(object sender, EventArgs e)
		{
			OpenFileDialog dlg = new OpenFileDialog();
			dlg.Title = "Select csapreproc.exe";
			dlg.Filter = "CSA Preproc|csapreproc.exe";
			if (dlg.ShowDialog(this) == System.Windows.Forms.DialogResult.OK)
			{
				txtPreproc.Text = dlg.FileName;
				saveconfig("PreprocUtil", txtPreproc.Text);
			}
		}
		private void txtPreproc_TextChanged(object sender, EventArgs e)
		{
			saveconfig("PreprocUtil", txtPreproc.Text);
		}

		private void btSampleFolder_Click(object sender, EventArgs e)
		{
			FolderBrowserDialog dlg = new FolderBrowserDialog();
			dlg.Description = "Select the folder containing HTML files to be processed";
			dlg.ShowNewFolderButton = false;
			if (dlg.ShowDialog(this) == System.Windows.Forms.DialogResult.OK)
			{
				txtSampleFolder.Text = dlg.SelectedPath;
				saveconfig("TestFileFolder", txtSampleFolder.Text);
			}
		}
		private void txtSampleFolder_TextChanged(object sender, EventArgs e)
		{
			saveconfig("TestFileFolder", txtSampleFolder.Text);
		}
		private void btOutput_Click(object sender, EventArgs e)
		{
			FolderBrowserDialog dlg = new FolderBrowserDialog();
			dlg.Description = "Select the folder for generating JavaScript files";
			dlg.ShowNewFolderButton = true;
			if (dlg.ShowDialog(this) == System.Windows.Forms.DialogResult.OK)
			{
				txtOutput.Text = dlg.SelectedPath;
				saveconfig("OutputFolder", txtOutput.Text);
			}
		}
		private void txtOutput_TextChanged(object sender, EventArgs e)
		{
			saveconfig("OutputFolder", txtOutput.Text);
		}

		private void txtPreprocURL_TextChanged(object sender, EventArgs e)
		{
			saveconfig("PreprocURL", txtPreprocURL.Text);
		}

		private void btStandardFolder_Click(object sender, EventArgs e)
		{
			FolderBrowserDialog dlg = new FolderBrowserDialog();
			dlg.Description = "Select the folder containing JavaScript files to be compared with";
			dlg.ShowNewFolderButton = false;
			if (dlg.ShowDialog(this) == System.Windows.Forms.DialogResult.OK)
			{
				txtStandardFolder.Text = dlg.SelectedPath;
				saveconfig("StandardFileFolder", txtStandardFolder.Text);
			}
		}
		private void txtStandardFolder_TextChanged(object sender, EventArgs e)
		{
			saveconfig("StandardFileFolder", txtStandardFolder.Text);
		}

		private void btWebFolder_Click(object sender, EventArgs e)
		{
			FolderBrowserDialog dlg = new FolderBrowserDialog();
			dlg.Description = "Select the folder containing JavaScript library files included in HTML files to be processed";
			dlg.ShowNewFolderButton = false;
			if (dlg.ShowDialog(this) == System.Windows.Forms.DialogResult.OK)
			{
				txtWebFolder.Text = dlg.SelectedPath;
				saveconfig("WebFileFolder", txtWebFolder.Text);
			}
		}
		private void txtWebFolder_TextChanged(object sender, EventArgs e)
		{
			saveconfig("WebFileFolder", txtWebFolder.Text);
		}

		private void btStart_Click(object sender, EventArgs e)
		{
			if (_th == null && _webFormLoaded)
			{
				_cancel = false;
				enableUI(false);
				picRet.Image = Resource1.empty;
				if (verifyConfig())
				{
					progressBar1.Value = 0;
					listBox1.Items.Clear();
					_th = new Thread(process);
					_th.Start();
				}
				else
				{
					enableUI(true);
				}
			}
		}

		private void btCancel_Click(object sender, EventArgs e)
		{
			_cancel = true;
		}
		private void listBox1_DoubleClick(object sender, EventArgs e)
		{
			FormInfo.ShowMessage(listBox1.Text);
		}
		#endregion
		#region work
		private void enableUI(bool b)
		{
			btCancel.Enabled = !b;
			btOutput.Enabled = b;
			btPreproc.Enabled = b;
			btSampleFolder.Enabled = b;
			btStandardFolder.Enabled = b;
			btWebFolder.Enabled = b;
			btStart.Enabled = b;
		}
		private void setProgressbar(int max, int val)
		{
			double d = (100.0)*(double)val / (double)max;
			this.Invoke((MethodInvoker)(delegate()
			{
				progressBar1.Value = (int)d;
				progressBar1.Refresh();
				Application.DoEvents();
			}));
		}
		private void showStatus(string msg)
		{
			this.Invoke((MethodInvoker)(delegate()
			{
				lblFile.Text = msg;
				lblFile.Refresh();
				Application.DoEvents();
			}));
		}
		private void logMessage(string msg, params object[] values)
		{
			if (values != null && values.Length > 0)
			{
				msg = string.Format(CultureInfo.InvariantCulture, msg, values);
			}
			this.Invoke((MethodInvoker)(delegate()
			{
				listBox1.Items.Add(msg);
			}));
		}
		private string compareFiles(string f1, string f2)
		{
			StreamReader sb = new StreamReader(f1);
			string text1 = sb.ReadToEnd();
			sb.Close();
			sb = new StreamReader(f2);
			string text2 = sb.ReadToEnd();
			sb.Close();
			//return (string.CompareOrdinal(text1, text2) == 0);
			object v = null;
			_webForm.Invoke((MethodInvoker)(delegate()
			{
				v = _webForm.InvokeJs("compare_codes", text1, text2);
			}));
			if (v != null)
			{
				return v.ToString();
			}
			return string.Empty;
		}
		private bool processFile(string f)
		{
			bool bRet = true;
			showStatus(Path.GetFileNameWithoutExtension(f));
			string[] existingFiles = Directory.GetFiles(_testCfg.OutputFolder,string.Format(CultureInfo.InvariantCulture,"{0}_p.html", Path.GetFileNameWithoutExtension(f)));
			if (existingFiles != null && existingFiles.Length > 0)
			{
				for (int i = 0; i < existingFiles.Length; i++)
				{
					File.Delete(existingFiles[i]);
				}
			}
			existingFiles = Directory.GetFiles(_testCfg.OutputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_client.js", Path.GetFileNameWithoutExtension(f)));
			if (existingFiles != null && existingFiles.Length > 0)
			{
				for (int i = 0; i < existingFiles.Length; i++)
				{
					File.Delete(existingFiles[i]);
				}
			}
			existingFiles = Directory.GetFiles(_testCfg.OutputFolder, string.Format(CultureInfo.InvariantCulture, "{0}_server*.js", Path.GetFileNameWithoutExtension(f)));
			if (existingFiles != null && existingFiles.Length > 0)
			{
				for (int i = 0; i < existingFiles.Length; i++)
				{
					File.Delete(existingFiles[i]);
				}
			}
			Process p = new Process();
			ProcessStartInfo psI = new ProcessStartInfo("cmd");
			psI.UseShellExecute = false;
			psI.RedirectStandardInput = false;
			psI.RedirectStandardOutput = true;
			psI.RedirectStandardError = true;
			psI.CreateNoWindow = true;
			p.StartInfo = psI;
			p.StartInfo.FileName = _testCfg.PreprocessorUtility;
			StringBuilder sb = new StringBuilder();
			sb.Append("/h \"");
			sb.Append(f);
			sb.Append("\" /o \"");
			sb.Append(_testCfg.OutputFolder);
			sb.Append("\" /u \"");
			sb.Append(_testCfg.PreprocessorURL);
			sb.Append("\" /j \"");
			sb.Append(_testCfg.JavaScriptFolder);
			sb.Append("\" /s");
			p.StartInfo.Arguments = sb.ToString();
			string stdout;
			string errout;
			p.Start();
			stdout = p.StandardOutput.ReadToEnd();
			errout = p.StandardError.ReadToEnd();
			p.WaitForExit();
			if (p.ExitCode != 0)
			{
				bRet = false;
				logMessage("Error code {0}, output:{1}, error:{2} for calling {3} {4}", p.ExitCode, stdout, errout, p.StartInfo.FileName, p.StartInfo.Arguments);
			}
			else
			{
				string fn = Path.GetFileNameWithoutExtension(f);
				string fnClient = string.Format(CultureInfo.InvariantCulture,"{0}_client.js",fn);
				string fnClientPath = Path.Combine(_testCfg.OutputFolder, fnClient);
				string fnServer = string.Format(CultureInfo.InvariantCulture,"{0}_server*.js",fn);
				string[] fnServerPaths = Directory.GetFiles(_testCfg.OutputFolder, fnServer);
				//
				string[] sdClientPath = Directory.GetFiles(_testCfg.StandardFilesFolder, fnClient);
				if (File.Exists(fnClientPath))
				{
					if (sdClientPath == null || sdClientPath.Length == 0)
					{
						bRet = false;
						logMessage("{0} failed. Client JS generated in [{1}] but not found in [{2}]", fn, _testCfg.OutputFolder, _testCfg.StandardFilesFolder);
					}
					else if (sdClientPath.Length > 1)
					{
						bRet = false;
						logMessage("{0} failed. More than one [{1}] found in [{2}]", fn, fnClient, _testCfg.StandardFilesFolder);
					}
					else
					{
						string err = compareFiles(fnClientPath, sdClientPath[0]);
						if (!string.IsNullOrEmpty(err))
						{
							bRet = false;
							logMessage("{0} failed. Files are different: [{1}] and [{2}]. {3}", fn, fnClientPath, sdClientPath[0], err);
						}
					}
				}
				else
				{
					if (sdClientPath != null && sdClientPath.Length > 0)
					{
						bRet = false;
						logMessage("{0} failed. Client JavaScript is not created", fn);
					}
				}
				string[] sdServerPaths = Directory.GetFiles(_testCfg.StandardFilesFolder, fnServer);
				if (fnServerPaths == null || fnServerPaths.Length == 0)
				{
					if (sdServerPaths != null && sdServerPaths.Length > 0)
					{
						bRet = false;
						logMessage("{0} failed. Server javaScript files not generated", fn);
					}
				}
				else
				{
					if (sdServerPaths == null || sdServerPaths.Length == 0)
					{
						bRet = false;
						logMessage("{0} failed. Server JavaScript files are generated but there are not corresponding files in folder [{1}]", fn, _testCfg.StandardFilesFolder);
					}
					else
					{
						if (sdServerPaths.Length != fnServerPaths.Length)
						{
							bRet = false;
							logMessage("{0} failed. Different numbers of server script files are generated.", fn);
						}
						else
						{
							for (int i = 0; i < fnServerPaths.Length; i++)
							{
								string err=compareFiles(fnServerPaths[i], sdServerPaths[i]);
								if (!string.IsNullOrEmpty(err))
								{
									bRet = false;
									logMessage("{0} failed. Different server file generated: [{1}] and [{2}]. {3}", fn, fnServerPaths[i], sdServerPaths[i], err);
								}
							}
						}
					}
				}
			}
			return bRet;
		}
		private void process()
		{
			string[] htmlFiles = Directory.GetFiles(_testCfg.TestFilesFolder, "*.html");
			if (htmlFiles != null && htmlFiles.Length > 0)
			{
				int n = 0;
				for (int i = 0; i < htmlFiles.Length; i++)
				{
					if (_cancel)
						break;
					setProgressbar(htmlFiles.Length, i);
					if (processFile(htmlFiles[i]))
					{
						n++;
					}
				}
				setProgressbar(100, 100);
				if (n == htmlFiles.Length)
				{
					showStatus(string.Format(CultureInfo.InvariantCulture, "All test cases passed! Total test cases: {0}", htmlFiles.Length));
					picRet.Image = Resource1.ok.ToBitmap();
				}
				else
				{
					showStatus(string.Format(CultureInfo.InvariantCulture, "{0} passed. {1} failed. Total test cases: {2}", n,htmlFiles.Length-n, htmlFiles.Length));
					picRet.Image = Resource1._cancel.ToBitmap();
				}
			}
			else
			{
				this.Invoke((MethodInvoker)(delegate()
				{
					showError("There are not test files in folder {0}", _testCfg.TestFilesFolder);
				}));
			}
			_th = null;
			this.Invoke((MethodInvoker)(delegate() {
				enableUI(true);
			}));
		}
		private void showError(string msg,params object[] values)
		{
			if (values != null && values.Length > 0)
			{
				msg = string.Format(CultureInfo.InvariantCulture, msg, values);
			}
			MessageBox.Show(this, msg, this.Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
		}
		private bool verifyConfig()
		{
			_testCfg = new TestConfig();
			_testCfg.PreprocessorUtility = txtPreproc.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.PreprocessorUtility))
			{
				showError("Preprocessor utility not specified");
				return false;
			}
			else if (!File.Exists(_testCfg.PreprocessorUtility))
			{
				showError("File not found: {0}", _testCfg.PreprocessorUtility);
				return false;
			}
			_testCfg.TestFilesFolder = txtSampleFolder.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.TestFilesFolder))
			{
				showError("Test files folder not specified");
				return false;
			}
			else if (!Directory.Exists(_testCfg.TestFilesFolder))
			{
				showError("Test files folder does not exist: {0}", _testCfg.TestFilesFolder);
				return false;
			}
			_testCfg.OutputFolder = txtOutput.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.OutputFolder))
			{
				showError("Output folder not specified");
				return false;
			}
			else if (!Directory.Exists(_testCfg.OutputFolder))
			{
				showError("Output folder does not exist: {0}", _testCfg.OutputFolder);
				return false;
			}
			_testCfg.PreprocessorURL = txtPreprocURL.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.PreprocessorURL))
			{
				showError("Preprocessor URL is not specified");
				return false;
			}
			_testCfg.StandardFilesFolder = txtStandardFolder.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.StandardFilesFolder))
			{
				showError("Standard files folder is not specified");
				return false;
			}
			else if (!Directory.Exists(_testCfg.StandardFilesFolder))
			{
				showError("Standard files folder does not exist: {0}", _testCfg.StandardFilesFolder);
				return false;
			}
			_testCfg.JavaScriptFolder = txtWebFolder.Text.Trim();
			if (string.IsNullOrEmpty(_testCfg.JavaScriptFolder))
			{
				showError("Web folder for looking for JavaScript library files included in HTML files is not specified");
				return false;
			}
			else if (!Directory.Exists(_testCfg.JavaScriptFolder))
			{
				showError("Web folder for looking for JavaScript library files included in HTML files does not exist: {0}", _testCfg.JavaScriptFolder);
				return false;
			}
			return true;
		}
		#endregion
		class TestConfig
		{
			public string PreprocessorUtility { get; set; }
			public string TestFilesFolder { get; set; }
			public string OutputFolder { get; set; }
			public string PreprocessorURL { get; set; }
			public string StandardFilesFolder { get; set; }
			public string JavaScriptFolder { get; set; }
		}








	}
}
