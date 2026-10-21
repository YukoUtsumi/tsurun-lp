(function(){
  /* ============ 固定CTA:ファーストビューのボタンと重ならないよう出し分け ============ */
  var heroCta = document.getElementById('heroCtaGroup');
  var fixedCta = document.querySelector('.mobile-fixed-cta');
  var orderSection = document.getElementById('order');
  if (!fixedCta || !('IntersectionObserver' in window)) return;

  var hiddenBy = { hero:false, order:false, foot:false };
  var footEl = document.querySelector('.site-footer');
  if (footEl) new IntersectionObserver(function(e){ hiddenBy.foot = e[0].isIntersecting; update(); }).observe(footEl);
  function update(){
    fixedCta.classList.toggle('is-hidden', hiddenBy.hero || hiddenBy.order || hiddenBy.foot);
  }
  if (heroCta) {
    new IntersectionObserver(function(entries){
      hiddenBy.hero = entries[0].isIntersecting; update();
    }, { threshold:0 }).observe(heroCta);
  }
  if (orderSection) {
    new IntersectionObserver(function(entries){
      hiddenBy.order = entries[0].isIntersecting; update();
    }, { threshold:0.15 }).observe(orderSection);
  }
})();

(function(){
  /* ============ スクロールでふわっと表示 ============ */
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.12 });
  targets.forEach(function(el){ io.observe(el); });
})();

(function(){
  /* ============ 申込フォーム:入力チェック(デモのため送信はしません) ============ */
  /* 申込データの送り先(Google Apps Script のウェブアプリURL)。空のあいだはデモ表示になり、送信されません */
  var GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbyPiR4-mtiFPGvC73v73sOmlVee1yoRijE4UejuFh6s2L0wQ55OWOTOiWj13LRS-XtLGg/exec";
  var form = document.getElementById('order-form');
  if (!form) return;
  var done = document.getElementById('order-done');
  var summary = document.getElementById('form-error-summary');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var TEL = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;
  var ids = ['name','email','tel','address','agree'];

  function check(id){
    var el = document.getElementById('f-' + id);
    var ok = true;
    if (id === 'email') ok = EMAIL.test(el.value.trim());
    else if (id === 'tel') ok = TEL.test(el.value.trim());
    else if (id === 'agree') ok = el.checked;
    else ok = el.value.trim().length > 0;
    var err = document.getElementById('err-' + id);
    if (err) err.classList.toggle('hidden', ok);
    if (el.type !== 'checkbox') el.classList.toggle('is-error', !ok);
    return ok;
  }

  ids.forEach(function(id){
    var el = document.getElementById('f-' + id);
    if (!el) return;
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function(){ check(id); });
    el.addEventListener('blur', function(){ check(id); });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var first = null;
    ids.forEach(function(id){
      if (!check(id) && !first) first = id;
    });
    if (first) {
      summary.classList.remove('hidden');
      var el = document.getElementById('f-' + first);
      el.scrollIntoView({ behavior:'smooth', block:'center' });
      el.focus({ preventScroll:true });
      return;
    }
    summary.classList.add('hidden');
    var payload = {
      flavor: (form.querySelector('input[name="flavor"]:checked') || {}).value || '',
      name: document.getElementById('f-name').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      tel: document.getElementById('f-tel').value.trim(),
      address: document.getElementById('f-address').value.trim(),
      website: (document.getElementById('f-website') || {}).value || '',
      submittedAt: new Date().toISOString()
    };
    var btn = document.getElementById('f-submit'), label = btn.textContent;
    function finish(isDemo){
      form.classList.add('hidden');
      done.classList.remove('hidden');
      var dn = document.getElementById('demo-note');
      if (dn) dn.classList.toggle('hidden', !isDemo);
      done.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    if (!GAS_ENDPOINT_URL) {
      console.warn('GAS_ENDPOINT_URL が未設定です。送信はされません(デモ表示)。', payload);
      btn.disabled = true; btn.textContent = '送信中…';
      setTimeout(function(){ finish(true); }, 500);
      return;
    }
    btn.disabled = true; btn.textContent = '送信中…';
    // GAS Webアプリは別ドメイン扱いのため no-cors で送る(失敗は通信エラーのときだけ検知できる)
    fetch(GAS_ENDPOINT_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function(){ finish(false); })
    .catch(function(){
      btn.disabled = false; btn.textContent = label;
      summary.textContent = '送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。';
      summary.classList.remove('hidden');
    });
  });
})();

(function(){
  /* ============ 写真の自動差し込み:画像ファイルがあるときだけ背景に使う ============ */
  document.querySelectorAll('[data-photo]').forEach(function(el){
    var img = new Image();
    img.onload = function(){
      el.classList.add('has-photo');
      if (el.classList.contains('photo-slot')) {
        var pic = document.createElement('img');
        pic.src = img.src;
        pic.alt = el.getAttribute('data-alt') || '';
        pic.loading = 'lazy';
        el.appendChild(pic);
      }
    };
    img.src = el.getAttribute('data-photo');
  });
})();

(function(){
  /* ============ 果物の写真(背景透過PNG)があれば、イラストから差し替える ============ */
  document.querySelectorAll('img[data-swap]').forEach(function(el){
    var test = new Image();
    test.onload = function(){ el.src = test.src; el.classList.add('is-photo'); };
    test.src = el.getAttribute('data-swap');
  });
})();

(function(){
  /* ============ 追加の動き(スクロール進捗・ヘッダー・表示の順番・数字) ============ */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.getElementById('scrollProgress'), header = document.querySelector('.site-header');
  var ticking = false;
  function onScroll(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;

  // 自動で「表示アニメ」をつける(HTMLを書き換えなくてOK)
  var groups = ['.worry-list li','.points-list > *','.scene-list li','.quality-list li','.voice-list > *','.price-points li','.flavor-card'];
  groups.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el, i){
      el.classList.add('reveal'); el.style.setProperty('--d', (i * 0.1) + 's');
      if (sel === '.scene-list li') el.classList.add(i % 2 ? 'from-right' : 'from-left');
    });
  });
  document.querySelectorAll('.section-eyebrow,.section-title,.section-lead,.reveal').forEach(function(el){
    if (el.classList.contains('is-visible')) return;
    if (!el.classList.contains('reveal')) { /* 見出し類 */ }
  });
  var io2 = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('is-visible'); io2.unobserve(en.target); } });
  }, { threshold:0.12 });
  document.querySelectorAll('.section-eyebrow,.section-title,.section-lead,.reveal:not(.is-visible)').forEach(function(el){ io2.observe(el); });

  // 数字のカウントアップ
  var nums = document.querySelectorAll('.price-num, .point-amount b');
  var io3 = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (!en.isIntersecting) return;
      io3.unobserve(en.target);
      var el = en.target, raw = el.textContent.trim();
      if (!/^\d[\d,]*$/.test(raw)) return;
      var end = parseInt(raw.replace(/,/g,''), 10), t0 = null, dur = 1100;
      function step(t){
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e).toLocaleString('ja-JP');
        if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
      }
      requestAnimationFrame(step);
    });
  }, { threshold:0.6 });
  nums.forEach(function(n){ io3.observe(n); });
})();
