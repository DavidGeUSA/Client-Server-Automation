<?php
/*
	Client Server Automation Server Side Dispatcher for PHP
	Author: David Ge
	Date: 2015-02-10
	Description: it is a server side dispatcher for client server automation. csa.js connects to this file via Ajax
*/
//include_once 'libphp/FastJSON.class.php';
//include_once 'libPhp/fileutility.php';
spl_autoload_register(function ($class) {
	include $_SERVER['DOCUMENT_ROOT'].'/libphp/' . $class . '.php';
});
//function variableIsDefined($v)
//{
//	$defined_vars = get_defined_vars();
//	return array_key_exists($v, $defined_vars);
//}
$thisInstance;
function myErrorHandler($errno, $errstr, $errfile, $errline)
{
	if (!(error_reporting() & $errno)) {
		// This error code is not included in error_reporting
		return;
	}
	$e;
	switch ($errno) {
	case E_USER_ERROR:
		$e = "<b>My ERROR</b> [$errno] $errstr<br />\n  Fatal error on line $errline in file $errfile,  PHP ". PHP_VERSION ." ( ". PHP_OS . ")<br />\nAborting...<br />\n";
		$GLOBALS["debugError"] = $e;
		echo $e;
		exit(1);
		break;
	case E_USER_WARNING:
		$e = "<b>My WARNING</b> [$errno] $errstr<br />\n";
		$GLOBALS["debugError"] = $e;
		echo $e;
		break;
	case E_USER_NOTICE:
		$e = "<b>My NOTICE</b> [$errno] $errstr<br />\n";
		$GLOBALS["debugError"] = $e;
		echo $e;
		break;
	default:
		$e = "error type: [$errno] $errstr<br />\n";
		$GLOBALS["debugError"] = $e;
		echo $e;
		break;
	}
	/* Don't execute PHP internal error handler */
	return true;
}
class WebClientRequest
{
	public $ServerTypes = array();
	public $ServerFiles = array();
	public $clientvalues;
	public $code;
	function __construct()
	{
	}
}
class WebServerResponse
{
	public $values;
	public $Calls = array();
	function __construct()
	{
		$this->values = new stdClass();
	}
}
function startsWith($haystack, $needle) {
    // search backwards starting from haystack length characters from the end
    return $needle === "" || strrpos($haystack, $needle, -strlen($haystack)) !== false;
}

function endsWith($haystack, $needle) {
    // search forward starting from end minus needle length characters
    return $needle === "" || (($temp = strlen($haystack) - strlen($needle)) >= 0 && strpos($haystack, $needle, $temp) !== false);
}
class CsaPhp
{
	public $DEBUG = false;
	protected $DEBUG_SYMBOL="F3E767376E6546a8A15D97951C849CE5";
	protected $jsonFromClient; //a WebClientRequest from client
	protected $response;       //a WebServerResponse to be sent to the client
	function __construct()
	{
		$this->response	= new WebServerResponse();
	}
	protected function OnRequestStart()
	{
	}
	protected function OnRequestClientData()
	{
	}
	protected function OnRequestFinish()
	{
	}
	function CombinePath($p1, $p2)
	{
		if(strlen($p1) == 0)
			return $p2;
		if(strlen($p2) == 0)
			return $p1;
		if($p2{0} == '/' || $p2{0} == '\\')
		{
			if($p1{strlen($p1)-1} == '/' || $p1{strlen($p1)-1} == '\\')
			{
				return $p1.substr($p2, 1);
			}
			else
			{
				return $p1.$p2;
			}
		}
		else
		{
			if($p1{strlen($p1)-1} == '/' || $p1{strlen($p1)-1} == '\\')
			{
				return $p1.$p2;
			}
			else
			{
				return $p1.'/'.$p2;
			}
		}
	}
	function url_exists($url)
	{
		$file_headers = @get_headers($url);
		if($GLOBALS["debug"])
		{
			echo "header 0:".$file_headers[0]."<br>"; 
		}
		if($file_headers[0] == 'HTTP/1.1 404 Not Found') 
		{
			return false;
		}
		if($file_headers[0] == 'HTTP/1.0 404 Not Found') 
		{
			return false;
		}
		return true;
	}
	public function AddDownloadValue($name, $value)
	{
		//$this->init();
		$this->response->values->{$name} = $value;
	}
	function readfile($value)
	{
		$dir = dirname(realpath(__FILE__));
		if(endsWith($dir,'csapre'))
		{
			$dir = substr($dir, 0, -6);
		}
		if ($this->DEBUG)
		{
			echo "Reading file ".$value. " from dir ".$dir. "<br>";
		}
		$fn = $this->CombinePath($dir,$value);
		if(file_exists($fn))
		{
			if ($this->DEBUG)
			{
				echo "Reading file from ".$fn."<br>";
			}
			return file_get_contents($fn);
		}
		else
		{
			if ($this->DEBUG)
			{
				echo "file does not exist: ".$fn."<br>";
			}
		}
		return '';
	}
	function checkFileExist($value)
	{
		$dir = dirname(realpath(__FILE__));
		if ($this->DEBUG)
		{
			echo "Check file exist of ".$value." from ".$dir."<br>";
		}
		$fn = $this->CombinePath($dir,$value);
		if ($this->DEBUG)
		{
			echo "target file path:".$fn." <br>";
		}
		try
		{
			$fh = file_exists($fn);
			$this->AddDownloadValue('fileExists',$fh);
			return $fh;
		}
		catch(Exception $e)
		{
			$errMsg = "Error checking file exist ".$fn.". ".$e->getMessage();
			$this->AddDownloadValue('serverFailure',$errMsg);
			if ($this->DEBUG)
			{
				echo $errMsg."<br>";
			}
		}
		return false;
	}
	public function ProcessClientRequest()
	{
		$raw = file_get_contents('php://input');
		if($raw === false || strlen($raw) == 0)
		{
			//get uploaded data via form submission through an element "clientRequest"
			//this is for supporting file upload
			if (get_magic_quotes_gpc()) {
				$raw = stripslashes($_POST["clientRequest"]);
			}
			else {
				$raw = $_POST["clientRequest"];
			}
		}
		$debugLen = strlen($this->DEBUG_SYMBOL);
		if(strncmp($raw, $this->DEBUG_SYMBOL, $debugLen) == 0)
		{
			$this->DEBUG = true;
			$raw = substr($raw, $debugLen);
		}
		else
		{
			$this->DEBUG = false;
		}
		//
		$GLOBALS["debug"] = $this->DEBUG;
		$thisInstance = $this;
		set_error_handler("myErrorHandler");
		//
		if ($this->DEBUG)
		{
			echo "client request:".$raw."<br>";
		}
		$this->OnRequestStart();
		try
		{
			$this->jsonFromClient = json_decode($raw);
			if ($this->DEBUG)
			{
				echo "jsFile:";
				if($this->jsonFromClient->jsFile == null)
				{
					echo "null";
				}
				else
				{
					echo $this->jsonFromClient->jsFile;
				}
				echo "<br>";
			}
			$this->OnRequestClientData();
			if($this->jsonFromClient->jsFile != null)
			{
				$this->response->values->jsText = $this->readfile($this->jsonFromClient->jsFile);
			}
			$this->response->values->jsfile = $this->jsonFromClient->jsFile;
			/*
			$b = $this->checkFileExist($this->jsonFromClient->jsFile);
			if($b)
			{
				$this->response->values->jsText = 'var test="'.$this->jsonFromClient->jsFile.'"; var b=true;';
			}
			else
			{
				$this->response->values->jsText = 'var test="'.$this->jsonFromClient->jsFile.'"; var b=false;';
			}
			*/
			$this->OnRequestFinish();
			if ($this->DEBUG)
			{
				echo $this->DEBUG_SYMBOL;
			}
			echo json_encode($this->response);
		}
		catch (Exception $e) 
		{
			echo 'Server process exception: '.  $e->getMessage(). "<br>";
			echo $this->DEBUG_SYMBOL;
			echo json_encode($this->response);
		}
	}
}

$csa = new CsaPhp();
$csa->ProcessClientRequest();
?>