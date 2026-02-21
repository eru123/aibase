<?php

declare(strict_types=1);

namespace Api\Services;

use LightnCandy\LightnCandy;

class TemplateRenderer
{
    private array $cache = [];

    public function render(string $template, array $data = []): string
    {
        $key = hash('sha256', $template);
        if (!isset($this->cache[$key])) {
            $php = LightnCandy::compile($template, [
                'flags' => LightnCandy::FLAG_HANDLEBARS | LightnCandy::FLAG_ERROR_EXCEPTION,
            ]);
            $this->cache[$key] = $this->prepareRenderer($php);
        }

        $renderer = $this->cache[$key];
        return $renderer($data);
    }

    private function prepareRenderer(string $php)
    {
        $php = "<?php $php ?>";

        $tmpDir = null;
        if (!ini_get('allow_url_include') || !ini_get('allow_url_fopen')) {
            $tmpDir = sys_get_temp_dir();
        }

        if (is_string($tmpDir) && is_dir($tmpDir)) {
            $fn = tempnam($tmpDir, 'lci_');
            if (!$fn) {
                error_log("Can not generate tmp file under $tmpDir!!\n");
                return false;
            }
            if (file_put_contents($fn, $php) === false) {
                error_log("Can not include saved temp php code from $fn, you should add $tmpDir into open_basedir!!\n");
                return false;
            }

            $phpfunc = include $fn;
            unlink($fn);

            return $phpfunc;
        }

        return include('data://text/plain,' . urlencode($php));
    }
}
