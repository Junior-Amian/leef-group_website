<?php
declare(strict_types=1);

/**
 * Crée un compte administrateur, ou change son mot de passe s'il existe déjà.
 * Usage (ligne de commande uniquement) :  php bin/creer-admin.php email@domaine.ci
 * Le mot de passe est demandé (saisie masquée sous Linux/macOS) ou lu dans la variable LEEF_MOT_DE_PASSE.
 */

if (PHP_SAPI !== 'cli') {
    exit("À lancer en ligne de commande.\n");
}
require dirname(__DIR__) . '/app/bootstrap.php';
ini_set('display_errors', '1');

$email = mb_strtolower(trim($argv[1] ?? ''));
if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    exit("Usage : php bin/creer-admin.php email@domaine.ci\n");
}

$password = getenv('LEEF_MOT_DE_PASSE') ?: '';
if ($password === '') {
    $unix = stripos(PHP_OS, 'WIN') !== 0;
    echo 'Mot de passe (12 caractères minimum) : ';
    if ($unix) {
        system('stty -echo');
    }
    $password = trim((string) fgets(STDIN));
    if ($unix) {
        system('stty echo');
    }
    echo "\n";
}
if (mb_strlen($password) < 12) {
    exit("Le mot de passe doit contenir au moins 12 caractères.\n");
}

App\Models\Admin::upsert($email, $password);
echo "Compte administrateur prêt : {$email}\n";
