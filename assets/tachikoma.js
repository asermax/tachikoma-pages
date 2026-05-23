(function () {
    var STORAGE_KEY = 'tachikoma_bot_username';

    // ── Action presets ──

    var PRESETS = {
        routines: [
            {"icon":"✓","label":"Done","cmd":"done {slug}"},
            {"icon":"⏭","label":"Skip","cmd":"skip {slug}"}
        ],
        reading: [
            {"icon":"📖","label":"Read","cmd":"read {slug}"},
            {"icon":"🗑","label":"Discard","cmd":"discard {slug}"}
        ],
        watch: [
            {"icon":"✓","label":"Watched","cmd":"watch {slug}"},
            {"icon":"🗑","label":"Discard","cmd":"discard {slug}"}
        ]
    };

    // ── Config ──

    function getBotUsername() {
        return localStorage.getItem(STORAGE_KEY) || '';
    }

    function setBotUsername(name) {
        localStorage.setItem(STORAGE_KEY, name.trim());
    }

    function buildDeepLink(command) {
        var username = getBotUsername();
        if (!username) return null;
        return 'https://t.me/' + username + '?text=' + encodeURIComponent(command);
    }

    function sendCommand(command) {
        var link = buildDeepLink(command);
        if (!link) {
            showSetupModal();
            return;
        }
        window.open(link, '_blank');
    }

    // ── Setup modal ──

    var overlay = null;

    function showSetupModal() {
        if (!overlay) createModal();
        var input = document.getElementById('tachi-bot-input');
        if (input) input.value = getBotUsername();
        overlay.style.display = 'flex';
        if (input) input.focus();
    }

    function hideSetupModal() {
        if (overlay) overlay.style.display = 'none';
    }

    function createModal() {
        overlay = document.createElement('div');
        overlay.className = 'tachi-overlay';

        var modal = document.createElement('div');
        modal.className = 'tachi-modal';

        modal.innerHTML =
            '<div class="tachi-modal-title">Tachikoma Setup</div>' +
            '<label class="tachi-modal-label" for="tachi-bot-input">Bot username</label>' +
            '<input id="tachi-bot-input" class="tachi-modal-input" type="text" placeholder="e.g. my_tachikoma_bot">' +
            '<div class="tachi-modal-btns">' +
            '  <button class="tachi-modal-btn tachi-modal-btn-primary" id="tachi-save">Save</button>' +
            '  <button class="tachi-modal-btn" id="tachi-cancel">Cancel</button>' +
            '</div>';

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        var input = document.getElementById('tachi-bot-input');

        document.getElementById('tachi-save').onclick = function () {
            setBotUsername(input.value);
            overlay.style.display = 'none';
            refreshActions();
        };
        document.getElementById('tachi-cancel').onclick = function () {
            overlay.style.display = 'none';
        };
        overlay.onclick = function (e) {
            if (e.target === overlay) overlay.style.display = 'none';
        };
    }

    // ── Action button injection ──
    // Declarative pattern: add data-tachi-actions and data-tachi-slug to any element.
    // data-tachi-actions='[{"icon":"📖","label":"Read","cmd":"read {slug}"}]'
    // Buttons are only rendered when a bot username is configured.

    function escAttr(s) {
        return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderActionsFor(el) {
        // Remove existing actions if any
        var existing = el.querySelector('.tachi-actions');
        if (existing) existing.remove();

        // Only show actions when bot username is configured
        if (!getBotUsername()) return;

        var raw = el.getAttribute('data-tachi-actions');
        var actionsDef = PRESETS[raw] || null;
        if (!actionsDef) {
            try { actionsDef = JSON.parse(raw); } catch (e) { return; }
        }
        var slug = el.getAttribute('data-tachi-slug') || '';

        var html = '<div class="tachi-actions">';

        for (var j = 0; j < actionsDef.length; j++) {
            var a = actionsDef[j];
            var cmd = a.cmd.replace(/\{slug\}/g, slug);
            html += '<span class="tachi-action" onclick="event.stopPropagation(); event.preventDefault()" data-tachi-command="' + escAttr(cmd) + '">' +
                a.icon + ' ' + escAttr(a.label) + '</span>';
        }
        html += '</div>';

        var meta = el.querySelector('.meta');
        if (meta) {
            meta.insertAdjacentHTML('beforebegin', html);
        } else {
            el.insertAdjacentHTML('beforeend', html);
        }
    }

    function refreshActions() {
        var containers = document.querySelectorAll('[data-tachi-actions]');
        for (var i = 0; i < containers.length; i++) {
            renderActionsFor(containers[i]);
        }
    }

    // Global click handler for all .tachi-action buttons
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.tachi-action');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        var cmd = btn.getAttribute('data-tachi-command');
        if (cmd) sendCommand(cmd);
    });

    // ── CSS ──

    var css = document.createElement('style');
    css.textContent =
        '.tachi-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);' +
        'z-index:10000;align-items:center;justify-content:center}' +
        '.tachi-modal{background:#fff;border-radius:12px;padding:1.5rem;max-width:360px;' +
        'width:90%;box-shadow:0 8px 30px rgba(0,0,0,0.2)}' +
        '.tachi-modal-title{font-size:1.1rem;font-weight:600;margin-bottom:1rem}' +
        '.tachi-modal-label{display:block;font-size:0.85rem;color:#666;margin-bottom:0.3rem}' +
        '.tachi-modal-input{width:100%;padding:0.5rem 0.75rem;border:1px solid #ddd;' +
        'border-radius:8px;font-size:0.95rem;margin-bottom:1rem;box-sizing:border-box}' +
        '.tachi-modal-input:focus{outline:none;border-color:#667eea}' +
        '.tachi-modal-btns{display:flex;gap:0.5rem;justify-content:flex-end}' +
        '.tachi-modal-btn{padding:0.4rem 1rem;border-radius:6px;border:1px solid #ddd;' +
        'background:#fff;cursor:pointer;font-size:0.9rem}' +
        '.tachi-modal-btn:hover{background:#f5f5f5}' +
        '.tachi-modal-btn-primary{background:#667eea;color:#fff;border-color:#667eea}' +
        '.tachi-modal-btn-primary:hover{background:#5a6fd6}' +
        '.tachi-actions{display:flex;gap:0.4rem;margin-top:0.5rem}' +
        '.tachi-action{display:inline-flex;align-items:center;gap:0.2rem;' +
        'padding:0.2rem 0.55rem;border-radius:10px;font-size:0.72rem;cursor:pointer;' +
        'user-select:none;border:1px solid rgba(0,0,0,0.12);background:rgba(255,255,255,0.7);' +
        'color:#666;transition:all 0.15s;' +
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif}' +
        '.tachi-action:hover{background:rgba(0,0,0,0.06);color:#333}';
    document.head.appendChild(css);

    // ── Init ──

    // ── Public API ──

    window.Tachikoma = {
        get: getBotUsername,
        set: setBotUsername,
        send: sendCommand,
        setup: showSetupModal,
        refresh: refreshActions,
    };
})();
