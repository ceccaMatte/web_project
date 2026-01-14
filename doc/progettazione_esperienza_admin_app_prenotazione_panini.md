# Progettazione dell’esperienza Admin

Questo documento descrive la **progettazione dell’esperienza Admin** dell’applicazione web per la **prenotazione di panini presso uno stand di ristoro nel Campus**.

L’obiettivo è definire in modo chiaro:
- cosa può fare l’admin all’interno dell’applicazione;
- quali dati può gestire;
- quali regole e vincoli governano le operazioni amministrative.

Il documento è focalizzato sugli aspetti funzionali e concettuali, indipendentemente dall’implementazione tecnica.

---

## 1. Ruolo dell’Admin

L’admin rappresenta il **gestore operativo dello stand**.  
Il suo compito principale è:
- organizzare il lavoro giornaliero;
- controllare il flusso degli ordini;
- gestire le risorse (ingredienti e tempi);
- garantire coerenza e affidabilità del servizio.

L’admin non gestisce pagamenti né il ritiro fisico, ma esclusivamente la **preparazione e consegna logica** degli ordini.

---

## 2. Gestione Ordini

### 2.1 Visualizzazione ordini

L’admin può visualizzare tutti gli ordini presenti nel sistema:
- limitati alla **settimana corrente**;
- organizzati per **data** e **slot temporale**;
- filtrabili per **stato**.

Per ogni ordine sono visibili:
- utente (nickname ed eventuale numero di telefono);
- contenuto dell’ordine (panino e/o articoli ready-to-use);
- slot associato;
- stato corrente.

---

### 2.2 Stati dell’ordine

Gli ordini possono assumere i seguenti stati:

- **PENDENTE**  
  Ordine modificabile e annullabile dall’utente entro la deadline.

- **CONFERMATO**  
  Ordine non più modificabile, in attesa di preparazione.

- **EVASO**  
  Ordine preparato dallo stand.

- **RITIRATO**  
  Ordine consegnato all’utente.

- **REJECTED**  
  Ordine rifiutato dal sistema o dall’admin per motivi organizzativi o di configurazione.

---

### 2.3 Transizioni di stato

Le transizioni di stato seguono regole precise:

- al superamento della deadline:
  - **PENDENTE → CONFERMATO** (automatico);
- l’admin può avanzare lo stato:
  - **CONFERMATO → EVASO → RITIRATO**;
- un ordine può diventare **REJECTED** se:
  - l’utente viene disabilitato;
  - una modifica di configurazione (es. capienza degli slot o programmazione oraria) rende l’ordine non più valido, escludendo la disponibilità degli ingredienti già prenotati;
  - l’ordine viene esplicitamente rifiutato dall’admin.

Un ordine **non può mai tornare modificabile** dopo essere diventato confermato.

---

## 3. Gestione Ingredienti

L’admin gestisce gli ingredienti disponibili per la composizione degli ordini.

### 3.1 Tipologie di ingredienti

Ogni ingrediente è classificato come:

- **Prepared**  
  Ingredienti che richiedono preparazione (es. panini).

- **Ready-to-use**  
  Articoli pronti al consumo (es. acqua, bibite).

---

### 3.2 Attributi degli ingredienti

Per ogni ingrediente l’admin può gestire:
- nome;
- tipologia (prepared / ready-to-use);
- disponibilità (sì / no).

Non è prevista la gestione delle quantità: un ingrediente è considerato disponibile o non disponibile.

---

### 3.3 Impatto sugli ordini

- ingredienti disponibili sono selezionabili dall’utente;
- ingredienti non disponibili risultano disabilitati nell’interfaccia utente;
- la modifica della disponibilità influisce solo sugli **ordini futuri**.

---

## 4. Programmazione Presenza e Configurazione

L’admin può programmare la presenza dello stand e i parametri di lavoro.

### 4.1 Orari di attività

- definizione dei giorni di attività **limitati alla settimana corrente**;
- orari di apertura e chiusura discreti a multipli di **30 minuti**;
- possibilità di definire più giornate di lavoro nella stessa settimana.

---

### 4.2 Slot temporali

- durata dello slot: **fissa (15 minuti)**;
- gli slot vengono generati automaticamente in base agli orari impostati;
- slot passati o già iniziati non sono selezionabili.

---

### 4.3 Parametri configurabili

L’admin può impostare:
- **capienza massima di panini per slot**;
- **deadline** (minuti prima dello slot oltre i quali l’ordine non è più modificabile);
- finestra di prenotazione (limitata alla settimana corrente).

Le modifiche di configurazione:
- si applicano solo agli **slot futuri**;
- possono causare il passaggio automatico di alcuni ordini allo stato **REJECTED**.

---

## 5. Gestione Utenti

L’admin può visualizzare l’elenco degli utenti registrati, distinti in:
- utenti attivi;
- utenti disabilitati.

### 5.1 Disabilitazione utente

- un utente disabilitato non può creare nuovi ordini;
- tutti gli ordini pronti o futuri dell’utente disabilitato passano automaticamente allo stato **REJECTED**;
- i dati storici dell’utente non vengono eliminati.

---

## 6. Storico Ordini

Tutti gli ordini vengono **storicizzati** dal sistema.

- gli ordini **RITIRATI** restano visibili nella giornata corrente;
- gli ordini **REJECTED** sono visibili all’utente e all’admin;
- lo storico può essere utilizzato per analisi o estensioni future.

---

## 7. Scelte progettuali

La progettazione dell’esperienza Admin è orientata a:
- semplicità operativa;
- chiarezza delle responsabilità;
- riduzione dei casi limite;
- controllo rigoroso dello stato degli ordini.

Le scelte adottate privilegiano la coerenza del sistema e la facilità di gestione quotidiana rispetto a funzionalità non essenziali.

---

## 8. Conclusione

L’esperienza Admin fornisce tutti gli strumenti necessari per la gestione efficace dello stand, mantenendo il sistema coerente, prevedibile e facilmente estendibile, in linea con i vincoli di un progetto individuale.

