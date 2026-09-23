/* Screenshot lightbox for the home page gallery.
   Uses event delegation so it survives Material's instant navigation. */
(function () {
	'use strict';

	var overlay = null;
	var items = [];
	var index = 0;

	function el(tag, cls, text) {
		var node = document.createElement(tag);
		if (cls) node.className = cls;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function render() {
		var img = overlay.querySelector('.ea-lightbox-img');
		var counter = overlay.querySelector('.ea-lightbox-counter');
		img.src = items[index].src;
		img.alt = items[index].alt;
		counter.textContent = (index + 1) + ' / ' + items.length;
	}

	function step(delta) {
		index = (index + delta + items.length) % items.length;
		render();
	}

	function onKey(e) {
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowRight') step(1);
		else if (e.key === 'ArrowLeft') step(-1);
	}

	function close() {
		if (!overlay) return;
		document.removeEventListener('keydown', onKey);
		overlay.remove();
		overlay = null;
		document.body.style.overflow = '';
	}

	function open(start) {
		if (overlay) return;
		items = Array.prototype.slice
			.call(document.querySelectorAll('.ea-gallery img'))
			.map(function (node) {
				return { src: node.src, alt: node.alt };
			});
		index = Math.max(0, items.findIndex(function (i) { return i.src === start.src; }));

		overlay = el('div', 'ea-lightbox');
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-label', items[index].alt || 'Screenshot');

		var img = el('img', 'ea-lightbox-img');
		img.src = items[index].src;
		img.alt = items[index].alt;
		var closeBtn = el('button', 'ea-lightbox-btn ea-lightbox-close', '✕');
		closeBtn.setAttribute('aria-label', 'Close');
		var prevBtn = el('button', 'ea-lightbox-btn ea-lightbox-prev', '‹');
		prevBtn.setAttribute('aria-label', 'Previous screenshot');
		var nextBtn = el('button', 'ea-lightbox-btn ea-lightbox-next', '›');
		nextBtn.setAttribute('aria-label', 'Next screenshot');

		overlay.append(prevBtn, img, nextBtn, closeBtn, el('div', 'ea-lightbox-counter'));
		document.body.appendChild(overlay);
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', onKey);

		closeBtn.addEventListener('click', close);
		prevBtn.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
		nextBtn.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
		overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

		render();
		closeBtn.focus();
	}

	document.addEventListener('click', function (e) {
		if (overlay) return;
		var img = e.target.closest ? e.target.closest('.ea-gallery img') : null;
		if (img) {
			e.preventDefault();
			open(img);
		}
	});
})();
