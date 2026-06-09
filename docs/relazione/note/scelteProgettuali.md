# Scelte progettuali consolidate

Il progetto prende il nome di **Campus Truck** e riguarda una web-app per la gestione delle prenotazioni dei panini presso un food truck universitario/scolastico.

Il sistema gestisce un solo food truck. La posizione del truck è variabile, ma viene rappresentata in forma testuale, ad esempio “Campus - Unibo Cesena”, senza coordinate geografiche.

Gli utenti del sistema sono clienti e amministratore. Entrambi sono registrati con nickname, email e password; ciò che cambia sono i privilegi applicativi. I clienti possono essere studenti, professori o altro personale: il sistema non distingue tra queste categorie. L’amministratore è uno solo.

Il sistema gestisce solo panini, intesi come composizione libera di ingredienti. Non esistono panini predefiniti, nomi di panini, listini o prezzi. Il pagamento non viene gestito dall’applicazione.

Un panino è valido se contiene obbligatoriamente uno e un solo tipo di pane. Gli altri ingredienti possono essere presenti o assenti. Non vengono gestite quantità multiple dello stesso ingrediente, quindi un ingrediente può comparire al massimo una volta nello stesso panino.

Ogni ordine è associato a un solo cliente e contiene un solo panino. Un cliente può effettuare più ordini nello stesso giorno e anche nella stessa fascia oraria; ogni panino ordinato viene comunque registrato come ordine distinto.

Gli ordini possono assumere i seguenti stati:

* pending: ordine inserito dal cliente e ancora modificabile;
* confirmed: ordine confermato e non più modificabile;
* ready: panino pronto per la consegna;
* picked_up: ordine ritirato dal cliente;
* rejected: ordine rifiutato dall’amministratore, ad esempio per mancanza di ingredienti.

Il cliente può modificare o annullare l’ordine solo entro un certo limite temporale prima dell’inizio della fascia oraria. Tale limite è configurabile dall’amministratore ed è espresso in minuti.

Le fasce orarie hanno durata fissa di 15 minuti. Per ogni fascia è previsto un numero massimo di panini prenotabili. Il sistema impedisce nuove prenotazioni quando la fascia risulta piena.

L’amministratore pianifica il servizio scegliendo i giorni in cui il truck è attivo e la fascia oraria complessiva del servizio per ciascun giorno. Non sono previste più fasce operative separate nello stesso giorno. La posizione del servizio e i principali vincoli operativi, come capacità per slot e deadline di modifica, sono configurati a livello globale.

Gli ingredienti vengono tracciati solo come disponibili o non disponibili. Non vengono gestite quantità di magazzino, perché il food truck serve anche clienti al banco non tracciati dall’applicazione; una gestione quantitativa delle scorte sarebbe quindi imprecisa e operativamente poco utile.

L’amministratore può bannare manualmente un cliente. Il ban è rappresentato tramite un valore booleano. Un cliente bannato può accedere e consultare il sito, ma non può effettuare ordini.

Il sistema conserva lo storico degli ordini. Il cliente può visualizzare i propri ordini attuali e passati, mentre l’amministratore può monitorare l’andamento complessivo del servizio.

Le statistiche principali riguardano:

* fasce orarie più richieste;
* ingredienti più utilizzati;
* clienti con più o meno di un certo numero di ordini;
* andamento degli ordini per giorno e per settimana.

L’applicazione è realizzata con frontend Blade e JavaScript vanilla, backend Laravel e database MySQL.
