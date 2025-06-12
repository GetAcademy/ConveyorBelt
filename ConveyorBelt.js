/* conveyor-belt.js ------------------------------------------------------- */
class ConveyorBelt extends HTMLElement {
    static get observedAttributes() { return ['direction', 'autospawn']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>
        :host{display:inline-block;width:100px;height:100px;position:relative;
              overflow:hidden;border:1px solid #ccc}
        /* ---------- bånd ---------- */
        .belt{width:100%;height:100%;background-size:20px 20px;animation:1s linear infinite}
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
        /* ---------- koffert ---------- */
        .case{position:absolute;font-size:24px;animation:3s linear forwards}
        /* (x,y) er posisjonen til EMOJIENS ØVRE VENSTRE hjørne */
        /* 38 = 50 – 12 (midt minus halv bredde), 76 = 100 – 24           */
        /* 100×100 rute – emoji 24×24 – halv bredde = 12 px  */
        /* 100×100 rute – emoji 24×24 → midtkant til midtkant */
        @keyframes travel-up-right  { from { transform: translate(38px, 76px); } to { transform: translate(76px, 38px); } }
        @keyframes travel-down-right{ from { transform: translate(38px,-12px); } to { transform: translate(76px, 38px); } }
        @keyframes travel-up-left   { from { transform: translate(38px, 76px); } to { transform: translate(-12px,38px); } }
        @keyframes travel-down-left { from { transform: translate(38px,-12px); } to { transform: translate(-12px,38px); } }
      </style>
      <div class="belt"></div>
    `;
        this.belt = this.shadowRoot.querySelector('.belt');
    }

    /* ---------- lifecycle ---------- */
    connectedCallback() {
        this.#applyDir();
        /* autospawn én gang rett etter mount */
        if (this.hasAttribute('autospawn')) requestAnimationFrame(() => this.spawn());
    }
    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'direction' && oldVal !== newVal) this.#applyDir();
    }

    /* ---------- offentlig API ---------- */
    spawn() {
        const dir = this.direction;
        const s = document.createElement('span');
        s.textContent = '🧳';
        s.className = 'case';
        s.style.animationName = `travel-${dir}`;
        this.shadowRoot.append(s);
        s.addEventListener('animationend', () => {
            s.remove();
            this.#relay();
        }, { once: true });
    }

    /* ---------- helpers ---------- */
    get direction() { return (this.getAttribute('direction') || 'up-right').toLowerCase(); }
    #applyDir() { this.belt.className = `belt ${this.direction}`; }

    /* Bytt HELE #relay-metoden i conveyor-belt.js med denne: */

    #relay() {
        const m = /^([a-z])(\d+)$/i.exec(this.id || '');
        if (!m) return;                        // mangler / feil id

        let [, r, c] = m;
        let row = r.toLowerCase().charCodeAt(0);
        let col = parseInt(c, 10);

        switch (this.direction) {
            case 'up-right': row--; col++; break;
            case 'down-right': row++; col++; break;
            case 'up-left': row--; col--; break;
            case 'down-left': row++; col--; break;
        }

        /* Stopp hvis rad havner utenfor a–z eller kolonne blir negativ */
        if (row < 97 || row > 122 || col < 0) return;

        const nextId = String.fromCharCode(row) + col;

        /* Velg trygt via attributt-selektor (ingen SyntaxError) */
        const next = this.parentElement?.querySelector(
            `conveyor-belt[id="${CSS.escape(nextId)}"]`
        );
        next?.spawn?.();
    }

}

customElements.define('conveyor-belt', ConveyorBelt);
