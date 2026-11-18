<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Core\Validator;

/**
 * Textes et coordonnées éditables du site (table parametres).
 * DEFINITIONS est la source unique : clés autorisées, règles de validation et libellés du formulaire
 * du panel (qui génère son formulaire à partir de cette liste renvoyée par l'API).
 *
 * Types : texte (une ligne), paragraphe, liste (une entrée par ligne), email, telephone, url, decimal.
 */
final class Setting
{
    public const DEFINITIONS = [
        // Référencement
        'seo.titre'       => ['groupe' => 'Référencement', 'libelle' => 'Titre de la page (onglet et résultats Google)', 'type' => 'texte', 'max' => 70],
        'seo.description' => ['groupe' => 'Référencement', 'libelle' => 'Description (résultats Google)', 'type' => 'paragraphe', 'max' => 170],
        // Accueil
        'hero.description' => ['groupe' => 'Accueil', 'libelle' => 'Phrase sous le slogan', 'type' => 'paragraphe', 'max' => 200],
        // Le groupe
        'groupe.titre'       => ['groupe' => 'Le groupe', 'libelle' => 'Titre', 'type' => 'texte', 'max' => 90],
        'groupe.texte'       => ['groupe' => 'Le groupe', 'libelle' => 'Présentation', 'type' => 'paragraphe', 'max' => 600],
        'groupe.vision'      => ['groupe' => 'Le groupe', 'libelle' => 'Notre vision', 'type' => 'paragraphe', 'max' => 300],
        'valeurs.connecter'  => ['groupe' => 'Le groupe', 'libelle' => 'Connecter : description', 'type' => 'texte', 'max' => 120],
        'valeurs.structurer' => ['groupe' => 'Le groupe', 'libelle' => 'Structurer : description', 'type' => 'texte', 'max' => 120],
        'valeurs.performer'  => ['groupe' => 'Le groupe', 'libelle' => 'Performer : description', 'type' => 'texte', 'max' => 120],
        // En-tête de la section pôles (le contenu des pôles se modifie dans la rubrique Pôles)
        'poles.titre' => ['groupe' => 'Section pôles', 'libelle' => 'Titre', 'type' => 'texte', 'max' => 60],
        'poles.texte' => ['groupe' => 'Section pôles', 'libelle' => 'Texte d’introduction', 'type' => 'paragraphe', 'max' => 200],
        // Partenariats
        'partenariat.titre'               => ['groupe' => 'Partenariats', 'libelle' => 'Titre', 'type' => 'texte', 'max' => 60],
        'partenariat.texte'               => ['groupe' => 'Partenariats', 'libelle' => 'Texte', 'type' => 'paragraphe', 'max' => 400],
        'partenariat.pistes.entreprise'   => ['groupe' => 'Partenariats', 'libelle' => 'Pistes pour une entreprise (une par ligne)', 'type' => 'liste', 'max' => 600],
        'partenariat.pistes.institution'  => ['groupe' => 'Partenariats', 'libelle' => 'Pistes pour une institution (une par ligne)', 'type' => 'liste', 'max' => 600],
        'partenariat.pistes.investisseur' => ['groupe' => 'Partenariats', 'libelle' => 'Pistes pour un investisseur (une par ligne)', 'type' => 'liste', 'max' => 600],
        'partenariat.pistes.technique'    => ['groupe' => 'Partenariats', 'libelle' => 'Pistes pour un partenaire technique (une par ligne)', 'type' => 'liste', 'max' => 600],
        // Contact
        'contact.texte'               => ['groupe' => 'Contact', 'libelle' => 'Texte d’introduction', 'type' => 'paragraphe', 'max' => 200],
        'contact.telephone'           => ['groupe' => 'Contact', 'libelle' => 'Téléphone', 'type' => 'telephone'],
        'contact.whatsapp'            => ['groupe' => 'Contact', 'libelle' => 'Numéro WhatsApp', 'type' => 'telephone'],
        'contact.email'               => ['groupe' => 'Contact', 'libelle' => 'E-mail affiché sur le site', 'type' => 'email'],
        'contact.adresse'             => ['groupe' => 'Contact', 'libelle' => 'Adresse', 'type' => 'texte', 'max' => 100],
        'contact.adresse_complement'  => ['groupe' => 'Contact', 'libelle' => 'Complément d’adresse', 'type' => 'texte', 'max' => 120, 'requis' => false],
        'contact.carte_latitude'      => ['groupe' => 'Contact', 'libelle' => 'Carte : latitude du siège', 'type' => 'decimal', 'min' => -90, 'maxValeur' => 90],
        'contact.carte_longitude'     => ['groupe' => 'Contact', 'libelle' => 'Carte : longitude du siège', 'type' => 'decimal', 'min' => -180, 'maxValeur' => 180],
        'contact.email_notifications' => ['groupe' => 'Contact', 'libelle' => 'E-mail qui reçoit les propositions de partenariat', 'type' => 'email', 'prive' => true],
        // Réseaux sociaux (vide = bouton masqué)
        'reseaux.linkedin'  => ['groupe' => 'Réseaux sociaux', 'libelle' => 'LinkedIn', 'type' => 'url', 'requis' => false],
        'reseaux.facebook'  => ['groupe' => 'Réseaux sociaux', 'libelle' => 'Facebook', 'type' => 'url', 'requis' => false],
        'reseaux.instagram' => ['groupe' => 'Réseaux sociaux', 'libelle' => 'Instagram', 'type' => 'url', 'requis' => false],
        // Pied de page
        'pied.accroche' => ['groupe' => 'Pied de page', 'libelle' => 'Accroche', 'type' => 'texte', 'max' => 90],
    ];

    /** @return array<string, string> toutes les valeurs (uniquement les clés définies) */
    public static function all(): array
    {
        $stored = Database::query('SELECT cle, valeur FROM parametres')->fetchAll(\PDO::FETCH_KEY_PAIR);
        $values = [];
        foreach (array_keys(self::DEFINITIONS) as $key) {
            $values[$key] = $stored[$key] ?? '';
        }
        return $values;
    }

    /** @return array<string, string> valeurs publiables (sans les paramètres privés) */
    public static function public(): array
    {
        return array_filter(self::all(), static fn (string $key) => empty(self::DEFINITIONS[$key]['prive']), ARRAY_FILTER_USE_KEY);
    }

    public static function get(string $key): string
    {
        return self::all()[$key] ?? '';
    }

    /** @return list<array<string, mixed>> définitions pour le formulaire du panel */
    public static function definitions(): array
    {
        $list = [];
        foreach (self::DEFINITIONS as $key => $definition) {
            $list[] = ['cle' => $key, 'requis' => $definition['requis'] ?? true] + $definition;
        }
        return $list;
    }

    /**
     * Valide une mise à jour partielle : toute clé inconnue est refusée.
     * @return array<string, string> valeurs nettoyées
     */
    public static function validate(array $data): array
    {
        $v = new Validator($data);
        $clean = [];
        foreach (array_keys($data) as $key) {
            $definition = self::DEFINITIONS[$key] ?? null;
            if ($definition === null) {
                $v->addError((string) $key, 'Paramètre inconnu.');
                continue;
            }
            $required = $definition['requis'] ?? true;
            $clean[$key] = match ($definition['type']) {
                'texte', 'paragraphe' => $v->string($key, $definition['max'], $required),
                'liste'     => self::cleanList($v->string($key, $definition['max'], $required, multiline: true)),
                'email'     => $v->email($key, $required),
                'telephone' => $v->phone($key),
                'url'       => $v->url($key, $required),
                'decimal'   => $v->decimal($key, $definition['min'], $definition['maxValeur']),
            };
        }
        $v->validate();
        return $clean;
    }

    /** @param array<string, string> $values valeurs déjà validées */
    public static function save(array $values): void
    {
        Database::transaction(static function () use ($values): void {
            foreach ($values as $key => $value) {
                Database::query(
                    'INSERT INTO parametres (cle, valeur) VALUES (?, ?) ON DUPLICATE KEY UPDATE valeur = VALUES(valeur)',
                    [$key, $value]
                );
            }
        });
    }

    private static function cleanList(string $value): string
    {
        $lines = array_filter(array_map('trim', explode("\n", $value)), static fn (string $line) => $line !== '');
        return implode("\n", $lines);
    }
}
