import { S, acts, forms, changes, esc, fmt, api, toast } from './core.js';
import { statusLabel } from './app.js';

const NEXT = {
  awaiting_payment: ['cancelled'], paid: ['preparing', 'cancelled', 'refunded'], preparing: ['shipping', 'cancelled', 'refunded'],
  shipping: ['delivered', 'cancelled', 'refunded'], delivered: ['refunded'], cancelled: [], refunded: [],
};
const tabs = [['orders', 'Commandes'], ['products', 'Produits'], ['zones', 'Livraison'], ['stats', 'Statistiques'], ['pioneers', 'Pionniers']];
let editId = null;

export async function render(q) {
  const tab = q.get('tab') || 'orders';
  const head = `<h1>Administration</h1><div class="tabs">${tabs.map(([k, n]) => `<a class="chip ${tab === k ? 'on' : ''}" href="#/admin?tab=${k}">${n}</a>`).join('')}</div>`;
  return head + await ({ orders, products, zones, stats, pioneers }[tab] || orders)();
}

async function orders() {
  const list = await api('/api/admin/orders');
  return list.map((o) => `<form class="panel" data-form="admin-order" data-id="${o.id}">
    <div class="row"><b class="grow">${esc(o.number)}</b><span class="badge ${o.status}">${statusLabel(o.status)}</span></div>
    ${o.needs_review ? '<div class="err">Stock insuffisant au moment du paiement : à vérifier.</div>' : ''}
    <div class="muted">${new Date(o.created_at).toLocaleString('fr-FR')} · ${fmt(o.total_pi)} (livraison ${fmt(o.delivery_fee_pi)})</div>
    <div style="margin:8px 0"><b>${esc(o.recipient_name || o.full_name)}</b> · ${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.quartier)}, ${esc(o.commune)} — ${esc(o.zone_city)}, ${esc(o.zone_country)}
    ${o.instructions ? `<br><i>${esc(o.instructions)}</i>` : ''}</div>
    <div class="muted">${o.order_items.map((i) => `${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty}`).join(' · ')}</div>
    <div class="muted">Paiement Pi : ${o.payment_id ? esc(o.payment_id.slice(0, 10)) + '…' : '—'} ${o.txid ? '· transaction ' + esc(o.txid.slice(0, 10)) + '…' : ''}</div>
    <label>Statut</label><select name="status"><option value="">Inchangé</option>${NEXT[o.status].map((s) => `<option value="${s}">${statusLabel(s)}</option>`).join('')}</select>
    <label>N° de suivi</label><input name="tracking_number" value="${esc(o.tracking_number)}" maxlength="80">
    <label>Date estimée de livraison</label><input type="date" name="eta_date" value="${esc(o.eta_date || '')}">
    <label>Commentaire (visible par le client)</label><textarea name="admin_comment" rows="2" maxlength="1000">${esc(o.admin_comment)}</textarea>
    <button class="btn sm" style="margin-top:10px">Enregistrer</button></form>`).join('') || '<p>Aucune commande.</p>';
}
forms['admin-order'] = async (f) => {
  const d = Object.fromEntries(new FormData(f)); const body = { tracking_number: d.tracking_number, admin_comment: d.admin_comment, eta_date: d.eta_date || null };
  if (d.status) body.status = d.status;
  try { await api(`/api/admin/orders/${f.dataset.id}`, { method: 'PATCH', body }); toast('Commande mise à jour'); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message); }
};

async function products() {
  const [list, cats] = await Promise.all([api('/api/admin/products'), Promise.resolve(S.cat.categories)]);
  const p = list.find((x) => x.id === editId) || { name: '', description: '', category_id: cats[0].id, price_pi: '', promo_price_pi: '', stock: 0, images: [], active: true, is_new: false, variants: [] };
  const form = `<form class="panel" data-form="admin-product"><h3>${editId ? 'Modifier' : 'Nouveau produit'}</h3>
    <label>Nom</label><input name="name" required value="${esc(p.name)}" maxlength="160">
    <label>Catégorie</label><select name="category_id">${cats.map((c) => `<option value="${c.id}" ${c.id === p.category_id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
    <label>Prix (Pi)</label><input name="price_pi" type="number" step="any" min="0" required value="${esc(p.price_pi)}">
    <label>Prix promotionnel (Pi, facultatif)</label><input name="promo_price_pi" type="number" step="any" min="0" value="${esc(p.promo_price_pi ?? '')}">
    <label>Stock</label><input name="stock" type="number" min="0" step="1" required value="${esc(p.stock)}">
    <label>Description</label><textarea name="description" rows="3" maxlength="4000">${esc(p.description)}</textarea>
    <label>Images (une URL https ou chemin par ligne)</label><textarea name="images" rows="3" id="img-list">${esc((p.images || []).join('\n'))}</textarea>
    <label>Téléverser une photo</label><input type="file" accept="image/jpeg,image/png,image/webp" data-change="upload">
    <label>Variantes (une par ligne, ex. « Taille: S, M, L »)</label><textarea name="variants" rows="2">${esc((p.variants || []).map((v) => `${v.name}: ${v.options.join(', ')}`).join('\n'))}</textarea>
    <label><input type="checkbox" name="active" style="width:auto" ${p.active ? 'checked' : ''}> Visible dans la boutique</label>
    <label><input type="checkbox" name="is_new" style="width:auto" ${p.is_new ? 'checked' : ''}> Nouveauté</label>
    <div class="row" style="margin-top:12px"><button class="btn gold">Enregistrer</button>${editId ? '<button type="button" class="btn ghost" data-act="p-cancel">Annuler</button>' : ''}</div></form>`;
  const rows = list.map((x) => `<tr><td>${esc(x.name)}${x.is_demo ? ' <span class="badge">démo</span>' : ''}${x.active ? '' : ' <span class="badge cancelled">masqué</span>'}</td><td>${fmt(x.price_pi)}</td><td>${x.stock}</td>
    <td><button class="btn sm ghost" data-act="p-edit" data-id="${x.id}">Éditer</button> <button class="btn sm danger" data-act="p-del" data-id="${x.id}">Suppr.</button></td></tr>`).join('');
  return `${form}<div class="panel" style="overflow-x:auto"><table><tr><th>Produit</th><th>Prix</th><th>Stock</th><th></th></tr>${rows}</table></div>`;
}
forms['admin-product'] = async (f) => {
  const d = new FormData(f);
  const body = {
    name: d.get('name'), description: d.get('description'), category_id: d.get('category_id'), price_pi: Number(d.get('price_pi')),
    promo_price_pi: d.get('promo_price_pi') ? Number(d.get('promo_price_pi')) : null, stock: Number(d.get('stock')),
    images: String(d.get('images')).split('\n').map((s) => s.trim()).filter(Boolean),
    variants: String(d.get('variants')).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [n, o] = l.split(':'); return { name: n.trim(), options: (o || '').split(',').map((s) => s.trim()).filter(Boolean) }; }),
    active: d.has('active'), is_new: d.has('is_new'),
  };
  try { await api(editId ? `/api/admin/products/${editId}` : '/api/admin/products', { method: editId ? 'PUT' : 'POST', body }); toast('Produit enregistré'); editId = null; window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message); }
};
Object.assign(acts, {
  'p-edit': (el) => { editId = el.dataset.id; window.dispatchEvent(new Event('hashchange')); },
  'p-cancel': () => { editId = null; window.dispatchEvent(new Event('hashchange')); },
  'p-del': async (el) => { if (!confirm('Supprimer ce produit ?')) return; try { const r = await api(`/api/admin/products/${el.dataset.id}`, { method: 'DELETE' }); toast(r.deactivated ? 'Produit déjà commandé : masqué' : 'Supprimé'); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message); } },
});
changes.upload = (el) => {
  const file = el.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const { url } = await api('/api/admin/upload', { method: 'POST', body: { contentType: file.type, dataBase64: String(r.result).split(',')[1] } });
      const t = document.getElementById('img-list'); t.value = (t.value ? t.value + '\n' : '') + url; toast('Photo téléversée');
    } catch (e) { toast(e.message); }
  };
  r.readAsDataURL(file);
};

async function zones() {
  const list = await api('/api/admin/zones');
  const f = (z = {}) => `<form class="panel" data-form="admin-zone" data-id="${z.id || ''}"><div class="row"><input name="country" placeholder="Pays" required value="${esc(z.country || '')}"><input name="city" placeholder="Ville" required value="${esc(z.city || '')}"></div>
    <div class="row" style="margin-top:8px"><input name="fee_pi" type="number" step="any" min="0" placeholder="Frais (Pi)" required value="${esc(z.fee_pi ?? '')}"><input name="eta" placeholder="Délai ex. 24 à 48 h" value="${esc(z.eta || '')}"></div>
    <label><input type="checkbox" name="active" style="width:auto" ${z.active === false ? '' : 'checked'}> Zone active</label><button class="btn sm" style="margin-top:8px">${z.id ? 'Enregistrer' : 'Ajouter la zone'}</button></form>`;
  return `<h3>Nouvelle zone</h3>${f()}<h3>Zones existantes</h3>${list.map(f).join('')}`;
}
forms['admin-zone'] = async (f) => {
  const d = new FormData(f); const id = f.dataset.id;
  const body = { country: d.get('country'), city: d.get('city'), fee_pi: Number(d.get('fee_pi')), eta: d.get('eta') || '', active: d.has('active') };
  try { await api(id ? `/api/admin/zones/${id}` : '/api/admin/zones', { method: id ? 'PUT' : 'POST', body }); toast('Zone enregistrée'); window.dispatchEvent(new Event('hashchange')); } catch (e) { toast(e.message); }
};

async function stats() {
  const s = await api('/api/admin/stats');
  return `<div class="panel"><div class="tot big"><span>Ventes confirmées</span><span>${fmt(s.revenue_pi)}</span></div><div class="tot"><span>Commandes payées</span><span>${s.paid_orders}</span></div></div>
    <div class="panel"><h3>Par statut</h3>${Object.entries(s.byStatus).map(([k, v]) => `<div class="tot"><span>${statusLabel(k)}</span><span>${v}</span></div>`).join('') || '—'}</div>
    <div class="panel"><h3>Meilleures ventes</h3>${s.top.map((t) => `<div class="tot"><span>${esc(t.name)}</span><span>${t.qty}</span></div>`).join('') || '—'}</div>`;
}

async function pioneers() {
  const r = await api('/api/admin/pioneers');
  const mark = (v) => (v ? '✔' : '✖');
  const rows = r.list.map((p) => `<tr><td>${esc(p.username)}</td><td>${p.step} / 3 ${p.validated ? '✔' : ''}</td><td>${mark(p.login_ok)} ${mark(p.u2a_done)} ${mark(p.a2u_done)}</td><td>${new Date(p.updated_at).toLocaleString('fr-FR')}</td></tr>`).join('');
  return `<div class="panel"><div class="tot big"><span>Pionniers validés (Testnet)</span><span>${r.count} / ${r.cap}</span></div>
    <p class="muted">Étapes : 1 connexion · 2 paiement de test · 3 envoi de test reçu.</p></div>
    <div class="panel" style="overflow-x:auto"><table><tr><th>Utilisateur</th><th>Étape</th><th>1 2 3</th><th>Date</th></tr>${rows || '<tr><td colspan="4">Aucun pionnier pour le moment.</td></tr>'}</table></div>`;
}
