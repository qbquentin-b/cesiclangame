<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasUuids;

    protected $guarded = [];

    /**
     * Parse the markdown content into an array of questions.
     *
     * Format expected:
     *   ### Question text ?
     *   - [x] Correct answer
     *   - [ ] Wrong answer 1
     *   - [ ] Wrong answer 2
     *   - [ ] Wrong answer 3
     */
    public function parseQuestions(): array
    {
        $questions = [];
        $current   = null;

        foreach (explode("\n", $this->content) as $raw) {
            $line = trim($raw);

            if (str_starts_with($line, '### ')) {
                if ($current && $current['correct']) {
                    $questions[] = $current;
                }
                $current = ['question' => substr($line, 4), 'correct' => null, 'answers' => []];

            } elseif ($current && preg_match('/^- \[x\] (.+)/i', $line, $m)) {
                $current['correct']    = trim($m[1]);
                $current['answers'][]  = trim($m[1]);

            } elseif ($current && preg_match('/^- \[ \] (.+)/', $line, $m)) {
                $current['answers'][] = trim($m[1]);
            }
        }

        if ($current && $current['correct']) {
            $questions[] = $current;
        }

        return $questions;
    }
}
