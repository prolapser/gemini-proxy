const PROXY_URL = 'https://generativelanguage.googleapis.com';

const harmCategory = [
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_HARASSMENT",
  // "HARM_CATEGORY_CIVIC_INTEGRITY",
];

const safetySettings = harmCategory.map(category => ({
  category,
  threshold: "OFF",
}));

export default defineEventHandler(async event => {
  const url = getRequestURL(event);
  const headers = getRequestHeaders(event);
  const body = await readRawBody(event);
  let requestBody;

  try {
    requestBody = JSON.parse(body);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return await sendFetchRequest(url, headers, body, event);
  }

  // Modify the request based on the URL
  if (url.pathname.includes('/openai/')) {
    delete requestBody.safetySettings;
  } else {
    requestBody.safetySettings = safetySettings;
  }

  const updatedBody = JSON.stringify(requestBody);

  // Log the outgoing request details
  console.log('Outgoing request:');
  console.log('URL:', PROXY_URL + url.pathname + url.search);
  console.log('Headers:', headers);
  console.log('Body:', updatedBody);

  return await sendFetchRequest(url, headers, updatedBody, event);
});

async function sendFetchRequest(url, headers, body, event) {
  try {
    const res = await fetch(PROXY_URL + url.pathname + url.search, {
      method: event.method,
      headers: headers,
      body,
    });

    console.log(`Request to ${url.pathname} succeeded with status: ${res.status}`);
    const responseText = await res.text();
    console.log('Response body:', responseText);

    return new Response(responseText, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  } catch (error) {
    console.error(`Error during fetch request to ${url.pathname}:`, error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
