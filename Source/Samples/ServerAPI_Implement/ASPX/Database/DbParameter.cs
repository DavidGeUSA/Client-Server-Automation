using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace Database
{
	/// <summary>
	/// parameter for executing a database command
	/// </summary>
	public class STI_DbParameter
	{
		public STI_DbParameter()
		{
		}
		public STI_DbParameter(string name, DbType type,int size, object value)
		{
			Name = name;
			DataType = type;
			Size = size;
			Value = value;
		}
		public string Name { get; set; }
		public DbType DataType { get; set; }
		public int Size { get; set; }
		public object Value { get; set; }
	}
}
