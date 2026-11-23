-- Phase de test : aucun paiement ne doit dépasser 2 Pi.
-- Produits 0,3 à 1,5 Pi ; livraison 0,1 à 0,3 Pi (donc un article seul reste sous 2 Pi).
-- Le serveur bloque aussi toute commande au-dessus de PI_MAX_PAYMENT (voir .env.example).
update delivery_zones set fee_pi = case city when 'Cotonou' then 0.1 when 'Porto-Novo' then 0.2 else 0.3 end;
update products set
  promo_price_pi = case when promo_price_pi is null then null else least(1.4, greatest(0.2, round(promo_price_pi/50.0, 1))) end,
  price_pi = least(1.5, greatest(0.3, round(price_pi/50.0, 1)));
