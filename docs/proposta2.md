# Proposta di progetto – Campus Truck

L’obiettivo del progetto è realizzare un sistema informativo per la gestione di un food truck universitario, pensato per permettere agli studenti di prenotare il pranzo in anticipo e per consentire agli amministratori di organizzare il servizio.

Il dominio applicativo riguarda un servizio di ristorazione mobile presente all’interno di un campus universitario. Gli utenti registrati possono consultare le giornate in cui il food truck è attivo, scegliere una fascia oraria disponibile e comporre il proprio ordine selezionando gli ingredienti del panino.
Il servizio è organizzato in giornate lavorative, suddivise in time slot con capienza limitata. Ogni ordine è associato a un utente, a una giornata e a uno specifico time slot, e possiede uno stato che descrive la fase in cui si trova: in attesa, confermato, pronto, ritirato oppure rifiutato.

Le funzionalità offerte agli utenti sono le seguenti:

* registrare un nuovo account;
* consultare lo stato del servizio;
* visualizzare le giornate lavorative attive;
* visualizzare gli slot disponibili per una determinata giornata;
* creare un ordine scegliendo fascia oraria e ingredienti;
* modificare un ordine ancora modificabile;
* eliminare un ordine non ancora confermato;
* consultare gli ordini attivi e lo storico degli ordini;
* salvare e riutilizzare panini preferiti.

Le funzionalità offerte all’amministratore sono le seguenti:

* creare e modificare giornate lavorative;
* generare e gestire i time slot;
* attivare o disattivare una giornata lavorativa;
* visualizzare gli ordini suddivisi per giorno e fascia oraria;
* aggiornare lo stato degli ordini;
* rifiutare un ordine quando non può essere preparato;
* gestire gli ingredienti disponibili;
* creare, modificare o disattivare ingredienti;
* visualizzare l’elenco degli utenti registrati;
* bloccare o sbloccare un utente;
* impedire agli utenti bloccati di effettuare nuovi ordini;
* visualizzare una dashboard con statistiche aggregate sul servizio;
* visualizzare una pagina di ranking con utenti più attivi, utenti con più o meno di X ordini e ingredienti più utilizzati.

La dashboard amministrativa permetterà inoltre di consultare informazioni aggregate come:

* numero totale di ordini per giornata;
* numero di ordini per fascia oraria;
* fasce orarie più richieste;
* ingredienti più scelti;
* categorie di ingredienti più utilizzate;
* utenti che effettuano più ordini;
* utenti con più di X ordini;
* utenti con meno di X ordini;
* giorni con maggiore affluenza;
* rapporto tra ordini creati e ordini effettivamente ritirati.


Il progetto sarà realizzato come applicazione web full stack con backend Laravel, frontend Blade/JavaScript e database MySQL.
