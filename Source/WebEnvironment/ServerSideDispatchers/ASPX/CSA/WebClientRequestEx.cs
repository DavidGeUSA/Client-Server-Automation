/*
	Client Server Automation Server Side Dispatcher for Aspx
	Author: David Ge
	Date: 2015-02-10
	Description: it is a server side dispatcher for client server automation. csa.js connects to this file via Ajax/csa.aspx
*/

using System;
using System.Collections.Generic;
using System.Text;

namespace JScriptInterface
{
	/// <summary>
	/// it represents a client request
	/// it depends on WebClientRequest which is defined in json.cs
	/// </summary>
	public class WebClientRequestEx:WebClientRequest
	{
		#region fields and constructors
		private string[] _serverTypes; //server library references
		private string[] _serverFiles; //server library files
		private string[] _usedkeys; //enumerated keys when doing server value enumeration
		private string _jscode; //server side JavaScript code. this feature is not used currently by the Client Server Automation
		private JsonDataPropertyBag _clientvalues; //client value uploaded
		public WebClientRequestEx()
		{
		}
		#endregion
		#region overrides
		/// <summary>
		/// parse JSON data into C# objects
		/// </summary>
		/// <param name="prb">JSON data</param>
		protected override void OnParseJsonText(JsonDataPropertyBag prb)
		{
			_serverTypes = null;
			_serverFiles = null;
			_usedkeys = null;
			IJsonValue d;
			if (prb.TryGetValue("ServerTypes", out d))
			{
				JsonDataArray a = d as JsonDataArray;
				if (a != null)
				{
					_serverTypes = a.ToStringArray();
				}
			}
			if (prb.TryGetValue("ServerFiles", out d))
			{
				JsonDataArray a = d as JsonDataArray;
				if (a != null)
				{
					_serverFiles = a.ToStringArray();
				}
			}
			if (prb.TryGetValue("usedkeys", out d))
			{
				JsonDataArray a = d as JsonDataArray;
				if (a != null)
				{
					_usedkeys = a.ToStringArray();
				}
			}
			if (prb.TryGetValue("code", out d))
			{
				JsonDataString sv = d as JsonDataString;
				if (sv != null)
				{
					_jscode = sv.ValueString;
				}
			}
			if (prb.TryGetValue("clientvalues", out d))
			{
				_clientvalues = d as JsonDataPropertyBag;
			}
		}
		#endregion
		#region Properties
		/// <summary>
		/// server types used in server API
		/// </summary>
		public string[] ServerTypes
		{
			get
			{
				return _serverTypes;
			}
		}
		/// <summary>
		/// server API files
		/// </summary>
		public string[] ServerFiles
		{
			get
			{
				return _serverFiles;
			}
		}
		/// <summary>
		/// enumerated keys while doing a server value enumeration
		/// </summary>
		public string[] UsedKeys
		{
			get
			{
				return _usedkeys;
			}
		}
		/// <summary>
		/// server code to be executed.
		/// current client server automation does not use it. the server code is among ServerFiles
		/// </summary>
		public string Code
		{
			get
			{
				return _jscode;
			}
		}
		/// <summary>
		/// uploaded values including client values and server state values
		/// </summary>
		public JsonDataPropertyBag ClientValues
		{
			get
			{
				if (_clientvalues == null)
					_clientvalues = new JsonDataPropertyBag(null);
				return _clientvalues;
			}
		}
		#endregion
	}
}
