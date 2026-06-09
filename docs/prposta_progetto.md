# Proposta di progetto - Campus Truck

## Descrizione generale

L'obiettivo del progetto e' realizzare un sistema informativo di supporto alla gestione di un food truck universitario, pensato per permettere agli studenti di prenotare il pranzo in anticipo e per consentire agli amministratori del servizio di organizzare in modo efficiente giornate lavorative, fasce orarie e ordini.

Il dominio modellato riguarda un servizio di ristorazione mobile collocato all'interno di un campus universitario. Gli utenti possono registrarsi alla piattaforma inserendo le proprie informazioni personali, come nome, nickname, email e password. Ogni utente registrato puo' consultare lo stato del servizio, verificare i giorni in cui il food truck e' attivo, controllare le fasce orarie disponibili e creare un ordine scegliendo gli ingredienti del proprio panino.

Il servizio e' organizzato in giorni lavorativi. Per ogni giorno lavorativo vengono memorizzate informazioni come data, luogo, orario di inizio e fine servizio, numero massimo di ordini accettabili e stato di attivazione. Ogni giorno viene suddiviso in piu' time slot, cioe' fasce orarie nelle quali gli utenti possono prenotare il ritiro del proprio ordine. Gli slot permettono di distribuire gli ordini nel tempo ed evitare un carico eccessivo in un singolo momento della giornata.

Gli ordini rappresentano il nucleo principale del sistema. Ogni ordine e' associato a un utente, a un giorno lavorativo e a uno specifico time slot. Inoltre, ogni ordine possiede un numero progressivo giornaliero, utile per la gestione operativa, e uno stato che descrive la fase in cui si trova: in attesa, confermato, pronto, ritirato oppure rifiutato. Gli ingredienti scelti vengono salvati come snapshot all'interno dell'ordine, in modo da conservare la composizione effettiva anche se in futuro l'elenco generale degli ingredienti viene modificato.

Il sistema gestisce anche gli ingredienti disponibili per la composizione dei panini. Ogni ingrediente ha un nome, un codice, una categoria e un'indicazione di disponibilita'. Le categorie permettono di distinguere pane, carne, formaggi, verdure, salse e altri ingredienti. Gli utenti possono inoltre salvare configurazioni preferite di ingredienti, cosi' da poter riutilizzare rapidamente panini gia' composti in precedenza.

Sono previsti due ruoli principali: utente e amministratore. L'utente puo' effettuare e gestire i propri ordini, mentre l'amministratore puo' pianificare il servizio, monitorare gli ordini ricevuti e modificarne lo stato durante la preparazione.

## Tecnologie utilizzate

Il progetto e' realizzato come applicazione web full stack.

- Database: SQLite, gestito tramite migration e model Eloquent di Laravel.
- Backend: PHP 8.2 con framework Laravel 12.
- Frontend: Blade come sistema di template server-rendered, JavaScript vanilla per le interazioni dinamiche, Tailwind CSS per lo stile dell'interfaccia.
- Build frontend: Vite, con Laravel Vite Plugin.
- Gestione dipendenze: Composer per le librerie PHP e npm per le dipendenze JavaScript/CSS.

## Funzionalita' principali

Le funzionalita' offerte dalla piattaforma per gli utenti sono le seguenti:

- Registrare un nuovo utente inserendo nome, nickname, email e password.
- Effettuare login e logout dalla piattaforma.
- Consultare la home page pubblica con lo stato del servizio nella giornata corrente.
- Visualizzare i giorni lavorativi attivi e il luogo in cui si trova il food truck.
- Visualizzare i time slot disponibili per una certa data.
- Creare un nuovo ordine scegliendo uno slot orario e una lista di ingredienti.
- Modificare un ordine gia' creato, se si trova ancora in uno stato modificabile.
- Eliminare un ordine, se non e' ancora stato confermato o preparato.
- Consultare gli ordini attivi e lo storico degli ordini recenti.
- Salvare o rimuovere una configurazione di ingredienti tra i panini preferiti.
- Riutilizzare una configurazione preferita per velocizzare la creazione di nuovi ordini.

Le funzionalita' offerte all'amministratore sono le seguenti:

- Pianificare i giorni lavorativi futuri del food truck.
- Configurare per ogni giornata luogo, orario di inizio, orario di fine e capacita' massima.
- Generare e gestire le fasce orarie disponibili per il ritiro degli ordini.
- Attivare o disattivare una giornata lavorativa senza eliminarla definitivamente.
- Monitorare gli ordini ricevuti, suddivisi per giorno e fascia oraria.
- Visualizzare il dettaglio degli ingredienti contenuti in ogni ordine.
- Aggiornare lo stato degli ordini durante il ciclo operativo, ad esempio da pending a confirmed, ready o picked_up.
- Rifiutare un ordine quando non puo' essere preparato.
- Gestire la disponibilita' degli ingredienti senza cancellare lo storico degli ordini gia' effettuati.
- Disabilitare un utente mantenendo i suoi dati storici nel sistema.

## Operazioni sul database

Il progetto prevede operazioni di inserimento, modifica, eliminazione logica, consultazione semplice e consultazione aggregata.

Operazioni di inserimento:

- Inserimento di un nuovo utente registrato.
- Inserimento di un nuovo ingrediente.
- Inserimento di un nuovo giorno lavorativo.
- Inserimento dei time slot associati a un giorno lavorativo.
- Inserimento di un nuovo ordine con i relativi ingredienti.
- Inserimento di una configurazione di panino preferito.

Operazioni di modifica:

- Aggiornamento dei dati di pianificazione di una giornata lavorativa.
- Aggiornamento della disponibilita' di un ingrediente.
- Modifica degli ingredienti scelti in un ordine ancora modificabile.
- Aggiornamento dello stato di un ordine.
- Attivazione o disattivazione di una giornata lavorativa.
- Abilitazione o disabilitazione di un utente.

Operazioni di eliminazione:

- Eliminazione di un ordine non ancora confermato.
- Rimozione di un panino dai preferiti dell'utente.
- Disattivazione logica di ingredienti, utenti o giornate lavorative quando e' necessario conservare lo storico.

Operazioni di consultazione semplice:

- Visualizzare gli ingredienti disponibili, raggruppati per categoria.
- Visualizzare gli slot disponibili per una determinata data.
- Visualizzare gli ordini attivi di un utente.
- Visualizzare lo storico degli ordini recenti di un utente.
- Visualizzare tutti gli ordini di una giornata per l'area amministrativa.
- Visualizzare il dettaglio di un ordine con gli ingredienti selezionati.

## Operazioni statistiche e aggregate

Per valorizzare la parte di basi di dati, il sistema puo' offrire anche interrogazioni aggregate e statistiche, utili all'amministratore per analizzare l'andamento del servizio.

- Ottenere il numero totale di ordini per ciascun giorno lavorativo.
- Ottenere il numero di ordini per ogni time slot di una giornata.
- Individuare le fasce orarie piu' richieste dagli studenti.
- Calcolare la percentuale di riempimento di ogni slot rispetto alla capacita' disponibile.
- Individuare gli ingredienti piu' scelti negli ordini.
- Individuare le categorie di ingredienti piu' utilizzate.
- Ottenere gli utenti che hanno effettuato piu' ordini in un certo periodo.
- Calcolare il numero medio di ingredienti scelti per ordine.
- Calcolare il numero di ordini confermati, pronti, ritirati e rifiutati in una giornata.
- Individuare i giorni lavorativi con maggiore affluenza.
- Ottenere gli slot che hanno raggiunto la capienza massima.
- Calcolare il rapporto tra ordini creati e ordini effettivamente ritirati.

Queste interrogazioni permettono di analizzare sia il comportamento degli utenti sia il carico di lavoro del servizio, fornendo dati utili per ottimizzare la pianificazione futura.

## Vincoli e aspetti rilevanti del modello

Il modello dati include diversi vincoli utili a mantenere la coerenza delle informazioni.

Ogni utente ha un indirizzo email univoco. Gli utenti sono distinti in base al ruolo, che puo' essere user oppure admin. Inoltre, un utente puo' essere disabilitato senza essere eliminato, cosi' da non perdere gli ordini storici associati.

Ogni ordine appartiene a un solo utente, a un solo giorno lavorativo e a un solo time slot. Il numero progressivo giornaliero dell'ordine e' univoco all'interno dello stesso giorno lavorativo, in modo da permettere una gestione ordinata degli ordini durante il servizio.

Gli ingredienti degli ordini vengono salvati separatamente dagli ingredienti generali del catalogo. Questa scelta consente di storicizzare la composizione dell'ordine: se un ingrediente viene rinominato, eliminato o reso non disponibile, gli ordini passati continuano a mantenere i dati corretti.

I time slot sono legati ai giorni lavorativi e permettono di controllare la capacita' del servizio. In questo modo il sistema puo' impedire la creazione di ordini in fasce orarie non disponibili o gia' piene.

## Conclusione

Campus Truck non e' soltanto un semplice sistema di prenotazione, ma modella un dominio realistico in cui convivono utenti, ordini, ingredienti, disponibilita' temporale, capienza limitata e gestione amministrativa.

Il progetto permette di rappresentare in modo chiaro le entita' principali e le loro relazioni, offrendo al tempo stesso operazioni di diversa complessita': registrazione e inserimento dati, modifica dello stato degli ordini, gestione delle disponibilita', consultazioni operative e interrogazioni statistiche aggregate.
