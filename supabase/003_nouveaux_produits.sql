-- Produits ajoutés (prix de TEST, max 1.5 Pi)
with c as (select slug, id from categories),
p(cat, name, descr, price, promo, imgs, isnew) as (values
 ('soins','Rituel soins naturels, flacons ambrés','Sérum, crème et gel nettoyant en flacons ambrés, pour un rituel doux au quotidien.',0.5,null,array['soin-rituel-ambre'],true),
 ('soins','Crème visage nourrissante','Crème onctueuse au toucher soyeux, pour une peau douce et souple.',0.4,null,array['creme-orchidee'],false),
 ('homme','Sélection soins homme','Gels, soins visage et rasage pour homme, de marques reconnues.',0.7,null,array['homme-selection-soins'],true),
 ('homme','Sélection rituels et soins homme','Sérum, nettoyant, parfum et déodorant pour un rituel complet.',0.8,null,array['homme-selection-rituels'],false),
 ('homme','Soin visage hydratant apaisant pour homme','Soin visage hydratant et apaisant, parfum naturel menthe poivrée et lavande.',0.4,null,array['homme-soin-visage'],false),
 ('homme','Gamme soin homme complète','Gel douche, gel de rasage, soin visage et sérum pour homme.',0.9,0.8,array['homme-gamme-complete'],true),
 ('parfums','Le Beau Le Parfum, Jean Paul Gaultier','Eau de parfum masculine, flacon torse sculpté dans sa boîte métal.',1.5,null,array['parfum-le-beau'],true),
 ('parfums','Barakkat Rouge 540, extrait de parfum 100 ml','Extrait de parfum ambré, floral et boisé, en flacon rouge et or.',1.2,1.0,array['parfum-barakkat-1','parfum-barakkat-2'],true),
 ('parfums','Vanilla Base, eau de parfum DeFacto','Eau de parfum 100 ml aux notes vanillées, flacon noir et coffret.',1.0,null,array['parfum-vanilla-1','parfum-vanilla-2'],false),
 ('parfums','Opéra, Maison Héritage','Eau de parfum aux notes ambrées et vanillées, agrumes en tête.',1.1,null,array['parfum-opera'],false),
 ('sacs','Sac à main effet croco marron','Sac structuré effet croco, anses rigides, finitions dorées.',1.3,null,array['sac-croco-marron'],true),
 ('sacs','Trio de sacs effet croco marron','Sac cabas, pochette et porte-cartes assortis.',1.5,1.3,array['sac-trio-marron'],true),
 ('sacs','Trio de sacs effet croco rouge','Sac cabas, pochette et porte-cartes assortis, coloris rouge.',1.5,null,array['sac-trio-rouge'],true),
 ('sacs','Pochette de soirée strass argent','Pochette rigide ornée d''une grande fleur en strass.',0.9,null,array['pochette-strass-argent'],false),
 ('sacs','Sac à main effet croco bordeaux','Sac à main bordeaux, anses souples, fermoir doré.',1.2,null,array['sac-croco-bordeaux'],false),
 ('sacs','Pochette de soirée strass dorée','Pochette à anse en strass et métal doré.',0.9,null,array['pochette-strass-or'],false),
 ('sacs','Mini sac matelassé rose, breloques dorées','Mini sac matelassé rose fuchsia, anse arrondie et breloques dorées.',1.5,null,array['sac-matelasse-rose'],false),
 ('sacs','Pochettes de soirée pailletées','Pochettes pailletées avec chaîne dorée, en 4 coloris.',0.8,null,array['pochettes-pailletees'],true),
 ('sacs','Sac besace en cuir cognac','Sac en cuir lisse plissé, bandoulière fine.',1.1,null,array['besace-cognac'],false),
 ('sacs','Pochette en cuir bleu roi','Pochette en cuir grainé bleu roi, anneau doré.',1.2,null,array['pochette-bleu-roi'],true),
 ('sacs','Sac en cuir crème, chaîne dorée','Sac en cuir grainé crème avec chaîne dorée.',1.3,null,array['sac-creme-chaine'],false)
)
insert into products (category_id, name, description, price_pi, promo_price_pi, images, stock, is_new, is_demo, variants)
select c.id, p.name, p.descr, p.price, p.promo, (select array_agg('/img/'||x||'.jpg') from unnest(p.imgs) x), 10, p.isnew, true, '[]'::jsonb
from p join c on c.slug=p.cat;
