<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Validator;

/**
 * Les six pôles d'activité et leurs prestations (tables poles et prestations).
 * La liste est fixe (identité du groupe) : leur contenu est modifiable, pas leur existence.
 */
final class Pole
{
    private const MAX_SERVICES = 12;

    /** @return list<array<string, mixed>> */
    public static function all(bool $activeOnly): array
    {
        $poles = Database::query('SELECT * FROM poles' . ($activeOnly ? ' WHERE actif = 1' : '') . ' ORDER BY ordre, id')->fetchAll();

        $servicesByPole = [];
        foreach (Database::query('SELECT * FROM prestations ORDER BY pole_id, ordre, id')->fetchAll() as $row) {
            $servicesByPole[$row['pole_id']][] = self::toService($row);
        }
        return array_map(static fn (array $pole) => self::toPole($pole, $servicesByPole[$pole['id']] ?? []), $poles);
    }

    /** @return array<string, mixed> */
    public static function find(int $id): array
    {
        $pole = Database::query('SELECT * FROM poles WHERE id = ?', [$id])->fetch()
            ?: throw HttpException::notFound('Pôle introuvable.');
        $services = Database::query('SELECT * FROM prestations WHERE pole_id = ? ORDER BY ordre, id', [$id])->fetchAll();
        return self::toPole($pole, array_map(self::toService(...), $services));
    }

    /**
     * Valide le contenu complet d'un pôle et de ses prestations.
     * @return array{pole: array<string, mixed>, services: list<array<string, string>>}
     */
    public static function validate(array $data): array
    {
        $v = new Validator($data);
        $pole = [
            'nom'          => $v->string('nom', 80),
            'resume'       => $v->string('resume', 160),
            'accroche'     => $v->string('accroche', 300),
            'introduction' => $v->string('introduction', 1000, multiline: true),
            'engagement'   => $v->string('engagement', 300),
            // Photo facultative : sans photo, le site affiche un placeholder aux couleurs du groupe.
            'image'        => $v->string('image', 500, required: false),
            'image_alt'    => $v->string('imageAlt', 200, required: false),
            'actif'        => $v->boolean('actif') ? 1 : 0,
        ];
        if ($pole['image'] !== '' && !preg_match('#^(/uploads/[\w.-]+|https://[^\s<>"]+)$#', $pole['image'])) {
            $v->addError('image', 'Choisissez une photo téléversée ou une adresse https://.');
        }
        if ($pole['image'] !== '' && $pole['image_alt'] === '') {
            $v->addError('imageAlt', 'Décrivez la photo en quelques mots.');
        }
        if ($pole['image'] === '') {
            $pole['image_alt'] = '';
        }
        $services = self::validateServices($v, $data['prestations'] ?? null);
        $v->validate();
        return ['pole' => $pole, 'services' => $services];
    }

    /** Remplace le contenu du pôle et la liste complète de ses prestations (l'ordre du tableau fait foi). */
    public static function update(int $id, array $pole, array $services): void
    {
        Database::transaction(static function () use ($id, $pole, $services): void {
            Database::query(
                'UPDATE poles SET nom = ?, resume = ?, accroche = ?, introduction = ?, engagement = ?, image = ?, image_alt = ?, actif = ? WHERE id = ?',
                [$pole['nom'], $pole['resume'], $pole['accroche'], $pole['introduction'], $pole['engagement'], $pole['image'], $pole['image_alt'], $pole['actif'], $id]
            );
            Database::query('DELETE FROM prestations WHERE pole_id = ?', [$id]);
            foreach ($services as $index => $service) {
                Database::query(
                    'INSERT INTO prestations (pole_id, titre, libelle_court, description, ordre) VALUES (?, ?, ?, ?, ?)',
                    [$id, $service['titre'], $service['libelleCourt'], $service['description'], $index + 1]
                );
            }
        });
    }

    /** @return list<array{titre: string, libelleCourt: string, description: string}> */
    private static function validateServices(Validator $v, mixed $list): array
    {
        if (!is_array($list) || $list === [] || !array_is_list($list)) {
            $v->addError('prestations', 'Ajoutez au moins une prestation.');
            return [];
        }
        if (count($list) > self::MAX_SERVICES) {
            $v->addError('prestations', self::MAX_SERVICES . ' prestations maximum.');
            return [];
        }
        $clean = [];
        foreach ($list as $index => $service) {
            $sv = new Validator(is_array($service) ? $service : []);
            $clean[] = [
                'titre'        => $sv->string('titre', 150),
                'libelleCourt' => $sv->string('libelleCourt', 60),
                'description'  => $sv->string('description', 300),
            ];
            foreach ($sv->errors() as $field => $message) {
                $v->addError("prestations.{$index}.{$field}", $message); // ex. prestations.2.titre
            }
        }
        return $clean;
    }

    /** Ligne SQL → représentation de l'API (camelCase, types). */
    private static function toPole(array $row, array $services): array
    {
        return [
            'id'           => (int) $row['id'],
            'slug'         => $row['slug'],
            'nom'          => $row['nom'],
            'resume'       => $row['resume'],
            'accroche'     => $row['accroche'],
            'introduction' => $row['introduction'],
            'engagement'   => $row['engagement'],
            'image'        => $row['image'],
            'imageAlt'     => $row['image_alt'],
            'actif'        => (bool) $row['actif'],
            'prestations'  => $services,
        ];
    }

    private static function toService(array $row): array
    {
        return ['titre' => $row['titre'], 'libelleCourt' => $row['libelle_court'], 'description' => $row['description']];
    }
}
