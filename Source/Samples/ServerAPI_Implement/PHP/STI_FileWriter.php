<?php
class STI_FileWriter
{
	private $filepath;
	function SetFile($file)
	{
		//assume this PHP file is in libPHP folder under current web folder 
		$target = $_SERVER['SCRIPT_FILENAME'];
		$target = str_replace("\\","/",$target);
		$pos = strrpos($target,'/');
		$target = substr($target,0,$pos);
		$this->filepath = $target.'/'.$file;
	}
	public function append($contents)
	{
		file_put_contents($this->filepath, $contents, FILE_APPEND | LOCK_EX);
	}
}
?>