class CryptoTips extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'})
        // Styles
        const styles = document.createElement('style');
        styles.innerHTML = require('./styles/style.scss');
        this.shadowRoot.append(styles);

        // Content
        const template = document.createElement('template');
        template.innerHTML = require('./crypto-tips.html');
        this.shadowRoot.appendChild(template.content);
    }

    connectedCallback() {
    }
}

customElements.define('crypto-tips', CryptoTips)
