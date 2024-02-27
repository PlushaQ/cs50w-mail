document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function change_view(view) {
 // Hide all views initially
 document.querySelector('#single-email-view').style.display = 'none';
 document.querySelector('#emails-view').style.display = 'none';
 document.querySelector('#compose-view').style.display = 'none';
 
 // Show the specified view
 if (view === 'single-email') {
   document.querySelector('#single-email-view').style.display = 'block';
 } else if (view === 'emails') {
   document.querySelector('#emails-view').style.display = 'block';
 } else if (view === 'compose') {
   document.querySelector('#compose-view').style.display = 'block';
 } else {
   console.error('Invalid view specified:', view);
 }
}


function compose_email() {

  // Show compose view and hide other views
  change_view('compose')

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function get_single_mail(email_id) {
  return fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(mail => {
      return mail;
  });
}

function change_read_status(mail) {
  return fetch(`/emails/${mail.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: !mail.read
    })
  })
}

function archive_mail(mail) {
  console.log(mail)
  return fetch(`/emails/${mail.id}`, {
  method: 'PUT',
  body: JSON.stringify(
    {
      archived: !mail.archived
    })
  }).then(
    load_mailbox('archive')
  )
}

function reply(mail) {
  change_view('compose')

  if (!mail.subject.startsWith('RE: ')){
    mail.subject = "RE: " + mail.subject
} 
  let body = `\n\n On the ${mail.timestamp} ${mail.sender} wrote: \n \t "${mail.body}"`

  document.querySelector('#compose-recipients').value = `${mail.sender}`;
  document.querySelector('#compose-subject').value = `${mail.subject}`;
  document.querySelector('#compose-body').value = `${body}`;
}

function show_single_email(mail) {
  singleEmailView = document.querySelector('#single-email-view');
  singleEmailView.innerHTML = `
  <div class="email-details">
  <p class="email-info"><span class="email-info-label">From:</span> ${mail.sender}</p>
  <p class="email-info"><span class="email-info-label">To:</span> ${mail.recipients.join(', ')}</p>
  <p class="email-info"><span class="email-info-label">Send on: </span>${mail.timestamp}</p>
  <h2 class="email-subject">Subject: ${mail.subject}</h2>
  <div class="email-body">${mail.body}</div>
  </div>
  <button id="reply-button" class="btn btn-primary">Reply</button> 
  <button id="archive-button" class="btn btn-${mail.archived ? "success": 'danger'}">${mail.archived ? 'Unarchive': 'Archive'}</button>
`
  document.querySelector('#archive-button').addEventListener('click', () => archive_mail(mail));
  document.querySelector('#reply-button').addEventListener('click', () => reply(mail))
}

function process_single_email(email_id) {
  change_view('single-email')

  get_single_mail(email_id)
  .then(mail => {
      if (!mail.read) {
        return change_read_status(mail)
          .then(() => mail);
      } else {
        return mail;
      }})
    .then(mail =>
      show_single_email(mail)
    )}

function get_emails_for_inbox(mailbox) {
  return fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails)
    return emails; 
});
}

function show_emails(mailbox) {
  const emailsView = document.getElementById('emails-view');
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  get_emails_for_inbox(mailbox)
  .then(emails => {
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      if (mailbox === 'sent') {
      emailDiv.innerHTML = `
        <span class="sender">To: ${email.recipients.join(', ')}</span><br>
        <span class="subject">Subject: ${email.subject}</span><br>
        <div class="body">${email.body}</div>
      `;}
      else {
        emailDiv.innerHTML = `
        <span class="sender">From: ${email.sender}</span><br>
        <span class="subject">Subject: ${email.subject}</span><br>
        <div class="body">${email.body}</div>
      `;
      }
      emailDiv.classList.add('email');
      emailDiv.classList.add(email.read ? 'read': 'unread');
      emailsView.appendChild(emailDiv);
      emailDiv.addEventListener('click', function () {
        process_single_email(email.id)
      })
    });
    })
  .catch(error => {
    console.error('Error fetching emails:', error);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  change_view('emails')

  // Show the mailbox name
  
  show_emails(mailbox)
}

function get_form_info () { 
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  return {
    recipients: recipients,
    subject: subject,
    body: body,
  }
}

function clear_form () {
  document.querySelector('#compose-recipients').value = "";
  document.querySelector('#compose-subject').value = "";
  document.querySelector('#compose-body').value = "";
}

function send_mail_to_server_and_return_response() {
  let mailInfo = get_form_info()

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify(mailInfo)
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });
}

function send_mail(event) {
  event.preventDefault();
  send_mail_to_server_and_return_response()
  clear_form()
  load_mailbox('sent')
}
