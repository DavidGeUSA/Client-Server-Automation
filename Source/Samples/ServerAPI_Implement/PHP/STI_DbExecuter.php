<?php
define('_dataCrendential_', TRUE);
include_once "DbCredential.php";
class DbParameter
{
	public $name;
	public $type;
	public $value;
	public $size;
	public function PhpType()
	{
		if($this->type == 2 || $this->type == 3 || ($this->type>=10 && $this->type <=12) || $this->type == 14 || $this->type==18||$this->type==19||$this->type==20)
			return "i";
		if($this->type==4||$this->type==7||$this->type==8||$this->type==15||$this->type==21)
			return "d";
		if($this->type==1)
			return "b";
		return "s";
	}
	public function PhpValue()
	{
		if($this->type == 5 || $this->type == 6 || $this->type == 26 || $this->type == 27)
		{
			$dt;
			//return $this->value;//"2016-03-03";
			$n = strpos($this->value, "(");
			if($n === FALSE)
			{
				$dt = new DateTime($this->value);
			}
			else
			{
				$dm = substr($this->value, 0, $n);
				$dt = new DateTime($dm);
			}
			return $dt->format('Y-m-d H:i:s');
		}
		return $this->value;
	}
}
class STI_DbExecuter
{
	private $params;
	private $cr;
	private $errorMessage;
	private $DEBUG;
	private $lastAutonum;
	function __construct()
	{
		$this->params = array();
		$this->errorMessage = '';
		$this->DEBUG = true;
	}
	public function LastAutoNumber()
	{
		return $this->lastAutonum;
	}
	public function SetConnect($connectID)
	{
		$this->cr = GetDatabaseConfig($connectID);
	}
	public function AddParamValue($name, $type, $size, $value)
	{
		$a = new DbParameter();
		$a->name = $name;
		$a->type = $type;
		$a->size = $size;
		$a->value = $value;
		$this->params[] = $a;
	}
	private function substituteParamName($qry)
	{
		$parts = explode("@", $qry);
		$pn = count($parts);
		if($pn > 1)
		{
			$q = $parts[0];
			for($i=1;$i<$pn;$i++)
			{
				$n = strpos($parts[$i], ",");
				if($n === FALSE)
				{
					$n = strpos($parts[$i], " ");
					if($n === FALSE)
					{
						$n = strpos($parts[$i], ")");
					}
				}
				if($n === FALSE)
				{
					$q = $q." ?";
				}
				else
				{
					$q = $q." ?".substr($parts[$i],$n);
				}
			}
			return $q;
		}
		return $qry;
	}
	public function Execute($query)
	{
		$this->errorMessage = '';
		//subtitute @[name] with ?
		$query = $this->substituteParamName($query);
		//
		$mysqli = new mysqli($this->cr->host, $this->cr->user, $this->cr->password, $this->cr->database);
		if (mysqli_connect_errno()) {
			$this->errorMessage = "Connect failed: ".mysqli_connect_error();
			return $this->errorMessage;
		}
		//
		$stmt = $mysqli->stmt_init();
		if($mysqli->errno)
		{
			$this->errorMessage = "MySql: stmt_init failed:". $mysqli->error;
			if($this->DEBUG)
			{
				echo "MySql: stmt_init failed:". $mysqli->error. " <br>";
			}
			return $this->errorMessage;
		}
		if ($stmt->prepare($query)) 
		{
			
			$st = "";
			$pn = count($this->params);
			if($this->DEBUG)
			{
				echo "MySql: parameter count:". $pn. "<br>";
			}
			
			if($pn > 0)
			{
				$pvs = array();
				$bindpV[] = &$st;
				for($i=0;$i<$pn;$i++)
				{
					if($this->DEBUG)
					{
						echo "MySql: parameter ". $i. " type:". $this->params[$i]->PhpType(). "  value:". $this->params[$i]->PhpValue(). "<br>";
					}
					
					$st = $st.(($this->params[$i])->PhpType());
					
					$pvs["p".strval($i)] = $this->params[$i]->PhpValue();
					
					$bindpV[] = &$pvs["p".strval($i)];
					
				}
				
				call_user_func_array(array($stmt,'bind_param'),$bindpV);
				
			}
			
			$stmt->execute();
			
			if($mysqli->errno)
			{
				$this->errorMessage = "MySql: execute failed:". $mysqli->error;
				if($this->DEBUG)
				{
					echo "MySql: execute failed:". $mysqli->error. " <br>";
				}
			}
			else
			{
				//
				if($this->DEBUG)
				{
					echo "MySql: finish execute.<br>";
				}
				//
				$mysqli->commit();
				//
				if($mysqli->errno)
				{
					$this->errorMessage = "MySql: commit failed:". $mysqli->error;
					if($this->DEBUG)
					{
						echo "MySql: commit failed:". $mysqli->error. " <br>";
					}
				}
				else
				{
					//
					if($this->DEBUG)
					{
						echo "MySql: committed.<br>";
					}
					//$lastAutonum
				}
			}
			//
			// Free resultset
			$stmt->free_result();
			$stmt->close();
			if($this->errorMessage == "")
			{
				if(strtolower(substr($query, 0, 7)) == 'insert ')
				{
					$stmt = $mysqli->stmt_init();
					if($this->DEBUG)
					{
						echo "MySql after insert: stmt_init finished. <br>";
					}
					if($mysqli->errno)
					{
						if($this->DEBUG)
						{
							echo "MySql after insert: stmt_init failed:". $mysqli->error. " <br>";
						}
					}
					if ($stmt->prepare('SELECT LAST_INSERT_ID();')) 
					{
						if($this->DEBUG)
						{
							echo "MySql after insert: prepare autonumber query finished. <br>";
						}
						$stmt->execute();
					}
					else
					{
						if($this->DEBUG)
						{
							echo "MySql after insert: prepare autonumber query failed. <br>";
						}
					}
					//
					if($mysqli->errno)
					{
						if($this->DEBUG)
						{
							echo "MySql after insert: execute failed:". $mysqli->error. " <br>";
						}
					}
					//
					if($this->DEBUG)
					{
						echo "MySql after insert: execute finished. <br>";
					}
					//
					$meta = $stmt->result_metadata();
					if ($column = $meta->fetch_field())
					{
						$bindVarsArray[] = &$results[$column->name];
					}
					call_user_func_array(array($stmt, 'bind_result'), $bindVarsArray);
					if($stmt->fetch())
					{
						$autoNum = 0;
						foreach($results as $key => $value)
						{
							$autoNum = $value;
						}
						if($this->DEBUG)
						{
							echo "MySql auto number: ". $autoNum. "<br>";
						}
						$this->lastAutonum = $autoNum;
					}
					// Free resultset
					$stmt->free_result();
					$stmt->close();
				}
			}
		}
		else
		{
			$this->errorMessage = "MySql: prepare query failed. ". $mysqli->error;
			if($this->DEBUG)
			{
				echo "MySql: prepare query failed. <br>";
				echo $mysqli->error;
				echo "<br>";
			}
		}
		//
		// Closing connection
		$mysqli->close();
		return $this->errorMessage;
	}
}
?>