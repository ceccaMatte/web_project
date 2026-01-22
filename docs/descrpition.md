# Campus Truck – Visione del Progetto

## Introduzione

Campus Truck nasce con l’obiettivo di semplificare e migliorare l’esperienza di ordinazione del pranzo all’interno di un contesto universitario, dove i tempi sono spesso limitati e la gestione delle code rappresenta un problema concreto per studenti e operatori del servizio.

Il progetto modella il funzionamento di un food truck universitario (“paninaro”), offrendo una rappresentazione chiara e aggiornata dello stato del servizio, sia dal punto di vista dell’utente finale che da quello amministrativo.

L’idea centrale è ridurre l’incertezza: sapere **se il servizio è attivo**, **quando è disponibile**, **quanto è affollato** e **in che stato si trovano i propri ordini**.

---

## Scopo del progetto

Lo scopo principale di Campus Truck è fornire un’interfaccia semplice, immediata e fruibile soprattutto da mobile, che consenta agli studenti di:

- verificare la disponibilità del servizio nella giornata corrente
- conoscere luogo, orari e capienza del food truck
- prenotare il proprio pranzo evitando attese inutili
- monitorare e gestire i propri ordini in modo trasparente

Parallelamente, l’applicazione offre all’amministratore uno strumento per **organizzare il servizio**, **monitorare gli ordini in tempo reale** e **programmare le giornate lavorative**, mantenendo il controllo su carichi di lavoro e flussi.

---

## Dominio applicativo

Il dominio applicativo di Campus Truck ruota attorno a pochi concetti chiave:

- **Giorni lavorativi**, che definiscono quando il servizio è attivo
- **Time slot**, ovvero fasce orarie con capienza limitata
- **Ordini**, associati a uno specifico slot e caratterizzati da uno stato
- **Deadline**, che regola fino a quando un ordine può essere modificato

Un ordine attraversa diversi stati (pending, confirmed, ready, picked up, rejected) che riflettono il suo ciclo di vita reale.  
Questa modellazione consente di rappresentare in modo coerente le dinamiche del servizio, evitando ambiguità e situazioni incoerenti.

Il sistema è progettato per gestire anche scenari non banali, come la riduzione della capienza di uno slot o la cancellazione di una giornata lavorativa, garantendo che gli ordini coinvolti vengano trattati correttamente.

---

## Esperienza utente

L’esperienza utente è pensata secondo un approccio **mobile-first**, dato che il contesto principale di utilizzo è quello in movimento.

La home page è progettata per mostrare immediatamente:
- lo stato del servizio nella giornata corrente
- i giorni attivi della settimana
- i time slot disponibili
- eventuali ordini già effettuati

L’azione principale (prenotare) è sempre facilmente accessibile, mentre le informazioni secondarie sono organizzate in modo da non sovraccaricare l’interfaccia.

L’obiettivo è ridurre al minimo la frizione: se il servizio è attivo e ci sono slot disponibili, l’utente deve poter prenotare in pochi passaggi.

---

## Area amministrativa

L’area amministrativa consente una visione completa e operativa del servizio.  
L’amministratore può:

- monitorare gli ordini suddivisi per fascia oraria
- visualizzare il dettaglio degli ingredienti di ogni ordine
- aggiornare lo stato degli ordini durante la preparazione
- programmare i giorni di lavoro settimanali
- configurare orari, capienza e parametri globali

Questa separazione netta dei ruoli permette di mantenere l’interfaccia utente semplice, senza rinunciare a una gestione avanzata del servizio.

---

## Panoramica sull’implementazione

Campus Truck è realizzato come applicazione web con backend in Laravel e frontend server-rendered, arricchito da JavaScript vanilla per la gestione delle interazioni.

Dal punto di vista architetturale:
- la logica di dominio è concentrata nei service
- i controller rimangono sottili e orientati all’orchestrazione
- il frontend segue un approccio a **Single Source of Truth**, in cui la UI è una funzione dello stato

Sono state evitate librerie JavaScript esterne per mantenere il controllo completo sul comportamento dell’applicazione.

---

## Considerazioni finali

Campus Truck non si limita a essere un semplice sistema di prenotazione, ma rappresenta una simulazione realistica di un servizio di ristorazione mobile, con vincoli temporali, capienza limitata e stati di avanzamento.

Il progetto mette al centro la chiarezza del dominio e l’esperienza dell’utente, cercando di bilanciare semplicità d’uso e correttezza applicativa.
