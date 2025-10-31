(() => {
  'use strict';

  const STYLE_ID = 'lyrics-select-style';
  const CSS = ':host, :root, *{ -webkit-user-select:text!important; user-select:text!important; }';

  const appendStyle = root => {
    try {
      if (!root) return;
      if (root.querySelector?.(`#${STYLE_ID}`)) return;

      const doc = root.ownerDocument || root;
      const s = doc.createElement('style');
      s.id = STYLE_ID;
      s.textContent = CSS;

      const parent =
        root.nodeType === 11 ? root :                
        root.head || root.documentElement || root.body ||
        root;

      parent.appendChild(s);
    } catch {}
  };

  appendStyle(document);

  const seen = new WeakSet();
  const walkShadows = r => {
    if (!r || seen.has(r)) return;
    seen.add(r);
    appendStyle(r);
    r.querySelectorAll?.('*').forEach(el => el.shadowRoot && walkShadows(el.shadowRoot));
  };

  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.shadowRoot) walkShadows(n.shadowRoot);
      n.querySelectorAll?.('*').forEach(el => el.shadowRoot && walkShadows(el.shadowRoot));
    }
  }).observe(document, { childList: true, subtree: true });

  const inject = code => {
    const s = document.createElement('script');
    s.textContent = code;
    (document.documentElement || document.head).appendChild(s);
    s.remove();
  };

  inject(`(() => {
    const ID=${JSON.stringify(STYLE_ID)}, CSS=${JSON.stringify(CSS)};
    const add = root => {
      try {
        if (root.querySelector && root.querySelector('#'+ID)) return;
        const s = document.createElement('style');
        s.id = ID; s.textContent = CSS;
        const parent = root.nodeType===11 ? root : (root.head || root.documentElement || root.body || root);
        parent.appendChild(s);
      } catch {}
    };

    add(document);

    const orig = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(init){
      const r = orig.call(this, init);
      add(r);
      return r;
    };

    const stop = e => e.stopImmediatePropagation();
    addEventListener('copy', stop, true);
    addEventListener('cut', stop, true);
    addEventListener('selectstart', stop, true);
  })();`);
})();