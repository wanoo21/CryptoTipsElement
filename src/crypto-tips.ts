import Web3 from 'web3';

const ETHCurrency = new Intl.NumberFormat(navigator.language, {
    style: 'currency', currency: 'ETH', minimumFractionDigits: 3
});

class CryptoTips extends HTMLElement {
    #web3: Web3;
    #address: string;
    #root: ShadowRoot;

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

    get #infoEl(): HTMLDivElement {
        return this.#root.querySelector('.container-info');
    }

    get #buttonEl(): HTMLButtonElement {
        return this.#root.querySelector('button');
    }

    async getAccount(): Promise<void> {
        try {
            const [address] = await this.#web3.eth.requestAccounts()
            this.#address = address;
            const wei = await this.getBalance();
            this.#buttonEl.innerText = ETHCurrency.format(Number(this.#web3.utils.fromWei(wei, 'ether')))
        } catch (e) {
            console.error(e)
        }
    }

    // Get balance in wei
    async getBalance(): Promise<string> {
        try {
            return await this.#web3.eth.getBalance(this.#address);
        } catch {
            // this.buttonEl.innerText = Currency.format(+this.#web3.utils.fromWei(wei, 'ether'))
        }
    }

    async connectedCallback() {
        if (!window.Web3) {
            const web3js = document.createElement('script');
            web3js.src = "//cdnjs.cloudflare.com/ajax/libs/web3/1.6.0/web3.min.js";
            // web3js.async = true;
            web3js.onload = async () => {
                this.#web3 = new window.Web3(window.Web3.givenProvider);
                await this.getAccount()
            }
            document.head.appendChild(web3js);
        } else {
            this.#web3 = new window.Web3(window.Web3.givenProvider)
            await this.getAccount()
        }

        this.#buttonEl.onclick = () => {
            alert('Hello')
        }
    }
}

customElements.define('crypto-tips', CryptoTips)
