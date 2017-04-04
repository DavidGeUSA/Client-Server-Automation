/*
	Example of .NET support for server-technology-independent-API
	Author: David Ge
	Date: 2015-02-10
	Description: a sample of server-technology-independent-API is serverA.js
 *		In serverA.js, a class ServerTaskX is used without definition. It must be implemented by supported server technologies.
 *		This file uses .NET to implement ServerTaskX
 *		In serverA.js, the ServerTypes is ['ServerTasks.ServerTaskX']. The server side dispatcher for .Net will treat "ServerTasks.ServerTaskX" as a full type name.
 *		Therefore, we need to use namespace ServerTasks and class name ServerTaskX.
*/

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Threading.Tasks;
// namespace is from ServerTypes in serverA.js
namespace ServerTasks
{
	/// <summary>
	/// class name is from ServerTypes in serverA.js
	/// </summary>
	public class ServerTaskX
	{
		public ServerTaskX()
		{
		}
		/// <summary>
		/// a sample function
		/// </summary>
		/// <param name="var1"></param>
		/// <param name="idx2"></param>
		/// <returns></returns>
		public string Func1(string var1, int idx2)
		{
			return string.Format(CultureInfo.InvariantCulture, "Server call Func1(var1={0}, idx2={1})", var1, idx2);
		}
		/// <summary>
		/// a sample function
		/// </summary>
		/// <param name="var1"></param>
		/// <param name="idx2"></param>
		/// <param name="idx3"></param>
		/// <returns></returns>
		public string Func2(string var1,int idx2,int idx3)
		{
			return string.Format(CultureInfo.InvariantCulture, "Calling Func2 with var1={0}, idx2={1} and idx3={2}",  var1, idx2, idx3);
		}
	}
}
