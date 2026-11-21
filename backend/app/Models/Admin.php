<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/** Comptes du panel d'administration (table admins). Les mots de passe ne sont stockés que hachés. */
final class Admin
{
    /**
     * Hash bcrypt d'un mot de passe jetable, vérifié quand l'e-mail est inconnu : la réponse prend alors
     * le même temps que pour un vrai compte (sinon la durée révèle quelles adresses ont un compte).
     */
    private const DUMMY_HASH = '$2y$10$3XtB.pLB7uoYCLiL.0Gi0uzxbi18G/ocIdBXpclIFdUz/L86kmlIm';

    /** @return array{id: int, email: string}|null si les identifiants sont valides */
    public static function verify(string $email, string $password): ?array
    {
        $row = Database::query('SELECT id, email, mot_de_passe_hash FROM admins WHERE email = ?', [mb_strtolower(trim($email))])->fetch();
        if (!$row) {
            password_verify($password, self::DUMMY_HASH);
            return null;
        }
        if (!password_verify($password, $row['mot_de_passe_hash'])) {
            return null;
        }
        if (password_needs_rehash($row['mot_de_passe_hash'], PASSWORD_DEFAULT)) {
            self::setPassword((int) $row['id'], $password);
        }
        return ['id' => (int) $row['id'], 'email' => $row['email']];
    }

    /**
     * Empreinte du mot de passe actuel, mémorisée dans la session à la connexion.
     * Elle change avec le mot de passe : les sessions ouvertes avant le changement sont alors refusées.
     * @return string|null null si le compte n'existe plus
     */
    public static function sessionFingerprint(int $id): ?string
    {
        $hash = Database::query('SELECT mot_de_passe_hash FROM admins WHERE id = ?', [$id])->fetchColumn();
        return $hash === false ? null : hash('sha256', (string) $hash);
    }

    /** Crée le compte, ou change son mot de passe s'il existe déjà. */
    public static function upsert(string $email, string $password): void
    {
        Database::query(
            'INSERT INTO admins (email, mot_de_passe_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE mot_de_passe_hash = VALUES(mot_de_passe_hash)',
            [mb_strtolower(trim($email)), password_hash($password, PASSWORD_DEFAULT)]
        );
    }

    private static function setPassword(int $id, string $password): void
    {
        Database::query('UPDATE admins SET mot_de_passe_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $id]);
    }
}
