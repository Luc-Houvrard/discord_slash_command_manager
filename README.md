# Discord Commands Manager

Un outil en ligne de commande pour gérer facilement les commandes slash (slash commands) de votre bot Discord. Cet utilitaire vous permet de récupérer et supprimer vos commandes Discord, qu'elles soient globales ou spécifiques à un serveur.

![Discord Commands Manager](https://img.shields.io/badge/Discord-Commands%20Manager-7289DA?style=for-the-badge&logo=discord&logoColor=white)

## Fonctionnalités

- 📋 **Récupération des commandes** - Liste toutes les commandes globales et spécifiques à un serveur
- 💾 **Sauvegarde automatique** - Enregistre les commandes dans des fichiers JSON pour référence ultérieure
- 🗑️ **Suppression des commandes** - Supprime une commande spécifique ou toutes les commandes en une seule opération
- 🎨 **Interface colorée** - Utilise des couleurs dans le terminal pour une meilleure lisibilité
- 🔄 **Workflow intuitif** - Guide l'utilisateur étape par étape avec des menus interactifs

## Prérequis

- [Node.js](https://nodejs.org/) (v12.0.0 ou supérieur)
- Un bot Discord avec des permissions appropriées
- Token du bot Discord
- ID d'application Discord
- (Optionnel) ID de serveur Discord pour les commandes spécifiques à un serveur

## Installation

1. Clonez ou téléchargez ce dépôt
2. Placez le fichier `discord_commands_manager.js` dans votre projet
3. Aucune dépendance externe n'est nécessaire (le script utilise uniquement des modules Node.js intégrés)

## Utilisation

1. Exécutez le script avec Node.js :

```bash
node discord_commands_manager.js
```

2. Suivez les instructions à l'écran pour configurer et utiliser l'outil :
   - Entrez votre ID d'application Discord
   - Fournissez le token de votre bot
   - (Optionnel) Entrez l'ID de serveur si vous souhaitez gérer des commandes spécifiques à un serveur
   - Choisissez les opérations à effectuer à partir du menu principal

## Menu principal

Le script vous propose trois options principales :

1. **Récupérer les commandes** - Liste et sauvegarde les commandes existantes
2. **Supprimer des commandes** - Supprime des commandes globales ou de serveur
3. **Quitter** - Termine l'exécution du script

## Exemples d'utilisation

### Récupération des commandes

En choisissant l'option 1, le script va :
- Récupérer et afficher toutes vos commandes globales
- Sauvegarder ces commandes dans `./discord_commands/commands_globales.json`
- Si un ID de serveur est fourni, il récupérera également les commandes de serveur et les sauvegardera dans `./discord_commands/commands_serveur.json`

### Suppression des commandes

En choisissant l'option 2, vous pourrez :
- Choisir entre supprimer des commandes globales ou de serveur
- Supprimer une commande spécifique en fournissant son ID
- Ou supprimer toutes les commandes d'un coup (avec confirmation de sécurité)

## Structure des données

Les fichiers JSON générés contiennent des informations détaillées sur chaque commande, incluant :

- `id` - L'identifiant unique de la commande
- `name` - Le nom de la commande
- `description` - La description affichée dans Discord
- Options et sous-commandes (le cas échéant)

## Sécurité

⚠️ **Attention** : 
- Ne partagez jamais votre token de bot Discord
- Le script demande confirmation avant de supprimer des commandes
- Les opérations de suppression sont irréversibles

## Personnalisation

Vous pouvez modifier les valeurs par défaut dans la section `CONFIG` du script :

```javascript
const CONFIG = {
  APPLICATION_ID: '',
  BOT_TOKEN: '',
  GUILD_ID: '', // Optionnel, pour les commandes spécifiques à un serveur
  OUTPUT_DIR: './discord_commands'
};
```

## Dépannage

| Problème | Solution |
|----------|----------|
| "Erreur lors de la récupération des commandes" | Vérifiez que votre token de bot et ID d'application sont corrects |
| "Unauthorized" | Assurez-vous que votre bot a les permissions appropriées |
| "Aucune commande trouvée" | Le bot n'a pas encore de commandes enregistrées pour l'application ou le serveur indiqué |

## Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer comme bon vous semble.

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

Créé avec ❤️ pour faciliter la gestion des bots Discord.
