# Progettazione dell’esperienza utente

Questo documento descrive la **progettazione dell’esperienza utente** dell’applicazione web per la **prenotazione di panini presso uno stand di ristoro nel Campus**.

L’obiettivo è chiarire:
- quali **dati vengono raccolti sull’utente**;
- cosa l’utente può **effettivamente fare nell’app**;
- le differenze tra **utente non autenticato** e **utente autenticato**.

Il documento è focalizzato sugli aspetti funzionali e concettuali, indipendentemente dall’implementazione tecnica.

---

## 1. Contesto di utilizzo

L’applicazione è pensata per essere utilizzata principalmente:
- da **smartphone**;
- in **brevi sessioni** (pochi secondi/minuti);
- in momenti di pausa tra lezioni.

L’utente non esplora l’app, ma la utilizza per:
- verificare rapidamente la disponibilità del servizio;
- prenotare un panino;
- controllare lo stato delle proprie prenotazioni.

---

## 2. Dati raccolti sull’utente

I dati utente sono ridotti al minimo indispensabile, con una visione orientata a un possibile utilizzo reale del servizio.

### 2.1 Dati obbligatori

- **Email**  
  Utilizzata come identificativo univoco dell’utente e per l’autenticazione.

- **Password**  
  Salvata in forma cifrata (hash). Utilizzata esclusivamente per il login.

- **Nickname**  
  Nome visualizzato associato agli ordini, utilizzato lato admin per identificare facilmente l’utente.

### 2.2 Dati facoltativi

- **Numero di telefono**  
  Non utilizzato direttamente dall’applicazione nel flusso principale, ma previsto come recapito diretto nel caso l’admin debba contattare l’utente (es. imprevisti operativi).  
  Il campo è facoltativo e visibile solo all’admin.

---

## 3. Utente non autenticato

L’utente non autenticato può accedere a una **vista pubblica** dell’applicazione.

### Funzionalità disponibili

- visualizzazione della **disponibilità dello stand**;
- visualizzazione dei **giorni e orari di apertura**;
- visualizzazione degli **slot disponibili**;
- visualizzazione del **tempo di attesa stimato**;
- visualizzazione degli slot **pieni** (mostrati come *full*).

### Limitazioni

L’utente non autenticato:
- non può creare ordini;
- non può modificare o annullare ordini;
- non può visualizzare lo stato di un ordine.

Per effettuare qualsiasi operazione è richiesto il login.

---

## 4. Utente autenticato

Una volta autenticato, l’utente accede alle funzionalità complete del servizio.

### 4.1 Prenotazione di un panino

L’utente può:
- selezionare uno **slot temporale** (intervalli da 15 minuti);
- visualizzare la capienza residua dello slot;
- creare una prenotazione composta da:
  - **1 panino**;
  - **eventuali articoli ready-to-use** (es. acqua, bibite).

Le bibite non influiscono sulla capienza dello slot, che dipende esclusivamente dal numero di panini.

---

### 4.2 Gestione delle prenotazioni

- Un utente può avere **più prenotazioni attive**, anche nella stessa giornata e anche sullo stesso slot: ogni panino viene infatti gestito come un **ordine distinto**, anche se effettuato dallo stesso utente.
- Ogni prenotazione è **vincolata allo slot scelto** e non può essere spostata.

Per ogni ordine l’utente può:
- visualizzare i dettagli;
- visualizzare lo **stato dell’ordine**;
- visualizzare la **deadline di modifica**.

---

### 4.3 Modifica e annullamento ordine

- Ogni ordine è inizialmente in stato **pendente**.
- Fino a un tempo limite (deadline), definito come un certo numero di minuti prima dello slot e configurabile dall’admin, l’utente può:
  - modificare il contenuto dell’ordine;
  - annullare l’ordine.

Dopo la deadline:
- l’ordine non è più modificabile;
- l’utente può solo monitorarne lo stato.

---

### 4.4 Stato degli ordini

Gli ordini possono assumere i seguenti stati logici:

- **Pendente**: ordine modificabile o annullabile.
- **Confermato**: ordine non più modificabile, in attesa di preparazione.
- **Evaso**: ordine completato.

Lo stato ha valore informativo per l’utente e non influisce su ulteriori azioni pratiche.

---

## 5. Prenotazioni future

Il modello dell’applicazione supporta la **prenotazione di slot futuri**.

A livello logico:
- le prenotazioni possono estendersi alla **settimana corrente**;
- eventuali limitazioni ulteriori possono essere applicate solo lato interfaccia, senza modificare la logica sottostante.

---

## 6. Scelte progettuali

L’esperienza utente è progettata per:
- essere **semplice e immediata**;
- ridurre al minimo il numero di azioni necessarie;
- evitare complessità non necessarie (es. carrelli, pagamenti, notifiche).

Molte funzionalità potenzialmente estendibili sono state volutamente escluse per mantenere il progetto coerente con uno sviluppo individuale, lasciando spazio a possibili evoluzioni future.

---

## 7. Conclusione

La progettazione dell’esperienza utente è orientata a un utilizzo reale del servizio, mantenendo un equilibrio tra semplicità, chiarezza e completezza funzionale.  
Il modello distingue chiaramente tra accesso pubblico e accesso autenticato, definendo in modo esplicito cosa l’utente può fare in ogni stato dell’applicazione.

