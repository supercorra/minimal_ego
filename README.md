# Minimal Ego v2

Catalogo cinematografico in italiano con ricerca TMDB, watchlist, voti da 1 a 10 e note personali. L'interfaccia riprende l'HTML fornito, con tema scuro e accenti gialli.

## Configurazione Netlify

Imposta `TMDB_READ_TOKEN` nelle variabili d'ambiente del sito Netlify, rendendola disponibile alle Functions. Utilizza un token di lettura TMDB valido e ridistribuisci il sito dopo la configurazione. Il valore non deve essere inserito in HTML, file del repository o messaggi pubblici. Il token precedentemente condiviso nel codice dovrebbe essere revocato e sostituito.

Netlify Database viene provisionato automaticamente. Lo schema è definito in `db/schema.ts`; le migrazioni in `netlify/database/migrations` vengono applicate dalla piattaforma al deploy. Non eseguire manualmente le migrazioni.

La configurazione di deploy copia il file principale `index.html` in una directory pubblica separata e genera con esbuild `auth.js`, il piccolo pacchetto browser di Netlify Identity (sorgente in `src/auth.js`): vengono pubblicati solo i contenuti dell'interfaccia, non il codice server o le dipendenze. Le Netlify Functions espongono `/api/tmdb/*`, `/api/library` e `/api/library/import` anche su domini personalizzati.

## Account e dati personali

Il sito è multiutente grazie a Netlify Identity (pacchetto `@netlify/identity`). La registrazione è aperta: chiunque può creare un account con email e password, confermarlo tramite il link ricevuto via email e recuperare la password con «Password dimenticata?». Chi non ha effettuato l'accesso può cercare e consultare i film, ma per votare o usare la watchlist deve accedere.

Watchlist, voti e note sono salvati nel database Netlify e associati all'identificativo dell'account, quindi si sincronizzano su ogni dispositivo. La funzione `/api/library` verifica la sessione dell'utente e risponde «non autorizzato» senza accesso. Le impostazioni di Identity (conferma email automatica, registrazione aperta o su invito, modelli delle email) si gestiscono da **Project configuration → Identity** nel pannello Netlify.

Salvare un voto rimuove il film dalla watchlist. I pulsanti Cannes e Venezia eseguono le ricerche esemplificative del codice fornito, non restituiscono un archivio completo di premi.

## Importazione da CSV

Dopo l'accesso compare la sezione **Importa**. Si carica un file CSV (separatore virgola o punto e virgola), si indica quale colonna contiene titolo, anno, voto, note e wishlist, e il sito cerca ogni film su TMDB un po' alla volta. Un'anteprima divide i risultati in trovati, dubbi (da scegliere tra più risultati) e non trovati (con titolo correggibile). La conferma salva i film nell'account a blocchi tramite `/api/library/import`; i film già presenti vengono aggiornati e le note esistenti restano se il file non ne contiene di nuove.

Regole: i voti vanno da 1 a 10 e accettano la virgola decimale (es. `7,5`); per la wishlist valgono `sì`, `si`, `x`, `1` e `true`. Un film con voto va tra i votati, un film senza voto ma segnato in wishlist va nella watchlist. È disponibile un CSV di esempio con le colonne `titolo;anno;voto;note;wishlist`.

## Dati del vecchio archivio

La migrazione `import_legacy_library` carica nella tabella `legacy_library_import` i film del vecchio archivio di marco.corradino@gmail.com: 66 film visti con voto, note, data di visione e preferenza, e 23 film in watchlist. I film nascosti e quelli di altri utenti sono stati esclusi; per i film ripetuti un film visto prevale sulla watchlist e vale il voto più recente. Al primo accesso con quell'email, `/api/library` sposta i film nella libreria dell'account e svuota la tabella di appoggio; un voto già dato nella nuova app non viene sovrascritto. La libreria conserva anche titolo originale, anno, regia, generi, durata, paese, sfondo, trailer e valutazione TMDB.

## Verifica e sviluppo

Installa le dipendenze con `npm install` e verifica TypeScript con `npm run typecheck`. Per modifiche future allo schema genera una migrazione con `npm run db:generate -- --name descrizione_modifica`.

L'interfaccia richiede Netlify per le API: l'apertura diretta come file HTML non supporta ricerca e salvataggio. Tailwind viene caricato dal CDN previsto dal codice originale.
