<?php

class V8JsExt extends V8Js
{
	private $typeExporter;
	private $setters = [];
	public function AddHostType($name, $type)
	{
		if ($this->typeExporter === null)
		{
			$this->typeExporter = $this->executeString('(function(typeName, instance) { this[typeName] = instance.constructor; })');
		}
		$func = $this->typeExporter;
		$func($name, $type);
	}
	public function SetHostValue($variable, $value)
	{
		if(!array_key_exists ($variable, $this->setters))
		{
			$this->setters[$variable] = $this->executeString('(function(value){'.$variable.'=value;})');
		}
		$func = $this->setters[$variable];
		$func($value);
	}
}
?>