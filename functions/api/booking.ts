const MAX_BODY_BYTES = 16_384;
const ALLOWED_APPLICANT_TYPES = new Set(['club', 'individuele-speler', 'anders']);

interface Booking {
  applicantType: string;
  clubName: string;
  contactName: string;
  email: string;
  date: string;
  startTime: string;
  location: string;
  extra: string;
}

function jsonResponse(message: string, status: number): Response {
  return Response.json({ message }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function respond(request: Request, message: string, status: number): Response {
  if (request.headers.get('Accept')?.includes('application/json')) {
    return jsonResponse(message, status);
  }

  if (status >= 200 && status < 300) {
    return Response.redirect(new URL('/bedankt', request.url), 303);
  }

  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function parseBooking(formData: FormData): Booking {
  return {
    applicantType: textField(formData, 'type-aanvrager'),
    clubName: textField(formData, 'clubnaam'),
    contactName: textField(formData, 'contactpersoon'),
    email: textField(formData, 'email').toLowerCase(),
    date: textField(formData, 'datum'),
    startTime: textField(formData, 'starttijd'),
    location: textField(formData, 'locatie'),
    extra: textField(formData, 'extra'),
  };
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function todayInBrussels(): string {
  const parts = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Brussels',
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function validateBooking(booking: Booking): string | null {
  if (!ALLOWED_APPLICANT_TYPES.has(booking.applicantType)) return 'Kies een geldig type aanvraag.';
  if (booking.contactName.length < 2 || booking.contactName.length > 100) return 'Vul een geldige naam in.';
  if (booking.clubName.length > 120) return 'De club- of ploegnaam is te lang.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) || booking.email.length > 254) return 'Vul een geldig e-mailadres in.';
  if (!isValidIsoDate(booking.date)) return 'Kies een geldige datum.';
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.startTime)) return 'Vul een geldig startuur in.';
  if (booking.location.length < 2 || booking.location.length > 200) return 'Vul een geldige locatie in.';
  if (booking.extra.length > 2_000) return 'De extra informatie is te lang.';

  if (booking.date < todayInBrussels()) return 'De datum mag niet in het verleden liggen.';
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

function formatApplicantType(value: string): string {
  return {
    club: 'Club',
    'individuele-speler': 'Individuele speler',
    anders: 'Anders',
  }[value] ?? value;
}

function emailText(booking: Booking): string {
  return [
    'Nieuwe boekingsaanvraag via sidelineaction.be',
    '',
    `Type: ${formatApplicantType(booking.applicantType)}`,
    `Club of ploeg: ${booking.clubName || 'Niet opgegeven'}`,
    `Contactpersoon: ${booking.contactName}`,
    `E-mail: ${booking.email}`,
    `Datum: ${formatDisplayDate(booking.date)}`,
    `Startuur: ${booking.startTime}`,
    `Locatie: ${booking.location}`,
    `Extra informatie: ${booking.extra || 'Niet opgegeven'}`,
  ].join('\n');
}

function emailHtml(booking: Booking): string {
  const rows = [
    ['Type', formatApplicantType(booking.applicantType)],
    ['Club of ploeg', booking.clubName || 'Niet opgegeven'],
    ['Contactpersoon', booking.contactName],
    ['E-mail', booking.email],
    ['Datum', formatDisplayDate(booking.date)],
    ['Startuur', booking.startTime],
    ['Locatie', booking.location],
    ['Extra informatie', booking.extra || 'Niet opgegeven'],
  ];

  const tableRows = rows
    .map(([label, value]) => `<tr><th align="left" style="padding:6px 16px 6px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`)
    .join('');

  return `<h1>Nieuwe boekingsaanvraag</h1><p>Er is een nieuwe aanvraag verstuurd via sidelineaction.be.</p><table>${tableRows}</table>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const request = context.request;
  const requestId = crypto.randomUUID();
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (origin && origin !== requestUrl.origin) {
    return respond(request, 'Deze aanvraag is niet toegestaan.', 403);
  }

  const declaredLength = Number.parseInt(request.headers.get('Content-Length') ?? '0', 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return respond(request, 'De aanvraag is te groot.', 413);
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.startsWith('multipart/form-data') && !contentType.startsWith('application/x-www-form-urlencoded')) {
    return respond(request, 'Ongeldig formulierformaat.', 415);
  }

  let formData: FormData;
  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return respond(request, 'De aanvraag is te groot.', 413);
    }
    formData = await new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body,
    }).formData();
  } catch {
    return respond(request, 'Het formulier kon niet worden gelezen.', 400);
  }

  if (textField(formData, 'website')) {
    return respond(request, 'Bedankt! Je aanvraag is verzonden.', 200);
  }

  const booking = parseBooking(formData);
  const validationError = validateBooking(booking);
  if (validationError) return respond(request, validationError, 400);

  try {
    const result = await context.env.BOOKING_EMAIL.send({
      to: context.env.BOOKING_TO_EMAIL,
      from: {
        email: context.env.BOOKING_FROM_EMAIL,
        name: 'Sideline Action website',
      },
      replyTo: booking.email,
      subject: `Nieuwe boekingsaanvraag van ${booking.contactName}`,
      text: emailText(booking),
      html: emailHtml(booking),
    });

    console.log(JSON.stringify({
      event: 'booking_email_sent',
      requestId,
      messageId: result.messageId,
    }));

    return respond(request, 'Bedankt! Je aanvraag is verzonden. Ik neem zo snel mogelijk contact met je op.', 200);
  } catch (error) {
    const errorCode = error instanceof Error && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'UNKNOWN';
    console.error(JSON.stringify({
      event: 'booking_email_failed',
      requestId,
      errorCode,
    }));
    return respond(request, 'De aanvraag kon niet worden verzonden.', 503);
  }
};

export const onRequestGet: PagesFunction<Env> = () => new Response(null, {
  status: 405,
  headers: { Allow: 'POST' },
});
