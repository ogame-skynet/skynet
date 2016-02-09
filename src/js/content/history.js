/* global Skynet */

(function (_s) {
	_s.history.push({
		'date': '09.02.2016 :: v4.1.3',
		summary: 'Changes and improvements from user feedback',
		changes: ['Update translations',
			'Improvements to Event List detection',
			'Fix data lose if combat reports are opened in a new tab',
			'Improve CSS handling',
			'Improve message deletion from Raidar']
	}, {
		'date': '24.01.2016 :: v4.1.2',
		summary: 'Changes and improvements from user feedback and AMO editors',
		changes: ['Fix energy calculation on building page',
			'Update translations',
			'Add Turkish translation',
			'Update external libraries',
			'Fix bug during set up of default values',
			'TrashSim Button for easy combat simulation',
			'Fix wrong espionage level detection with officers',
			'Access API via HTTPS',
			'Small fix an fleet page 1 to make Skynet fully HTTPS ready',
			'Add color configuration for missing or outdated information',
			'Use outdated indicators for research, buildings, ships, defense and Raidar',
			'Fix bug in espionage report if ships not visible']
	}, {
		'date': '29.11.2015 :: v4.1.1',
		summary: 'Changes and improvements from user feedback',
		changes: ['The history is henceforth English, because of the large number of international users',
			'Update for Swedish translation',
			'Fix bug during player storage from galaxy view',
			'Change report handling to solve problems if Skynet had not seen the galaxy view',
			'Hungarian translation',
			'Portuguese translation',
			'Add abbreviated number format in summary',
			'Fix Raidar attack to moons',
			'Fix Raidar detect fleet and defense',
			'Fix Skynet lost techs and buildings after scan with insufficient probes',
			'Danish translation']
	}, {
		'date': '27.10.2015 :: v4.1.0',
		summary: 'Fehlerkorrekturen und Verbesserung nach User Feedback',
		changes: ['Skynet Konfiguration überarbeitet',
			'Historie',
			'Sortierung im Raidar korrigiert, Loot Faktor wurde nicht berücksichtigt',
			'kurze Spionagebericht auf und zuklappen',
			'Angriffssymbol im Raidar',
			'Anzeige im Raidar bei stattfindendem Angriff auf Ziel',
			'Schiffsauswahl und Direktlink für Angriff im Raidar']
	}, {
		'date': '23.10.2015 :: v4.1.0-RC.1',
		summary: 'Eine neue Firefox Version steht öffentlich zum testen bereit',
		changes: ['Anpassung des Galaxylink Parser an v6',
			'Verbesserter Zahlen Parser, erkennt nun Zahlen mit M, Mrd und Bn zuverlässig',
			'Planet & Mond an der selben Position: Spionagebericht wurde dem falschen zugeordnet',
			'Flackern und kurzes weißes aufblitzen im Firefox behoben',
			'Beschleunigung im Firefox',
			'Anpassung der Kapazitätsberechnung fürs raiden an v6',
			'Polnische Übersetzung',
			'Spalte Transportkapazität entfernt']
	}, {
		'date': '18.10.2015 :: v4.1.0-beta.1',
		summary: 'Raidar wird der Öffentlichkeit vorgestellt. Start der Testphase.',
		changes: ['Raidar',
			'Übersetzung Italienisch von Scappe']
	}, {
		'date': '16.10.2015 :: v4.0.2',
		summary: 'Version 4.0.2 ist ein kleines Update mit Fehlerkorrekturen und Spanisch.',
		changes: ['Bugfix: Kolonieschiff ignoriert wenn Recycler in der Flotte',
			'Übersetzung Spanisch von Sora']
	}, {
		'date': '14.10.2015 :: v4.0.1',
		summary: 'Version 4.0.1 ist ein kleines Update mit Fehlerkorrekturen und Schwedisch.',
		changes: ['Trümmerfeldfaktor für Simulatoren korrigiert',
			'Expo Punkte Berechnung aus den Stats von Position 1 (Position 0 Bug)',
			'Energieerkennung (wenn ein Tausender Punkt drin ist)',
			'Übersetzung ins Schwedische von Henke']
	}, {
		'date': '20.09.2015 :: v4.0.0',
		summary: 'Die Finale Version 4 ist mit zwei kleinen Bugfixes online.<br>\n' +
		'Diese Version wurde auch für den Review und zur Signierung bei Mozilla eingereicht.',
		changes: ['Schreibfehler',
			'Zur Anzeige der benötigten Solarsatelliten wurde die Energie falsch erkannt, wenn der Wert 999 überschritt.',
			'NaN Anzeige im Spionagebericht, wenn auf dem Ziel keine Ressourcen vorhanden waren.']
	});
})(Skynet);