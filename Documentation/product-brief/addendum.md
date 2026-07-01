---
title: "Addendum — Product Brief AfroLang-Library"
status: final
created: 2026-07-01
updated: 2026-07-01
---

# Addendum — AfroLang-Library

Détails de profondeur destinés aux étapes aval (PRD, architecture, solution design). Ne fait pas partie du corps du brief.

## Pile technique pressentie (NON CONFIRMÉE)

Discutée entre les 3 membres de l'équipe, à trancher à l'étape architecture :

- **Front-end** : Next.js
- **Back-end** : Python

À valider au regard des contraintes structurantes : zéro budget, hébergement gratuit, maintenabilité par 3 personnes, et besoin d'un planificateur gratuit pour la synchro (cf. ci-dessous).

## Infrastructure de synchronisation (HYPOTHÈSE)

La synchronisation automatique impose un processus qui s'exécute à intervalle régulier, sans serveur payant. Piste principale : **GitHub Actions sur un planning cron** (gratuit pour dépôt public), qui lance les scripts de synchro. À confirmer et à comparer aux alternatives gratuites lors de l'architecture.

## Normalisation — le travail central

- **Identité de langue** : mapper chaque valeur brute des plateformes (nom anglais, nom local, code ISO 639-1/2, variante dialectale) vers un code canonique **ISO 639-3**, avec **Glottolog** en repli pour les langues/variantes que l'ISO ne couvre pas.
- **Tâche NLP** : vocabulaire contrôlé à figer (ASR, NMT/traduction, NER, classification de texte, TTS, résumé, etc.). Chaque tag source est mappé vers ce vocabulaire.
- **Champs manquants/ambigus** : valeur « inconnu », le dataset reste référencé.
- Enjeux à approfondir en architecture : déduplication (même dataset sur plusieurs plateformes), enrichissement (famille linguistique / région dérivées du code langue), détection des disparitions.

## Compromis assumés (v1)

- **Entrées manuelles pour les sources sans API** : solution d'attente en phase 1. Ces entrées ne bénéficient pas de la synchro automatique et peuvent devenir obsolètes tant que le scraping (phase 2) n'existe pas. Compromis accepté pour ne pas retarder la v1.

## Phasage

- **Phase 1 (v1)** : sources à API (synchro auto), schéma unifié, UI web, API publique, quelques sources sans API en manuel.
- **Phase 2** : algorithme de scraping pour automatiser les sources sans API.
- **Phase future** : cadre de benchmarking et leaderboards pour les langues africaines (cf. README).
