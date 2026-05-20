<?php

namespace App\Services;

class TangoGenerator
{
    private int $state;
    private const MOD = 4294967296; // 2^32
    private const A   = 1664525;
    private const C   = 1013904223;

    // All 6-cell rows with exactly 3 zeros and 3 ones and no 3 consecutive same
    private static array $VALID_ROWS = [
        [0,0,1,0,1,1],[0,0,1,1,0,1],[0,1,0,0,1,1],[0,1,0,1,0,1],
        [0,1,0,1,1,0],[0,1,1,0,0,1],[0,1,1,0,1,0],[1,0,0,1,0,1],
        [1,0,0,1,1,0],[1,0,1,0,0,1],[1,0,1,0,1,0],[1,0,1,1,0,0],
        [1,1,0,0,1,0],[1,1,0,1,0,0],
    ];

    public function __construct(int $seed)
    {
        $this->state = abs($seed) % self::MOD;
        // Warm up the generator to avoid sequential seeds producing similar grids
        for ($i = 0; $i < 12; $i++) {
            $this->next();
        }
    }

    private function next(): int
    {
        $this->state = (self::A * $this->state + self::C) % self::MOD;
        return $this->state;
    }

    private function shuffle(array $arr): array
    {
        $n = count($arr);
        for ($i = $n - 1; $i > 0; $i--) {
            $j = $this->next() % ($i + 1);
            [$arr[$i], $arr[$j]] = [$arr[$j], $arr[$i]];
        }
        return $arr;
    }

    // Check whether placing $candidate at $row is consistent with the partial grid
    private function isValidPartial(array $grid, int $row, array $candidate): bool
    {
        $size = 6;
        for ($c = 0; $c < $size; $c++) {
            $val = $candidate[$c];

            // No 3 consecutive same in column
            if ($row >= 2 && $grid[$row - 1][$c] === $val && $grid[$row - 2][$c] === $val) {
                return false;
            }

            // Column balance feasibility
            $count0 = $val === 0 ? 1 : 0;
            $count1 = $val === 1 ? 1 : 0;
            for ($r = 0; $r < $row; $r++) {
                if ($grid[$r][$c] === 0) $count0++;
                else $count1++;
            }
            if ($count0 > 3 || $count1 > 3) return false;

            $remaining = $size - $row - 1;
            if ($count0 + $remaining < 3 || $count1 + $remaining < 3) return false;
        }
        return true;
    }

    private function backtrack(array &$grid, array $orders, int $row): bool
    {
        if ($row === 6) return true;
        foreach ($orders[$row] as $idx) {
            $candidate = self::$VALID_ROWS[$idx];
            if ($this->isValidPartial($grid, $row, $candidate)) {
                $grid[] = $candidate;
                if ($this->backtrack($grid, $orders, $row + 1)) return true;
                array_pop($grid);
            }
        }
        return false;
    }

    private function generateGrid(): array
    {
        // Pre-compute one shuffled candidate order per row so backtracking is deterministic
        $n = count(self::$VALID_ROWS);
        $orders = [];
        for ($i = 0; $i < 6; $i++) {
            $orders[] = $this->shuffle(range(0, $n - 1));
        }

        $grid = [];
        if ($this->backtrack($grid, $orders, 0)) {
            return $grid;
        }

        // Fallback: simple alternating pattern (always valid)
        $grid = [];
        for ($r = 0; $r < 6; $r++) {
            $row = [];
            for ($c = 0; $c < 6; $c++) {
                $row[] = ($r + $c) % 2;
            }
            $grid[] = $row;
        }
        return $grid;
    }

    private function pickConstraints(array $grid): array
    {
        $size = 6;
        $pairs = [];

        // Horizontal pairs
        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size - 1; $c++) {
                $pairs[] = [
                    'r1' => $r, 'c1' => $c, 'r2' => $r, 'c2' => $c + 1,
                    'type' => $grid[$r][$c] === $grid[$r][$c + 1] ? 'eq' : 'diff',
                ];
            }
        }
        // Vertical pairs
        for ($r = 0; $r < $size - 1; $r++) {
            for ($c = 0; $c < $size; $c++) {
                $pairs[] = [
                    'r1' => $r, 'c1' => $c, 'r2' => $r + 1, 'c2' => $c,
                    'type' => $grid[$r][$c] === $grid[$r + 1][$c] ? 'eq' : 'diff',
                ];
            }
        }

        $pairs = $this->shuffle($pairs);
        return array_values(array_slice($pairs, 0, 5));
    }

    private function pickPresets(array $grid): array
    {
        $size = 6;
        $all = [];
        for ($r = 0; $r < $size; $r++) {
            for ($c = 0; $c < $size; $c++) {
                $all[] = [$r, $c, $grid[$r][$c]];
            }
        }
        $all = $this->shuffle($all);
        return array_values(array_slice($all, 0, 6));
    }

    public function generate(): array
    {
        $grid = $this->generateGrid();

        return [
            'size'        => 6,
            'constraints' => $this->pickConstraints($grid),
            'presets'     => $this->pickPresets($grid),
            'solution'    => $grid,
        ];
    }
}
