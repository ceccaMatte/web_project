# Analisi dei requisiti
Si vuole realizzare un web-app a supporto degli studenti per migliorare la gestione delle prenotazioni dei panini presso il food track dell'istituto. quidni lo scopo è realizzare un web-app che consenta agli studenti di monitorar elo stto dei propri ordini e la posizione del food truck. mentre per i gestioni del truck la possibilità di organizzare meglio il lavoro e monitorare l'uso degli alimneit al fine da ridurre le attese e ridurre gli sprechi alimentari. infatti avrenon l apossibilità di monitorare orari di punta alimenti conusati maggiomente o meno e la possibilità di pianificare meglio gli ordini

# Intervista
ecco l'estratto dell'intervista fatta con il cliente
    Si vuole monitare tutta la fase produttiva dei panini a fine di migliorare il servizio e ridurre le code al truck, quidni si vuole tener traccia degli ordini e dividere il carico di lavoro in facse orarie al fine di ridurre le code e poter ridurre gli sprechi alimnetari. inoltre si volgiono monitorare i gli ordini dei clienti così da tracciare i gusti di ogni studente e poter soddisfare ogni richiesta senza sprechi. per ogni cliente si vuole quidni memorizzare nick name, mail e password così da poter semoplicare le consegne ai diretti interessati e semplicare e velocizzare il processo di ordine per ogni cliente. in più il sistema deve permettere al propietario di prinaificare la settimana lavorativa scegkeiendo in quali giorni abilitare o meno il servizio scegliere quanti clienti servire per fascia oraria. In serve la possibilità di bunnare dei client che spesso ordinano senza ritirare e si vuole poter tenere traccia degli alimneti utilizzati. si vuoe inoltre avere la possibilità di estrarre delle statistiche come quali sono gli orari di punta, quali sono gli ingredienti più richiesti i clienti più assidui e quelli più sporadici. in più si vuole la possibilità di seguire e traccaire lo stato di avanzamnete degli ordini in modotale da poter gestire meglio il carico lavorativo

    1) si chiama Campus Truck

2) solo 1

3) posizione varibaile

4) posizione testuale



5) si servono solo quelli e sono gli stessi sia per gli utenti che per adimin quello che varia sono i privilegi

6) no solo i campi sopra citati

7) i clienti sono clineti inidpendentemnete dal fatto che essi siano studenti o professori

8) si esatto solo cliente e admin

9) il gestore/admin è uno solo

10) solo panini e i relativi ingredinti

11) non ci sono panini fissi ogni utente deve comporselo

12) ogni  panino è formato da ingredienti scelti liberamnte. non tutte le categorie hanno la setssa libertà per esempio un panino per essere valido deve obbligatoriamnte avere uno ed uno solo tipo di pane quidni un panino con nessun tipo di pane o due tipi di pane diversi non è valido mentre per gli altri ingredienti non esite il x2 o x3 ma ogni tipo di ingrediente può essere messo o no sono e possono esserci anche più ingredineti per la stessa categoria es ci possono essere 2 proteine diverse o anche nessuna proteina

13) no un panino è definito solo ed eslusivamnte dall'insieme dei suoi ingredineti. niente nome o prezzo il sistema nno traccia i pagamente traccia solo le prenotazioni è come se fosse un agenta condivisa con gli studenti per le prenotazioni dei panini

14) ogni ingredinete è tracciato solo come presente o no non è traccaita la quantità

la scelta di non tracciare le quantità nasce da un problmea pratico. il paninaro non gestisce solamnete rpenotazioni sull'app ma serve anche al banmco quidni il sistema può traccaire bene gli ingredienti che vengonon usate sull'app ma non ci sarebbe modo di tracciare in maniera agevole gli ordin al banco quidi per semplicità operativa dato il tipo particolare di domio la quantità sarebbe non aggingerebbere nessun valore aggiunto se non una complicazione al titolare per questo si è scelto di adottare una presenza binaria presnte o assente in modo da poter in maniera più agevole gestire gli ingredienti

15) statische genrali poi gli ingredineti e le quantità nei giorni sono operazionin che si possono derivare tanto io per igni fascia oraria conosco gli ordini quidni risalnedo agli oridni posso risalire agli ingredineti utilizzati

16) si ogni ordine è formato da un solo panino associato ad un solo client, poi un clinete può ordinar epiù panini per la stessa fascia oraria ma in ordini distinti ogni comanda è formata da un solo panino

17) no un ordine continen un solo panino

18) si non solo all'inyerno dello sctesso giorno ma anche della strssa fascia oraria

19) gli stati son 5 pending(utente può modificarlo) confirmed(l'ordine è confermato e non può essere piùmodifcato) read (il panino è pronte e deve essere consegnato) piked_up (l'oridne è stato evaso e il clinete l'ha ritirato) rejected(l'ordine è stato rifiutato perchè mancava l'alimento o per alri motivi)

20) si entro 30 minprima della consegna

21) può annularlo entro 30 min prima

22) il pagamento non centra con l'app

23) non vinene gestito

24) sono fisse a 15 min

25) si esatto 

26) si

27) si

28) si

29) no no sonon previste ricorrenze e le face orario possono essere massimo una contingua per giornoi. non è previsto che il servizio possa essere operativo dalle 10-12 e poi dalle 15-19 e non è previsto che il servizio possa essere in due posti diversi e il luogo deve essere lo stesso per l'intera settimana o comuque va imposatato giorno per giorno non è rpevisto alivello di web-app la possibilità di dire lunedì sono nel luogo A e martedì nel luoog B e mercoledì nel luoog C. ci sono die parametri globali per la settiman che sono panin per time slot, luyogo etempo prima del quale il panino è modficabile

30) esatto
31) no è a discrezione dell'adimin ma il fatto di ordinare e no ritirare è una delle motivazione che può portare l'admin a buinnare
32) è manuale
33) no solo un bool che mi dice se è bannato o no
34) può vedere il sito ma non può ordinare
35) voglio queste
orari/fasce più richieste;
ingredienti più utilizzati;
clienti con più o mneo di X ordini
andamento degli ordini per giorno/settimana.
36) no
37) no non sono tracciati ma grazie all'uso degli ingredienti posso stimare quali è meglio aver emaggiormente e quli no
38) il getsore a mano
39) si
40) solo i propri attuali e lo storico dei suoi ordini
41) basta lo stato dell'ordine
42) si
43) no non c'è nessun listino ne dei panini e ne dei prezzi
44) non viene traccaito il prezzo dei panini
45) non ci sono menu
46) fontend blade + js vanilla, bakend: laravel, db: mysql
47) verlamnete imlpementate e lo è già va solo un po' corretta
48) l'app è gia pronta
49) si
50)  A

