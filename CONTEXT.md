# Client Management System

1. Leads Database
Fields:
Name
Company
Email
Phone
Segment

2. Email Campaigns
Segment-Based Campaigns:
Ability to create and manage email campaigns targeted to leads grouped by their segment.
Email Sequence Management:
Define a sequence of emails for each campaign.
Configure the order and content of emails to be sent over time.
Dynamic Personalization:
Use placeholders (e.g., {{name}}, {{company}}) to dynamically insert the lead’s personal details into the email content.
Scheduling:
Ability to schedule the sending of each email in the sequence.
Edit or update the scheduled time for individual emails.
Cronjob Functionality:
Leverage GitHub Actions to run scheduled tasks (i.e., send emails based on their scheduled times).

3. Email Interaction Management
Inbox Scanning for Replies:
Monitor the connected email inbox for any replies to campaign emails.
Automatically remove leads from the ongoing email campaign if they reply.
Flag these leads for manual follow-up.

4. Email Tracking and Analytics
Open Tracking:
Track whether an email has been opened by the recipient.
Record the number of times each email is opened.
Display this tracking data within the CRM dashboard for easy review.

5. Integration & Automation
GitHub Actions:
Use GitHub Actions for scheduling email sending tasks (cronjob functionality).
Dynamic Data Handling:
Ensure the system dynamically handles lead data for personalized email content.
Update lead status based on interactions (e.g., remove from campaign upon reply).

