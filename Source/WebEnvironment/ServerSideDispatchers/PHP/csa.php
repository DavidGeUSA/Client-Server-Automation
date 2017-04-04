<?php
/*
	Client Server Automation Server Side Dispatcher for PHP
	Author: David Ge
	Date: 2015-02-10
	Description: it is a server side dispatcher for client server automation. csa.js connects to this file via Ajax
	Change history:
		09/05/2016 - with helps from stesie@brokenpipe.de (V8Js team), created an extended V8Js class, V8JsExt, which has methods AddHostType and SetHostValue.
									These two methods are used to call PHP implementations of the Server-Technology-Independent API.
									This file depends on V8JsExt.php.
*/

spl_autoload_register(function ($class) {
	$target = $_SERVER['SCRIPT_FILENAME'];
	$target = str_replace("\\","/",$target);
	$pos = strrpos($target,'/');
	if($pos === false)
	{
	}
	else
	{
		$target = substr($target,0,$pos);
	}
	include $target.'/libphp/' . $class . '.php';
});

function myErrorHandler($errno, $errstr, $errfile, $errline)
{
	if (!(error_reporting() & $errno)) {
		// This error code is not included in error_reporting
		return;
	}
	$e;
	echo "file:".$errfile.", line:".$errline."<br>";
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
	//return true;
	return false;
}
/*data uploaded to server*/
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
/*data to be downloaded to client*/
class WebServerResponse
{
	public $values;
	public $Calls = array();
	function __construct()
	{
		$this->values = new stdClass();
	}
}
/*server side dispatcher using PHP*/
class CsaPhp
{
	public $DEBUG = false; //debug mode flag
	protected $DEBUG_SYMBOL="F3E767376E6546a8A15D97951C849CE5"; //if client data begins with this symbol then it is in debug mode. when sending server response to client, send debug information first, followed by this symbol, and then the actual response
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
	public function ProcessClientRequest()
	{
		set_error_handler("myErrorHandler");
		$raw = '';
		//get uploaded data via form submission through an element "clientRequest"
		//this is for supporting file upload
		if (get_magic_quotes_gpc()) {
			$raw = stripslashes($_POST["clientRequest"]);
		}
		else {
			$raw = $_POST["clientRequest"];
		}
		if($raw === false || strlen($raw) == 0)
		{
			$raw = file_get_contents('php://input');
		}
		//echo 'raw:['; echo $eaw'; echo ']<br>';
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
				echo "Number of ServerTypes:";
				if($this->jsonFromClient->ServerTypes == null)
				{
					echo "0";
				}
				else
				{
					echo count($this->jsonFromClient->ServerTypes);
				}
				echo "<br>";
				echo "Number of ServerFiles:";
				if($this->jsonFromClient->ServerFiles == null)
				{
					echo "0";
				}
				else
				{
					echo count($this->jsonFromClient->ServerFiles);
				}
				echo "<br>";
				echo "clientvalues:";
				if($this->jsonFromClient->clientvalues == null)
				{
					echo "null";
				}
				else
				{
					echo count($this->jsonFromClient->clientvalues);
				}
				echo "<br>";
				echo "code:";
				if($this->jsonFromClient->code == null)
				{
					echo "null";
				}
				else
				{
					echo count($this->jsonFromClient->code);
				}
				echo "<br>";
			} //finish sending debug information
			//
			$this->OnRequestClientData();
			//
			$cl = $this->jsonFromClient;
			//
			//form server side JavaScript code to be executed:
			$sevrercode = '';
			//
			//load Server-Technology-Independent API in JavaScript files
			if (property_exists($cl,'ServerFiles'))
			{
				foreach($cl->ServerFiles as $idx => $sf)
				{
					$ftxt = file_get_contents("serverjs/". $sf);
					$sevrercode = $sevrercode. $ftxt;
				}
			}
			//"code" is not currently used in the Client Server Automation
			if (property_exists($cl,'code'))
			{
				$sevrercode = $sevrercode. $cl->code;
			}
			if ($this->DEBUG)
			{
				echo 'server code:<br>';
				echo $sevrercode;
				echo '<br>';
			}
			//create JavaScript engine
			$v8 = new V8JsExt();
			//add server-specific types used in the Server-Technology-Independent API
			//because the server technology is PHP, those server-specific types are PHP types
			if (property_exists($cl,'ServerTypes'))
			{
				foreach($cl->ServerTypes as $idx => $stp)
				{
					//add the PHP type to V8
					$cn = $stp;
					$pos = strpos($stp, '.');
					if($pos >= 0)
					{
						$cn = substr($stp, $pos+1);
					}
					if ($this->DEBUG)
					{
						echo 'add host type:'.$cn.'<br>';
					}
					try
					{
						$v8->AddHostType($cn, new $cn);
					}
					catch(\Exception $v8e)
					{
						echo "error loading PHP class:".$cn. "<br>";
					}
				}
			}
			//add download value collector
			$v8->executeString('var jsServer ={values:{},AddDownloadValue:function(vname,vvalue){jsServer.values[vname]=vvalue;}};');
			//add uploaded values to V8 to immitate an execution scope for the server code
			if (property_exists($cl,'clientvalues'))
			{
				$v8->executeString('var clientvalues={};');
				if ($this->DEBUG)
				{
					echo 'clientvalues:<br>';
				}
				foreach($cl->clientvalues as $idx => $sf)
				{
					$v8->SetHostValue('clientvalues["'. $idx.'"]', $sf);
					if ($this->DEBUG)
					{
						echo 'clientvalues["'. $idx.'"]='.$sf.'<br>';
					}
				}
				//for supporting server value enumerations
				if (property_exists($cl, 'usedkeys'))
				{
					$v8->executeString("clientvalues.usedkeys=[];");
					foreach($cl->usedkeys as $idx => $sf)
					{
						if (strlen($sf) != 0)
						{
							$v8->executeString("clientvalues.usedkeys.push('".$sf."');");
						}
					}
				}
			}
			//execute JavaScript code; all download values should be collected in $jsServer->values
			$v8->executeString($sevrercode);
			//get download values and assign them to response
			$vs = $v8->executeString('jsServer.values');
			$ps = get_object_vars($vs);
			if ($this->DEBUG)
			{
				echo 'download values:<br>';
			}
			foreach($ps as $name => $vl)
			{
				$this->response->values->{$name} = $vl;
				if ($this->DEBUG)
				{
					echo 'download value "'.$name.'"='.$vl.'<br>';
				}
			}
			$this->OnRequestFinish();
			//send response to client
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
//create server side dispatcher
$csa = new CsaPhp();
//process client request
$csa->ProcessClientRequest();
?>