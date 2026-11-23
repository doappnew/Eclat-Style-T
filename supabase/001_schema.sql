-- Éclat & Style — schéma complet. À exécuter dans Supabase > SQL Editor.
-- RLS activé partout, sans policy : seul le serveur (clé service_role) accède aux données.

create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  pi_uid text not null unique,
  username text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null,
  description text not null default '',
  price_pi numeric(18,7) not null check (price_pi > 0),
  promo_price_pi numeric(18,7) check (promo_price_pi is null or promo_price_pi > 0),
  images text[] not null default '{}',
  stock int not null default 0 check (stock >= 0),
  active boolean not null default true,
  is_new boolean not null default false,
  is_demo boolean not null default false,
  variants jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on products (category_id);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  city text not null,
  fee_pi numeric(18,7) not null default 0 check (fee_pi >= 0),
  eta text not null default '',
  active boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid not null references users(id),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','paid','preparing','shipping','delivered','cancelled','refunded')),
  subtotal_pi numeric(18,7) not null,
  delivery_fee_pi numeric(18,7) not null,
  total_pi numeric(18,7) not null,
  full_name text not null, phone text not null,
  zone_country text not null, zone_city text not null, zone_eta text not null default '',
  commune text not null, quartier text not null, address text not null,
  instructions text not null default '', recipient_name text not null default '',
  payment_id text unique,
  txid text unique,
  paid_at timestamptz,
  needs_review boolean not null default false,
  tracking_number text not null default '',
  admin_comment text not null default '',
  eta_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on orders (user_id, created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  name text not null,
  unit_price_pi numeric(18,7) not null,
  qty int not null check (qty > 0),
  variant text
);
create index on order_items (order_id);

create table favorites (
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (user_id, product_id)
);

create table events (
  id bigint generated always as identity primary key,
  event text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table favorites enable row level security;
alter table events enable row level security;

-- Validation atomique et idempotente d'une commande payée (appelée uniquement par le serveur).
create or replace function finalize_paid_order(p_order uuid, p_txid text) returns text
language plpgsql security definer set search_path = public as $$
declare o orders; it record; low boolean := false;
begin
  select * into o from orders where id = p_order for update;
  if not found then return 'not_found'; end if;
  if o.status <> 'awaiting_payment' then return 'already'; end if;
  for it in select product_id, qty from order_items where order_id = p_order loop
    if (select stock from products where id = it.product_id) < it.qty then low := true; end if;
    update products set stock = greatest(stock - it.qty, 0) where id = it.product_id;
  end loop;
  update orders set status = 'paid', txid = p_txid, paid_at = now(), updated_at = now(), needs_review = low
   where id = p_order;
  return 'paid';
end $$;
revoke all on function finalize_paid_order(uuid, text) from public, anon, authenticated;

-- Stockage public des photos produits
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;

-- ------------------------------------------------------------------
-- Données de démonstration (prix de TEST, images remplaçables depuis l'administration)
-- ------------------------------------------------------------------
insert into categories (slug, name, sort) values
 ('soins', 'Cosmétiques & soins', 1), ('maquillage', 'Maquillage', 2), ('parfums', 'Parfums', 3),
 ('homme', 'Beauté homme', 4), ('bijoux', 'Bijoux & joaillerie', 5), ('sacs', 'Sacs', 6),
 ('chaussures', 'Chaussures', 7), ('accessoires', 'Accessoires de mode', 8), ('tenues', 'Tenues & costumes', 9);

insert into delivery_zones (country, city, fee_pi, eta) values
 ('Bénin', 'Cotonou', 2, '24 à 48 h'), ('Bénin', 'Porto-Novo', 3, '48 à 72 h'),
 ('Bénin', 'Autres villes', 6, '3 à 6 jours');

with c as (select slug, id from categories),
p(cat, name, descr, price, promo, img, isnew, variants) as (values
 ('tenues','Tailleur jupe blanc','Veste cintrée à boutons dorés et jupe crayon blanche.',38,null,'tailleur-blanc',true,'[{"name":"Taille","options":["S","M","L","XL"]}]'),
 ('tenues','Tailleur jupe bleu marine','Blazer ajusté et jupe crayon, coupe élégante.',42,null,'tailleur-marine',true,'[{"name":"Taille","options":["S","M","L","XL"]}]'),
 ('tenues','Ensemble veste ceinturée blanc','Veste ceinturée à boutons dorés et jupe longue évasée.',55,48,'ensemble-blanc-ceinture',false,'[{"name":"Taille","options":["S","M","L","XL"]}]'),
 ('tenues','Tailleur pantalon bordeaux','Blazer et pantalon large coordonnés.',46,null,'tailleur-pantalon-bordeaux',false,'[{"name":"Taille","options":["S","M","L","XL","XXL"]}]'),
 ('tenues','Costume homme motif floral bleu','Costume de cérémonie à motif floral bleu sur fond blanc.',90,null,'costume-fleuri-bleu',true,'[{"name":"Taille","options":["46","48","50","52","54"]}]'),
 ('tenues','Blazer homme doré','Blazer texturé de couleur dorée pour les grandes occasions.',60,null,'blazer-dore',false,'[{"name":"Taille","options":["46","48","50","52","54"]}]'),
 ('maquillage','Meuble de rangement maquillage à tiroirs','Meuble blanc et cuivré à tiroirs pour ranger le maquillage.',70,null,'rangement-maquillage',false,'[]'),
 ('maquillage','Coiffeuse miroir rose doré','Organiseur à miroir avec tiroirs et supports pinceaux.',35,30,'coiffeuse-rose-or',true,'[]'),
 ('chaussures','Derby homme rouge verni','Derby à finition vernie rouge.',28,null,'derby-rouge-verni',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('chaussures','Derby homme tissé gris','Derby tissé gris et blanc, ornement doré.',24,null,'derby-gris-tisse',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('chaussures','Richelieu homme bordeaux','Richelieu bi-matière, brodé et verni, bordeaux.',32,null,'richelieu-bordeaux',true,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('chaussures','Mocassin motif porcelaine bleu et or','Mocassin à pampilles dorées et motif bleu et blanc.',48,null,'mocassin-porcelaine',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('chaussures','Mocassin vernis marine et or','Mocassin verni marine à motifs dorés.',52,null,'mocassin-marine-or',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('chaussures','Mocassin velours noir broderies or','Mocassin en velours noir, broderies dorées.',50,null,'mocassin-velours-or',true,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
 ('bijoux','Parure pierres rectangulaires, finition dorée','Collier, bague et boucles d''oreilles assortis.',18,null,'parure-rectangles-doree',true,'[]'),
 ('bijoux','Parure cœurs, finition dorée','Colliers, boucles et pierres en forme de cœur.',20,null,'parure-coeurs-doree',false,'[]'),
 ('bijoux','Parure grappe de pierres, finition dorée','Boucles d''oreilles et collier lariat.',19,null,'parure-grappe-doree',false,'[]'),
 ('bijoux','Parure carrés noirs et strass','Collier, bague, bracelets et boucles d''oreilles.',24,20,'parure-carres-noirs',false,'[]'),
 ('bijoux','Parure de mariée dorée','Collier, boucles, bague et bracelets pour cérémonie.',65,null,'parure-mariee-doree',true,'[]'),
 ('bijoux','Parure de mariée argentée','Collier et boucles d''oreilles pour cérémonie.',58,null,'parure-mariee-argent',false,'[]'),
 ('bijoux','Parure cœurs argentée','Collier ras de cou et boucles d''oreilles cœur.',16,null,'parure-coeur-argent',false,'[]'),
 ('bijoux','Collier feuilles argenté','Collier de cérémonie à motif de feuilles.',34,null,'collier-feuilles-argent',false,'[]'),
 ('accessoires','Diadème et parure rose','Diadème, collier et boucles d''oreilles en coffret.',40,null,'diademe-parure-rose',false,'[]'),
 ('accessoires','Diadème et parure argentée','Diadème, collier et boucles d''oreilles.',44,null,'diademe-parure-argent',true,'[]'),
 ('accessoires','Gants en dentelle blanche','Gants courts en dentelle à fleur, pour mariage.',9,null,'gants-dentelle',false,'[]'),
 ('chaussures','Ensemble escarpins et pochette cristaux dorés','Escarpins à bride et pochette assortie, cristaux ambrés.',75,null,'ensemble-escarpins-cristaux-or',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Ensemble escarpins et pochette pailletés','Escarpins pailletés et pochette à chaîne ornée de perles.',68,null,'ensemble-escarpins-pailletes-perles',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Ensemble mules à nœud et pochette dorés','Mules à talon et pochette en strass dorés.',62,55,'ensemble-mule-noeud-or',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Ensemble mules à nœud et pochette noirs','Mules à talon et pochette en strass, coloris noir.',62,null,'ensemble-mule-noeud-noir',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Ensemble mules et pochette bleu royal','Mules ornées de pierres bleues et pochette assortie.',64,null,'ensemble-mule-bleu-royal',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Sandales à talon pailletées argentées','Sandales à plateforme et bride de cheville.',30,null,'sandales-pailletees-argent',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Escarpins en dentelle blanche et perles','Escarpins à bride de cheville, dentelle et perles, pour mariage.',45,null,'escarpins-dentelle-blanche',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
 ('chaussures','Escarpins transparents ornés de strass','Escarpins blancs à talon bas et ornement strassé.',33,null,'escarpins-transparents-strass',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]')
)
insert into products (category_id, name, description, price_pi, promo_price_pi, images, stock, is_new, is_demo, variants)
select c.id, p.name, p.descr, p.price, p.promo, array['/img/' || p.img || '.jpg'], 10, p.isnew, true, p.variants::jsonb
from p join c on c.slug = p.cat;

-- Donner le rôle administrateur (remplacer par VOTRE nom d'utilisateur Pi, après votre première connexion) :
-- update users set role = 'admin' where username = 'votre_nom_pi';
