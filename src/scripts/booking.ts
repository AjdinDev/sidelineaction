const bookingForm = document.querySelector<HTMLFormElement>('#booking-form');

if (bookingForm) {
  // Keep native browser validation as the no-JavaScript fallback. When this
  // script is active, use the form's inline error messages instead.
  bookingForm.noValidate = true;

  const status = bookingForm.querySelector<HTMLElement>('#form-status');
  const submit = bookingForm.querySelector<HTMLButtonElement>('#booking-submit');
  const dateInput = bookingForm.querySelector<HTMLInputElement>('#datum');

  if (dateInput) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    dateInput.min = localDate.toISOString().slice(0, 10);
  }

  const fieldWrapper = (input: HTMLElement): HTMLElement | null => input.closest<HTMLElement>('[data-field]');

  const validate = (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
    const wrapper = fieldWrapper(input);
    if (!wrapper) return true;
    const valid = input.checkValidity();
    wrapper.classList.toggle('has-error', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) input.removeAttribute('aria-describedby');
    else input.setAttribute('aria-describedby', `${input.id}-err`);
    return valid;
  };

  const setStatus = (kind: 'ok' | 'err', message: string): void => {
    if (!status) return;
    status.className = `form-status is-visible form-status--${kind}`;
    status.textContent = message;
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const inputs = [...bookingForm.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')];
  inputs.forEach((input) => {
    input.addEventListener('blur', () => {
      if (input.value) validate(input);
    });
    input.addEventListener('input', () => {
      if (fieldWrapper(input)?.classList.contains('has-error')) validate(input);
    });
  });

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status) status.className = 'form-status';

    const requiredInputs = inputs.filter((input) => input.required);
    const validationResults = requiredInputs.map((input) => ({ input, valid: validate(input) }));
    const firstInvalid = validationResults.find(({ valid }) => !valid)?.input;
    if (firstInvalid) {
      setStatus('err', 'Enkele velden zijn nog niet correct ingevuld. Kijk de aangeduide velden na.');
      firstInvalid.focus();
      return;
    }

    submit?.classList.add('is-loading');
    if (submit) submit.disabled = true;

    try {
      const response = await fetch(bookingForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(bookingForm),
      });
      const result: unknown = await response.json();
      const message = typeof result === 'object' && result !== null && 'message' in result && typeof result.message === 'string'
        ? result.message
        : null;

      if (!response.ok) throw new Error(message ?? 'De aanvraag kon niet worden verzonden.');
      setStatus('ok', message ?? 'Bedankt! Je aanvraag is verzonden.');
      bookingForm.reset();
      bookingForm.querySelectorAll('.has-error').forEach((element) => element.classList.remove('has-error'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'De aanvraag kon niet worden verzonden.';
      setStatus('err', `${message} Je kunt ook mailen naar harunviteskic50@gmail.com.`);
    } finally {
      submit?.classList.remove('is-loading');
      if (submit) submit.disabled = false;
    }
  });
}
