/*
	Client Server Automation Server Side Dispatcher for Aspx
	Author: David Ge
	Date: 2015-02-10
	Description: it is a server side dispatcher for client server automation. csa.js connects to this file via Ajax/csa.aspx
*/

using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.Data;
using System.Globalization;

namespace JScriptInterface
{
	/// <summary>
	/// data types supported
	/// </summary>
	public enum EnumJsonDataType { Value = 0, PropertyBag, Array }
	/// <summary>
	/// an interface representing a JSON object
	/// </summary>
	public interface IJsonValue
	{
		IJsonObject Parent { get; }
		EnumJsonDataType DataType { get; }
		string JavaScript { get; }
	}
	/// <summary>
	/// an interface for a JSON object containg child objects
	/// </summary>
	public interface IJsonObject : IJsonValue
	{
		int ChildCount { get; }
	}
	/// <summary>
	/// a base type for all JSON values
	/// </summary>
	public abstract class JsonDataValue : IJsonValue
	{
		#region fields and constructors
		private IJsonObject _parent;
		public JsonDataValue(IJsonObject parent)
		{
			_parent = parent;
		}
		#endregion
		#region IJsonValue Members

		public IJsonObject Parent
		{
			get { return _parent; }
		}

		public EnumJsonDataType DataType
		{
			get { return EnumJsonDataType.Value; }
		}

		#endregion
		public abstract object Value { get; }
		public abstract string JavaScript { get; }
	}
	/// <summary>
	/// a JSON type representing NULL
	/// </summary>
	public class JsonDataNull : JsonDataValue
	{
		#region fields and constructors
		public JsonDataNull(IJsonObject parent)
			: base(parent)
		{
		}
		#endregion

		public override object Value
		{
			get { return null; }
		}
		public override string JavaScript
		{
			get { return "null"; }
		}
		public override string ToString()
		{
			return string.Empty;
		}
	}
	/// <summary>
	/// a JSON type representing a string
	/// </summary>
	public class JsonDataString : JsonDataValue
	{
		#region fields and constructors
		public JsonDataString(IJsonObject parent)
			: base(parent)
		{
		}
		public JsonDataString(string value, IJsonObject parent)
			: base(parent)
		{
			ValueString = value;
		}
		#endregion
		public override object Value
		{
			get { return ValueString; }
		}
		public override string JavaScript
		{
			get
			{
				if (ValueString == null)
				{
					return "null";
				}
				return string.Format(CultureInfo.InvariantCulture, "'{0}'", ValueString.Replace("'","\\'"));
			}
		}
		public string ValueString { get; set; }
		public override string ToString()
		{
			return ValueString;
		}
	}
	/// <summary>
	/// a JSON type representing an integer
	/// </summary>
	public class JsonDataNumber : JsonDataValue
	{
		#region fields and constructors
		public JsonDataNumber(IJsonObject parent)
			: base(parent)
		{
		}
		public JsonDataNumber(long value, IJsonObject parent)
			: base(parent)
		{
			ValueNumber = value;
		}
		#endregion
		public override object Value
		{
			get { return ValueNumber; }
		}
		public override string JavaScript
		{
			get
			{
				return ValueNumber.ToString(CultureInfo.InvariantCulture);
			}
		}
		public long ValueNumber { get; set; }
		public override string ToString()
		{
			return ValueNumber.ToString(CultureInfo.InvariantCulture);
		}
	}
	/// <summary>
	/// a json type representing a decimal
	/// </summary>
	public class JsonDataDecimal : JsonDataValue
	{
		#region fields and constructors
		public JsonDataDecimal(IJsonObject parent)
			: base(parent)
		{
		}
		public JsonDataDecimal(double value, IJsonObject parent)
			: base(parent)
		{
			ValueDecimal = value;
		}
		#endregion
		public override object Value
		{
			get { return ValueDecimal; }
		}
		public override string JavaScript
		{
			get
			{
				return ValueDecimal.ToString(CultureInfo.InvariantCulture);
			}
		}
		public double ValueDecimal { get; set; }
		public override string ToString()
		{
			return ValueDecimal.ToString(CultureInfo.InvariantCulture);
		}
	}
	/// <summary>
	/// a json type representing a datetime
	/// </summary>
	public class JsonDataDateTime : JsonDataValue
	{
		#region fields and constructors
		public JsonDataDateTime(IJsonObject parent)
			: base(parent)
		{
		}
		public JsonDataDateTime(DateTime value, IJsonObject parent)
			: base(parent)
		{
			ValueDateTime = value;
		}
		#endregion
		public override object Value
		{
			get { return ValueDateTime; }
		}
		public override string JavaScript
		{
			get
			{
				return ValueDateTime.ToString(string.Format(CultureInfo.InvariantCulture, "(new Date({0},{1},{2},{3},{4},{5},{6}))", ValueDateTime.Year, ValueDateTime.Month, ValueDateTime.Day, ValueDateTime.Hour, ValueDateTime.Minute, ValueDateTime.Second, ValueDateTime.Millisecond));
			}
		}
		public DateTime ValueDateTime { get; set; }
		public override string ToString()
		{
			return ValueDateTime.ToString(CultureInfo.InvariantCulture);
		}
	}
	/// <summary>
	/// a json type representing a boolean
	/// </summary>
	public class JsonDataBool : JsonDataValue
	{
		#region fields and constructors
		public JsonDataBool(IJsonObject parent)
			: base(parent)
		{
		}
		public JsonDataBool(bool value, IJsonObject parent)
			: base(parent)
		{
			ValueBool = value;
		}
		#endregion
		public override object Value
		{
			get { return ValueBool; }
		}
		public override string JavaScript
		{
			get
			{
				return ValueBool ? "true" : "false";
			}
		}
		public bool ValueBool { get; set; }
		public override string ToString()
		{
			if (ValueBool)
				return "true";
			return "false";
		}
	}
	/// <summary>
	/// a json type representing a list of named json types
	/// </summary>
	public class JsonDataPropertyBag : Dictionary<string, IJsonValue>, IJsonObject
	{
		private IJsonObject _parent;
		public JsonDataPropertyBag(IJsonObject parent)
		{
			_parent = parent;
		}
		#region IJsonObject Members

		public IJsonObject Parent
		{
			get { return _parent; }
		}
		public EnumJsonDataType DataType
		{
			get { return EnumJsonDataType.PropertyBag; }
		}
		public string JavaScript
		{
			get
			{
				return this.ToString();
			}
		}

		public int ChildCount
		{
			get { return this.Count; }
		}

		#endregion

		public override string ToString()
		{
			StringBuilder sb = new StringBuilder();
			bool bf = true;
			sb.Append("{");
			foreach (KeyValuePair<string, IJsonValue> kv in this)
			{
				if (bf)
				{
					bf = false;
				}
				else
				{
					sb.Append(",");
				}
				sb.Append(kv.Key);
				sb.Append(":");
				if (kv.Value != null)
				{
					sb.Append(kv.Value.JavaScript);
				}
				else
				{
					sb.Append("null");
				}
			}
			sb.Append("}");
			return sb.ToString();
		}
	}
	/// <summary>
	/// a json type representing a dictionary with string keys
	/// </summary>
	public class JsonDataStringDictionary : Dictionary<string, object>, IJsonObject
	{
		private IJsonObject _parent;
		public JsonDataStringDictionary(IJsonObject parent)
		{
			_parent = parent;
		}

		#region IJsonObject Members

		public int ChildCount
		{
			get { return 0; }
		}

		#endregion

		#region IJsonValue Members

		public IJsonObject Parent
		{
			get { return _parent; }
		}

		public EnumJsonDataType DataType
		{
			get { return EnumJsonDataType.Value; }
		}
		public string JavaScript
		{
			get
			{
				StringBuilder sb = new StringBuilder();
				sb.Append("{");
				bool f = false;
				foreach (KeyValuePair<string, object> kv in this)
				{
					if (f)
						sb.Append(",");
					else
						f = true;
					sb.Append(kv.Key);
					sb.Append(":");
					if (kv.Value == null)
						sb.Append("null");
					else
					{
						sb.Append(kv.Value.ToString());
					}
				}
				sb.Append("}");
				return sb.ToString();
			}
		}
		#endregion
	}
	/// <summary>
	/// a json type representing a list of json types
	/// </summary>
	public class JsonDataArray : List<IJsonValue>, IJsonObject
	{
		private IJsonObject _parent;
		public JsonDataArray(IJsonObject parent)
		{
			_parent = parent;
		}
		public string JavaScript
		{
			get
			{
				StringBuilder sb = new StringBuilder();
				sb.Append("[");
				bool f = false;
				foreach (IJsonValue jv in this)
				{
					if (f)
						sb.Append(",");
					else
						f = true;
					sb.Append(jv.JavaScript);
				}
				sb.Append("]");
				return sb.ToString();
			}
		}
		public byte[] ToByteArray()
		{
			byte[] bs = new byte[this.Count];
			for (int i = 0; i < this.Count; i++)
			{
				JsonDataNumber jvn = this[i] as JsonDataNumber;
				if (jvn != null)
				{
					bs[i] = (byte)jvn.ValueNumber;
				}
			}
			return bs;
		}
		public string[] ToStringArray()
		{
			string[] bs = new string[this.Count];
			for (int i = 0; i < this.Count; i++)
			{
				JsonDataString jvn = this[i] as JsonDataString;
				if (jvn != null)
				{
					bs[i] = jvn.ValueString;
				}
			}
			return bs;
		}
		#region IJsonValue Members

		public EnumJsonDataType DataType
		{
			get { return EnumJsonDataType.Array; }
		}
		public IJsonObject Parent
		{
			get { return _parent; }
		}
		#endregion

		#region IJsonObject Members

		public int ChildCount
		{
			get { return this.Count; }
		}

		#endregion

		public override string ToString()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("[");
			if (this.Count > 0)
			{
				if (this[0] != null)
				{
					sb.Append(this[0].ToString());
				}
				else
				{
					sb.Append("null");
				}
				for (int i = 1; i < this.Count; i++)
				{
					sb.Append(",");
					if (this[i] != null)
					{
						sb.Append(this[i].ToString());
					}
					else
					{
						sb.Append("null");
					}
				}
			}
			sb.Append("]");
			return sb.ToString();
		}
	}
	/// <summary>
	/// json utility
	/// </summary>
	public static class Json
	{
		/// <summary>
		/// parse a json string into a json object
		/// </summary>
		/// <param name="jsonText">a json string</param>
		/// <returns>a json object</returns>
		public static IJsonObject StringToJson(string jsonText)
		{
			try
			{
				JavaScriptSerializer js = new JavaScriptSerializer();
				object v = js.DeserializeObject(jsonText);
				return createJsonObject(v, null);
			}
			catch (Exception err)
			{
				throw new Exception(string.Format(CultureInfo.InvariantCulture, "Error calling StringToJson. {0}", jsonText), err);
			}
		}
		/// <summary>
		/// convert a dataset to a json text
		/// </summary>
		/// <param name="ds">the dataset to be converted</param>
		/// <returns>a json text representing the dataset</returns>
		public static string DataSetToJsonText(DataSet ds)
		{
			JavaScriptSerializer js = new JavaScriptSerializer();
			return js.Serialize(new JsonDataSet(ds));
		}
		/// <summary>
		/// convert a .Net object to a json value
		/// </summary>
		/// <param name="v">the .Net object</param>
		/// <returns>a json value converted from the object</returns>
		public static IJsonValue ObjectToJsonValue(object v)
		{
			return createJsonValue(v, null);
		}
		/// <summary>
		/// convert a .Net object to a json value and place the json value as a child element of a parent json object
		/// </summary>
		/// <param name="v">the .Net object</param>
		/// <param name="parent">the parent json object</param>
		/// <returns>a json value converted from the .Net object</returns>
		private static IJsonValue createJsonValue(object v, IJsonObject parent)
		{
			if (v == null)
			{
				return new JsonDataNull(parent);
			}
			Type t = v.GetType();
			TypeCode tc = Type.GetTypeCode(t);
			switch (tc)
			{
				case TypeCode.Boolean:
					return new JsonDataBool((bool)v, parent);
				case TypeCode.Char:
				case TypeCode.String:
					return new JsonDataString(v.ToString(), parent);
				case TypeCode.DateTime:
					return new JsonDataDateTime((DateTime)v, parent);
				case TypeCode.DBNull:
					return new JsonDataNull(parent);
				case TypeCode.Decimal:
				case TypeCode.Double:
				case TypeCode.Single:
					return new JsonDataDecimal(Convert.ToDouble(v, CultureInfo.InvariantCulture), parent);
				case TypeCode.Byte:
				case TypeCode.Int16:
				case TypeCode.Int32:
				case TypeCode.Int64:
				case TypeCode.SByte:
				case TypeCode.UInt16:
				case TypeCode.UInt32:
				case TypeCode.UInt64:
					return new JsonDataNumber(Convert.ToInt64(v, CultureInfo.InvariantCulture), parent);
			}
			return createJsonObject(v, parent);
		}
		/// <summary>
		/// convert a .Net object to a json object and place the json object as a child element of a parent json object
		/// </summary>
		/// <param name="v">the .Net object</param>
		/// <param name="parent">the parent json object</param>
		/// <returns>a json object converted from the .Net object</returns>
		private static IJsonObject createJsonObject(object v, IJsonObject parent)
		{
			if (v == null)
			{
				return null;
			}
			else
			{
				object[] vs = v as object[];
				if (vs != null)
				{
					JsonDataArray ja = new JsonDataArray(parent);
					for (int i = 0; i < vs.Length; i++)
					{
						ja.Add(createJsonValue(vs[i], ja));
					}
					return ja;
				}
				else
				{
					Dictionary<string, object> dc = v as Dictionary<string, object>;
					if (dc != null)
					{
						JsonDataPropertyBag jp = new JsonDataPropertyBag(parent);
						foreach (KeyValuePair<string, object> kv in dc)
						{
							jp.Add(kv.Key, createJsonValue(kv.Value, jp));
						}
						return jp;
					}
					else
					{
						throw new ArgumentException(string.Format("Unsupported object: [{0}]. Value:[{1}]", v.GetType().FullName, v));
					}
				}
			}
		}
	}
	/// <summary>
	/// a dataset is a list of tables usually representing data from a database
	/// it can generate a json string to represent a dataset
	/// </summary>
	public class JsonDataSet
	{
		private static bool _debug;
		private static HttpResponse Response;
		public JsonDataSet()
		{
		}
		/// <summary>
		/// represent a .Net DataSet with a list of JsonDataTable objects
		/// </summary>
		/// <param name="ds"></param>
		public JsonDataSet(DataSet ds)
		{
			Locale = ds.Locale.LCID;
			DataSetName = ds.DataSetName;
			Tables = new JsonDataTable[ds.Tables.Count];
			if (_debug)
			{
				Response.Write(" table count:");
				Response.Write(ds.Tables.Count.ToString());
				Response.Write(" ");
			}
			JsonDataTable.SetDebugMode(_debug, Response);
			for (int i = 0; i < ds.Tables.Count; i++)
			{
				Tables[i] = new JsonDataTable(ds.Tables[i]);
			}
		}
		public string DataSetName { get; set; }
		public int Locale { get; set; }
		public JsonDataTable[] Tables { get; set; }
		public static void SetDebugMode(bool debug, HttpResponse process)
		{
			Response = process;
			_debug = debug;
		}
		/// <summary>
		/// add new tables from another dataset to this dataset
		/// a new table is a table whose name is not found in this dataset
		/// </summary>
		/// <param name="jds">the other dataset</param>
		public void MergeDataSet(JsonDataSet jds)
		{
			if (string.IsNullOrEmpty(DataSetName))
			{
				DataSetName = jds.DataSetName;
			}
			if (Locale == 0)
			{
				Locale = jds.Locale;
			}
			if (Tables == null)
			{
				Tables = jds.Tables;
			}
			else
			{
				if (jds.Tables != null && jds.Tables.Length > 0)
				{
					for (int i = 0; i < jds.Tables.Length; i++)
					{
						bool found = false;
						for (int j = 0; j < Tables.Length; j++)
						{
							if (string.Compare(jds.Tables[i].TableName, Tables[j].TableName, StringComparison.OrdinalIgnoreCase) == 0)
							{
								found = true;
								break;
							}
						}
						if (!found)
						{
							int n = Tables.Length;
							JsonDataTable[] newT = new JsonDataTable[n + 1];
							if (n > 0)
							{
								Tables.CopyTo(newT, 0);
							}
							newT[n] = jds.Tables[i];
							Tables = newT;
						}
					}
				}
			}
		}
		/// <summary>
		/// convert this dataset to a json string
		/// </summary>
		/// <returns>a json string representing this dataset</returns>
		public override string ToString()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("{");
			sb.Append("DataSetName="); sb.Append(DataSetName);
			sb.Append(",Tables=[");
			if (Tables != null && Tables.Length > 0)
			{
				sb.Append(Tables[0].ToString());
				for (int i = 1; i < Tables.Length; i++)
				{
					sb.Append(",");
					sb.Append(Tables[i].ToString());
				}
			}
			sb.Append("]");
			sb.Append("}");
			return sb.ToString();
		}
	}
	/// <summary>
	/// a column definition for a table
	/// </summary>
	public class JsonDataColumn
	{
		public JsonDataColumn()
		{
		}
		public string Name { get; set; }
		public bool ReadOnly { get; set; }
		public string Type { get; set; }
		/// <summary>
		/// convert the column definition to a json string
		/// </summary>
		/// <returns>a json string representing this column definition</returns>
		public override string ToString()
		{
			return string.Format(CultureInfo.InstalledUICulture, "{Name:{0},ReadOnly:{1},Type:{2}}", Name, ReadOnly, Type);
		}
	}
	/// <summary>
	/// a table 
	/// </summary>
	public class JsonDataTable
	{
		private static bool _debug;
		private static HttpResponse Response;
		public JsonDataTable()
		{
		}
		/// <summary>
		/// representing a .Net DataTable
		/// </summary>
		/// <param name="tb">the .Net table</param>
		public JsonDataTable(DataTable tb)
		{
			TableName = tb.TableName;
			CaseSensitive = tb.CaseSensitive;
			if (_debug)
			{
				Response.Write(" Columns: ");
				if (tb.Columns == null)
				{
					Response.Write("null ");
				}
				else
				{
					Response.Write(tb.Columns.Count.ToString());
				}
				Response.Write("<br>");
			}
			Columns = new JsonDataColumn[tb.Columns.Count];
			bool hasBlob = false;
			bool[] blobColumns = new bool[tb.Columns.Count];
			for (int i = 0; i < tb.Columns.Count; i++)
			{
				Columns[i] = new JsonDataColumn();
				Columns[i].Name = tb.Columns[i].ColumnName;
				Columns[i].ReadOnly = tb.Columns[i].ReadOnly;
				Columns[i].Type = tb.Columns[i].DataType.Name;
				if (typeof(byte[]).Equals(tb.Columns[i].DataType))
				{
					hasBlob = true;
					blobColumns[i] = true;
				}
				else
				{
					blobColumns[i] = false;
				}
			}
			if (tb.PrimaryKey != null)
			{
				PrimaryKey = new string[tb.PrimaryKey.Length];
				for (int i = 0; i < tb.PrimaryKey.Length; i++)
				{
					PrimaryKey[i] = tb.PrimaryKey[i].ColumnName;
				}
			}
			Rows = new JsonDataRow[tb.Rows.Count];
			for (int i = 0; i < tb.Rows.Count; i++)
			{
				if (hasBlob)
				{
					object[] vs = new object[Columns.Length];
					for (int c = 0; c < Columns.Length; c++)
					{
						if (blobColumns[c])
						{
							if (tb.Rows[i][c] != null && tb.Rows[i][c] != DBNull.Value)
							{
								string img = Convert.ToBase64String((byte[])tb.Rows[i][c]);
								vs[c] = img;
							}
							else
							{
								vs[c] = string.Empty;
							}
						}
						else
						{
							vs[c] = tb.Rows[i].ItemArray[c];
						}
					}
					Rows[i] = new JsonDataRow(vs);
				}
				else
				{
					Rows[i] = new JsonDataRow(tb.Rows[i].ItemArray);
				}
			}
		}
		public string TableName { get; set; }
		public bool CaseSensitive { get; set; }
		public JsonDataColumn[] Columns { get; set; }
		public string[] PrimaryKey { get; set; }
		public JsonDataRow[] Rows { get; set; }
		protected virtual void OnWriteToStringContent(StringBuilder sb)
		{
		}
		public static void SetDebugMode(bool debug, HttpResponse process)
		{
			Response = process;
			_debug = debug;
		}
		public JsonDataColumn GetColumnByName(string name)
		{
			if (Columns != null)
			{
				for (int i = 0; i < Columns.Length; i++)
				{
					if (string.Compare(name, Columns[i].Name, StringComparison.OrdinalIgnoreCase) == 0)
					{
						return Columns[i];
					}
				}
			}
			return null;
		}
		/// <summary>
		/// use a json string to represent this table
		/// </summary>
		/// <returns>a json string representing this table</returns>
		public override string ToString()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("{");
			sb.Append("TableName="); sb.Append(TableName);
			sb.Append(",CaseSensitive="); sb.Append(CaseSensitive.ToString());
			sb.Append(",Columns=[");
			if (Columns != null && Columns.Length > 0)
			{
				sb.Append(Columns[0]);
				for (int i = 1; i < Columns.Length; i++)
				{
					sb.Append(",");
					sb.Append(Columns[i].ToString());
				}
			}
			sb.Append("],PrimaryKey=[");
			if (PrimaryKey != null && PrimaryKey.Length > 0)
			{
				sb.Append(PrimaryKey[0]);
				for (int i = 1; i < PrimaryKey.Length; i++)
				{
					sb.Append(PrimaryKey[i]);
				}
			}
			sb.Append("],Rows=[");
			if (Rows != null && Rows.Length > 0)
			{
				sb.Append(Rows[0].ToString());
				for (int i = 1; i < Rows.Length; i++)
				{
					sb.Append(",");
					sb.Append(Rows[i].ToString());
				}
			}
			sb.Append("]");
			OnWriteToStringContent(sb);
			sb.Append("}");
			return sb.ToString();
		}
	}
	/// <summary>
	/// table with a row index
	/// </summary>
	public class JsonDataTableUpdate : JsonDataTable
	{
		public JsonDataTableUpdate()
		{
		}
		public long RowIndex { get; set; }
		protected override void OnWriteToStringContent(StringBuilder sb)
		{
			sb.Append(",RowIndex=");
			sb.Append(RowIndex.ToString(CultureInfo.InvariantCulture));
		}
	}
	/// <summary>
	/// a row in a table
	/// </summary>
	public class JsonDataRow
	{
		/// <summary>
		/// construct a row with an array of objects
		/// </summary>
		/// <param name="r"></param>
		public JsonDataRow(object[] r)
		{
			ItemArray = r;
		}
		public object[] ItemArray { get; set; }
		public void addColumnValue(int i, object v)
		{
			ItemArray[i] = v;
		}
		/// <summary>
		/// number of columns
		/// </summary>
		public int Count
		{
			get
			{
				if (ItemArray == null)
					return 0;
				return ItemArray.Length;
			}
		}
		/// <summary>
		/// create a json string to represent this row
		/// </summary>
		/// <param name="sb">a StringBuilder for holding the json string</param>
		protected virtual void OnWriteToStringContent(StringBuilder sb)
		{
			sb.Append("ItemArray=[");
			if (ItemArray != null && ItemArray.Length > 0)
			{
				sb.Append(ItemArray[0] == null ? "" : ItemArray[0].ToString());
				for (int i = 1; i < ItemArray.Length; i++)
				{
					sb.Append(",");
					sb.Append(ItemArray[i] == null ? "" : ItemArray[i].ToString());
				}
			}
			sb.Append("]");
		}
		/// <summary>
		/// create a json string to represent this row
		/// </summary>
		/// <returns>a json string representing this row</returns>
		public override string ToString()
		{
			StringBuilder sb = new StringBuilder();
			sb.Append("{");
			OnWriteToStringContent(sb);
			sb.Append("}");
			return sb.ToString();
		}
	}
	/// <summary>
	/// represents a modified row
	/// </summary>
	public class JsonDataRowUpdate : JsonDataRow
	{
		public JsonDataRowUpdate()
			: base(null)
		{
		}
		/// <summary>
		/// key values for identifying the modified row
		/// </summary>
		public object[] KeyValues { get; set; }
		/// <summary>
		/// gets and sets a Boolean indicating wether this row is deleted
		/// </summary>
		public bool Deleted { get; set; }
		/// <summary>
		/// gets and sets a Boolean indicating wether this row is a new row
		/// </summary>
		public bool Added { get; set; }
		/// <summary>
		/// create a json string to represent this row
		/// </summary>
		/// <param name="sb">a StringBuilder for holding the json string</param>
		protected override void OnWriteToStringContent(StringBuilder sb)
		{
			base.OnWriteToStringContent(sb);
			sb.Append(",Deleted="); sb.Append(Deleted.ToString());
			sb.Append(",Added="); sb.Append(Added.ToString());
			sb.Append(",KeyValues=[");
			if (KeyValues != null && KeyValues.Length > 0)
			{
				sb.Append(KeyValues[0] == null ? "" : KeyValues[0].ToString());
				for (int i = 1; i < KeyValues.Length; i++)
				{
					sb.Append(",");
					sb.Append(KeyValues[i] == null ? "" : KeyValues[i].ToString());
				}
			}
			sb.Append("]");
		}
	}
	/// <summary>
	/// it represents a server function to be executed
	/// </summary>
	public class RequestCommand
	{
		public RequestCommand()
		{
		}
		/// <summary>
		/// method name
		/// </summary>
		public string method { get; set; }
		/// <summary>
		/// method parameters
		/// </summary>
		public string value { get; set; }
		public override string ToString()
		{
			return string.Format(CultureInfo.InvariantCulture, "{0}({1})", method, value);
		}
	}
	/// <summary>
	/// base class for data exchange
	/// </summary>
	public abstract class WebExchange
	{
		public WebExchange()
		{
		}
		public JsonDataSet Data { get; set; }

	}
	/// <summary>
	/// client request 
	/// </summary>
	public class WebClientRequest : WebExchange
	{
		public WebClientRequest()
		{
			Calls = new RequestCommand[] { };
		}
		/// <summary>
		/// for accessing uploaded client values
		/// </summary>
		/// <param name="name">value name</param>
		/// <returns>value identified by the name</returns>
		public object this[string name]
		{
			get
			{
				return GetValue(name);
			}
			set
			{
				SetValue(name, value);
			}
		}
		/// <summary>
		/// server functions to be executed
		/// </summary>
		public RequestCommand[] Calls { get; set; }
		/// <summary>
		/// uploaded values
		/// </summary>
		public JsonDataPropertyBag values { get; set; }
		/// <summary>
		/// get client value by name
		/// </summary>
		/// <param name="name">value name</param>
		/// <returns>client value identified by the name</returns>
		public object GetValue(string name)
		{
			if (values != null)
			{
				IJsonValue ij;
				if (values.TryGetValue(name, out ij))
				{
					JsonDataValue jv = ij as JsonDataValue;
					if (jv != null)
					{
						return jv.Value;
					}
				}
			}
			return null;
		}
		/// <summary>
		/// set uploaded value by name
		/// </summary>
		/// <param name="name">value name</param>
		/// <param name="value">new value</param>
		public void SetValue(string name, object value)
		{
			if (values == null)
			{
				values = new JsonDataPropertyBag(null);
			}
			IJsonValue jv = Json.ObjectToJsonValue(value);
			if (values.ContainsKey(name))
			{
				values[name] = jv;
			}
			else
			{
				values.Add(name, jv);
			}
		}
		/// <summary>
		/// get a string array by name
		/// </summary>
		/// <param name="name">array name</param>
		/// <returns>a string array identified by the name</returns>
		public string[] GetStringArrayValue(string name)
		{
			if (values != null)
			{
				IJsonValue ij;
				if (values.TryGetValue(name, out ij))
				{
					JsonDataArray a = ij as JsonDataArray;
					if (a != null)
					{
						return a.ToStringArray();
					}
				}
			}
			return new string[] { };
		}
		/// <summary>
		/// get a string value by name
		/// </summary>
		/// <param name="name">value name</param>
		/// <returns>a string value identified by name</returns>
		public string GetStringValue(string name)
		{
			if (values != null)
			{
				IJsonValue ij;
				if (values.TryGetValue(name, out ij))
				{
					JsonDataString ds = ij as JsonDataString;
					if (ds != null)
					{
						return ds.ValueString;
					}
					JsonDataValue dv = ij as JsonDataValue;
					if (dv != null)
					{
						if (dv.Value == null)
						{
							return null;
						}
						return dv.Value.ToString();
					}
				}
			}
			return null;
		}
		/// <summary>
		/// get number of Calls
		/// </summary>
		/// <returns></returns>
		public int GetNumberOfCalls()
		{
			if (Calls == null)
			{
				return 0;
			}
			return Calls.Length;
		}
		protected virtual void OnParseJsonText(JsonDataPropertyBag prb)
		{
		}
		/// <summary>
		/// parse a json string to set contents of this object
		/// </summary>
		/// <param name="jsonText">a json string</param>
		public void FromJsonText(string jsonText)
		{
			Calls = new RequestCommand[] { };
			Data = null;
			if (!string.IsNullOrEmpty(jsonText))
			{
				JavaScriptSerializer js = new JavaScriptSerializer();
				IJsonObject jo = Json.StringToJson(jsonText); //parse the json string into a json object
				if (jo != null)
				{
					JsonDataPropertyBag prb = jo as JsonDataPropertyBag;
					if (prb != null) //the json object is supposed to be a property bag
					{
						IJsonValue jv;
						if (prb.TryGetValue("Calls", out jv)) //get Calls
						{
							JsonDataArray callsX = jv as JsonDataArray;
							if (callsX != null)
							{
								if (callsX.Count > 0)
								{
									Calls = new RequestCommand[callsX.Count];
									for (int i = 0; i < callsX.Count; i++)
									{
										Calls[i] = new RequestCommand();
										JsonDataPropertyBag pb = callsX[i] as JsonDataPropertyBag;
										if (pb != null)
										{
											if (pb.TryGetValue("method", out jv))
											{
												JsonDataString sv = jv as JsonDataString;
												if (sv != null)
												{
													Calls[i].method = sv.ValueString;
												}
											}
											if (pb.TryGetValue("value", out jv))
											{
												JsonDataString sv = jv as JsonDataString;
												if (sv != null)
												{
													Calls[i].value = sv.ValueString;
												}
											}
										}
									}
								}
							}
						}
						JsonDataArray clientData;
						IJsonValue jvalue;
						//get uploaded values
						if (prb.TryGetValue("values", out jvalue))
						{
							values = jvalue as JsonDataPropertyBag;
						}
						//get a data set, it can be data updates sent from the client
						if (prb.TryGetValue("Data", out jvalue))
						{
							clientData = jvalue as JsonDataArray;
							if (clientData != null)
							{
								Data = new JsonDataSet();
								Data.Tables = new JsonDataTable[clientData.Count];
								for (int i = 0; i < clientData.Count; i++)
								{
									JsonDataTableUpdate tbl = new JsonDataTableUpdate();
									Data.Tables[i] = tbl;
									if (clientData[i] != null)
									{
										JsonDataPropertyBag pb = clientData[i] as JsonDataPropertyBag;
										if (pb != null)
										{
											JsonDataArray rows;
											if (pb.TryGetValue("TableName", out jv))
											{
												JsonDataString name = jv as JsonDataString;
												Data.Tables[i].TableName = name.ValueString;
											}
											if (pb.TryGetValue("Columns", out jv))
											{
												JsonDataArray pbc = jv as JsonDataArray;
												if (pbc != null && pbc.Count > 0)
												{
													Data.Tables[i].Columns = new JsonDataColumn[pbc.Count];
													for (int c = 0; c < pbc.Count; c++)
													{
														Data.Tables[i].Columns[c] = new JsonDataColumn();
														JsonDataPropertyBag jsc = pbc[c] as JsonDataPropertyBag;
														if (jsc != null)
														{
															if (jsc.TryGetValue("Name", out jv))
															{
																JsonDataString jds = jv as JsonDataString;
																if (jds != null)
																{
																	Data.Tables[i].Columns[c].Name = jds.ValueString;
																}
															}
															if (jsc.TryGetValue("ReadOnly", out jv))
															{
																JsonDataBool jdb = jv as JsonDataBool;
																if (jdb != null)
																{
																	Data.Tables[i].Columns[c].ReadOnly = jdb.ValueBool;
																}
															}
															if (jsc.TryGetValue("Type", out jv))
															{
																JsonDataString jds = jv as JsonDataString;
																if (jds != null)
																{
																	Data.Tables[i].Columns[c].Type = jds.ValueString;
																}
															}
														}
													}
												}
											}
											if (pb.TryGetValue("PrimaryKey", out jv))
											{
												JsonDataArray pbc = jv as JsonDataArray;
												if (pbc != null && pbc.Count > 0)
												{
													Data.Tables[i].PrimaryKey = new string[pbc.Count];
													for (int c = 0; c < pbc.Count; c++)
													{
														Data.Tables[i].PrimaryKey[c] = pbc[c].ToString();
													}
												}
											}
											if (pb.TryGetValue("rowIndex", out jv))
											{
												JsonDataNumber jn = jv as JsonDataNumber;
												if (jn != null)
												{
													tbl.RowIndex = jn.ValueNumber;
												}
											}
											if (pb.TryGetValue("Rows", out jv))
											{
												rows = jv as JsonDataArray;
												if (rows != null)
												{
													Data.Tables[i].Rows = new JsonDataRow[rows.Count];
													for (int m = 0; m < rows.Count; m++)
													{
														JsonDataPropertyBag r = rows[m] as JsonDataPropertyBag;
														if (r != null)
														{
															JsonDataRowUpdate jdr = new JsonDataRowUpdate();
															Data.Tables[i].Rows[m] = jdr;
															if (r.TryGetValue("KeyValues", out jv))
															{
																JsonDataArray keys = jv as JsonDataArray;
																if (keys != null)
																{
																	jdr.KeyValues = new object[keys.Count];
																	for (int k = 0; k < keys.Count; k++)
																	{
																		if (keys[k] != null)
																		{
																			JsonDataValue jdv = keys[k] as JsonDataValue;
																			if (jdv != null)
																			{
																				jdr.KeyValues[k] = jdv.Value;
																			}
																		}
																	}
																}
															}
															if (r.TryGetValue("added", out jv))
															{
																if (((JsonDataBool)jv).ValueBool)
																{
																	jdr.Added = true;
																}
															}
															if (r.TryGetValue("deleted", out jv))
															{
																if (((JsonDataBool)jv).ValueBool)
																{
																	jdr.Deleted = true;
																}
															}
															if (r.TryGetValue("ItemArray", out jv))
															{
																JsonDataArray rowsData = jv as JsonDataArray;
																if (rowsData != null)
																{
																	Data.Tables[i].Rows[m].ItemArray = new object[rowsData.Count];
																	if (rowsData.Count > 0)
																	{
																		for (int c = 0; c < rowsData.Count; c++)
																		{
																			if (rowsData[c] != null)
																			{
																				JsonDataValue jv0 = rowsData[c] as JsonDataValue;
																				if (jv0 != null)
																				{
																					Data.Tables[i].Rows[m].ItemArray[c] = jv0.Value;
																				}
																				else
																				{
																					JsonDataArray jva = rowsData[c] as JsonDataArray;
																					if (jva != null)
																					{
																						Data.Tables[i].Rows[m].ItemArray[c] = jva.ToByteArray();
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
						OnParseJsonText(prb);
					}
				}
			}
		}
	}
	/// <summary>
	/// server response to the client
	/// </summary>
	public class WebServerResponse : WebExchange
	{
		public WebServerResponse()
		{
			Calls = new string[] { };
			disableCallback = false;
		}
		public string[] Calls { get; set; }
		public JsonDataStringDictionary values { get; set; }
		public string serverComponentName { get; set; }
		public bool disableCallback { get; set; }
		/// <summary>
		/// generate a json string as a server response to be sent to the client
		/// </summary>
		/// <returns>a json string</returns>
		public string ToJsonText()
		{
			JavaScriptSerializer js = new JavaScriptSerializer();
			return js.Serialize(this);
		}
	}
}
