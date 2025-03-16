async function findEmailsOnWebsite(url: string): Promise<string[]> {
  try {
    // Validate the URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Fetch the website content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content
    const htmlContent = await response.text();

    // Regular expression for email pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // Find all matches
    const emails = htmlContent.match(emailRegex) || [];
    // Return unique emails as an array
    return Array.from(new Set(emails));
  } catch (error) {
    console.error('Error while scraping website:', error);
    return [];
  }
}

// Usage example
async function main() {
  const targetUrl = "https://soneill.ie/";
  try {
    const emails = await findEmailsOnWebsite(targetUrl);
    
    if (emails.length > 0) {
      console.log(`Found ${emails.length} email addresses on ${targetUrl}:`);
      emails.forEach(email => console.log(`- ${email}`));
    } else {
      console.log(`No email addresses found on ${targetUrl}`);
      
      // Attempt to find and check contact page
      console.log("Attempting to check contact page...");
      const contactEmails = await findEmailsOnWebsite(`${targetUrl}/contact`);
      
      if (contactEmails.length > 0) {
        console.log(`Found ${contactEmails.length} email addresses on contact page:`);
        contactEmails.forEach(email => console.log(`- ${email}`));
      } else {
        console.log("No email addresses found on contact page either.");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();