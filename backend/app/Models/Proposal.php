<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Validator;

/** Propositions de partenariat déposées depuis le site (table propositions). */
final class Proposal
{
    public const PROFILES = ['entreprise', 'institution', 'investisseur', 'technique'];
    public const PER_PAGE = 20;

    /** @return array<string, string> données nettoyées */
    public static function validate(array $data): array
    {
        $v = new Validator($data);
        $proposal = [
            'profil'       => $v->in('profil', self::PROFILES),
            'organisation' => $v->string('organisation', 150),
            'nom'          => $v->string('nom', 150),
            'email'        => $v->email('email'),
            'pole'         => $v->string('pole', 80),
            'message'      => $v->string('message', 3000, multiline: true),
        ];
        $v->validate();
        return $proposal;
    }

    public static function create(array $proposal, string $ip): void
    {
        Database::query(
            'INSERT INTO propositions (profil, organisation, nom, email, pole, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$proposal['profil'], $proposal['organisation'], $proposal['nom'], $proposal['email'], $proposal['pole'], $proposal['message'], $ip]
        );
    }

    public static function countRecentFromIp(string $ip, int $minutes): int
    {
        return (int) Database::query(
            'SELECT COUNT(*) FROM propositions WHERE ip = ? AND cree_le > (NOW() - INTERVAL ? MINUTE)',
            [$ip, $minutes]
        )->fetchColumn();
    }

    /** Nombre de propositions reçues sur tout le site pendant les $minutes dernières minutes. */
    public static function countRecent(int $minutes): int
    {
        return (int) Database::query(
            'SELECT COUNT(*) FROM propositions WHERE cree_le > (NOW() - INTERVAL ? MINUTE)',
            [$minutes]
        )->fetchColumn();
    }

    /** @return array{elements: list<array<string, mixed>>, page: int, pages: int, total: int, nonLues: int} */
    public static function paginate(int $page): array
    {
        $total = (int) Database::query('SELECT COUNT(*) FROM propositions')->fetchColumn();
        $pages = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min(max(1, $page), $pages);
        $rows = Database::query(
            'SELECT * FROM propositions ORDER BY cree_le DESC, id DESC LIMIT ? OFFSET ?',
            [self::PER_PAGE, ($page - 1) * self::PER_PAGE]
        )->fetchAll();

        return [
            'elements' => array_map(self::toProposal(...), $rows),
            'page'     => $page,
            'pages'    => $pages,
            'total'    => $total,
            'nonLues'  => (int) Database::query('SELECT COUNT(*) FROM propositions WHERE lue = 0')->fetchColumn(),
        ];
    }

    /** @return array<string, mixed> */
    public static function find(int $id): array
    {
        $row = Database::query('SELECT * FROM propositions WHERE id = ?', [$id])->fetch()
            ?: throw HttpException::notFound('Proposition introuvable.');
        return self::toProposal($row);
    }

    public static function setRead(int $id, bool $read): void
    {
        Database::query('UPDATE propositions SET lue = ? WHERE id = ?', [$read ? 1 : 0, $id]);
    }

    public static function delete(int $id): void
    {
        Database::query('DELETE FROM propositions WHERE id = ?', [$id]);
    }

    private static function toProposal(array $row): array
    {
        return [
            'id'           => (int) $row['id'],
            'profil'       => $row['profil'],
            'organisation' => $row['organisation'],
            'nom'          => $row['nom'],
            'email'        => $row['email'],
            'pole'         => $row['pole'],
            'message'      => $row['message'],
            'lue'          => (bool) $row['lue'],
            'creeLe'       => date(DATE_ATOM, (int) strtotime($row['cree_le'])),
        ];
    }
}
