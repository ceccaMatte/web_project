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

Segue un elenco delle principali azioni richieste:

1. Creare un nuovo cliente.
2. Inserire un nuovo ordine per una fascia oraria disponibile.
3. Modificare o annullare un ordine ancora modificabile.
4. Cambiare lo stato di avanzamento di un ordine o rifiutarlo.
5. Visualizzare lo storico degli ordini di un cliente.
6. Riordinare un ordine a partire dallo storico.
7. Aggiornare la disponibilità di un ingrediente per uno specifico giorno di servizio.
8. Impostare i giorni in cui il servizio viene erogato e configurare le relative fasce orarie.
9. Estrarre statistiche sui clienti più o meno frequenti, sugli ingredienti più utilizzati e sull’andamento degli ordini.


## Progettazione concettuale

### Schema scheletro

Dopo aver analizzato il dominio applicativo, si procede alla progettazione dello schema E/R. Per rendere più chiara la modellazione, il dominio è stato inizialmente suddiviso in tre viste parziali, ciascuna relativa a un aspetto specifico del sistema:

* gestione degli utenti e dei ruoli;
* composizione degli ordini e gestione degli ingredienti;
* prenotazione degli ordini e pianificazione del servizio.

Questa suddivisione permette di analizzare separatamente le principali aree del dominio per poi integrarle nello schema concettuale finale.

---

### Vista utenti e ruoli

La prima vista riguarda la gestione degli utenti della piattaforma. Poiché clienti e amministratori condividono le stesse informazioni di autenticazione, è stata introdotta una generica entità **UTENTE**, identificata da una chiave primaria artificiale si sarebbe potuta utilizzare la mail per sicurezza di è scelto di creare un attributo ad hoc.

L’entità **UTENTE** viene specializzata nelle entità **CLIENTE** e **AMMINISTRATORE** mediante una generalizzazione totale ed esclusiva: ogni utente appartiene a una sola delle due categorie.

Nell’entità **CLIENTE** è stato introdotto l’attributo `abilitato` per modellare il vincolo applicativo secondo cui solo i clienti autorizzati possono effettuare nuovi ordini. Tale vincolo non è esprimibile direttamente tramite le cardinalità dello schema E/R e viene quindi rappresentato attraverso questo attributo.

*Figura 1 - Schema E/R parziale per la gestione degli utenti e dei ruoli.*

---

### Vista composizione degli ordini e ingredienti

La seconda vista riguarda la composizione degli ordini. Poiché ogni ordine corrisponde sempre a un singolo panino, non è stata introdotta un'entità autonoma **PANINO**. La composizione viene invece rappresentata direttamente tramite gli ingredienti associati all'ordine.

Per questo motivo è stata introdotta l'entità **INGREDIENTE_ORDINE**, che consente di storicizzare la composizione del panino al momento della prenotazione. In particolare, gli attributi `nomeSnapshot` e `categoriaSnapshot` permettono di conservare le informazioni originali dell'ingrediente anche nel caso in cui il catalogo venga modificato successivamente.

Allo stesso tempo, **INGREDIENTE_ORDINE** mantiene un collegamento all'entità **INGREDIENTE**, consentendo di risalire all'ingrediente attualmente presente nel catalogo e supportando funzionalità come il riordino di panini già acquistati.

Gli ingredienti sono organizzati tramite l'entità **CATEGORIA_INGREDIENTE**. Gli attributi `minScelte` e `maxScelte` sono stati introdotti per rappresentare i vincoli di composizione del panino. Ad esempio, il requisito secondo cui deve essere selezionato esattamente un tipo di pane viene modellato imponendo per la relativa categoria un minimo e un massimo pari a uno.

*Figura 2 - Schema E/R parziale per la composizione degli ordini e la gestione degli ingredienti.*

---

### Vista prenotazioni e pianificazione del servizio

La terza vista riguarda la prenotazione degli ordini e la pianificazione temporale del servizio.

L’entità **ORDINE** rappresenta una prenotazione effettuata da un cliente ed è identificata da una chiave primaria artificiale. È stato inoltre introdotto l’attributo `preferito`, che consente di rappresentare i panini salvati dal cliente senza dover modellare una specifica entità dedicata ai preferiti: un ordine già presente nello storico può semplicemente essere marcato come tale.

La pianificazione temporale è stata modellata attraverso le entità **FASCIA_ORARIA** e **GIORNO_SERVIZIO**. Questa scelta consente di separare la definizione delle finestre di ritiro dalla gestione delle singole giornate operative del food truck, rendendo più flessibile la configurazione del servizio.

Le informazioni relative all'orario complessivo di un giorno di servizio sono considerate derivabili dalle fasce orarie associate e non richiedono quindi una modellazione autonoma.

*Figura 3 - Schema E/R parziale per la prenotazione degli ordini e la pianificazione del servizio.*

---

### Integrazione delle viste

Le tre viste vengono integrate nello schema concettuale finale attraverso le entità condivise tra i diversi sottodomini.

L’entità **CLIENTE** collega la gestione degli utenti con quella degli ordini, mentre l’entità **ORDINE** costituisce il punto di raccordo tra la composizione del panino e la pianificazione del ritiro.

L’integrazione non ha richiesto la risoluzione di conflitti tra le viste, poiché i concetti comuni sono stati uniformati durante la fase di analisi dei requisiti. Lo schema finale è quindi ottenuto dall’unione delle tre viste mantenendo le relazioni individuate nelle singole fasi di progettazione.

*Figura 4 - Schema E/R concettuale finale.*

### Stima del volume dei dati

In questa sezione viene stimato il volume dei dati relativi alle principali entità e associazioni dello schema E/R. Le stime sono riferite a un anno di utilizzo del sistema.

Si assume che il food truck sia attivo per circa 300 giorni all’anno, con una media di 14 fasce orarie giornaliere. Si ipotizza inoltre una media di circa 70 ordini al giorno e una composizione media di 5 ingredienti per ordine. Il catalogo degli ingredienti è stimato in circa 40 elementi, suddivisi in 6 categorie.

| Concetto                  | Costrutto | Volume  |
| ------------------------- | --------- | ------- |
| UTENTE                    | E         | 801     |
| CLIENTE                   | E         | 800     |
| AMMINISTRATORE            | E         | 1       |
| ORDINE                    | E         | 21.000  |
| FASCIA_ORARIA             | E         | 4.200   |
| GIORNO_SERVIZIO           | E         | 300     |
| INGREDIENTE_ORDINE        | E         | 105.000 |
| INGREDIENTE               | E         | 40      |
| CATEGORIA_INGREDIENTE     | E         | 6       |
| DISPONIBILITA_INGREDIENTE | E         | 12.000  |
| EFFETTUA                  | R         | 21.000  |
| PRENOTATO_IN              | R         | 21.000  |
| APPARTIENE_A              | R         | 4.200   |
| FORMATO_DA                | R         | 105.000 |
| RIFERISCE                 | R         | 105.000 |
| APPARTIENE                | R         | 40      |
| HA                        | R         | 12.000  |
| DEFINISCE                 | R         | 12.000  |

```
I volumi sono stati calcolati sulla base delle seguenti ipotesi:

* il numero di utenti è pari a circa 800 clienti registrati più un amministratore;
* il numero di ordini annui è pari a 300 giorni di servizio per 70 ordini medi giornalieri, quindi circa 21.000 ordini;
* il numero di fasce orarie annue è pari a 300 giorni per 14 fasce orarie giornaliere, quindi circa 4.200 fasce;
* il numero di ingredienti d’ordine è pari a 21.000 ordini per 5 ingredienti medi per ordine, quindi circa 105.000 occorrenze;
* il numero di disponibilità ingrediente è pari a 300 giorni per 40 ingredienti presenti nel catalogo, quindi circa 12.000 occorrenze.
```


### Descrizione delle operazioni principali e stima della loro frequenza

Le operazioni considerate sono state selezionate tra quelle individuate nella fase di analisi, privilegiando quelle più rappresentative del dominio applicativo e quelle che comportano gli accessi più significativi alla base di dati.

| Codice | Operazione                                                                                                            |        Frequenza |
| -----: | --------------------------------------------------------------------------------------------------------------------- | ---------------: |
|      1 | Creare un nuovo cliente                                                                                               |      3 al giorno |
|      2 | Inserire un nuovo ordine per una fascia oraria disponibile                                                            |     70 al giorno |
|      3 | Modificare o annullare un ordine ancora modificabile                                                                  |     10 al giorno |
|      4 | Cambiare lo stato di avanzamento di un ordine o rifiutarlo                                                            |    158 al giorno |
|      5 | Visualizzare lo storico degli ordini di un cliente                                                                    |    123 al giorno |
|      6 | Riordinare un ordine a partire dallo storico                                                                          |     49 al giorno |
|      7 | Aggiornare la disponibilità di un ingrediente per un giorno di servizio                                               | 4 alla settimana |
|      8 | Impostare i giorni in cui il servizio viene erogato e configurare le fasce orarie                                     | 1 alla settimana |
|      9 | Estrarre statistiche sui clienti più o meno frequenti, sugli ingredienti più utilizzati e sull’andamento degli ordini |      1 al giorno |


### Schemi di navigazione e tabelle degli accessi

Sono riportate in seguito le tabelle degli accessi relative alle principali operazioni individuate. Dove l’operazione non risulti immediata, viene indicato anche il relativo schema di navigazione.
Ai fini del calcolo del costo, si considerano di peso doppio gli accessi in scrittura rispetto a quelli in lettura.

---

#### OP 1 - Creare un nuovo cliente

L’operazione consiste nella registrazione di un nuovo cliente all’interno della piattaforma. Vengono create una nuova istanza di **UTENTE** e la relativa specializzazione **CLIENTE**.

| Concetto | Costrutto | Accessi | Tipo |
| -------- | --------- | ------- | ---- |
| UTENTE   | E         | 1       | S    |
| CLIENTE  | E         | 1       | S    |

**Totale per esecuzione: 2S = 2 × 2 = 4**
**Costo giornaliero: 4 × 3 = 12**

---

#### OP 2 - Inserire un nuovo ordine per una fascia oraria disponibile

Prima di inserire un nuovo ordine è necessario verificare che il cliente sia abilitato, che il giorno di servizio sia attivo, che la fascia oraria non abbia superato la capacità massima e che gli ingredienti scelti siano disponibili per quel giorno. Successivamente viene creato il nuovo ordine.

Schema di navigazione:

```text
CLIENTE → EFFETTUA → ORDINE
ORDINE → PRENOTATO_IN → FASCIA_ORARIA → APPARTIENE_A → GIORNO_SERVIZIO
ORDINE → FORMATO_DA → INGREDIENTE_ORDINE → RIFERISCE → INGREDIENTE
INGREDIENTE → HA → DISPONIBILITA_INGREDIENTE ← DEFINISCE ← GIORNO_SERVIZIO
INGREDIENTE → APPARTIENE → CATEGORIA_INGREDIENTE
```

##### OP 2.1 - Verifica preliminare di cliente, giorno di servizio e disponibilità della fascia oraria

Si considera una media di 5 ordini già presenti nella fascia oraria selezionata.

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | --------- | ------- | ---- |
| CLIENTE         | E         | 1       | L    |
| FASCIA_ORARIA   | E         | 1       | L    |
| APPARTIENE_A    | R         | 1       | L    |
| GIORNO_SERVIZIO | E         | 1       | L    |
| PRENOTATO_IN    | R         | 5       | L    |
| ORDINE          | E         | 5       | L    |

**Costo parziale: 14L = 14**

##### OP 2.2 - Verifica della disponibilità degli ingredienti

Si considera una media di 5 ingredienti per ordine.

| Concetto                  | Costrutto | Accessi | Tipo |
| ------------------------- | --------- | ------- | ---- |
| INGREDIENTE               | E         | 5       | L    |
| APPARTIENE                | R         | 5       | L    |
| CATEGORIA_INGREDIENTE     | E         | 5       | L    |
| HA                        | R         | 5       | L    |
| DEFINISCE                 | R         | 5       | L    |
| DISPONIBILITA_INGREDIENTE | E         | 5       | L    |

**Costo parziale: 30L = 30**

##### OP 2.3 - Creazione del nuovo ordine

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| ORDINE             | E         | 1       | S    |
| EFFETTUA           | R         | 1       | S    |
| PRENOTATO_IN       | R         | 1       | S    |
| INGREDIENTE_ORDINE | E         | 5       | S    |
| FORMATO_DA         | R         | 5       | S    |
| RIFERISCE          | R         | 5       | S    |

**Costo parziale: 18S = 36**

##### Riepilogo OP 2

| Sottosezione | Costo |
| ------------ | ----- |
| OP 2.1       | 14    |
| OP 2.2       | 30    |
| OP 2.3       | 36    |

**Totale per esecuzione: 18S + 44L = (18 × 2) + 44 = 80**
**Costo giornaliero: 80 × 70 = 5600**

---

#### OP 3 - Modificare o annullare un ordine ancora modificabile

Per modificare o annullare un ordine occorre verificare che l’ordine sia ancora modificabile, controllare il limite temporale associato alla fascia oraria e, nel caso di modifica della composizione, aggiornare gli ingredienti associati all’ordine.

Schema di navigazione:

```text
ORDINE → PRENOTATO_IN → FASCIA_ORARIA → APPARTIENE_A → GIORNO_SERVIZIO
ORDINE → FORMATO_DA → INGREDIENTE_ORDINE → RIFERISCE → INGREDIENTE
INGREDIENTE → HA → DISPONIBILITA_INGREDIENTE ← DEFINISCE ← GIORNO_SERVIZIO
```

##### OP 3.1 - Recupero dell'ordine e verifica della possibilità di modifica

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | --------- | ------- | ---- |
| ORDINE          | E         | 1       | L    |
| PRENOTATO_IN    | R         | 1       | L    |
| FASCIA_ORARIA   | E         | 1       | L    |
| APPARTIENE_A    | R         | 1       | L    |
| GIORNO_SERVIZIO | E         | 1       | L    |

**Costo parziale: 5L = 5**

##### OP 3.2 - Verifica della nuova composizione

| Concetto                  | Costrutto | Accessi | Tipo |
| ------------------------- | --------- | ------- | ---- |
| FORMATO_DA                | R         | 5       | L    |
| INGREDIENTE_ORDINE        | E         | 5       | L    |
| INGREDIENTE               | E         | 5       | L    |
| APPARTIENE                | R         | 5       | L    |
| CATEGORIA_INGREDIENTE     | E         | 5       | L    |
| HA                        | R         | 5       | L    |
| DEFINISCE                 | R         | 5       | L    |
| DISPONIBILITA_INGREDIENTE | E         | 5       | L    |

**Costo parziale: 40L = 40**

##### OP 3.3 - Aggiornamento dell'ordine

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| ORDINE             | E         | 1       | S    |
| INGREDIENTE_ORDINE | E         | 5       | S    |
| FORMATO_DA         | R         | 5       | S    |
| RIFERISCE          | R         | 5       | S    |

**Costo parziale: 16S = 32**

##### Riepilogo OP 3

| Sottosezione | Costo |
| ------------ | ----- |
| OP 3.1       | 5     |
| OP 3.2       | 40    |
| OP 3.3       | 32    |

**Totale per esecuzione: 16S + 45L = (16 × 2) + 45 = 77**
**Costo giornaliero: 77 × 10 = 770**

---

#### OP 4 - Cambiare lo stato di avanzamento di un ordine o rifiutarlo

L’operazione viene eseguita dall’amministratore e consiste nell’aggiornamento dello stato corrente di un ordine. Nel caso di rifiuto, lo stato viene impostato a `rejected`.

| Concetto | Costrutto | Accessi | Tipo |
| -------- | --------- | ------- | ---- |
| ORDINE   | E         | 1       | L    |
| ORDINE   | E         | 1       | S    |

**Totale per esecuzione: 1S + 1L = (1 × 2) + 1 = 3**
**Costo giornaliero: 3 × 158 = 474**

---

#### OP 5 - Visualizzare lo storico degli ordini di un cliente

L’operazione consiste nella visualizzazione dello storico degli ordini effettuati da un cliente. Per stimare il costo si considera che un cliente effettui mediamente 2 ordini a settimana; considerando gli ultimi quattro mesi (circa 16 settimane), lo storico consultato contiene mediamente **32 ordini**. Per ogni ordine vengono mostrate anche la fascia oraria, il giorno di servizio e la composizione storicizzata del panino.

Schema di navigazione:

```text
CLIENTE → EFFETTUA → ORDINE
ORDINE → PRENOTATO_IN → FASCIA_ORARIA → APPARTIENE_A → GIORNO_SERVIZIO
ORDINE → FORMATO_DA → INGREDIENTE_ORDINE
```

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| CLIENTE            | E         | 1       | L    |
| EFFETTUA           | R         | 32      | L    |
| ORDINE             | E         | 32      | L    |
| PRENOTATO_IN       | R         | 32      | L    |
| FASCIA_ORARIA      | E         | 32      | L    |
| APPARTIENE_A       | R         | 32      | L    |
| GIORNO_SERVIZIO    | E         | 32      | L    |
| FORMATO_DA         | R         | 160     | L    |
| INGREDIENTE_ORDINE | E         | 160     | L    |

**Totale per esecuzione: 513L = 513**
**Costo giornaliero: 513 × 123 = 63099**

---

#### OP 6 - Riordinare un ordine a partire dallo storico

Per riordinare un ordine passato è necessario recuperare la composizione storicizzata, verificare che gli ingredienti siano ancora disponibili, controllare la disponibilità della fascia oraria scelta e infine creare un nuovo ordine.

Schema di navigazione:

```text
ORDINE storico → FORMATO_DA → INGREDIENTE_ORDINE → RIFERISCE → INGREDIENTE
INGREDIENTE → HA → DISPONIBILITA_INGREDIENTE ← DEFINISCE ← GIORNO_SERVIZIO
FASCIA_ORARIA → APPARTIENE_A → GIORNO_SERVIZIO
FASCIA_ORARIA ← PRENOTATO_IN ← ORDINE
CLIENTE → EFFETTUA → nuovo ORDINE
```

##### OP 6.1 - Recupero della composizione storicizzata

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| ORDINE             | E         | 1       | L    |
| FORMATO_DA         | R         | 5       | L    |
| INGREDIENTE_ORDINE | E         | 5       | L    |
| RIFERISCE          | R         | 5       | L    |

**Costo parziale: 16L = 16**

##### OP 6.2 - Verifica della disponibilità degli ingredienti

| Concetto                  | Costrutto | Accessi | Tipo |
| ------------------------- | --------- | ------- | ---- |
| INGREDIENTE               | E         | 5       | L    |
| APPARTIENE                | R         | 5       | L    |
| CATEGORIA_INGREDIENTE     | E         | 5       | L    |
| HA                        | R         | 5       | L    |
| DEFINISCE                 | R         | 5       | L    |
| DISPONIBILITA_INGREDIENTE | E         | 5       | L    |

**Costo parziale: 30L = 30**

##### OP 6.3 - Verifica della fascia oraria scelta

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | --------- | ------- | ---- |
| CLIENTE         | E         | 1       | L    |
| FASCIA_ORARIA   | E         | 1       | L    |
| APPARTIENE_A    | R         | 1       | L    |
| GIORNO_SERVIZIO | E         | 1       | L    |
| PRENOTATO_IN    | R         | 5       | L    |
| ORDINE          | E         | 5       | L    |

**Costo parziale: 14L = 14**

##### OP 6.4 - Creazione del nuovo ordine

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| ORDINE             | E         | 1       | S    |
| EFFETTUA           | R         | 1       | S    |
| PRENOTATO_IN       | R         | 1       | S    |
| INGREDIENTE_ORDINE | E         | 5       | S    |
| FORMATO_DA         | R         | 5       | S    |
| RIFERISCE          | R         | 5       | S    |

**Costo parziale: 18S = 36**

##### Riepilogo OP 6

| Sottosezione | Costo |
| ------------ | ----- |
| OP 6.1       | 16    |
| OP 6.2       | 30    |
| OP 6.3       | 14    |
| OP 6.4       | 36    |

**Totale per esecuzione: 18S + 60L = (18 × 2) + 60 = 96**
**Costo giornaliero: 96 × 49 = 4704**

---

#### OP 7 - Aggiornare la disponibilità di un ingrediente per un giorno di servizio

L’operazione consente all’amministratore di indicare se un ingrediente è disponibile o non disponibile in uno specifico giorno di servizio. La disponibilità viene gestita tramite l’entità **DISPONIBILITA_INGREDIENTE**, associata sia a **INGREDIENTE** sia a **GIORNO_SERVIZIO**.

Schema di navigazione:

```text
INGREDIENTE → HA → DISPONIBILITA_INGREDIENTE ← DEFINISCE ← GIORNO_SERVIZIO
```

| Concetto                  | Costrutto | Accessi | Tipo |
| ------------------------- | --------- | ------- | ---- |
| INGREDIENTE               | E         | 1       | L    |
| GIORNO_SERVIZIO           | E         | 1       | L    |
| HA                        | R         | 1       | L    |
| DEFINISCE                 | R         | 1       | L    |
| DISPONIBILITA_INGREDIENTE | E         | 1       | L    |
| DISPONIBILITA_INGREDIENTE | E         | 1       | S    |

**Totale per esecuzione: 1S + 5L = (1 × 2) + 5 = 7**
**Costo settimanale: 7 × 4 = 28**

---

#### OP 8 - Impostare i giorni in cui il servizio viene erogato e configurare le fasce orarie

L’operazione consente all’amministratore di configurare una settimana di servizio. Si considera la creazione di 7 giorni di servizio, 14 fasce orarie per ciascun giorno e la creazione delle disponibilità degli ingredienti per ciascun giorno, inizializzate sulla base del catalogo.

Schema di navigazione:

```text
GIORNO_SERVIZIO → APPARTIENE_A ← FASCIA_ORARIA
GIORNO_SERVIZIO → DEFINISCE → DISPONIBILITA_INGREDIENTE ← HA ← INGREDIENTE
```

| Concetto                  | Costrutto | Accessi | Tipo |
| ------------------------- | --------- | ------- | ---- |
| GIORNO_SERVIZIO           | E         | 7       | S    |
| FASCIA_ORARIA             | E         | 98      | S    |
| APPARTIENE_A              | R         | 98      | S    |
| DISPONIBILITA_INGREDIENTE | E         | 280     | S    |
| HA                        | R         | 280     | S    |
| DEFINISCE                 | R         | 280     | S    |

**Totale per esecuzione: 1043S = 1043 × 2 = 2086**
**Costo settimanale: 2086 × 1 = 2086**

---


#### OP 9 - Estrarre statistiche sui clienti più o meno frequenti, sugli ingredienti più utilizzati e sull’andamento degli ordini

L’operazione consente all’amministratore di ottenere informazioni aggregate sull’utilizzo del servizio. Si considera l’estrazione giornaliera di statistiche riferite all’ultimo mese di attività. Considerando circa 21.000 ordini annui, si stimano circa **1.750 ordini mensili** e circa **8.750 ingredienti d’ordine mensili** (5 ingredienti medi per ordine).

Schema di navigazione:

```text
CLIENTE → EFFETTUA → ORDINE
ORDINE → FORMATO_DA → INGREDIENTE_ORDINE
ORDINE → PRENOTATO_IN → FASCIA_ORARIA → APPARTIENE_A → GIORNO_SERVIZIO
```

##### OP 9.1 - Statistiche sui clienti più o meno frequenti

| Concetto | Costrutto | Accessi | Tipo |
| -------- | --------- | ------- | ---- |
| ORDINE   | E         | 1750    | L    |
| EFFETTUA | R         | 1750    | L    |
| CLIENTE  | E         | 800     | L    |

**Costo parziale: 4300L = 4300**

##### OP 9.2 - Statistiche sugli ingredienti più utilizzati

Per individuare gli ingredienti maggiormente utilizzati è necessario analizzare tutti gli ingredienti associati agli ordini del periodo considerato.

| Concetto           | Costrutto | Accessi | Tipo |
| ------------------ | --------- | ------- | ---- |
| ORDINE             | E         | 1750    | L    |
| FORMATO_DA         | R         | 8750    | L    |
| INGREDIENTE_ORDINE | E         | 8750    | L    |
| RIFERISCE          | R         | 8750    | L    |
| INGREDIENTE        | E         | 8750    | L    |

**Costo parziale: 36750L = 36750**

##### OP 9.3 - Statistiche sull’andamento degli ordini

Per analizzare l’andamento degli ordini nel tempo è necessario raggruppare gli ordini per giorno di servizio e fascia oraria.

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | --------- | ------- | ---- |
| ORDINE          | E         | 1750    | L    |
| PRENOTATO_IN    | R         | 1750    | L    |
| FASCIA_ORARIA   | E         | 350     | L    |
| APPARTIENE_A    | R         | 350     | L    |
| GIORNO_SERVIZIO | E         | 25      | L    |

**Costo parziale: 4225L = 4225**

##### Riepilogo OP 9

| Sottosezione | Costo |
| ------------ | ----- |
| OP 9.1       | 4300  |
| OP 9.2       | 36750 |
| OP 9.3       | 4225  |

**Totale per esecuzione: 45275L = 45275**
**Costo giornaliero: 45275 × 1 = 45275**


### Raffinamento dello schema

#### Eliminazione delle gerarchie

Nello schema E/R è presente una gerarchia tra l’entità generale **UTENTE** e le entità specializzate **CLIENTE** e **AMMINISTRATORE**. La generalizzazione è totale ed esclusiva, poiché ogni utente registrato appartiene a una sola delle due categorie.

Per eliminare tale gerarchia si sceglie di adottare l’approccio del collasso verso l’alto, mantenendo un’unica entità **UTENTE** e introducendo l’attributo `ruolo`, utilizzato per distinguere i clienti dagli amministratori.

Questa scelta è motivata dal fatto che **CLIENTE** e **AMMINISTRATORE** condividono gli stessi attributi principali di autenticazione, cioè nickname, email e password. L’unico attributo specifico del cliente è `abilitato`, utilizzato per indicare se il cliente può effettuare nuovi ordini. Tale attributo viene mantenuto in **UTENTE**: per gli utenti con ruolo amministratore non assume significato applicativo.

---

#### Scelta delle chiavi primarie

Per le principali entità dello schema si sceglie di utilizzare chiavi primarie artificiali, in modo da evitare dipendenze da attributi potenzialmente modificabili nel tempo, come email, nickname o nome dell’ingrediente.

Per l’entità **DISPONIBILITA_INGREDIENTE** si sceglie invece una chiave composta, formata dalla coppia:

```text
(idIngrediente, idGiornoServizio)
```

Questa scelta rappresenta direttamente il vincolo secondo cui, per uno stesso ingrediente e uno stesso giorno di servizio, può esistere una sola informazione di disponibilità.

---

#### Eliminazione degli identificatori esterni e importazione delle chiavi

Le associazioni presenti nello schema E/R vengono eliminate importando le chiavi delle entità coinvolte nelle relazioni corrispondenti.

In particolare:

* **EFFETTUA**, tra **CLIENTE** e **ORDINE**, viene eliminata importando `idUtente` in **ORDINE**. Dopo il collasso della gerarchia, il cliente è rappresentato da un utente con `ruolo = cliente`.


* **PRENOTATO_IN**, tra **ORDINE** e **FASCIA_ORARIA**, viene eliminata importando `idFasciaOraria` in **ORDINE**.


* **APPARTIENE_A**, tra **FASCIA_ORARIA** e **GIORNO_SERVIZIO**, viene eliminata importando `idGiornoServizio` in **FASCIA_ORARIA**.


* **FORMATO_DA**, tra **ORDINE** e **INGREDIENTE_ORDINE**, viene eliminata importando `idOrdine` in **INGREDIENTE_ORDINE**.

* **RIFERISCE**, tra **INGREDIENTE_ORDINE** e **INGREDIENTE**, viene eliminata importando `idIngrediente` in **INGREDIENTE_ORDINE**.


* **APPARTIENE**, tra **INGREDIENTE** e **CATEGORIA_INGREDIENTE**, viene eliminata importando `idCategoria` in **INGREDIENTE**.

* Le associazioni **HA** e **DEFINISCE**, che collegano **INGREDIENTE**, **GIORNO_SERVIZIO** e **DISPONIBILITA_INGREDIENTE**, vengono eliminate importando `idIngrediente` e `idGiornoServizio` in **DISPONIBILITA_INGREDIENTE**. La coppia `(idIngrediente, idGiornoServizio)` identifica univocamente una disponibilità.

---

#### Vincoli applicativi non rappresentati direttamente nello schema relazionale

Alcuni vincoli del dominio non sono esprimibili direttamente tramite la sola struttura delle relazioni e devono quindi essere gestiti tramite vincoli applicativi o controlli nella base di dati.

In particolare:

* solo gli utenti con `ruolo = cliente` possono effettuare ordini;
* un cliente non abilitato non può inserire nuovi ordini;
* un ordine può essere modificato o annullato solo se si trova in uno stato modificabile e se non è stato superato il limite temporale definito dal giorno di servizio;
* una fascia oraria non può superare la capacità massima impostata per il relativo giorno di servizio;
* un ingrediente non disponibile in uno specifico giorno di servizio non può essere utilizzato per nuovi ordini in quel giorno;
* ogni ordine deve contenere esattamente un ingrediente appartenente alla categoria del pane;
* lo stesso ingrediente non può comparire più di una volta nello stesso ordine;

### Analisi delle ridondanze

Nello schema E/R è presente una possibile ridondanza relativa agli attributi `oraInizio` e `oraFine` dell’entità **GIORNO_SERVIZIO**. Tali attributi non rappresentano informazioni autonome, poiché possono essere ricavati dalle fasce orarie appartenenti allo stesso giorno di servizio:

```text
oraInizio = MIN(FASCIA_ORARIA.oraInizio)
oraFine = MAX(FASCIA_ORARIA.oraFine)
```

Si valuta quindi se convenga mantenere tali attributi ridondanti in **GIORNO_SERVIZIO** oppure eliminarli e calcolarli a partire dalle fasce orarie.

Per la valutazione si considera l’operazione di visualizzazione dell’orario complessivo di un giorno di servizio, operazione che può essere eseguita quando il cliente consulta i giorni disponibili per effettuare una prenotazione. Si assume che ogni giorno di servizio contenga mediamente 14 fasce orarie.

---

#### Caso con ridondanza

Se `oraInizio` e `oraFine` sono memorizzati direttamente in **GIORNO_SERVIZIO**, per ottenere l’orario complessivo del servizio è sufficiente leggere il giorno di servizio.

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | :-------: | ------: | :--: |
| GIORNO_SERVIZIO |     E     |       1 |   L  |

**Totale per esecuzione: 1L = 1**

Assumendo che tale informazione venga consultata 70 volte al giorno, in corrispondenza dell’inserimento degli ordini, il costo giornaliero è:

```text
1 × 70 = 70
```

---

#### Caso senza ridondanza

Se `oraInizio` e `oraFine` non sono memorizzati in **GIORNO_SERVIZIO**, è necessario leggere le fasce orarie associate al giorno e calcolare il minimo valore di `oraInizio` e il massimo valore di `oraFine`.

| Concetto        | Costrutto | Accessi | Tipo |
| --------------- | :-------: | ------: | :--: |
| GIORNO_SERVIZIO |     E     |       1 |   L  |
| APPARTIENE_A    |     R     |      14 |   L  |
| FASCIA_ORARIA   |     E     |      14 |   L  |

**Totale per esecuzione: 29L = 29**

Assumendo la stessa frequenza di 70 consultazioni al giorno, il costo giornaliero è:

```text
29 × 70 = 2030
```

---

#### Valutazione finale

Dal solo punto di vista degli accessi in lettura, mantenere `oraInizio` e `oraFine` in **GIORNO_SERVIZIO** riduce il costo dell’operazione di visualizzazione dell’orario complessivo del servizio, passando da 29 letture a una sola lettura. Pertanto si sceglie di mantenere la ridondanza 

### Traduzione di entità e associazioni in relazioni

A seguito del raffinamento dello schema E/R, le entità e le associazioni vengono tradotte nelle seguenti relazioni.
Gli attributi che fanno riferimento ad altre relazioni sono indicati specificando la relazione referenziata.

```text
utenti(
    idUtente,
    nickname,
    email,
    password,
    ruolo,
    abilitato*
)
UNIQUE(email)
```

```text
giorni_servizio(
    idGiornoServizio,
    data,
    posizione,
    attivo,
    capacitaMassima,
    limiteModificaMinuti,
    oraInizio,
    oraFine
)
UNIQUE(data)
```

```text
fasce_orarie(
    idFasciaOraria,
    idGiornoServizio: giorni_servizio,
    oraInizio,
    oraFine
)
UNIQUE(idGiornoServizio, oraInizio)
```

```text
ordini(
    idOrdine,
    idUtente: utenti,
    idFasciaOraria: fasce_orarie,
    numeroGiornaliero,
    statoCorrente,
    dataCreazione,
    preferito
)
```

```text

La relazione `categorie_ingredienti` rappresenta le categorie logiche degli ingredienti e permette di modellare i vincoli di composizione del panino, come il vincolo secondo cui deve essere scelto uno e un solo tipo di pane.
categorie_ingredienti(
    idCategoria,
    nome,
    minScelte,
    maxScelte
)
UNIQUE(nome)
```

```text
ingredienti(
    idIngrediente,
    idCategoria: categorie_ingredienti,
    nome,
    codice
)
UNIQUE(codice)
```

```text
ingredienti_ordine(
    idIngredienteOrdine,
    idOrdine: ordini,
    idIngrediente: ingredienti,
    nomeSnapshot,
    categoriaSnapshot
)
UNIQUE(idOrdine, idIngrediente)
```

```text
disponibilita_ingredienti(
    idIngrediente: ingredienti,
    idGiornoServizio: giorni_servizio,
    disponibile
)
```

### Traduzione delle operazioni in query SQL

Di seguito vengono riportate le principali query SQL associate alle operazioni individuate.
Si utilizzano parametri indicati con `?`, che verranno valorizzati dall’applicazione al momento dell’esecuzione.

---

#### OP 1 - Creare un nuovo cliente

Per registrare un nuovo cliente viene inserito un nuovo record nella relazione `utenti`, impostando il ruolo a `cliente` e l’attributo `abilitato` a vero.

```sql
INSERT INTO utenti (nickname, email, password, ruolo, abilitato)
VALUES (?, ?, ?, 'cliente', TRUE);
```

---

#### OP 2 - Inserire un nuovo ordine per una fascia oraria disponibile

Prima di inserire un nuovo ordine è necessario verificare che il cliente sia abilitato, che la fascia oraria scelta appartenga a un giorno di servizio attivo e che non sia stata raggiunta la capacità massima prevista.

```sql
SELECT U.idUtente
FROM utenti U
WHERE U.idUtente = ?
  AND U.ruolo = 'cliente'
  AND U.abilitato = TRUE;
```

Successivamente si controlla che la fascia oraria scelta sia disponibile.

```sql
SELECT F.idFasciaOraria
FROM fasce_orarie F
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
LEFT JOIN ordini O
  ON O.idFasciaOraria = F.idFasciaOraria
WHERE F.idFasciaOraria = ?
  AND G.attivo = TRUE
GROUP BY F.idFasciaOraria, G.capacitaMassima
HAVING COUNT(O.idOrdine) < G.capacitaMassima;
```

Si verifica poi che gli ingredienti scelti siano disponibili nel giorno di servizio relativo alla fascia oraria.

```sql
SELECT I.idIngrediente
FROM ingredienti I
JOIN disponibilita_ingredienti D
  ON I.idIngrediente = D.idIngrediente
JOIN fasce_orarie F
  ON D.idGiornoServizio = F.idGiornoServizio
WHERE F.idFasciaOraria = ?
  AND I.idIngrediente IN (?, ?, ?, ?, ?)
  AND D.disponibile = TRUE;
```

A livello applicativo si verifica inoltre che il numero di ingredienti restituiti coincida con il numero di ingredienti scelti dal cliente.

Per controllare i vincoli sulle categorie, ad esempio il vincolo secondo cui deve essere scelto uno e un solo tipo di pane, si può verificare che il numero di ingredienti scelti per ogni categoria rispetti i valori `minScelte` e `maxScelte`.

```sql
SELECT C.idCategoria, C.nome, C.minScelte, C.maxScelte,
       COUNT(I.idIngrediente) AS numeroScelte
FROM categorie_ingredienti C
LEFT JOIN ingredienti I
  ON I.idCategoria = C.idCategoria
 AND I.idIngrediente IN (?, ?, ?, ?, ?)
GROUP BY C.idCategoria, C.nome, C.minScelte, C.maxScelte;
```

Appurata la validità dell’ordine, si procede con l’inserimento.
Il numero giornaliero viene calcolato considerando gli ordini già associati allo stesso giorno di servizio.

```sql
INSERT INTO ordini (
    idUtente,
    idFasciaOraria,
    numeroGiornaliero,
    statoCorrente,
    dataCreazione,
    preferito
)
SELECT
    ?,
    ?,
    COALESCE(MAX(O.numeroGiornaliero), 0) + 1,
    'pending',
    NOW(),
    FALSE
FROM fasce_orarie F
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
LEFT JOIN fasce_orarie F2
  ON F2.idGiornoServizio = G.idGiornoServizio
LEFT JOIN ordini O
  ON O.idFasciaOraria = F2.idFasciaOraria
WHERE F.idFasciaOraria = ?;
```

Dopo aver creato l’ordine, si inseriscono gli ingredienti associati, copiando anche il nome e la categoria al momento dell’ordine.

```sql
INSERT INTO ingredienti_ordine (
    idOrdine,
    idIngrediente,
    nomeSnapshot,
    categoriaSnapshot
)
SELECT
    LAST_INSERT_ID(),
    I.idIngrediente,
    I.nome,
    C.nome
FROM ingredienti I
JOIN categorie_ingredienti C
  ON I.idCategoria = C.idCategoria
WHERE I.idIngrediente IN (?, ?, ?, ?, ?);
```

---

#### OP 3 - Modificare o annullare un ordine ancora modificabile

Prima di modificare o annullare un ordine è necessario verificare che l’ordine appartenga al cliente, che sia ancora nello stato `pending` e che non sia stato superato il limite temporale di modifica.

```sql
SELECT O.idOrdine
FROM ordini O
JOIN fasce_orarie F
  ON O.idFasciaOraria = F.idFasciaOraria
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
WHERE O.idOrdine = ?
  AND O.idUtente = ?
  AND O.statoCorrente = 'pending'
  AND NOW() < TIMESTAMP(G.data, F.oraInizio) - INTERVAL G.limiteModificaMinuti MINUTE;
```

Se il cliente intende annullare l’ordine, si eliminano prima gli ingredienti associati e poi l’ordine.

```sql
DELETE FROM ingredienti_ordine
WHERE idOrdine = ?;
```

```sql
DELETE FROM ordini
WHERE idOrdine = ?;
```

Se invece il cliente intende modificare la composizione del panino, si eliminano gli ingredienti precedenti.

```sql
DELETE FROM ingredienti_ordine
WHERE idOrdine = ?;
```

Dopo aver verificato la disponibilità dei nuovi ingredienti con una query analoga a quella usata nell’OP 2, si inserisce la nuova composizione.

```sql
INSERT INTO ingredienti_ordine (
    idOrdine,
    idIngrediente,
    nomeSnapshot,
    categoriaSnapshot
)
SELECT
    ?,
    I.idIngrediente,
    I.nome,
    C.nome
FROM ingredienti I
JOIN categorie_ingredienti C
  ON I.idCategoria = C.idCategoria
WHERE I.idIngrediente IN (?, ?, ?, ?, ?);
```

---

#### OP 4 - Cambiare lo stato di avanzamento di un ordine o rifiutarlo

L’amministratore può aggiornare lo stato corrente di un ordine impostandolo a uno degli stati previsti: `pending`, `confirmed`, `ready`, `picked_up`, `rejected`.

```sql
UPDATE ordini
SET statoCorrente = ?
WHERE idOrdine = ?;
```

Per rifiutare un ordine, viene impostato lo stato `rejected`.

```sql
UPDATE ordini
SET statoCorrente = 'rejected'
WHERE idOrdine = ?;
```

---

#### OP 5 - Visualizzare lo storico degli ordini di un cliente

Per visualizzare lo storico degli ordini di un cliente si recuperano gli ordini effettuati, la fascia oraria di ritiro, il giorno di servizio e gli ingredienti storicizzati associati.

```sql
SELECT
    O.idOrdine,
    O.numeroGiornaliero,
    O.statoCorrente,
    O.dataCreazione,
    O.preferito,
    G.data,
    G.posizione,
    F.oraInizio,
    F.oraFine,
    IO.nomeSnapshot,
    IO.categoriaSnapshot
FROM ordini O
JOIN fasce_orarie F
  ON O.idFasciaOraria = F.idFasciaOraria
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
JOIN ingredienti_ordine IO
  ON O.idOrdine = IO.idOrdine
WHERE O.idUtente = ?
ORDER BY O.dataCreazione DESC, O.idOrdine DESC;
```

Per limitare la visualizzazione agli ultimi ordini si può aggiungere:

```sql
LIMIT ?;
```

---

#### OP 6 - Riordinare un ordine a partire dallo storico

Per riordinare un ordine già effettuato, si recupera prima la composizione storicizzata dell’ordine.

```sql
SELECT
    IO.idIngrediente,
    IO.nomeSnapshot,
    IO.categoriaSnapshot
FROM ingredienti_ordine IO
WHERE IO.idOrdine = ?;
```

Si verifica poi che gli ingredienti siano ancora disponibili nel giorno di servizio relativo alla nuova fascia oraria scelta.

```sql
SELECT I.idIngrediente
FROM ingredienti I
JOIN disponibilita_ingredienti D
  ON I.idIngrediente = D.idIngrediente
JOIN fasce_orarie F
  ON D.idGiornoServizio = F.idGiornoServizio
WHERE F.idFasciaOraria = ?
  AND I.idIngrediente IN (
      SELECT idIngrediente
      FROM ingredienti_ordine
      WHERE idOrdine = ?
  )
  AND D.disponibile = TRUE;
```

Si verifica anche la disponibilità della fascia oraria, come nell’inserimento di un nuovo ordine.

```sql
SELECT F.idFasciaOraria
FROM fasce_orarie F
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
LEFT JOIN ordini O
  ON O.idFasciaOraria = F.idFasciaOraria
WHERE F.idFasciaOraria = ?
  AND G.attivo = TRUE
GROUP BY F.idFasciaOraria, G.capacitaMassima
HAVING COUNT(O.idOrdine) < G.capacitaMassima;
```

Se i controlli hanno esito positivo, si crea il nuovo ordine.

```sql
INSERT INTO ordini (
    idUtente,
    idFasciaOraria,
    numeroGiornaliero,
    statoCorrente,
    dataCreazione,
    preferito
)
SELECT
    ?,
    ?,
    COALESCE(MAX(O.numeroGiornaliero), 0) + 1,
    'pending',
    NOW(),
    FALSE
FROM fasce_orarie F
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
LEFT JOIN fasce_orarie F2
  ON F2.idGiornoServizio = G.idGiornoServizio
LEFT JOIN ordini O
  ON O.idFasciaOraria = F2.idFasciaOraria
WHERE F.idFasciaOraria = ?;
```

Infine si copiano nel nuovo ordine gli ingredienti presenti nell’ordine storico, aggiornando gli snapshot con i dati correnti dell’ingrediente.

```sql
INSERT INTO ingredienti_ordine (
    idOrdine,
    idIngrediente,
    nomeSnapshot,
    categoriaSnapshot
)
SELECT
    LAST_INSERT_ID(),
    I.idIngrediente,
    I.nome,
    C.nome
FROM ingredienti_ordine IO
JOIN ingredienti I
  ON IO.idIngrediente = I.idIngrediente
JOIN categorie_ingredienti C
  ON I.idCategoria = C.idCategoria
WHERE IO.idOrdine = ?;
```

---

#### OP 7 - Aggiornare la disponibilità di un ingrediente per un giorno di servizio

Per aggiornare la disponibilità di un ingrediente in uno specifico giorno di servizio si aggiorna la relazione `disponibilita_ingredienti`.

```sql
UPDATE disponibilita_ingredienti
SET disponibile = ?
WHERE idIngrediente = ?
  AND idGiornoServizio = ?;
```

Nel caso in cui la riga di disponibilità non sia ancora presente, può essere inserita.

```sql
INSERT INTO disponibilita_ingredienti (
    idIngrediente,
    idGiornoServizio,
    disponibile
)
VALUES (?, ?, ?);
```

In alternativa, se il DBMS lo supporta, si può usare una singola istruzione con aggiornamento in caso di duplicato.

```sql
INSERT INTO disponibilita_ingredienti (
    idIngrediente,
    idGiornoServizio,
    disponibile
)
VALUES (?, ?, ?)
ON DUPLICATE KEY UPDATE disponibile = VALUES(disponibile);
```

---

#### OP 8 - Impostare i giorni in cui il servizio viene erogato e configurare le fasce orarie

Per configurare un nuovo giorno di servizio si inseriscono le informazioni relative alla giornata operativa.

```sql
INSERT INTO giorni_servizio (
    data,
    posizione,
    attivo,
    capacitaMassima,
    limiteModificaMinuti
)
VALUES (?, ?, ?, ?, ?);
```

Successivamente vengono inserite le fasce orarie associate al giorno di servizio.
La seguente query viene eseguita più volte dall’applicazione, una volta per ciascuna fascia oraria da creare.

```sql
INSERT INTO fasce_orarie (
    idGiornoServizio,
    oraInizio,
    oraFine
)
VALUES (?, ?, ?);
```

Per inizializzare la disponibilità degli ingredienti nel nuovo giorno di servizio, si possono inserire tutte le coppie ingrediente-giorno.

```sql
INSERT INTO disponibilita_ingredienti (
    idIngrediente,
    idGiornoServizio,
    disponibile
)
SELECT
    idIngrediente,
    ?,
    TRUE
FROM ingredienti;
```

---

#### OP 9 - Estrarre statistiche sui clienti più o meno frequenti, sugli ingredienti più utilizzati e sull’andamento degli ordini

Per individuare i clienti più frequenti si contano gli ordini effettuati da ciascun cliente nel periodo considerato.

```sql
SELECT
    U.idUtente,
    U.nickname,
    U.email,
    COUNT(O.idOrdine) AS numeroOrdini
FROM utenti U
JOIN ordini O
  ON U.idUtente = O.idUtente
WHERE U.ruolo = 'cliente'
  AND O.dataCreazione BETWEEN ? AND ?
GROUP BY U.idUtente, U.nickname, U.email
ORDER BY numeroOrdini DESC;
```

Per individuare i clienti meno frequenti si può usare una `LEFT JOIN`, includendo anche i clienti che non hanno effettuato ordini nel periodo considerato.

```sql
SELECT
    U.idUtente,
    U.nickname,
    U.email,
    COUNT(O.idOrdine) AS numeroOrdini
FROM utenti U
LEFT JOIN ordini O
  ON U.idUtente = O.idUtente
 AND O.dataCreazione BETWEEN ? AND ?
WHERE U.ruolo = 'cliente'
GROUP BY U.idUtente, U.nickname, U.email
ORDER BY numeroOrdini ASC;
```

Per individuare gli ingredienti più utilizzati si contano le occorrenze degli ingredienti d’ordine nel periodo considerato.

```sql
SELECT
    IO.idIngrediente,
    IO.nomeSnapshot,
    IO.categoriaSnapshot,
    COUNT(*) AS numeroUtilizzi
FROM ingredienti_ordine IO
JOIN ordini O
  ON IO.idOrdine = O.idOrdine
WHERE O.dataCreazione BETWEEN ? AND ?
GROUP BY IO.idIngrediente, IO.nomeSnapshot, IO.categoriaSnapshot
ORDER BY numeroUtilizzi DESC;
```

Per analizzare l’andamento degli ordini per giorno si raggruppano gli ordini per data del giorno di servizio.

```sql
SELECT
    G.data,
    COUNT(O.idOrdine) AS numeroOrdini
FROM ordini O
JOIN fasce_orarie F
  ON O.idFasciaOraria = F.idFasciaOraria
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
WHERE G.data BETWEEN ? AND ?
GROUP BY G.data
ORDER BY G.data ASC;
```

Per analizzare l’andamento degli ordini per fascia oraria si raggruppano gli ordini in base allo slot di ritiro.

```sql
SELECT
    G.data,
    F.oraInizio,
    F.oraFine,
    COUNT(O.idOrdine) AS numeroOrdini
FROM ordini O
JOIN fasce_orarie F
  ON O.idFasciaOraria = F.idFasciaOraria
JOIN giorni_servizio G
  ON F.idGiornoServizio = G.idGiornoServizio
WHERE G.data BETWEEN ? AND ?
GROUP BY G.data, F.oraInizio, F.oraFine
ORDER BY G.data ASC, F.oraInizio ASC;
```
