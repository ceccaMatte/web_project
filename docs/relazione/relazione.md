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



## Estrazione dei concetti principali

A seguito della lettura dell’intervista, si individuano i principali concetti del dominio applicativo analizzando i sostantivi e gli oggetti rilevanti citati dal cliente. In questa fase vengono inoltre eliminati sinonimi e termini utilizzati con significato equivalente, associando a ciascun concetto un unico termine di riferimento.


| Termine                   | Breve descrizione                                                                        | Eventuali sinonimi                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Cliente                   | Persona che utilizza la piattaforma per prenotare panini e consultare i propri ordini.   | Studente, professore, personale dell’istituto, utente |
| Amministratore            | Utente che gestisce il servizio, gli ordini e le configurazioni del food truck.          | Proprietario, gestore, amministratore                 |
| Food truck                | Punto di servizio presso cui vengono preparati e consegnati i panini.                    | Truck                                                 |
| Panino                    | Prodotto ordinato dal cliente e composto selezionando ingredienti disponibili.           | Prodotto ordinato                                     |
| Ingrediente               | Alimento utilizzabile nella composizione di un panino.                                   | Alimento                                              |
| Categoria ingrediente     | Raggruppamento logico degli ingredienti utilizzato per applicare regole di composizione. | Categoria di alimenti, tipo di alimento               |
| Ordine                    | Prenotazione effettuata da un cliente per il ritiro di un panino.                        | Prenotazione, richiesta                               |                                 | Stato del panino                                      |
| Fascia oraria             | Intervallo temporale prenotabile per il ritiro di un ordine.                             | Turno, slot                                           |
| Giorno di servizio        | Giorno in cui il food truck accetta prenotazioni.                                        | Giornata attiva                                       |
| Posizione                 | Luogo in cui il food truck opera in uno specifico giorno di servizio.                    | Luogo, sede                                           |

### Specifiche ristrutturate

A seguito della lettura e comprensione dei requisiti, si procede redigendo un testo che ne riassuma i concetti principali eliminando le ambiguità precedentemente rilevate.

Il sistema **Campus Truck** gestisce le prenotazioni dei panini presso un unico **food truck**. Gli utenti registrati al sistema sono distinti in **clienti** e **amministratore**. Per ogni utente vengono memorizzati nickname, email, password e ruolo. Per i clienti viene inoltre memorizzato l’eventuale stato di blocco. Un cliente bloccato può accedere alla piattaforma e consultare i propri dati, ma non può effettuare nuovi ordini.

Il **cliente** può comporre un **panino** selezionando gli **ingredienti** disponibili. Un panino è definito dall’insieme degli ingredienti che lo compongono e non possiede né un nome né un prezzo. Il pagamento non viene gestito dal sistema. Il cliente può salvare panini composti in precedenza, modificarli, eliminarli e riutilizzarli per effettuare nuovi ordini.

Gli **ingredienti** sono organizzati in **categorie di ingredienti**. Ogni ingrediente appartiene a una sola categoria. Per la categoria del pane vale il vincolo che in ogni panino deve essere scelto uno e un solo ingrediente; per le altre categorie la scelta è libera. Non sono previste quantità multiple dello stesso ingrediente nello stesso panino: un ingrediente può essere presente oppure assente.

Per ogni ingrediente vengono memorizzati il nome, la categoria di appartenenza e lo stato di disponibilità. Un ingrediente non disponibile rimane presente nel sistema, ma non può essere selezionato nella composizione di nuovi panini. L’amministratore può inserire nuovi ingredienti e aggiornare la disponibilità di quelli già presenti.

Un **ordine** rappresenta la prenotazione di un solo panino da parte di un solo cliente. Ogni ordine è associato a una specifica **fascia oraria** di ritiro. Un cliente può effettuare più ordini nello stesso giorno e anche nella stessa fascia oraria, ma ogni ordine contiene sempre un solo panino.

Le **fasce orarie** hanno durata fissa di 15 minuti e appartengono a un **giorno di servizio**. Ogni fascia oraria possiede una capacità massima, cioè il numero massimo di ordini accettabili. Quando tale limite viene raggiunto, il sistema non consente ulteriori prenotazioni per quella fascia.

L’**amministratore** configura i giorni in cui il servizio è attivo, la posizione testuale del food truck, la capacità massima delle fasce orarie e il limite temporale entro cui un ordine può essere modificato o annullato. Se un giorno non è attivo, non è possibile effettuare ordini per quel giorno.

Ogni ordine possiede uno **stato** che descrive il suo avanzamento. Gli stati previsti sono: pending, confirmed, ready, picked_up e rejected. Un ordine in stato pending può ancora essere modificato o annullato dal cliente entro il limite temporale stabilito. Un ordine confirmed non può più essere modificato. Un ordine ready indica che il panino è pronto per il ritiro. Un ordine picked_up indica che il panino è stato ritirato. Un ordine rejected indica che la prenotazione è stata rifiutata dall’amministratore.

Il cliente può visualizzare lo stato dei propri ordini, consultare lo storico delle prenotazioni effettuate e riordinare un panino già ordinato in passato. L’amministratore può visualizzare tutti gli ordini, aggiornarne lo stato, rifiutarli, bloccare o sbloccare clienti e consultare statistiche sull’utilizzo del servizio.

Le statistiche richieste riguardano gli ingredienti più utilizzati, i clienti più o meno frequenti e l’andamento degli ordini per giorno o settimana. Tali informazioni vengono ricavate dagli ordini memorizzati nel sistema.

Segue un elenco delle principali azioni richieste:

1. Creare un nuovo cliente.
2. Effettuare operazioni CRUD sui panini salvati.
3. Aggiungere un nuovo ingrediente.
4. Segnare un ingrediente come esaurito o nuovamente disponibile.
5. Visualizzare lo storico degli ordini di un cliente.
6. Filtrare i panini preferiti.
7. Riordinare un ordine a partire dallo storico.
8. Impostare i giorni in cui il servizio viene erogato.
9. Impostare la capacità massima delle fasce orarie.
10. Bloccare o sbloccare un utente.
11. Cambiare lo stato di un ordine o rifiutarlo.
12. Estrarre statistiche sui clienti più o meno frequenti, sugli ingredienti più utilizzati e sull’andamento degli ordini.
