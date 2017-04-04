/*
	C# implementation of FileAPI defined in FileAPIserver.js
 */
using JScriptInterface;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace FileAPI
{
	public class STI_ServerFileAPI
	{
		public string SaveTo(string tempFilePath, string targetFolder, string filename)
		{
			//find out current web folder
			string fileTarget = string.Format(CultureInfo.InvariantCulture, "{0}{1}", targetFolder, filename);
			File.Move(tempFilePath, fileTarget);
			return fileTarget;
		}
		public FileRec[] GetUploadedFiles()
		{
			//ClearScript uses a different AppDomain to run this code,
			//it takes too much trouble marshalling between app domains.
			//JavaScriptServer will insert uploaded file list, named httpUploadedFiles, into JavaScript scope,
			//so, this function is not needed
			//see FileAPIserver.js to see how httpUploadedFiles is used
			return new FileRec[]{};
		}
	}
	public class FileRec
	{
		public DateTime fileDate { get; set; }
		public string filename { get; set; }
		public int filesize { get; set; }
		public string filetype { get; set; }
		public string filepath { get; set; }
		public string fileerror { get; set; }
	}
}
