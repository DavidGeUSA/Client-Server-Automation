<?php
if(!defined('_dataCrendential_')) {
   die('Direct access not permitted');
}
class Credential
{
	public $host;
	public $user;
	public $password;
	public $database;
}
function GetDatabaseConfig($dbServerID)
{
	$cr = new Credential();
	if($dbServerID == 'database1')
	{
		$cr->host = 'localhost';
		$cr->user = 'root';
		$cr->password = '123';
		$cr->database = 'test1';
	}
	return $cr;
}
?>