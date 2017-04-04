<?php
class Filerec
{
	public $lastModifiedDate;
	public $name;
	public $size;
	public $type;
	public $filepath;
	public $fileerror;
}
class STI_ServerFileAPI
{
	public function SaveTo($tempFilePath, $targetFolder, $filename)
	{
		//assume this PHP file is in libPHP folder under current web folder 
		$target = $_SERVER['SCRIPT_FILENAME'];
		$target = str_replace("\\","/",$target);
		$pos = strrpos($target,'/');
		$target = substr($target,0,$pos);
		$target = $target.'/'.$targetFolder.$filename;
		if($GLOBALS["debug"])
		{
			echo "tmp file:". $tempFilePath. ", target file:". $target."<br>";
		}
		move_uploaded_file($tempFilePath, $target);
		return $target;
	}
	public function GetUploadedFiles()
	{
		$a = array();
		foreach ($_FILES as $f)
		{
			$fr = new Filerec();
			$fr->name = $f['name'];
			$fr->size = $f['size'];
			$fr->type = $f['type'];
			$fr->filepath = $f['tmp_name'];
			$fr->fileerror = $f['error'];
			$a[] = $fr;
		}
		return $a;
	}
}
?>