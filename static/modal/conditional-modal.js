var SESSION_KEY = 'dialog-session';
var ONE_DAY_MILLI_SEC = 24 * 60 * 60 * 1000;

function openDialog() {

	if (sessionStorage) {
		var session = sessionStorage.getItem(SESSION_KEY);
		// open the dialog only every 24 hours
		if (session && Date.now() - session < ONE_DAY_MILLI_SEC) {
			return;
		}
	}

    var html = '<div class="modal" tabindex="-1" role="dialog" id="prototypeModal"><div class="modal-dialog modal-dialog-centered" role="document"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Welcome to the new Environment & Health Data Portal. </h5><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><div class="modal-body"><p>This prototype is a work in progress. That means that not all of the data or information is final. But, feel free to click around and explore.</p><p><strong>Please sign up for our email list</strong>. We will email you every few months with updates, or opportunities to participate in user research. <a href="https://docs.google.com/forms/d/e/1FAIpQLSfUg3JE5ODNc6aqBPJwM8mZ80TYtK6ISw-OM7PBwKuoN3M--g/viewform">Click here to sign up</a>.</p></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button></div></div></div></div>';

	var dialog = document.createElement('div');
	dialog.id = 'dialog';
	dialog.setAttribute('role', 'dialog');
	dialog.innerHTML = html;

	document.body.insertBefore(dialog, document.body.firstChild);
	document.body.classList.add('overflowHidden');

	setTimeout(function () {
		dialog.focus();
	}, 100);

	// var closeBtn = document.querySelector('.close-dialog');
	var closeBtn = document.querySelector('.btn');
	closeBtn.addEventListener('click', function () {
		var dialog = document.getElementById('dialog');
		document.body.removeChild(dialog);
		document.body.classList.remove('overflowHidden');
		if (sessionStorage) {
			sessionStorage.setItem(SESSION_KEY, Date.now());
		}
	});

	// keep focus in dialog
	// https://css-tricks.com/a-css-approach-to-trap-focus-inside-of-an-element/
	dialog.addEventListener('transitionend', function () {
		dialog.querySelector('iframe').focus();
	});
}

openDialog();