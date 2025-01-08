export default {
  async fetch(request, env, ctx) {
    // Ensure this Worker handles POST requests only
    if (request.method !== 'POST') {
      return new Response('Only POST requests are allowed', { status: 405 });
    }

    try {
      // Parse the incoming request JSON
      const requestData = await request.json();

      const { to, subject, text, html } = requestData;

      if (!to || !subject || !text) {
        return new Response(
          JSON.stringify({ error: "Missing 'to', 'subject', or 'text' in request body" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mailgun API details
      const apiKey = env.MAILGUN_API_KEY; // Use environment variables to store sensitive data
      const domain = env.MAILGUN_DOMAIN;
      const mailgunApiUrl = `https://api.mailgun.net/v3/${domain}/messages`;

      // Construct the email data
      const formData = new URLSearchParams();
      formData.append('from', `Your Name <mailgun@${domain}>`);
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('text', text);
      if (html) formData.append('html', html);

      // Send the request to Mailgun
      const response = await fetch(mailgunApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      // Check for Mailgun's response
      const mailgunResponse = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify(mailgunResponse), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ message: 'Email sent successfully!', details: mailgunResponse }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'An error occurred', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
