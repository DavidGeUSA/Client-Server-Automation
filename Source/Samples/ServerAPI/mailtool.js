//server-technology-independent API - do not remove this line
// it is for providing web mail function, it depends on a MailSender which is supposed to be implemented using supported server technologies
//
SendMail.prototype.RunAt = true;//run-at flag to indicate a server object
SendMail.prototype.ServerTypes = ['WebMail.STI_MailSender'];//server implement information
function SendMail(mailServerID) {
	var _err;
	return {
		send: function (subject, mailbody, recipients, from, files) {
			var mailSender = new STI_MailSender();
			mailSender.SetMailServer(mailServerID);
			if (files && typeof (files) != 'string' && files.length > 0) {
				var fs = '';
				for (var i = 0; i < files.length; i++) {
					if (files[i]) {
						if (typeof (files[i].filepath) != 'undefined') {
							if (fs.length == 0) {
								fs = files[i].filepath;
							}
							else {
								fs += ';';
								fs += files[i].filepath;
							}
						}
						else {
							if (fs.length == 0) {
								fs = files[i];
							}
							else {
								fs += ';';
								fs += files[i];
							}
						}
					}
				}
				mailSender.Send(subject, mailbody, recipients, from, fs);
			}
			else {
				mailSender.Send(subject, mailbody, recipients, from, files);
			}
			_err = mailSender.ErrorMessage();
			return _err;
		},
		ErrorMessage: function () {
			return _err;
		}
	}
}