import detectEthereumProvider from '@metamask/detect-provider'

// const ETHCurrency = new Intl.NumberFormat(navigator.language, {
//     style: 'currency', currency: 'ETH', minimumFractionDigits: 3
// });

// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

class CryptoTips extends HTMLElement {
    #provider: any;
    #address: string;
    #root: ShadowRoot;
    #steps: Map<string, HTMLFormElement | HTMLDivElement>;

    constructor() {
        super();
        this.#root = this.attachShadow({mode: 'closed'})
        // Styles
        const styles = document.createElement('style');
        styles.innerHTML = require('./styles/style.scss');
        this.#root.append(styles);

        // Content
        const template = document.createElement('template');
        template.innerHTML = require('./crypto-tips.html');
        this.#root.appendChild(template.content.cloneNode(true));
    }

    get defaultTip(): string {
        return this.getAttribute('default-tip') || '0.1'
    }

    get #ownerAddress(): string {
        return this.getAttribute('to');
    }

    get #walletBtns(): NodeListOf<HTMLButtonElement> {
        return this.#walletContainer.querySelectorAll('button');
    }

    get #container(): HTMLDivElement {
        return this.#root.querySelector('.container');
    }

    get #walletContainer(): HTMLDivElement {
        return this.#root.querySelector('.wallet-container');
    }

    get #successContainer(): HTMLDivElement {
        return this.#root.querySelector('.success-container');
    }

    get #tipFormContainer(): HTMLFormElement {
        return this.#root.querySelector('form.form-container');
    }

    get #tipInput(): HTMLInputElement {
        return this.#tipFormContainer.querySelector('input');
    }

    // get #tipButton(): HTMLButtonElement {
    //     return this.#tipForm.querySelector('button');
    // }

    get #isDryRun(): boolean {
        return this.hasAttribute('dry-run');
    }

    get #donateBtn(): HTMLButtonElement {
        return this.#container.querySelector('button');
    }

    async getAccount(): Promise<void> {
        try {
            const [address] = await this.#provider.request({method: 'eth_requestAccounts'})
            this.#address = address;
        } catch (e) {
            console.error(e)
        }
    }

    async connectedCallback() {
        await this.#addAllListeners();
    }

    // Invoked when the custom element is moved to a new document.
    adoptedCallback() {
    }

    disconnectedCallback() {
    }

    attributeChangedCallback() {
    }

    #disableActions(state: boolean): void {
        [this.#tipInput, this.#donateBtn].forEach(el => {
            el.disabled = state;
        })
    }

    async #donate(): Promise<void> {
        const transactionHash = await this.#provider.request({
            method: 'eth_sendTransaction',
            params: [
                {
                    from: this.#address,
                    to: this.#ownerAddress,
                    value: (+this.#tipInput.value * 10e17).toString(16),
                }
            ]
        })
        console.log(transactionHash);
        this.#showStep('success');
    }

    async #addAllListeners(): Promise<void> {
        this.#provider = await detectEthereumProvider();
        this.#walletBtns.forEach(btn => {
            btn.onclick = () => this.#selectProvider();
        })

        this.#donateBtn.onclick = () => {
            this.#selectWallet();
        }

        // Insert default value
        this.#tipInput.setAttribute('value', this.defaultTip)
        this.#tipFormContainer.onsubmit = event => {
            event.preventDefault();
            this.#donate().then();
        }

        this.#steps = new Map<string, HTMLFormElement | HTMLDivElement>([
            ['init', this.#container],
            ['wallets', this.#walletContainer],
            ['donate', this.#tipFormContainer],
            ['success', this.#successContainer],
        ]);
    }

    #selectWallet(): void {
        this.#showStep('wallets');
    }

    async #selectProvider(): Promise<void> {
        await this.getAccount()
        this.#showStep('donate');
    }

    #showStep(step: 'init' | 'wallets' | 'donate' | 'success'): void {
        [...this.#steps.values()].forEach(step => step.hidden = true)
        this.#steps.get(step).hidden = false;
    }
}

customElements.define('crypto-tips', CryptoTips)
