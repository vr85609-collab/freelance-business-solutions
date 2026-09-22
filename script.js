document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('quoteForm');
const formStatus = document.getElementById('formStatus');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  formStatus.textContent = 'Sending your project request…';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === 'false' || result.success === false) {
      throw new Error(result.message || 'Submission failed');
    }

    form.reset();
    formStatus.textContent = 'Thank you! Your project request was sent successfully. Victor will follow up by email.';
  } catch (error) {
    formStatus.textContent = 'The request could not be sent. Please email victorfreelancebusiness@gmail.com directly.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
