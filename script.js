document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('quoteForm');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const subject = encodeURIComponent(`Freelance Project Inquiry — ${data.get('service')}`);
  const body = encodeURIComponent(`Hi Victor,\n\nMy name is ${data.get('name')}.\n\nService: ${data.get('service')}\n\nProject details:\n${data.get('details')}\n\nMy email: ${data.get('email')}\n\nThanks!`);
  window.location.href = `mailto:victorfreelancebusiness@gmail.com?subject=${subject}&body=${body}`;
});
