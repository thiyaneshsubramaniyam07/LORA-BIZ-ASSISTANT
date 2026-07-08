export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}

// Decodes web-safe base64 strings correctly handling UTF-8 characters
function decodeBase64Safe(data: string): string {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    try {
      return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
    } catch (err) {
      return "Failed to parse body content";
    }
  }
}

// Helper to recursively find plain or HTML text body in Gmail payload
function getMessageBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Safe(payload.body.data);
  }
  if (payload.parts) {
    // Try to find html first, then fallback to plain text
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Safe(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Safe(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.parts) {
        const body = getMessageBody(part);
        if (body) return body;
      }
    }
  }
  return "";
}

// Fetch list of message summaries
export async function listGmailMessages(token: string, query?: string): Promise<GmailMessage[]> {
  let url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10';
  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to retrieve Gmail inbox. Please check your credentials.');
  }

  const data = await res.json();
  const messages: any[] = data.messages || [];

  const detailedMessages = await Promise.all(
    messages.map(async (msg) => {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!detailRes.ok) return null;
        
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        return {
          id: detail.id,
          threadId: detail.threadId,
          snippet: detail.snippet || "",
          subject: getHeader("subject") || "(No Subject)",
          from: getHeader("from") || "(Unknown Sender)",
          to: getHeader("to") || "(Unknown Recipient)",
          date: getHeader("date") || "",
          body: getMessageBody(detail.payload) || detail.snippet || "",
        };
      } catch (err) {
        console.error(`Error fetching message details for ${msg.id}:`, err);
        return null;
      }
    })
  );

  return detailedMessages.filter((m): m is GmailMessage => m !== null);
}

// Send an actual email via Gmail
export async function sendGmailMessage(token: string, to: string, subject: string, body: string): Promise<any> {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body.replace(/\n/g, '<br>')
  ];

  const email = emailLines.join('\r\n');

  const base64Safe = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64Safe }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to dispatch email.');
  }

  return await res.json();
}
