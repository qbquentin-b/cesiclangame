<?php

namespace App\Services;

class DailyPuzzles
{
    // Puzzles Queens : grille colorée, 1 reine par région/ligne/colonne
    // regions : tableau 2D indiquant l'ID de région (0-indexed) de chaque cellule
    // solution : [row, col] de chaque reine
    private static array $queens = [
        [
            'size' => 5,
            'regions' => [
                [0, 0, 1, 1, 2],
                [0, 0, 1, 2, 2],
                [3, 0, 1, 2, 2],
                [3, 3, 4, 4, 2],
                [3, 3, 4, 4, 4],
            ],
            'solution' => [[0,3],[1,1],[2,4],[3,0],[4,2]],
        ],
        [
            'size' => 6,
            'regions' => [
                [0, 0, 1, 1, 2, 2],
                [0, 1, 1, 2, 2, 3],
                [0, 1, 4, 4, 3, 3],
                [5, 5, 4, 4, 3, 3],
                [5, 5, 4, 0, 3, 2],
                [5, 5, 5, 0, 2, 2],
            ],
            'solution' => [[0,4],[1,1],[2,5],[3,2],[4,0],[5,3]],
        ],
        [
            'size' => 5,
            'regions' => [
                [0, 1, 1, 1, 2],
                [0, 0, 1, 2, 2],
                [3, 0, 1, 2, 4],
                [3, 3, 3, 4, 4],
                [3, 3, 4, 4, 4],
            ],
            'solution' => [[0,0],[1,3],[2,4],[3,1],[4,2]],
        ],
        [
            'size' => 6,
            'regions' => [
                [0, 0, 0, 1, 1, 2],
                [0, 3, 1, 1, 2, 2],
                [3, 3, 3, 4, 2, 2],
                [3, 5, 4, 4, 4, 2],
                [5, 5, 5, 4, 2, 2],
                [5, 5, 5, 4, 4, 4],
            ],
            'solution' => [[0,5],[1,2],[2,0],[3,4],[4,1],[5,3]],
        ],
        [
            'size' => 5,
            'regions' => [
                [0, 0, 1, 2, 2],
                [0, 1, 1, 2, 3],
                [0, 1, 4, 3, 3],
                [0, 4, 4, 3, 3],
                [4, 4, 4, 3, 3],
            ],
            'solution' => [[0,3],[1,0],[2,2],[3,4],[4,1]],
        ],
        [
            'size' => 6,
            'regions' => [
                [0, 0, 1, 1, 2, 2],
                [0, 0, 1, 3, 3, 2],
                [4, 0, 1, 3, 3, 2],
                [4, 5, 5, 3, 2, 2],
                [4, 5, 5, 5, 3, 2],
                [4, 4, 5, 5, 5, 5],
            ],
            'solution' => [[0,2],[1,5],[2,3],[3,0],[4,1],[5,4]],
        ],
        [
            'size' => 5,
            'regions' => [
                [0, 1, 1, 2, 2],
                [0, 0, 1, 2, 3],
                [4, 0, 1, 3, 3],
                [4, 4, 4, 3, 3],
                [4, 4, 2, 2, 3],
            ],
            'solution' => [[0,0],[1,3],[2,1],[3,4],[4,2]],
        ],
    ];

    // Puzzles Tango : 0=soleil ☀️, 1=lune 🌙
    // constraints : [{r1,c1,r2,c2,type}] 'eq'=même symbole, 'diff'=symboles différents
    // presets : [[row,col,value]...] — cases pré-remplies, non modifiables
    private static array $tango = [
        [
            'size' => 6,
            'solution' => [
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>0,'r2'=>0,'c2'=>1,'type'=>'diff'],
                ['r1'=>1,'c1'=>1,'r2'=>1,'c2'=>2,'type'=>'diff'],
                ['r1'=>2,'c1'=>2,'r2'=>2,'c2'=>3,'type'=>'diff'],
                ['r1'=>3,'c1'=>3,'r2'=>3,'c2'=>4,'type'=>'diff'],
                ['r1'=>4,'c1'=>4,'r2'=>4,'c2'=>5,'type'=>'diff'],
            ],
            'presets' => [[0,0,0],[0,3,1],[1,5,0],[3,1,0],[4,4,0],[5,5,0]],
        ],
        [
            'size' => 6,
            'solution' => [
                [0, 0, 1, 1, 0, 1],
                [1, 1, 0, 0, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
                [0, 1, 1, 0, 0, 1],
                [1, 0, 0, 1, 1, 0],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>0,'r2'=>0,'c2'=>1,'type'=>'eq'],
                ['r1'=>0,'c1'=>2,'r2'=>0,'c2'=>3,'type'=>'eq'],
                ['r1'=>1,'c1'=>0,'r2'=>1,'c2'=>1,'type'=>'eq'],
                ['r1'=>4,'c1'=>1,'r2'=>4,'c2'=>2,'type'=>'eq'],
                ['r1'=>5,'c1'=>2,'r2'=>5,'c2'=>3,'type'=>'diff'],  // corrigé : sol[5][2]=0, sol[5][3]=1
            ],
            'presets' => [[0,0,0],[0,5,1],[2,1,1],[3,4,1],[4,2,1],[5,3,1]],
        ],
        [
            'size' => 6,
            'solution' => [
                [1, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 1, 0, 0, 1, 0],
                [0, 0, 1, 1, 0, 1],
                [1, 0, 0, 1, 0, 1],
                [0, 1, 1, 0, 1, 0],
            ],
            'constraints' => [
                ['r1'=>2,'c1'=>0,'r2'=>2,'c2'=>1,'type'=>'eq'],
                ['r1'=>2,'c1'=>2,'r2'=>2,'c2'=>3,'type'=>'eq'],
                ['r1'=>3,'c1'=>0,'r2'=>3,'c2'=>1,'type'=>'eq'],
                ['r1'=>4,'c1'=>1,'r2'=>4,'c2'=>2,'type'=>'eq'],
                ['r1'=>5,'c1'=>1,'r2'=>5,'c2'=>2,'type'=>'eq'],
            ],
            'presets' => [[0,0,1],[1,5,1],[2,4,1],[3,1,0],[4,2,0],[5,0,0]],
        ],
        [
            'size' => 6,
            'solution' => [
                [0, 1, 0, 1, 1, 0],
                [1, 0, 1, 0, 0, 1],
                [0, 0, 1, 1, 0, 1],
                [1, 1, 0, 0, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>3,'r2'=>0,'c2'=>4,'type'=>'eq'],
                ['r1'=>1,'c1'=>3,'r2'=>1,'c2'=>4,'type'=>'eq'],
                ['r1'=>2,'c1'=>0,'r2'=>2,'c2'=>1,'type'=>'eq'],
                ['r1'=>2,'c1'=>2,'r2'=>2,'c2'=>3,'type'=>'eq'],
                ['r1'=>3,'c1'=>0,'r2'=>3,'c2'=>1,'type'=>'eq'],
            ],
            'presets' => [[0,3,1],[0,4,1],[1,0,1],[2,0,0],[3,1,1],[5,4,1]],
        ],
        [
            'size' => 6,
            'solution' => [
                [1, 0, 1, 0, 0, 1],
                [0, 1, 0, 1, 1, 0],
                [1, 0, 0, 1, 0, 1],
                [0, 1, 1, 0, 1, 0],
                [1, 1, 0, 0, 1, 0],
                [0, 0, 1, 1, 0, 1],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>3,'r2'=>0,'c2'=>4,'type'=>'eq'],
                ['r1'=>1,'c1'=>3,'r2'=>1,'c2'=>4,'type'=>'eq'],
                ['r1'=>4,'c1'=>0,'r2'=>4,'c2'=>1,'type'=>'eq'],
                ['r1'=>5,'c1'=>0,'r2'=>5,'c2'=>1,'type'=>'eq'],
                ['r1'=>2,'c1'=>1,'r2'=>2,'c2'=>2,'type'=>'eq'],    // corrigé : sol[2][1]=0, sol[2][2]=0
            ],
            'presets' => [[0,0,1],[1,4,1],[2,3,1],[3,1,1],[4,0,1],[5,5,1]],
        ],
        [
            'size' => 6,
            'solution' => [
                [0, 1, 1, 0, 0, 1],
                [1, 0, 0, 1, 1, 0],
                [0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0],
                [1, 0, 1, 0, 0, 1],
                [0, 1, 0, 1, 1, 0],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>1,'r2'=>0,'c2'=>2,'type'=>'eq'],
                ['r1'=>0,'c1'=>3,'r2'=>0,'c2'=>4,'type'=>'eq'],
                ['r1'=>1,'c1'=>1,'r2'=>1,'c2'=>2,'type'=>'eq'],
                ['r1'=>4,'c1'=>0,'r2'=>5,'c2'=>0,'type'=>'diff'],  // corrigé : sol[4][0]=1, sol[5][0]=0
                ['r1'=>4,'c1'=>3,'r2'=>4,'c2'=>4,'type'=>'eq'],    // corrigé : sol[4][3]=0, sol[4][4]=0
            ],
            'presets' => [[0,1,1],[0,3,0],[1,3,1],[2,5,1],[3,2,1],[5,4,1]],
        ],
        [
            'size' => 6,
            'solution' => [
                [1, 0, 0, 1, 0, 1],
                [0, 1, 1, 0, 1, 0],
                [1, 0, 1, 0, 0, 1],
                [0, 1, 0, 1, 1, 0],
                [1, 1, 0, 0, 1, 0],
                [0, 0, 1, 1, 0, 1],
            ],
            'constraints' => [
                ['r1'=>0,'c1'=>1,'r2'=>0,'c2'=>2,'type'=>'eq'],
                ['r1'=>1,'c1'=>1,'r2'=>1,'c2'=>2,'type'=>'eq'],
                ['r1'=>4,'c1'=>0,'r2'=>4,'c2'=>1,'type'=>'eq'],
                ['r1'=>5,'c1'=>0,'r2'=>5,'c2'=>1,'type'=>'eq'],
                ['r1'=>2,'c1'=>2,'r2'=>2,'c2'=>3,'type'=>'diff'],
            ],
            'presets' => [[0,0,1],[0,3,1],[1,2,1],[2,5,1],[4,4,1],[5,2,1]],
        ],
    ];

    // Puzzles Zip : relier les numéros dans l'ordre en remplissant toute la grille
    // path : liste ordonnée de [row, col] représentant le chemin complet
    // numbers : positions des numéros avec leur valeur (pour l'affichage frontend)
    private static array $zip = [
        [
            'size' => 4,
            'numbers' => [[0,0,1],[1,3,2],[3,0,3],[2,2,4]],
            'solution' => [[0,0],[0,1],[0,2],[0,3],[1,3],[1,2],[1,1],[1,0],[2,0],[2,1],[2,2],[2,3],[3,3],[3,2],[3,1],[3,0]],
        ],
        [
            'size' => 4,
            'numbers' => [[0,0,1],[0,3,2],[3,3,3],[3,0,4]],
            'solution' => [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3],[2,3],[1,3],[0,3],[0,2],[0,1],[1,1],[1,2],[2,2],[2,1]],
        ],
        [
            'size' => 4,
            'numbers' => [[0,1,1],[1,0,2],[3,1,3],[2,3,4]],
            'solution' => [[0,1],[0,0],[1,0],[2,0],[3,0],[3,1],[2,1],[1,1],[1,2],[0,2],[0,3],[1,3],[2,3],[3,3],[3,2],[2,2]],
        ],
        [
            'size' => 4,
            'numbers' => [[0,2,1],[1,1,2],[2,0,3],[3,3,4]],
            'solution' => [[0,2],[0,1],[0,0],[1,0],[2,0],[1,1],[0,1],[0,2],[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,0],[2,0],[2,1],[2,2],[2,3],[3,3],[3,2],[3,1],[3,0]],
        ],
        [
            'size' => 5,
            'numbers' => [[0,0,1],[0,4,2],[4,4,3],[4,0,4],[2,2,5]],
            'solution' => [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[3,0],[2,0],[1,0],[1,1],[1,2],[1,3],[2,3],[2,2],[2,1],[3,1],[3,2],[3,3]],
        ],
        [
            'size' => 4,
            'numbers' => [[1,0,1],[0,2,2],[3,2,3],[2,3,4]],
            'solution' => [[1,0],[0,0],[0,1],[0,2],[0,3],[1,3],[1,2],[1,1],[2,1],[2,0],[3,0],[3,1],[3,2],[2,2],[2,3],[3,3]],
        ],
        [
            'size' => 4,
            'numbers' => [[0,0,1],[2,1,2],[1,3,3],[3,2,4]],
            'solution' => [[0,0],[1,0],[2,0],[3,0],[3,1],[2,1],[1,1],[0,1],[0,2],[0,3],[1,3],[1,2],[2,2],[3,2],[3,3],[2,3]],
        ],
    ];

    // Puzzles Patches : placer des pièces pour remplir une grille 4×4 (16 cases)
    // Chaque puzzle a exactement 4 pièces de 4 cases = 16 cases au total.
    // La validation est sémantique : on vérifie que chaque pièce forme la bonne forme.
    private static array $patches = [
        // Lundi — J + S + J-miroir + I
        // Grille : [[0,0,1,2],[0,1,1,2],[0,1,2,2],[3,3,3,3]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,1],[1,0],[1,0]],'color'=>0],
                ['shape'=>[[0,1],[1,1],[1,0]],'color'=>1],
                ['shape'=>[[0,1],[0,1],[1,1]],'color'=>2],
                ['shape'=>[[1,1,1,1]],'color'=>3],
            ],
        ],
        // Mardi — T + S + T90 + J
        // Grille : [[0,0,0,1],[2,0,1,1],[2,2,1,3],[2,3,3,3]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,1,1],[0,1,0]],'color'=>0],
                ['shape'=>[[0,1],[1,1],[1,0]],'color'=>1],
                ['shape'=>[[1,0],[1,1],[1,0]],'color'=>2],
                ['shape'=>[[0,0,1],[1,1,1]],'color'=>3],
            ],
        ],
        // Mercredi — S + L + S + J
        // Grille : [[0,1,1,1],[0,0,2,1],[3,0,2,2],[3,3,3,2]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,0],[1,1],[0,1]],'color'=>0],
                ['shape'=>[[1,1,1],[0,0,1]],'color'=>1],
                ['shape'=>[[1,0],[1,1],[0,1]],'color'=>2],
                ['shape'=>[[1,0,0],[1,1,1]],'color'=>3],
            ],
        ],
        // Jeudi — 4× I horizontal
        // Grille : [[0,0,0,0],[1,1,1,1],[2,2,2,2],[3,3,3,3]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,1,1,1]],'color'=>0],
                ['shape'=>[[1,1,1,1]],'color'=>1],
                ['shape'=>[[1,1,1,1]],'color'=>2],
                ['shape'=>[[1,1,1,1]],'color'=>3],
            ],
        ],
        // Vendredi — 2× I vertical + 2× O
        // Grille : [[0,2,2,1],[0,2,2,1],[0,3,3,1],[0,3,3,1]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1],[1],[1],[1]],'color'=>0],
                ['shape'=>[[1],[1],[1],[1]],'color'=>1],
                ['shape'=>[[1,1],[1,1]],'color'=>2],
                ['shape'=>[[1,1],[1,1]],'color'=>3],
            ],
        ],
        // Samedi — Z + L + T90 + T
        // Grille : [[0,0,1,1],[2,0,0,1],[2,2,3,1],[2,3,3,3]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,1,0],[0,1,1]],'color'=>0],
                ['shape'=>[[1,1],[0,1],[0,1]],'color'=>1],
                ['shape'=>[[1,0],[1,1],[1,0]],'color'=>2],
                ['shape'=>[[0,1,0],[1,1,1]],'color'=>3],
            ],
        ],
        // Dimanche — T + T90-droit + T90 + T
        // Grille : [[0,0,0,1],[2,0,1,1],[2,2,3,1],[2,3,3,3]]
        [
            'size' => 4,
            'pieces' => [
                ['shape'=>[[1,1,1],[0,1,0]],'color'=>0],
                ['shape'=>[[0,1],[1,1],[0,1]],'color'=>1],
                ['shape'=>[[1,0],[1,1],[1,0]],'color'=>2],
                ['shape'=>[[0,1,0],[1,1,1]],'color'=>3],
            ],
        ],
    ];

    public static function getForDate(string $type, \DateTimeInterface $date): array
    {
        // Tango uses a deterministic daily generator — includes solution for the hint feature
        if ($type === 'tango') {
            $seed = (int)$date->format('Ymd');
            return (new TangoGenerator($seed))->generate();
        }

        $index = (int)$date->format('N') - 1; // 0=lundi … 6=dimanche
        $puzzles = match ($type) {
            'queens'  => self::$queens,
            'zip'     => self::$zip,
            'patches' => self::$patches,
            default   => [],
        };
        $puzzle = $puzzles[$index % count($puzzles)];
        return array_diff_key($puzzle, array_flip(['solution']));
    }

    public static function validateSolution(string $type, \DateTimeInterface $date, array $submitted): bool
    {
        // Tango: regenerate puzzle from seed to get the day's constraints
        if ($type === 'tango') {
            $seed   = (int)$date->format('Ymd');
            $puzzle = (new TangoGenerator($seed))->generate();
            return self::validateTango($puzzle, $submitted);
        }

        $index = (int)$date->format('N') - 1;
        $puzzles = match ($type) {
            'queens'  => self::$queens,
            'zip'     => self::$zip,
            'patches' => self::$patches,
            default   => [],
        };
        if (empty($puzzles)) return false;
        $puzzle = $puzzles[$index % count($puzzles)];

        return match ($type) {
            'queens'  => self::validateQueens($puzzle, $submitted),
            'zip'     => self::validateZip($puzzle, $submitted),
            'patches' => self::validatePatches($puzzle, $submitted),
            default   => false,
        };
    }

    private static function validateQueens(array $puzzle, array $submitted): bool
    {
        $size    = $puzzle['size'];
        $regions = $puzzle['regions'];

        if (count($submitted) !== $size) return false;

        $rows = [];
        $cols = [];
        $regs = [];

        foreach ($submitted as $q) {
            if (!is_array($q) || count($q) < 2) return false;
            [$r, $c] = array_values($q);
            $r = (int)$r; $c = (int)$c;
            if ($r < 0 || $r >= $size || $c < 0 || $c >= $size) return false;
            $rows[] = $r;
            $cols[] = $c;
            $regs[] = $regions[$r][$c];
        }

        if (count(array_unique($rows)) !== $size) return false;
        if (count(array_unique($cols)) !== $size) return false;
        if (count(array_unique($regs)) !== $size) return false;

        $queens = array_map(fn($q) => [(int)array_values($q)[0], (int)array_values($q)[1]], $submitted);
        for ($i = 0; $i < count($queens); $i++) {
            for ($j = $i + 1; $j < count($queens); $j++) {
                [$r1, $c1] = $queens[$i];
                [$r2, $c2] = $queens[$j];
                if (abs($r1 - $r2) <= 1 && abs($c1 - $c2) <= 1) return false;
            }
        }

        return true;
    }

    private static function validateTango(array $puzzle, array $submitted): bool
    {
        $size        = $puzzle['size'];
        $constraints = $puzzle['constraints'];

        if (count($submitted) !== $size) return false;
        foreach ($submitted as $row) {
            if (!is_array($row) || count($row) !== $size) return false;
            foreach ($row as $v) {
                if ($v !== 0 && $v !== 1) return false;
            }
        }

        for ($r = 0; $r < $size; $r++) {
            $suns = count(array_filter($submitted[$r], fn($v) => $v === 0));
            if ($suns !== $size / 2) return false;
        }

        for ($c = 0; $c < $size; $c++) {
            $suns = count(array_filter(array_column($submitted, $c), fn($v) => $v === 0));
            if ($suns !== $size / 2) return false;
        }

        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size - 2; $c++) {
                if ($submitted[$r][$c] === $submitted[$r][$c + 1] && $submitted[$r][$c] === $submitted[$r][$c + 2]) return false;
            }
        }
        for ($c = 0; $c < $size; $c++) {
            for ($r = 0; $r < $size - 2; $r++) {
                if ($submitted[$r][$c] === $submitted[$r + 1][$c] && $submitted[$r][$c] === $submitted[$r + 2][$c]) return false;
            }
        }

        foreach ($constraints as $con) {
            $v1 = $submitted[$con['r1']][$con['c1']];
            $v2 = $submitted[$con['r2']][$con['c2']];
            if ($con['type'] === 'eq'   && $v1 !== $v2) return false;
            if ($con['type'] === 'diff' && $v1 === $v2) return false;
        }

        return true;
    }

    private static function validateZip(array $puzzle, array $submitted): bool
    {
        $size      = $puzzle['size'];
        $numbers   = $puzzle['numbers'];
        $totalCells = $size * $size;

        if (count($submitted) !== $totalCells) return false;

        $visited = [];
        foreach ($submitted as $cell) {
            if (!is_array($cell) || count($cell) < 2) return false;
            [$r, $c] = array_values($cell);
            $r = (int)$r; $c = (int)$c;
            if ($r < 0 || $r >= $size || $c < 0 || $c >= $size) return false;
            $key = "$r,$c";
            if (isset($visited[$key])) return false;
            $visited[$key] = true;
        }

        $numMap = [];
        foreach ($numbers as [$r, $c, $v]) {
            $numMap["$r,$c"] = (int)$v;
        }
        $ordered = $numbers;
        usort($ordered, fn($a, $b) => $a[2] - $b[2]);

        $numIdx = 0;
        foreach ($submitted as $cell) {
            [$r, $c] = array_values($cell);
            $key = (int)$r . ',' . (int)$c;
            if (isset($numMap[$key])) {
                if ($numMap[$key] !== $ordered[$numIdx][2]) return false;
                $numIdx++;
            }
        }
        if ($numIdx !== count($ordered)) return false;

        return true;
    }

    private static function validatePatches(array $puzzle, array $submitted): bool
    {
        $size   = $puzzle['size'];
        $pieces = $puzzle['pieces'];
        $n      = count($pieces);

        if (count($submitted) !== $size) return false;
        foreach ($submitted as $row) {
            if (!is_array($row) || count($row) !== $size) return false;
            foreach ($row as $v) {
                if (!is_int($v) || $v < 0 || $v >= $n) return false;
            }
        }

        foreach ($pieces as $pieceIdx => $piece) {
            $shape = $piece['shape'];

            $cells = [];
            for ($r = 0; $r < $size; $r++) {
                for ($c = 0; $c < $size; $c++) {
                    if ($submitted[$r][$c] === $pieceIdx) $cells[] = [$r, $c];
                }
            }

            $expectedCount = 0;
            $shapeCells = [];
            for ($dr = 0; $dr < count($shape); $dr++) {
                for ($dc = 0; $dc < count($shape[$dr]); $dc++) {
                    if ($shape[$dr][$dc]) {
                        $expectedCount++;
                        $shapeCells[] = [$dr, $dc];
                    }
                }
            }

            if (count($cells) !== $expectedCount) return false;

            $minR = min(array_column($cells, 0));
            $minC = min(array_column($cells, 1));
            $relCells = array_map(fn($cell) => [$cell[0] - $minR, $cell[1] - $minC], $cells);

            $sortFn = fn($a, $b) => $a[0] !== $b[0] ? $a[0] - $b[0] : $a[1] - $b[1];
            usort($relCells, $sortFn);
            usort($shapeCells, $sortFn);

            if ($relCells !== $shapeCells) return false;
        }

        return true;
    }
}
