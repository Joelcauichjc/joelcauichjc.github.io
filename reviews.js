(() => {
  const settings = window.LIFES_REVIEWS || {};
  const url = String(settings.url || '').replace(/\/$/, '');
  const key = String(settings.publishableKey || '');
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && key.startsWith('sb_publishable_');
  const list = document.querySelector('#reviews-list');
  const form = document.querySelector('#review-form');
  const status = document.querySelector('#review-status');
  const button = form.querySelector('button[type="submit"]');
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('error', error); };
  const showEmpty = message => { list.replaceChildren(); const p = document.createElement('p'); p.className = 'reviews-empty'; p.textContent = message; list.append(p); };
  const renderReviews = (reviews, demo = false) => {
    if (!reviews.length) { showEmpty(demo ? 'Aquí aparecerá tu reseña de prueba cuando la envíes.' : 'Aún no hay reseñas publicadas. ¡Sé la primera persona en contar su experiencia!'); return; }
    list.replaceChildren();
    reviews.forEach(review => {
      const article = document.createElement('article'); article.className = 'review-card';
      if (demo) { const note = document.createElement('small'); note.className = 'demo-badge'; note.textContent = 'VISTA DE PRUEBA · SOLO EN ESTE NAVEGADOR'; article.append(note); }
      const stars = document.createElement('span'); stars.className = 'review-stars'; stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating); stars.setAttribute('aria-label', `${review.rating} de 5 estrellas`);
      const quote = document.createElement('p'); quote.textContent = review.comment;
      const photos = Array.isArray(review.photos_data) ? review.photos_data : (review.photo_data ? [review.photo_data] : []);
      const gallery = document.createElement('div'); gallery.className = 'review-gallery';
      photos.slice(0, 5).forEach((data, index) => {
        if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data)) return;
        const photo = document.createElement('img'); photo.className = 'review-photo';
        photo.src = data; photo.alt = `Foto ${index + 1} compartida por ${review.name}`; photo.loading = 'lazy';
        gallery.append(photo);
      });
      const meta = document.createElement('div'); meta.className = 'review-meta';
      const name = document.createElement('strong'); name.textContent = review.name;
      const tour = document.createElement('span'); tour.textContent = review.tour;
      meta.append(name, tour); article.append(stars, quote); if (gallery.childElementCount) article.append(gallery); article.append(meta); list.append(article);
    });
  };
  const payloadFromForm = () => ({
    name: form.elements.name.value.trim(),
    tour: form.elements.tour.value,
    rating: Number(form.elements.rating.value),
    comment: form.elements.comment.value.trim()
  });
  async function compressPhoto(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      throw new Error('Elige fotos JPG, PNG o WebP de hasta 8 MB cada una.');
    }
    let bitmap;
    try { bitmap = await createImageBitmap(file); }
    catch { throw new Error('No pudimos abrir esta foto. Prueba con otra imagen JPG o PNG.'); }
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let data = canvas.toDataURL('image/jpeg', 0.7);
    if (data.length > 165000) data = canvas.toDataURL('image/jpeg', 0.45);
    if (data.length > 165000) {
      const reduced = document.createElement('canvas');
      const smaller = Math.min(1, 720 / Math.max(canvas.width, canvas.height));
      reduced.width = Math.max(1, Math.round(canvas.width * smaller));
      reduced.height = Math.max(1, Math.round(canvas.height * smaller));
      reduced.getContext('2d').drawImage(canvas, 0, 0, reduced.width, reduced.height);
      data = reduced.toDataURL('image/jpeg', 0.4);
    }
    if (data.length > 165000) throw new Error('Una foto sigue siendo demasiado grande. Elige otra o reduce su tamaño.');
    return data;
  }
  async function photosFromForm() {
    const files = Array.from(form.elements.photo.files);
    if (files.length > 5) throw new Error('Puedes subir hasta 5 fotos por reseña.');
    const photos = [];
    for (const file of files) photos.push(await compressPhoto(file));
    return photos;
  }

  if (!ready) {
    const demoReviews = [];
    const notice = document.createElement('p'); notice.className = 'demo-notice';
    notice.textContent = 'Modo de prueba: puedes enviar una reseña y verla aquí. No se guardará ni será visible para otros visitantes.';
    form.before(notice);
    renderReviews(demoReviews, true);
    setStatus('Modo de prueba activo. La reseña desaparecerá al cerrar o recargar esta página.');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (form.elements.website.value.trim()) { form.reset(); return; }
      const review = payloadFromForm();
      if (review.name.length < 2 || review.comment.length < 15) { setStatus('Revisa tu nombre y escribe al menos 15 caracteres.', true); return; }
      button.disabled = true;
      try { review.photos_data = await photosFromForm(); }
      catch (error) { setStatus(error.message, true); button.disabled = false; return; }
      demoReviews.unshift(review);
      renderReviews(demoReviews, true);
      form.reset();
      button.disabled = false;
      setStatus('Reseña y fotos de prueba mostradas. No se enviaron ni guardaron para otros visitantes.');
    });
    return;
  }

  const endpoint = `${url}/rest/v1/reviews`;
  const headers = { apikey: key };
  async function loadReviews() {
    try {
      const response = await fetch(`${endpoint}?select=name,tour,rating,comment,photos_data,created_at&order=created_at.desc&limit=12`, { headers });
      if (!response.ok) throw new Error('No se pudieron cargar las reseñas');
      renderReviews(await response.json());
    } catch { showEmpty('No pudimos cargar las reseñas en este momento. Intenta de nuevo más tarde.'); }
  }
  loadReviews();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.elements.website.value.trim()) { setStatus('Gracias por compartir tu experiencia.'); form.reset(); return; }
    const last = Number(localStorage.getItem('lifes_review_sent_at') || 0);
    if (Date.now() - last < 60000) { setStatus('Espera un minuto antes de enviar otra reseña.', true); return; }
    const payload = payloadFromForm();
    if (payload.name.length < 2 || payload.comment.length < 15) { setStatus('Revisa tu nombre y escribe al menos 15 caracteres.', true); return; }
    button.disabled = true; setStatus('Preparando fotos y enviando reseña…');
    try {
      payload.photos_data = await photosFromForm();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('No se pudo enviar');
      localStorage.setItem('lifes_review_sent_at', String(Date.now()));
      form.reset(); setStatus('¡Gracias! Recibimos tu reseña. Aparecerá aquí cuando la revisemos.');
    } catch (error) { setStatus(/^(Elige|No pudimos|Una foto|Puedes subir)/.test(error.message) ? error.message : 'No se pudo enviar tu reseña. Intenta de nuevo más tarde.', true); }
    finally { button.disabled = false; }
  });
})();
