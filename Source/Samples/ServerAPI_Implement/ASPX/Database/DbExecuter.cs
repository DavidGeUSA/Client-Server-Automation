/*
	Example of .NET support for server-technology-independent-API
	Author: David Ge
	Date: 2015-02-10
	Description: a sample of server-technology-independent-API is database.js
 *		In database.js, a class DbExecuter is used without definition. It must be implemented by supported server technologies.
 *		This file uses .NET to implement DbExecuter
 *		In database.js, the ServerTypes is ['Database.DbExecuter']. The server side dispatcher for .Net will treat "Database.DbExecuter" as a full type name.
 *		Therefore, we need to use namespace Database and class name DbExecuter.
*/

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Xml;

namespace Database
{
	/// <summary>
	/// This is to implement a class used in database.js
	/// </summary>
	public class STI_DbExecuter
	{
		private string _connectionId;
		private int _lastAutoNum=0;
		private int _lastAffectedRecordCount;
		private string _lastErrMsg;
		private string _connString;
		private Type _dbType;
		private List<STI_DbParameter> _parameterValues;
		public STI_DbExecuter()
		{
			
		}
		public STI_DbExecuter(string connectionId)
		{
			SetConnect(connectionId);
		}
		public void ClearParameters()
		{
			_parameterValues = null;
		}
		public void SetConnect(string connectionId)
		{
			_connectionId = connectionId;
			string cfgFile = Path.Combine(AppDomain.CurrentDomain.RelativeSearchPath, "databaseConfig.cfg");
			XmlDocument doc = new XmlDocument();
			doc.Load(cfgFile);
			if (doc.DocumentElement != null)
			{
				XmlNode node = doc.DocumentElement.SelectSingleNode(string.Format(CultureInfo.InvariantCulture, "database[@name='{0}']", connectionId));
				if (node != null)
				{
					XmlNode connNode = node.SelectSingleNode("connectionString");
					if (connNode != null)
					{
						_connString = connNode.InnerText;
					}
					XmlNode typeNode = node.SelectSingleNode("dbType");
					if (typeNode != null)
					{
						_dbType = Type.GetType(typeNode.InnerText);
					}
				}
				if (string.IsNullOrEmpty(_connString) || _dbType == null)
				{
					throw new Exception(string.Format("Connection String and Connection Type must be specified in file databaseConfig.cfg. Connectin ID:{0}, Connection String:{1}, Connection type:{2}", _connectionId, _connString, _dbType));
				}
			}
			else
			{
				throw new Exception("cannot load databaseConfig.cfg");
			}
		}
		public int LastAutoNumber()
		{
			return _lastAutoNum;
		}
		
		/// <summary>
		/// Support OleDb Types
		/// </summary>
		/// <param name="t">DbType to be converted</param>
		/// <returns>OleDbType converted from t</returns>
		public static OleDbType DbTypeToOleDbType(DbType t)
		{
			switch (t)
			{
				case DbType.AnsiString:
					return OleDbType.VarChar;
				case DbType.AnsiStringFixedLength:
					return OleDbType.Char;
				case DbType.Binary:
					return OleDbType.Binary;
				case DbType.Boolean:
					return OleDbType.Boolean;
				case DbType.Byte:
					return OleDbType.UnsignedTinyInt;
				case DbType.Currency:
					return OleDbType.Currency;
				case DbType.Date:
					return OleDbType.Date;
				case DbType.DateTime:
					return OleDbType.Date;
				case DbType.DateTime2:
					return OleDbType.Date;
				case DbType.DateTimeOffset:
					return OleDbType.DBDate;
				case DbType.Decimal:
					return OleDbType.Decimal;
				case DbType.Double:
					return OleDbType.Double;
				case DbType.Guid:
					return OleDbType.Guid;
				case DbType.Int16:
					return OleDbType.SmallInt;
				case DbType.Int32:
					return OleDbType.Integer;
				case DbType.Int64:
					return OleDbType.BigInt;
				case DbType.Object:
					return OleDbType.VarBinary;
				case DbType.SByte:
					return OleDbType.TinyInt;
				case DbType.Single:
					return OleDbType.Single;
				case DbType.String:
					return OleDbType.VarWChar;
				case DbType.StringFixedLength:
					return OleDbType.WChar;
				case DbType.Time:
					return OleDbType.DBTime;
				case DbType.UInt16:
					return OleDbType.UnsignedSmallInt;
				case DbType.UInt32:
					return OleDbType.UnsignedInt;
				case DbType.UInt64:
					return OleDbType.UnsignedBigInt;
				case DbType.VarNumeric:
					return OleDbType.VarNumeric;
				case DbType.Xml:
					return OleDbType.VarWChar;
			}
			return OleDbType.VarWChar;
		}
		/*
		 AnsiString=0
Binary=1
Byte=2
Boolean=3
Currency=4
Date=5
DateTime=6
Decimal=7
Double=8
Guid=9
Int16=10
Int32=11
Int64=12
Object=13
SByte=14
Single=15
String=16
Time=17
UInt16=18
UInt32=19
UInt64=20
VarNumeric=21
AnsiStringFixedLength=22
StringFixedLength=23
Xml=25
DateTime2=26
DateTimeOffset=27
		 */
		public void AddParamValue(string name, int type, int size, object value)
		{
			if (_parameterValues == null)
			{
				_parameterValues = new List<STI_DbParameter>();
			}
			DbType dt = (DbType)type;
			if (dt == DbType.Date || dt == DbType.DateTime || dt == DbType.DateTime2 || dt == DbType.Time)
			{
				//Fri Oct 21 22:20:10 2016
				string vs = value as string;
				if (!string.IsNullOrEmpty(vs))
				{
					if (vs.StartsWith("SUN ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("MON ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("TUE ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("WEN ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("THU ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("FRI ", StringComparison.OrdinalIgnoreCase) ||
						vs.StartsWith("SAT ", StringComparison.OrdinalIgnoreCase))
					{
						string format = "ddd MMM dd HH:mm:ss yyyy";
						value = DateTime.ParseExact(vs, format, CultureInfo.InvariantCulture);
					}
				}
			}
			STI_DbParameter p = new STI_DbParameter(name, dt, size, value);
			_parameterValues.Add(p);
			//if (name == "@RequestTime")
			//{
			//	throw new Exception(string.Format("name={0}, value={1}, type={2}", p.Name, p.Value, p.Value.GetType()));
			//}
		}
		public string Execute(string sSQL)
		{
			_lastErrMsg = string.Empty;
			DbConnection cn = null;
			try
			{
				
				cn = (DbConnection)Activator.CreateInstance(_dbType, _connString);
				DbCommand cmd = cn.CreateCommand();
				cmd.CommandText = sSQL;
				if (_parameterValues != null && _parameterValues.Count > 0)
				{
					//StringBuilder sb = new StringBuilder();
					for (int i = 0; i < _parameterValues.Count; i++)
					{
						//DbParameter p = new DbParameter(_parameterValues[i].Name, _parameterValues[i].DataType, _parameterValues[i].Size, _parameterValues[i].Value);
						DbParameter p = cmd.CreateParameter();
						p.ParameterName = _parameterValues[i].Name;
						p.DbType = _parameterValues[i].DataType;
						p.Size = _parameterValues[i].Size;
						p.Value = _parameterValues[i].Value;
						cmd.Parameters.Add(p);
						//sb.Append(_parameterValues[i].Name);
						//sb.Append("=");
						//sb.Append(_parameterValues[i]);
						//sb.Append("; ");
					}
					//if (sb.Length > 0)
					//{
					//	throw new Exception(sb.ToString());
					//}
				}
				cn.Open();
				_lastAffectedRecordCount = cmd.ExecuteNonQuery();
				DbCommand cmd2 = cn.CreateCommand();
				if (cn is OleDbConnection)
				{
					cmd2.CommandText = "SELECT @@Identity";
				}
				else
				{
					cmd2.CommandText = "SELECT LAST_INSERT_ID()";
				}
				object v = cmd2.ExecuteScalar();
				if (v != null)
				{
					_lastAutoNum = Convert.ToInt32(v);
				}
			}
			catch (Exception err)
			{
				_lastErrMsg = err.Message;
			}
			finally
			{
				if (cn != null)
				{
					if (cn.State != ConnectionState.Closed)
					{
						cn.Close();
					}
				}
			}
			return _lastErrMsg;
		}
		public string LastErrorMessage
		{
			get
			{
				return _lastErrMsg;
			}
		}
		public int LastAutoNum
		{
			get
			{
				return _lastAutoNum;
			}
		}
	}
}
