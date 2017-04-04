/*
	Example of .NET support for server-technology-independent-API
	Author: David Ge
	Date: 2015-02-10
	Description: a sample of server-technology-independent-API is mailtool.js
 *		In mailtool.js, a class MailSender is used without definition. It must be implemented by supported server technologies.
 *		This file uses .NET to implement MailSender
 *		In mailtool.js, the ServerTypes is ['WebMail.MailSender']. The server side dispatcher for .Net will treat "WebMail.MailSender" as a full type name.
 *		Therefore, we need to use namespace WebMail and class name MailSender.
*/

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace WebMail
{
	public class STI_MailSender
	{
		private string _mailServerID;
		private string _host = "myMailHost";
		private int _port = 220;
		private bool _DefAuthenticate;
		private bool _Secure;
		private string _UserName;
		private string _Password;
		private string _from = "myname@mydomain.com";
		private string _errorMsg="";
		public STI_MailSender()
		{
		}
		public STI_MailSender(string mailServerId)
		{
			SetMailServer(mailServerId);
		}
		public static string GetAttribute(XmlNode node, string name)
		{
			if (node != null)
			{
				if (string.IsNullOrEmpty(name))
				{
					throw new Exception("getting attribute missing name. ");
				}
				if (node.Attributes != null)
				{
					XmlAttribute xa = node.Attributes[name];
					if (xa != null)
					{
						return xa.Value;
					}
				}
			}
			return "";
		}
		public static int GetAttributeInt(XmlNode node, string name)
		{
			if (node != null)
			{
				XmlAttribute xa = node.Attributes[name];
				if (xa != null)
				{
					if (string.IsNullOrEmpty(xa.Value))
						return 0;
					return Convert.ToInt32(xa.Value);
				}
			}
			return 0;
		}
		public static bool GetAttributeBoolDefFalse(XmlNode node, string name)
		{
			if (node != null)
			{
				XmlAttribute xa = node.Attributes[name];
				if (xa != null)
				{
					if (string.IsNullOrEmpty(xa.Value))
						return false;
					return Convert.ToBoolean(xa.Value);
				}
			}
			return false;
		}
		public void SetMailServer(string mailServerId)
		{
			_mailServerID = mailServerId;
			string cfgFile = Path.Combine(AppDomain.CurrentDomain.RelativeSearchPath, "mailTools.xml");
			XmlDocument doc = new XmlDocument();
			doc.Load(cfgFile);
			if (doc.DocumentElement != null)
			{
				XmlNode node = doc.DocumentElement.SelectSingleNode(string.Format(CultureInfo.InvariantCulture,"MailServer[@name='{0}']", _mailServerID));
				if (node != null)
				{
					_host = GetAttribute(node, "Host");
					_port = GetAttributeInt(node, "Port");
					_DefAuthenticate = GetAttributeBoolDefFalse(node, "UseDefAuthenticate");
					_Secure = GetAttributeBoolDefFalse(node, "Secure");
					_UserName = GetAttribute(node, "UserName");
					_Password = GetAttribute(node, "Password");
				}
				else
				{
					throw new Exception(string.Format(CultureInfo.InvariantCulture, "cannot find MailServer {0} in mailTools.xml", mailServerId));
				}
			}
			else
			{
				throw new Exception("cannot load mailTools.xml");
			}
		}
		public string ErrorMessage()
		{
			return _errorMsg;
		}
		public string Send(string subject,string mailbody,string recipients, string from, string files)
		{
			string ret = string.Empty;
			_from = from;
#if DEBUG_SIMULATE
			//simulate sending email here
			ret = string.Format(CultureInfo.InvariantCulture, "Test sending web mail.<br> Subject:{0}<br> Body:{1}<br> Recipients:{2}", subject, mailbody, recipients);
#else
			try
			{
				//the _host and _port are hard coded. 
				//In a real implementation, bothe _host and _port should be dynamic, for example, fetched according to _mailServerID
				SmtpClient smtp = new SmtpClient(_host, _port);
				smtp.UseDefaultCredentials = _DefAuthenticate;
				if (!string.IsNullOrEmpty(_UserName))
				{
					smtp.Credentials = new System.Net.NetworkCredential(_UserName, _Password); 
				}
				smtp.EnableSsl = _Secure;
				if (string.IsNullOrEmpty(files))
				{
					smtp.Send(_from, recipients, subject, mailbody);
				}
				else
				{
					MailMessage message = new MailMessage(_from, recipients);
					message.Body = mailbody;
					message.Subject = subject;
					string[] fs = files.Split(';');
					for (int i = 0; i < fs.Length; i++)
					{
						message.Attachments.Add(new Attachment(fs[i]));
					}
					smtp.Send(message);
				}
			}
			catch (Exception err)
			{
				ret = err.Message;
			}
#endif
			_errorMsg = ret;
			return ret;
		}
	}
}
