# Questions en suspens — AfroLang-Library

> Registre des questions ouvertes à trancher en équipe. Format : une entrée par date, avec la liste des questions de ce jour. Ajouter une nouvelle date au fur et à mesure que des réponses arrivent (ne pas effacer : rayer/annoter la question résolue).

---

## 2026-07-01 : Liste de questions

### A. Décisions d'architecture provisoires — à confirmer en équipe

1. **Option de déploiement/stockage** : A (serveur FastAPI + PostgreSQL sur offre gratuite) · B (static-first : SQLite + déploiement gratuit unique) · C (hybride : FastAPI serverless). → **Choix provisoire retenu : B**, à confirmer. Le garde-fou « accès données via repository + ORM » rend un changement peu coûteux.
2. **Moteur de stockage** : SQLite (+ FTS5) — provisoire — ou PostgreSQL ? (lié à la question 1).
3. **Façon de servir l'API en Option B** : route handlers Next.js lisant le SQLite embarqué · fonctions serverless FastAPI · JSON pré-généré ?

### B. Questions produit et données

4. **Sources à API gratuite** : au-delà de Hugging Face et Kaggle, lesquelles ont réellement une API gratuite exploitable (Zindi, OPUS, OpenSLR, Masakhane… ) ? Recherche à mener avant de coder les connecteurs suivants.
5. **Fréquence de synchronisation** par défaut (quotidienne ? hebdomadaire ?) et quotas / limites des API des sources.
6. **Vocabulaire contrôlé des tâches NLP** : liste définitive à figer (ASR, traduction, NER, classification, TTS, résumé… ).
7. **Détection « langue africaine »** : comment identifier de façon fiable qu'un dataset concerne bien une langue africaine (pour éviter le bruit) ?
8. **Conditions d'utilisation / attribution** : quelle politique vis-à-vis des CGU des sources lors du référencement des métadonnées et de la redirection ?
9. **Cibles chiffrées de succès** : nombre de langues et de datasets visés, et date de mise en ligne.
10. **Langue de l'interface** : français, anglais ou bilingue ?
11. **Cibles de performance** : temps de réponse acceptables pour le web et l'API.

### C. Périmètre laissé ouvert — à revisiter après le MVP

12. **Soumission de sources par la communauté** (accélérateur de couverture) — à ajouter après le MVP ?
13. **Déduplication** automatique d'un même dataset présent sur plusieurs sources — à traiter en phase 2 ?

---

<!-- Modèle pour les prochaines réunions :

## AAAA-MM-JJ : Liste de questions
1. ...
-->
