import detectEthereumProvider from '@metamask/detect-provider'

// const ETHCurrency = new Intl.NumberFormat(navigator.language, {
//     style: 'currency', currency: 'ETH', minimumFractionDigits: 3
// });

// https://docs.metamask.io/guide/ethereum-provider.html#using-the-provider

class Notify {
    #el: HTMLDivElement;
    #timeout: number;

    constructor(root: ShadowRoot) {
        this.#el = root.querySelector('.alert');

        this.#el.onclick = () => {
            this.#clearTimeout();
            this.hide().then()
        }
    }

    async alert(color: 'danger' | 'warning', message: string): Promise<void> {
        this.#el.classList.add(`alert-${color}`);
        this.#el.innerText = message;
        this.#el.hidden = false;
        this.#timeout = setTimeout(() => {
            this.hide().then();
        }, 3000) as unknown as number
    }

    async hide(): Promise<void> {
        this.#el.classList.remove('alert-warning', 'alert-danger');
        this.#clearTimeout();
        await this.#waitAnimation();
        this.#el.hidden = true;
        this.#el.innerText = '';
    }

    #clearTimeout(): void {
        if (this.#timeout) {
            clearTimeout(this.#timeout)
        }
    }

    #waitAnimation(): Promise<void> {
        return new Promise(((resolve) => {
            this.#el.ontransitionend = () => {
                resolve()
            }
        }))
    }
}

class CryptoTips extends HTMLElement {
    #provider: any;
    #fromAddress: string;
    #toAddress: string;
    readonly #root: ShadowRoot;
    #steps: Map<string, HTMLFormElement | HTMLDivElement>;
    readonly #notify: Notify;

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

        this.#notify = new Notify(this.#root);

        // TODO add custom events on donate & abort
        // this.dispatchEvent(new CustomEvent('donated', {detail: {}}))
    }

    get defaultTip(): string {
        return this.getAttribute('default-tip') || '0.1'
    }

    get #container(): HTMLDivElement {
        return this.#root.querySelector('.container');
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

    get #isDryRun(): boolean {
        return this.hasAttribute('dry-run');
    }

    get #donateBtn(): HTMLButtonElement {
        return this.#container.querySelector('button');
    }

    async connectedCallback() {
        this.#toAddress = this.getAttribute('to');
        if (this.#toAddress) {
            this.removeAttribute('to')
            this.#provider = await detectEthereumProvider();

            if (this.#provider) {
                this.#provider.on('accountsChanged', (accounts: string[]) => this.#handleAccountChanged(accounts));

                this.#steps = new Map<string, HTMLFormElement | HTMLDivElement>([
                    ['init', this.#container],
                    ['donate', this.#tipFormContainer],
                    ['success', this.#successContainer],
                ]);

                this.#donateBtn.onclick = () => {
                    this.#requestAccount().then(() => {
                        this.#showStep('donate');
                    });
                }

                // Insert default value
                this.#tipInput.setAttribute('value', this.defaultTip)
                this.#tipFormContainer.onsubmit = event => {
                    event.preventDefault();
                    this.#donate().then();
                }
            } else {
                // TODO ask user what to do in case no wallet is found
                console.info('Please install MetaMask!');
            }

        } else {
            console.info('[to] attribute is mandatory.')
        }
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
        try {
            this.#disableActions(true);
            if (!this.#isDryRun) {
                const transactionHash = await this.#provider.request({
                    method: 'eth_sendTransaction',
                    params: [
                        {
                            from: this.#fromAddress,
                            to: this.#toAddress,
                            value: (+this.#tipInput.value * 10e17).toString(16),
                        }
                    ]
                })
                // TODO send anonymous data to our server
                console.log(transactionHash);
            }
            this.#showStep('success');
        } catch (err) {
            if (err.code === 4001) {
                this.#notify.alert('warning', 'Transaction aborted.').then()
            }
        } finally {
            this.#disableActions(false);
        }
    }

    async #requestAccount(): Promise<void> {
        try {
            const accounts = await this.#provider.request({method: 'eth_requestAccounts'})
            this.#handleAccountChanged(accounts);
        } catch (err) {
            if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                this.#notify.alert('warning', 'Please connect to Wallet').then()
            } else {
                this.#notify.alert('danger', err.message).then()
            }
        }
    }

    #handleAccountChanged(accounts: string[]): void {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            this.#notify.alert('warning', 'Please connect to Wallet').then()
        } else if (accounts[0] !== this.#fromAddress) {
            this.#fromAddress = accounts[0];
        }
    }

    #showStep(step: 'init' | 'wallets' | 'donate' | 'success'): void {
        [...this.#steps.values()].forEach(step => step.hidden = true)
        this.#steps.get(step).hidden = false;
    }
}

customElements.define('crypto-tips', CryptoTips)
