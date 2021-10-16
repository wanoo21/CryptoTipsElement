import Web3 from 'web3';

const ETHCurrency = new Intl.NumberFormat(navigator.language, {
    style: 'currency', currency: 'ETH', minimumFractionDigits: 3
});

class CryptoTips extends HTMLElement {
    #web3: Web3;
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
            const [address] = await this.#web3.eth.requestAccounts()
            this.#address = address;
            const wei = await this.getBalance();
            this.#donateBtn.innerText = ETHCurrency.format(Number(this.#web3.utils.fromWei(wei, 'ether')))
        } catch (e) {
            console.error(e)
        }
    }

    // Get balance in wei
    async getBalance(): Promise<string> {
        try {
            return await this.#web3.eth.getBalance(this.#address);
        } catch {
            // this.tipBtn.innerText = Currency.format(+this.#web3.utils.fromWei(wei, 'ether'))
        }
    }

    async connectedCallback() {
        if (!window.Web3) {
            this.#disableActions(true);
            const web3js = document.createElement('script');
            web3js.src = "//cdnjs.cloudflare.com/ajax/libs/web3/1.6.0/web3.min.js";
            // web3js.async = true;
            web3js.onload = async () => {
                // this.#web3 = new window.Web3(window.Web3.givenProvider);
                // await this.getAccount()
                this.#disableActions(false);
            }
            document.head.appendChild(web3js);
        } else {
            // this.#web3 = new window.Web3(window.Web3.givenProvider)
            // await this.getAccount()
        }
        this.#addAllListeners();
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

    #donateSuccess(): void {
        this.#showStep('success');
    }

    #addAllListeners(): void {
        this.#walletBtns.forEach(btn => {
            btn.onclick = () => this.#selectProvider(btn);
        })

        this.#donateBtn.onclick = () => {
            this.#selectWallet();
        }

        // Insert default value
        this.#tipInput.setAttribute('value', this.defaultTip)
        this.#tipFormContainer.onsubmit = event => {
            event.preventDefault();
            this.#donateSuccess();
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

    #selectProvider(btn: HTMLButtonElement): void {
        console.log(btn.value);
        this.#web3 = new window.Web3(window.Web3.givenProvider);
        this.#showStep('donate');
    }

    #showStep(step: 'init' | 'wallets' | 'donate' | 'success'): void {
        [...this.#steps.values()].forEach(step => step.hidden = true)
        this.#steps.get(step).hidden = false;
    }
}

customElements.define('crypto-tips', CryptoTips)
