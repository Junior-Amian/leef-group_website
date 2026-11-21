<?php
/**
 * Balises ajoutées dans le <head> de l'application React.
 * @var array<string, mixed> $page métadonnées de la page (App\Services\Seo)
 * @var array|null $content contenu public du site (null pour le panel, une page 404 ou si la base est indisponible)
 * @var string $nonce nonce de la Content-Security-Policy (autorise les seuls scripts injectés ici)
 */
use App\Core\View;
use App\Services\Seo;

// JSON_HEX_* : le contenu ne peut pas fermer la balise <script> (protection XSS).
$json = static fn (mixed $data): string => json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
?>
<?php if ($page['robots']): ?>
<meta name="robots" content="<?= View::e($page['robots']) ?>">
<?php endif; ?>
<?php if ($page['description'] !== ''): ?>
<meta name="description" content="<?= View::e($page['description']) ?>">
<?php endif; ?>
<?php if ($page['canonical']): ?>
<link rel="canonical" href="<?= View::e($page['canonical']) ?>">
<meta property="og:url" content="<?= View::e($page['canonical']) ?>">
<?php endif; ?>
<?php if ($page['robots'] === null): ?>
<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= View::e(Seo::SITE_NAME) ?>">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="<?= View::e($page['title']) ?>">
<?php if ($page['description'] !== ''): ?>
<meta property="og:description" content="<?= View::e($page['description']) ?>">
<?php endif; ?>
<?php if ($page['image']): ?>
<meta property="og:image" content="<?= View::e($page['image']) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logo LEEF GROUP">
<meta name="twitter:card" content="summary_large_image">
<?php endif; ?>
<?php endif; ?>
<?php if ($content !== null): ?>
<script nonce="<?= View::e($nonce) ?>">window.__SITE__ = <?= $json($content) ?>;</script>
<?php endif; ?>
<?php foreach ($page['jsonLd'] as $data): ?>
<script type="application/ld+json" nonce="<?= View::e($nonce) ?>"><?= $json($data) ?></script>
<?php endforeach;
