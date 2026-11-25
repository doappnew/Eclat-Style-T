-- Noms neutres : aucune marque dans les noms ni les descriptions (aucun produit supprimé, prix/stock/images inchangés).
update products set name = 'Mocassin homme noir à médaillon doré' where name = 'Mocassin Versace noir';
update products set name = 'Ensemble escarpins et pochette argentés' where name = 'Ensemble Venus Chan argenté, escarpins et pochette';
update products set name = 'Ensemble escarpins et pochette rose doré' where name = 'Ensemble Venus Chan rose doré, escarpins et pochette';
update products set name = 'Ensemble escarpins et sac bleu royal' where name = 'Ensemble Venus Chan bleu royal, escarpins et sac';
-- filet de sécurité : retire ces deux marques de tout nom ou description restant
update products set name = btrim(regexp_replace(name, 'versace|venus chan', '', 'gi')) where name ~* 'versace|venus chan';
update products set description = btrim(regexp_replace(description, 'versace|venus chan', '', 'gi')) where description ~* 'versace|venus chan';
-- contrôle : doit renvoyer 0 ligne
select name from products where name ~* 'versace|venus chan' or description ~* 'versace|venus chan';
