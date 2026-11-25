// English versions of the information pages (templates: to be reviewed by a lawyer before public launch).
import { esc } from './core.js';
import { OWNER } from './pages.js';

const ZONES = 'Africa, the United States, Europe and Canada';
const contact = (c) => `<p><b>Publisher and person responsible:</b> ${esc(OWNER.name)}<br>Pi account: ${esc(OWNER.pi)}<br>E-mail: ${esc(c.contactEmail || OWNER.email)}${c.contactPhone ? `<br>Phone / WhatsApp: ${esc(c.contactPhone)}` : ''}</p>
  <p>The service is offered in ${ZONES}.</p>`;

export const PAGES_EN = {
  livraison: { title: 'Delivery', body: `<p>Delivery is organised by the shop's promoter, to your door, in the zones listed at checkout. The service is offered in ${ZONES}.</p>
    <ul><li>Fees and the estimated time depend on the zone you choose; they are shown before payment.</li>
    <li>Preparation starts only after your Pi payment is confirmed.</li>
    <li>You can follow your order in “My orders” (tracking number and estimated date when available).</li>
    <li>A courier may call you: give a reachable phone number and a precise landmark.</li></ul>` },
  retours: { title: 'Returns and refunds', body: `<p>Contact customer service within 7 days of delivery to report a faulty or damaged product.</p>
    <ul><li>Opened hygiene and beauty products are neither taken back nor exchanged, unless defective.</li>
    <li>An accepted refund is paid in Pi to your wallet; the order status changes to “Refunded”.</li></ul>
    <p class="muted">These time limits are examples, to be confirmed by the promoter.</p>` },
  faq: { title: 'Frequently asked questions', body: `<h3>How do I pay?</h3><p>Only in Pi, from the Pi Browser, after signing in with your Pi account.</p>
    <h3>When is my order confirmed?</h3><p>As soon as our servers have verified the payment with Pi Network.</p>
    <h3>My payment is still pending.</h3><p>Reopen the shop in the Pi Browser and sign in again: a pending payment is resumed automatically. Otherwise, open the order and choose “Pay”.</p>
    <h3>Are the pictures binding?</h3><p>Some pictures are demonstration visuals, to be replaced by real product photos.</p>` },
  cgv: { title: 'Terms of sale', body: () => `<p>Prices are shown in Pi, delivery fees extra. An order is firm and final once the payment is confirmed.</p>
    <p>The promoter may cancel and refund an order if a product is unavailable. Displayed stock may change until payment is confirmed.</p>
    <p>Seller: ${OWNER.name} (Pi account ${OWNER.pi}), ${OWNER.email}. Service available in ${ZONES}.</p>
    <p class="muted">Withdrawal rights and applicable rules depend on your country of residence; in case of a dispute, please contact us first at the address above.</p>` },
  confidentialite: { title: 'Privacy policy', body: (c) => `<p class="muted">Last updated: November 2026.</p>
    <p>This policy explains what personal data Éclat &amp; Style collects, why, who it is shared with and what your rights are.</p>
    <h3>1. Data collected</h3>
    <ul><li><b>Pi account:</b> your Pi username and an app-specific identifier, provided by Pi Network when you sign in.</li>
    <li><b>Order and delivery:</b> recipient name, phone, district, neighbourhood, address or landmark, delivery instructions.</li>
    <li><b>Payment:</b> Pi payment and transaction identifiers, amount and date. We never have access to your wallet.</li>
    <li><b>Usage:</b> favourites, cart and session token, kept on your device to run the shop. Technical security logs (no passwords or keys).</li></ul>
    <h3>2. Why we use it</h3>
    <ul><li>To sign you in and process and verify your Pi payments.</li><li>To prepare, deliver and track your orders, and handle returns and refunds.</li>
    <li>To secure the app and prevent fraud.</li><li>To meet our legal and accounting obligations.</li></ul>
    <p>We do not sell your data and do not use it for targeted advertising.</p>
    <h3>3. Who it is shared with</h3>
    <ul><li><b>Pi Network:</b> to authenticate your account and process payments, under its own privacy rules.</li>
    <li><b>Technical providers:</b> hosting of the app and database, only to run the service.</li>
    <li><b>Couriers:</b> name, phone and address needed to deliver your order.</li>
    <li><b>Authorities:</b> where the law requires it.</li></ul>
    <h3>4. Retention</h3>
    <p>Order data is kept as long as needed for follow-up, claims and accounting obligations, then deleted or anonymised. You can clear your cart and session by signing out.</p>
    <h3>5. Security</h3>
    <p>Exchanges are encrypted, amounts are calculated and verified by our servers, and access to data is limited to authorised people. <b>We never ask for your Pi passphrase or your secret keys.</b></p>
    <h3>6. Your rights</h3>
    <p>You can ask to access, correct or delete your data, and object to certain processing, by contacting us below.</p>
    <h3>7. Minors</h3><p>The shop is intended for adults or minors with a legal guardian's consent.</p>
    <h3>8. Changes</h3><p>This policy may change; the update date is shown at the top of the page.</p>
    <h3>9. Contact</h3>${contact(c)}
    <p class="muted">Template text, to be adapted to your activity and the law of your country and reviewed by a lawyer.</p>` },
  conditions: { title: 'Terms of use', body: (c) => `<p class="muted">Last updated: November 2026.</p>
    <p>By using Éclat &amp; Style you accept these terms. If you do not accept them, do not use the app.</p>
    <h3>1. The service</h3><p>Éclat &amp; Style is an online shop for cosmetics, perfumes, jewellery, bags, shoes and fashion accessories. Payment is made exclusively in Pi, in the Pi Browser. Delivery is organised by the shop's promoter.</p>
    <h3>2. Account</h3><p>You sign in with your Pi account. You are responsible for the use of your account and the security of your device. We will never ask for your Pi passphrase.</p>
    <h3>3. Orders and prices</h3><ul><li>Prices are shown in Pi, delivery fees extra; the exact amount is calculated by our servers and shown before payment.</li>
    <li>An order is confirmed only after the payment is verified.</li><li>We may cancel and refund an order if a product is unavailable.</li></ul>
    <h3>4. Test phase</h3><p>During the test phase, amounts may be capped per order, and products and visuals may be demonstration examples. Test payments have no commercial value.</p>
    <h3>5. Delivery, returns and refunds</h3><p>See the “Delivery” and “Returns” pages. An accepted refund is paid in Pi.</p>
    <h3>6. Acceptable use</h3><p>You must not try to bypass security, provide false information, use the app for fraud or money laundering, or disrupt the service.</p>
    <h3>7. Intellectual property</h3><p>The shop's content (texts, logo, layout) is protected. Any brands mentioned belong to their owners; only authentic products are sold under their name.</p>
    <h3>8. Independence from Pi Network</h3><p>Éclat &amp; Style is an independent application, not affiliated with or approved by Pi Network. The word “Pi” refers only to the cryptocurrency accepted as payment.</p>
    <h3>9. Liability</h3><p>We do our best to provide a reliable service, without guaranteeing there will be no interruption. Our liability is limited to the extent permitted by law; it does not cover incidents specific to the Pi network or the Pi Browser.</p>
    <h3>10. Changes and governing law</h3><p>We may change these terms; the update date is shown at the top. The governing law and competent court are those of the publisher's country of residence, without depriving consumers of the mandatory rights of their own country.</p>
    <h3>11. Contact</h3>${contact(c)}
    <p class="muted">Template text, to be adapted and reviewed by a lawyer before public launch.</p>` },
  contact: { title: 'Contact', body: (c) => `<p>A question about an order? Please give your order number.</p>${contact(c)}
    <p class="muted">Éclat &amp; Style is an independent application, not affiliated with or approved by Pi Network. The word “Pi” refers here only to the cryptocurrency accepted as payment.</p>` },
};
