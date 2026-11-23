-- Produits avec marques visibles (sans filigrane ni nom de site) — prix de TEST
with c as (select slug, id from categories),
p(cat,name,descr,price,promo,img,isnew,variants) as (values
('chaussures','Escarpins slingback blancs à fleurs','Escarpins blancs à bride arrière, ornés de fleurs.',1.0,null,'escarpins-slingback-blancs',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Ensemble escarpins et pochette strass argent','Escarpins ornés de strass et pochette rigide assortie.',1.4,null,'ensemble-strass-argent',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Ensemble Venus Chan argenté, escarpins et pochette','Escarpins pointus à bride et pochette argentée assortie.',1.4,null,'ensemble-venus-argent',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Ensemble Venus Chan rose doré, escarpins et pochette','Escarpins pointus et pochette à chaîne, coloris rose doré.',1.4,1.2,'ensemble-venus-rose-or',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Escarpins roses scintillants','Escarpins à talon aiguille, finition scintillante rose.',1.0,null,'escarpins-roses-scintillants',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Ensemble Venus Chan bleu royal, escarpins et sac','Escarpins à nœud strassé et sac assorti, bleu royal.',1.5,null,'ensemble-venus-bleu-royal',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Derby homme bleu ciel','Derby en toile bleu ciel, lacets blancs.',0.8,null,'derby-bleu-ciel',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('chaussures','Ensemble escarpins et pochette dorés brodés','Escarpins ajourés et pochette brodée, coloris doré.',1.4,null,'ensemble-dore-brode',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Mocassin homme strass argent, bout doré','Mocassin strassé à médaillon doré et bout doré.',1.3,null,'mocassin-strass-argent',true,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('accessoires','Montre et bracelet strass argentés','Montre et bracelet assortis ornés de strass.',0.7,null,'montre-bracelet-strass',false,'[]'),
('soins','Coffret soins visage Beauty of Mind','Nettoyant, tonique, sérum, hydratant et écran solaire.',1.2,null,'coffret-soins-rose',true,'[]'),
('chaussures','Derby homme noir clouté, semelle rouge','Derby noir clouté, semelle rouge.',1.5,null,'derby-noir-cloute',true,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('chaussures','Mocassin homme doré à pampilles','Mocassin doré effet miroir à pampilles.',1.1,null,'mocassin-dore-pampilles',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('chaussures','Mocassin homme blanc et or à médaillon','Mocassin blanc à motifs dorés et médaillon noir.',1.3,null,'mocassin-medaillon-blanc',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('tenues','Tailleur jupe bordeaux','Veste ajustée et jupe crayon bordeaux.',1.2,null,'tailleur-jupe-bordeaux',false,'[{"name":"Taille","options":["S","M","L","XL"]}]'),
('chaussures','Escarpins bleu ciel scintillants','Escarpins à talon aiguille, finition scintillante bleu ciel.',1.0,null,'escarpins-bleu-ciel',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Mocassin Versace noir','Mocassin noir en cuir à plaque dorée.',1.4,null,'mocassin-noir-medaillon',false,'[{"name":"Pointure","options":["40","41","42","43","44","45"]}]'),
('chaussures','Sandale plate dorée à brillants','Sandale plate à bride arrière, finition brillante dorée.',0.9,null,'sandale-doree-brillants',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Escarpins argentés à bride','Escarpins argentés à bride de cheville.',1.1,null,'escarpins-argent-bride',false,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]'),
('chaussures','Escarpins argentés scintillants','Escarpins argentés à talon aiguille.',1.1,null,'escarpins-argent-scintillants',true,'[{"name":"Pointure","options":["36","37","38","39","40","41"]}]')
)
insert into products (category_id,name,description,price_pi,promo_price_pi,images,stock,is_new,is_demo,variants)
select c.id,p.name,p.descr,p.price,p.promo,array['/img/'||p.img||'.jpg'],10,p.isnew,true,p.variants::jsonb from p join c on c.slug=p.cat;