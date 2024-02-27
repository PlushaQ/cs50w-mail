document.addEventListener('DOMContentLoaded', function() {

  // Event listeners for navigation buttons
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

// Function to change the view (e.g., emails, single email, compose)
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

// Function to display the compose email form
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

function change_archive_status(mail) {
  console.log(mail)
  return fetch(`/emails/${mail.id}`, {
  method: 'PUT',
  body: JSON.stringify(
    {
      archived: !mail.archived
    })
  }).then( () => {
    if (!mail.archived) {
    load_mailbox('archive')
  }
  else {
    load_mailbox('inbox')
  }}
  )
}

// Function to populate the compose form for replying to an email
function reply(mail) {
  change_view('compose')

  // Check if the subject starts with "RE: " and add it if not
  if (!mail.subject.startsWith('RE: ')){
    mail.subject = "RE: " + mail.subject
} 
  // Create body for reply including original message 
  let body = `\n\n On the ${mail.timestamp} ${mail.sender} wrote: \n \t "${mail.body}"`

  // Populate compose form fields with reply information
  document.querySelector('#compose-recipients').value = `${mail.sender}`;
  document.querySelector('#compose-subject').value = `${mail.subject}`;
  document.querySelector('#compose-body').value = `${body}`;
}

// Function to display a single email
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
  // Add event listeners for reply and archive buttons
  document.querySelector('#archive-button').addEventListener('click', () => change_archive_status(mail));
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


// Function to fetch emails for a specific mailbox
function get_emails_for_inbox(mailbox) {
  return fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails)
    return emails; 
});
}

// Function to display emails in a mailbox
function show_emails(mailbox) {
  const emailsView = document.getElementById('emails-view');
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  get_emails_for_inbox(mailbox)
  .then(emails => {
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      // Display sent emails differently
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
      // Add read/unread class based on email status
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
