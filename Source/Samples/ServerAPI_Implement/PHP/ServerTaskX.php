<?php
class ServerTaskX
{
	public function Func1($var1, $idx2)
	{
		return 'Server call Func1(var1='. $var1. ', idx2='. $idx2. ')';
	}
	public function Func2($var1, $idx2, $idx3)
	{
		return 'Calling Func2 with var1='. $var1. ', idx2='. $idx2. ' and idx3='. $idx3;
	}
}
?>