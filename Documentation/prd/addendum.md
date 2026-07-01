---
title: "Addendum — PRD AfroLang-Library"
status: final
created: 2026-07-01
updated: 2026-07-01
---

# Addendum — PRD AfroLang-Library

Profondeur technique et pistes destinées à l'étape architecture. Ne fait pas partie du corps du PRD. Complète l'addendum du brief (`../../briefs/brief-AfroLang-Library-2026-07-01/addendum.md`).

## Stockage de l'Index — options gratuites (À TRANCHER en architecture)

L'Index ne contient que des Métadonnées (texte structuré), donc le volume est faible. Le stockage doit être **gratuit** (contrainte dure §10 du PRD). Pistes à évaluer :

- **Fichier(s) versionné(s) dans le dépôt** (SQLite, JSON ou CSV commités) : zéro coût, simple, versionné par git ; la Synchronisation (via GitHub Actions) commit l'Index mis à jour. Limite : concurrence d'écriture et taille du dépôt à surveiller.
- **Base gérée en offre gratuite** (ex. Supabase / Postgres free tier, Firebase) : requêtes plus riches, mais dépendance à un fournisseur et quotas gratuits à respecter.
- **SQLite servi par le back-end** : léger, requêtable, adapté à un volume de métadonnées modéré.

Critères de choix : coût nul durable, requêtabilité (recherche/filtre par Langue + Tâche NLP), compatibilité avec la mise à jour atomique (FR-10) et l'exécution de la Synchronisation sur planificateur gratuit.

## Modèle de données (esquisse, à finaliser en architecture)

Champs persistés par Dataset (dérivés du Glossaire §3) :
- identifiant interne ; Source ; identifiant du Dataset chez la Source
- code de Langue canonique (ISO 639-3 / Glottolog) + valeur brute d'origine (traçabilité)
- Tâche(s) NLP (vocabulaire contrôlé) + tag brut d'origine
- taille, licence, date de publication (ou « inconnu »)
- lien de Redirection
- origine : synchronisée vs manuelle ; horodatage de dernière Synchronisation

Tables/collections concrètes = livrable architecture.

## Infrastructure de synchronisation (rappel + HYPOTHÈSE)

Piste principale : **GitHub Actions sur planning cron** (gratuit) exécute les Connecteurs et écrit l'Index. Fréquence par défaut supposée quotidienne (FR-2), à confirmer selon quotas des API des Sources.

## Connecteurs (architecture d'extension)

Une Source = un Connecteur respectant un contrat commun (interface d'ingestion → Métadonnées brutes). Ancrage MVP : Connecteur Hugging Face + Connecteur Kaggle. Ajout d'une Source = nouveau Connecteur, sans toucher au reste. Isolation : l'échec d'un Connecteur n'interrompt pas les autres (NFR maintenabilité).

## Pile technique pressentie (NON CONFIRMÉE — voir addendum du brief)

- Front-end : Next.js
- Back-end : Python

À valider au regard des contraintes (coût nul, hébergement gratuit, maintenabilité à 3, exécution de la Synchronisation).

## Normalisation — détail

- Langue : mapper valeur brute → ISO 639-3 (Glottolog en repli). Conserver la valeur brute pour traçabilité et revue des cas non mappables (FR-6).
- Tâche NLP : vocabulaire contrôlé à figer (Question ouverte 3 du PRD).
- Détection « langue africaine » à l'ingestion pour limiter le bruit (Question ouverte 4).
- Déduplication inter-sources : hors MVP, à évaluer en phase 2.
