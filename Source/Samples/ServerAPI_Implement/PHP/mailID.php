<?php
if(!defined('_mailCrendential_')) {
   die('Direct access not permitted');
}

function GetMailConfig($mailServerID, $mailer)
{
	if($mailServerID == 'webMail1')
	{
		$mailer->SMTP_Server = '';
		$mailer->SMTP_Port = 25;
		$mailer->SMTP_Authenticate = false;
		$mailer->SMTP_Secure = ''; //ssl, tls or empty
		$mailer->SMTP_UserName = '';
		$mailer->SMTP_Password = '';
		$mailer->MailSender = 1; //0:SMTP, 1:PHP, 2:Qmail, 3:SendMail, 
	}
}
?>