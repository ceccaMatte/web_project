# Analisi dei requisiti

Si vuole realizzare una base di dati a supporto di **Campus Truck**, una web-app pensata per migliorare la gestione delle prenotazioni dei panini presso un food truck attivo all’interno dell’istituto.

La base di dati dovrà memorizzare le informazioni relative ai clienti registrati, agli ordini effettuati, agli ingredienti disponibili, alle fasce orarie di prenotazione e allo stato di avanzamento degli ordini. Il sistema dovrà consentire ai clienti di comporre e prenotare il proprio panino, scegliere una fascia oraria disponibile, monitorare lo stato dell’ordine e consultare lo storico delle proprie prenotazioni.

L’amministratore del food truck potrà invece pianificare i giorni e gli orari di servizio, configurare il numero massimo di panini gestibili per fascia oraria, aggiornare lo stato degli ordini, gestire la disponibilità degli ingredienti e consultare statistiche utili per analizzare l’andamento del servizio. In particolare, il sistema dovrà permettere di individuare le fasce orarie più richieste, gli ingredienti maggiormente utilizzati e i clienti più o meno assidui, con l’obiettivo di ridurre le attese e migliorare l’organizzazione del lavoro.

## Intervista

Un primo testo ottenuto dall’intervista con il cliente è il seguente:

Si vuole realizzare un sistema per gestire in modo più ordinato le prenotazioni dei panini presso il food truck dell’istituto. Attualmente, durante alcuni momenti della giornata, si formano code e attese elevate, soprattutto quando molti studenti si presentano nello stesso intervallo di tempo. Il sistema dovrebbe quindi aiutare a distribuire meglio gli ordini nei vari turni o fasce orarie, così da rendere più semplice il lavoro del gestore e più rapido il ritiro da parte dei clienti.

Ogni studente deve poter accedere alla web-app, scegliere gli alimenti che desidera inserire nel proprio panino e prenotare l’ordine per un determinato orario disponibile. Il cliente deve inoltre poter controllare lo stato del proprio panino, in modo da sapere se l’ordine è stato ricevuto, confermato, preparato, pronto per il ritiro oppure eventualmente rifiutato. Deve essere possibile anche consultare lo storico degli ordini già effettuati.

Per ogni cliente si vogliono memorizzare nickname, email e password, così da permettere l’accesso al sistema e rendere più semplice il riconoscimento della persona che ha effettuato la prenotazione. Non è necessario distinguere tra studenti, professori o altro personale dell’istituto: tutti coloro che utilizzano il servizio vengono considerati clienti della piattaforma.

Il panino non viene scelto da un menu fisso, ma viene composto direttamente dall’utente selezionando gli ingredienti disponibili. Alcuni alimenti devono seguire regole particolari: ad esempio, per preparare un panino valido deve essere scelto un solo tipo di pane, mentre per le altre categorie di ingredienti il cliente può scegliere liberamente quali elementi aggiungere. Non si vogliono gestire quantità multiple dello stesso ingrediente all’interno dello stesso panino, ma solo stabilire se un certo alimento è presente oppure assente.

Il proprietario o amministratore del truck deve poter configurare il servizio settimanale, scegliendo in quali giorni il food truck è attivo, in quale posizione si trova e quanti panini possono essere gestiti in ogni fascia oraria. Le fasce di prenotazione hanno durata fissa e il sistema deve impedire nuovi ordini quando un turno risulta già pieno. L’amministratore deve poter definire anche entro quanto tempo prima dell’orario scelto un ordine può ancora essere modificato o annullato dal cliente.

Il gestore deve poter seguire l’avanzamento degli ordini e aggiornare manualmente lo stato di ciascuna prenotazione. In questo modo può organizzare meglio il carico di lavoro, distinguendo gli ordini appena inseriti, quelli confermati, quelli pronti per il ritiro, quelli già consegnati e quelli eventualmente respinti perché non realizzabili.

Si vuole inoltre tenere traccia degli alimenti disponibili. Non è richiesta una gestione completa del magazzino con quantità precise, perché il food truck serve anche clienti al banco che non utilizzano l’applicazione; per questo motivo è sufficiente sapere se un ingrediente è disponibile o non disponibile. Questa informazione permette comunque di evitare che gli utenti prenotino panini con alimenti momentaneamente non presenti.

Il sistema deve permettere al gestore di bloccare alcuni clienti che si comportano in modo scorretto, ad esempio ordinando spesso senza poi ritirare. Un cliente bloccato può continuare ad accedere alla piattaforma e visualizzare le informazioni, ma non può effettuare nuove prenotazioni.

Infine, il proprietario desidera consultare alcune statistiche sull’uso del servizio, come gli orari di punta, gli ingredienti più richiesti, i clienti più assidui o meno assidui e l’andamento degli ordini nei diversi giorni o settimane. Tali informazioni dovrebbero aiutare a pianificare meglio il lavoro e a capire quali alimenti risultano maggiormente richiesti.

