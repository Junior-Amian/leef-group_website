<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Config;

/**
 * Référencement : métadonnées de chaque page servie par AppController
 * (titre, description, adresse canonique, statut HTTP, données structurées schema.org).
 *
 * Pages indexables : l'accueil (/) et une page par pôle actif (/poles/{slug}).
 * Toute autre adresse publique répond 404 (sinon chaque faute de frappe dupliquerait l'accueil).
 * Les adresses absolues (canonique, image de partage, JSON-LD) exigent « site_url » dans la configuration.
 */
final class Seo
{
    public const SITE_NAME = 'LEEF GROUP';
    private const SLOGAN = 'Connecter, structurer, performer';
    private const SHARE_IMAGE = '/app/assets/leef-partage.png'; // 1200 × 630, généré depuis le logo
    private const LOGO = '/app/assets/leef-logo.png';
    private const DESCRIPTION_MAX = 160; // au-delà, Google tronque l'extrait

    /** @return array<string, mixed> page du panel : jamais indexée */
    public static function admin(): array
    {
        return self::page(title: 'Administration | ' . self::SITE_NAME, robots: 'noindex, nofollow');
    }

    /**
     * @param array{parametres: array<string, string>, poles: list<array<string, mixed>>}|null $content
     *        contenu public (null si la base est momentanément indisponible)
     * @return array<string, mixed>
     */
    public static function forPath(string $path, ?array $content): array
    {
        $settings = $content['parametres'] ?? [];
        $siteUrl = self::siteUrl();

        if ($path === '/') {
            return self::page(
                title: ($settings['seo.titre'] ?? '') ?: self::SITE_NAME,
                description: $settings['seo.description'] ?? '',
                canonical: $siteUrl ? "{$siteUrl}/" : null,
                jsonLd: $content && $siteUrl ? [self::website($siteUrl), self::organisation($content, $siteUrl)] : [],
            );
        }

        if (preg_match('#^/poles/([a-z0-9-]+)$#', $path, $match)) {
            if ($content === null) {
                return self::page(title: self::SITE_NAME); // impossible de vérifier le pôle : l'application s'en chargera
            }
            foreach ($content['poles'] as $pole) {
                if ($pole['slug'] === $match[1]) {
                    return self::page(
                        title: self::poleTitle($pole),
                        description: $pole['accroche'],
                        canonical: $siteUrl ? "{$siteUrl}/poles/{$pole['slug']}" : null,
                        jsonLd: $siteUrl ? [self::service($pole, $siteUrl), self::breadcrumb($pole, $siteUrl)] : [],
                        pole: $pole,
                    );
                }
            }
        }

        return self::page(title: 'Page introuvable | ' . self::SITE_NAME, robots: 'noindex', status: 404);
    }

    /** Même format que le titre posé par l'application React (frontend/src/site/SitePage.tsx). */
    public static function poleTitle(array $pole): string
    {
        return "{$pole['nom']} à Abidjan | " . self::SITE_NAME;
    }

    /** Adresse publique du site sans « / » final (ex. https://leef-group.com), ou null si non configurée. */
    public static function siteUrl(): ?string
    {
        $url = rtrim((string) Config::get('site_url', ''), '/');
        return preg_match('#^https?://[^/\s]+$#', $url) ? $url : null;
    }

    /** @return array<string, mixed> */
    private static function page(
        string $title,
        string $description = '',
        ?string $canonical = null,
        ?string $robots = null,
        int $status = 200,
        array $jsonLd = [],
        ?array $pole = null,
    ): array {
        $siteUrl = self::siteUrl();
        return [
            'status'      => $status,
            'title'       => $title,
            'description' => self::excerpt($description),
            'canonical'   => $canonical,
            'robots'      => $robots,
            'image'       => $siteUrl && $status === 200 && $robots === null ? $siteUrl . self::SHARE_IMAGE : null,
            'jsonLd'      => $jsonLd,
            'pole'        => $pole,
        ];
    }

    /** Coupe au dernier mot entier avant DESCRIPTION_MAX caractères. */
    private static function excerpt(string $text): string
    {
        $text = trim((string) preg_replace('/\s+/u', ' ', $text));
        if (mb_strlen($text) <= self::DESCRIPTION_MAX) {
            return $text;
        }
        $cut = mb_substr($text, 0, self::DESCRIPTION_MAX - 1);
        $space = mb_strrpos($cut, ' ');
        return rtrim($space !== false ? mb_substr($cut, 0, $space) : $cut, ' ,;:.') . '…';
    }

    /** @return array<string, mixed> */
    private static function website(string $siteUrl): array
    {
        return [
            '@context'  => 'https://schema.org',
            '@type'     => 'WebSite',
            'name'      => self::SITE_NAME,
            'url'       => "{$siteUrl}/",
            'inLanguage' => 'fr',
            'publisher' => ['@id' => "{$siteUrl}/#organisation"],
        ];
    }

    /** @return array<string, mixed> */
    private static function organisation(array $content, string $siteUrl): array
    {
        $s = $content['parametres'];
        $address = [
            '@type'          => 'PostalAddress',
            'streetAddress'  => trim(implode(', ', array_filter([$s['contact.adresse'] ?? '', $s['contact.adresse_complement'] ?? '']))),
            'addressCountry' => 'CI',
        ];
        $organisation = [
            '@context'    => 'https://schema.org',
            '@type'       => 'Organization',
            '@id'         => "{$siteUrl}/#organisation",
            'name'        => self::SITE_NAME,
            'url'         => "{$siteUrl}/",
            'logo'        => $siteUrl . self::LOGO,
            'image'       => $siteUrl . self::SHARE_IMAGE,
            'slogan'      => self::SLOGAN,
            'description' => $s['seo.description'] ?? '',
            'email'       => $s['contact.email'] ?? '',
            'telephone'   => $s['contact.telephone'] ?? '',
            'address'     => $address,
            'location'    => self::headquarters($s, $address),
            'contactPoint' => ($s['contact.telephone'] ?? '') === '' ? '' : [
                '@type'             => 'ContactPoint',
                'contactType'       => 'customer service',
                'telephone'         => $s['contact.telephone'],
                'email'             => $s['contact.email'] ?? '',
                'areaServed'        => 'CI',
                'availableLanguage' => 'French',
            ],
            'areaServed'  => 'Côte d’Ivoire',
            'sameAs'      => array_values(array_filter([
                $s['reseaux.linkedin'] ?? '', $s['reseaux.facebook'] ?? '', $s['reseaux.instagram'] ?? '',
            ])),
            'hasOfferCatalog' => [
                '@type' => 'OfferCatalog',
                'name'  => 'Pôles d’activité',
                'itemListElement' => array_map(static fn (array $pole) => [
                    '@type' => 'Offer',
                    'itemOffered' => ['@type' => 'Service', 'name' => $pole['nom'], 'url' => "{$siteUrl}/poles/{$pole['slug']}"],
                ], $content['poles']),
            ],
        ];
        return array_filter($organisation, static fn ($value) => $value !== '' && $value !== []); // pas de champ vide
    }

    /**
     * Siège (lieu physique) avec ses coordonnées GPS, celles de la carte de la section Contact.
     * @return array<string, mixed>|string '' si les coordonnées ne sont pas renseignées
     */
    private static function headquarters(array $settings, array $address): array|string
    {
        $latitude = $settings['contact.carte_latitude'] ?? '';
        $longitude = $settings['contact.carte_longitude'] ?? '';
        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            return '';
        }
        return [
            '@type'   => 'Place',
            'name'    => 'Siège de ' . self::SITE_NAME,
            'address' => $address,
            'geo'     => ['@type' => 'GeoCoordinates', 'latitude' => (float) $latitude, 'longitude' => (float) $longitude],
        ];
    }

    /** @return array<string, mixed> */
    private static function service(array $pole, string $siteUrl): array
    {
        return [
            '@context'    => 'https://schema.org',
            '@type'       => 'Service',
            'name'        => $pole['nom'],
            'serviceType' => $pole['nom'],
            'description' => $pole['introduction'],
            'url'         => "{$siteUrl}/poles/{$pole['slug']}",
            'areaServed'  => 'Côte d’Ivoire',
            'provider'    => ['@type' => 'Organization', '@id' => "{$siteUrl}/#organisation", 'name' => self::SITE_NAME, 'url' => "{$siteUrl}/"],
            'hasOfferCatalog' => [
                '@type' => 'OfferCatalog',
                'name'  => $pole['nom'],
                'itemListElement' => array_map(static fn (array $s) => [
                    '@type' => 'Offer',
                    'itemOffered' => ['@type' => 'Service', 'name' => $s['titre'], 'description' => $s['description']],
                ], $pole['prestations']),
            ],
        ];
    }

    /** @return array<string, mixed> fil d'Ariane : Accueil › pôle */
    private static function breadcrumb(array $pole, string $siteUrl): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type'    => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Accueil', 'item' => "{$siteUrl}/"],
                ['@type' => 'ListItem', 'position' => 2, 'name' => $pole['nom'], 'item' => "{$siteUrl}/poles/{$pole['slug']}"],
            ],
        ];
    }
}
