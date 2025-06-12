/* conveyor-belt.js ------------------------------------------------------- */
class ConveyorBelt extends HTMLElement {
    static get observedAttributes() { return ['direction', 'autospawn']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host{display:inline-block;width:100px;height:100px;position:relative;
              overflow:hidden;border:1px solid #ccc}

        /* ───── Båndets bakgrunn (samme som du allerede har) ───── */
        .belt{width:100%;height:100%;background-size:20px 20px;animation:2.4s linear infinite}
        .up-right,.down-left {background-image:repeating-linear-gradient(135deg,#666 0 10px,#999 10px 20px)}
        .up-left ,.down-right{background-image:repeating-linear-gradient( 45deg,#666 0 10px,#999 10px 20px)}
        @keyframes belt-up-right  {from{background-position:0 0}to{background-position: 20px -20px}}
        @keyframes belt-down-right{from{background-position:0 0}to{background-position: 20px  20px}}
        @keyframes belt-up-left   {from{background-position:0 0}to{background-position:-20px -20px}}
        @keyframes belt-down-left {from{background-position:0 0}to{background-position:-20px  20px}}
        .up-right  {animation-name:belt-up-right}
        .down-right{animation-name:belt-down-right}
        .up-left   {animation-name:belt-up-left}
        .down-left {animation-name:belt-down-left}

        /* ───── Koffert ───── */
        .case{
          position:absolute;
          top:50%; left:50%;               /* sentrert ankerpunkt  */
          font-size:24px;                  /* 🧳 24×24 px           */
          animation:6s linear forwards;
        }

        /* midten → ±100 / ∓100 px  (én regel per retning) */
        @keyframes travel-up-right  {from{transform:translate(-50%,-50%) translate(-100px, 100px);}
                                     to  {transform:translate(-50%,-50%) translate( 100px,-100px);}}
        @keyframes travel-down-right{from{transform:translate(-50%,-50%) translate(-100px,-100px);}
                                     to  {transform:translate(-50%,-50%) translate( 100px, 100px);}}
        @keyframes travel-up-left   {from{transform:translate(-50%,-50%) translate( 100px, 100px);}
                                     to  {transform:translate(-50%,-50%) translate(-100px,-100px);}}
        @keyframes travel-down-left {from{transform:translate(-50%,-50%) translate( 100px,-100px);}
                                     to  {transform:translate(-50%,-50%) translate(-100px, 100px);}}
      </style>
      <div class="belt"></div>
    `;
        this.belt = this.shadowRoot.querySelector('.belt');
    }

    /* ---------- lifecycle ---------- */
    connectedCallback() {
        this.#applyDir();
        if (this.hasAttribute('autospawn')) requestAnimationFrame(() => this.spawn());
    }
    attributeChangedCallback(name, ov, nv) {
        if (name === 'direction' && ov !== nv) this.#applyDir();
    }

    /* ---------- offentlig API ---------- */
    spawn() {
        /* 1. Lag kofferten i denne ruten */
        const s = document.createElement('span');
        s.textContent = '🧳';
        s.className = 'case';
        s.style.animationName = `travel-${this.direction}`;
        this.shadowRoot.append(s);

        /* 2. Finn neste belte (før vi trenger det) */
        const next = this.#findNextBelt();

        /* 3. Hvor lenge varer animasjonen? */
        const durationSec = parseFloat(getComputedStyle(s).animationDuration) || 6;  // 6 s fallback
        const handoffMs = durationSec * 0.55 * 1000;   // ca. når kofferten forlater ruten

        /* 4. Planlegg overlevering → ingen synlig pause */
        if (next?.spawn) {
            setTimeout(() => next.spawn(), handoffMs);
        }

        /* 5. Rydd denne kofferten når den er HELT ferdig */
        s.addEventListener('animationend', () => s.remove(), { once: true });
    }

    /* helper – uendret logikk, bare flyttet ut av spawn() */
    #findNextBelt() {
        const m = /^([a-z])(\d+)$/i.exec(this.id || '');
        if (!m) return null;
        let [, r, c] = m;
        let row = r.charCodeAt(0), col = +c;
        switch (this.direction) {
            case 'up-right': col++; break;
            case 'down-right': row++; break;
            case 'down-left': col--; break;
            case 'up-left': row--; break;
        }
        const nextId = String.fromCharCode(row) + col;
        return this.parentElement?.querySelector(`conveyor-belt[id="${CSS.escape(nextId)}"]`);
    }


    /* ---------- helpers ---------- */
    get direction() { return (this.getAttribute('direction') || 'up-right').toLowerCase(); }
    #applyDir() { this.belt.className = `belt ${this.direction}`; }

    #relay() {
        const m = /^([a-z])(\d+)$/i.exec(this.id || ''); if (!m) return;
        let [, r, c] = m; let row = r.charCodeAt(0), col = +c;

        /* VIDEREFØR etter kardinal­delen av retningen */
        switch (this.direction) {
            case 'up-right': col++; break;   // bare høyre
            case 'down-right': row++; break;   // bare ned
            case 'down-left': col--; break;   // bare venstre
            case 'up-left': row--; break;   // bare opp
        }

        const nextId = String.fromCharCode(row) + col;
        const next = this.parentElement?.querySelector(
            `conveyor-belt[id="${CSS.escape(nextId)}"]`
        );
        console.log(`ConveyorBelt: ${this.id} → ${nextId}`);
        next?.spawn?.();
    }
}
customElements.define('conveyor-belt', ConveyorBelt);
