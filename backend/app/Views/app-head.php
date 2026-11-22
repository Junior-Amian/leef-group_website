<?php
/**
 * Balises ajoutées dans le <head> de l'application React.
 * @var bool $isAdmin
 * @var array|null $content contenu public du site (null pour le panel ou si la base est indisponible)
 * @var string $nonce nonce de la Content-Security-Policy (autorise ce seul script en ligne)
 */
use App\Core\View;

if ($isAdmin): ?>
<meta name="robots" content="noindex, nofollow">
<?php elseif ($content !== null): ?>
<meta name="description" content="<?= View::e($content['parametres']['seo.description']) ?>">
<meta property="og:title" content="<?= View::e($content['parametres']['seo.titre']) ?>">
<meta property="og:description" content="<?= View::e($content['parametres']['seo.description']) ?>">
<?php // JSON_HEX_* : le contenu ne peut pas fermer la balise <script> (protection XSS). ?>
<script nonce="<?= View::e($nonce) ?>">window.__SITE__ = <?= json_encode($content, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) ?>;</script>
<?php endif;
