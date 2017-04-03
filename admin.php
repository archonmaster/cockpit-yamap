<?php
// register content fields
$app->on("cockpit.content.fields.sources", function() {

    echo $this->assets([
      	'yamap:assets/ya-map-2.1.js',
        'yamap:assets/field.yamap.js'
    ], $this['cockpit/version']);

});

$app->on("cockpit.content.fields.settings", function() {
  $app = cockpit();
  
  // Max width
  $label = $app("i18n")->get("Balloon options");
echo <<<EOD
<div class="uk-form-row" data-ng-if="field.type=='yamap'">
	<label class="uk-form-label">{$label}</label>
    <div class="uk-form-controls">
    	<input class="uk-form-blank uk-width-1-1" type="text" data-ng-model="field['balloonOptions']" placeholder="{$label}...">
    </div>
</div>
EOD;
});
?>