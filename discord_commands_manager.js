// Script Node.js pour gérer les commandes d'un bot Discord
// Combine la récupération et la suppression des commandes
const fs = require('fs');
const https = require('https');
const path = require('path');
const readline = require('readline');

// Configuration par défaut
const CONFIG = {
  APPLICATION_ID: '',
  BOT_TOKEN: '',
  GUILD_ID: '', // Optionnel, pour les commandes spécifiques à un serveur
  OUTPUT_DIR: './discord_commands'
};

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Interface de ligne de commande pour les interactions utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Fonction pour effectuer une requête HTTPS
 */
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => chunks.push(chunk));
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        let responseData = null;
        
        if (body && body.length > 0) {
          try {
            responseData = JSON.parse(body);
          } catch (e) {
            // Si pas de JSON valide, on utilise la chaîne brute
            responseData = body;
          }
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => reject(error));
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Fonction pour sauvegarder les données dans un fichier
 */
function saveToFile(data, filename) {
  // Création du dossier de sortie s'il n'existe pas
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }
  
  const filePath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`${colors.green}✅ Données sauvegardées dans ${filePath}${colors.reset}`);
  return data;
}

/**
 * Récupère les commandes (globales ou de serveur)
 */
async function getCommands(isGuild = false) {
  const baseUrl = 'discord.com';
  const path = isGuild 
    ? `/api/v10/applications/${CONFIG.APPLICATION_ID}/guilds/${CONFIG.GUILD_ID}/commands`
    : `/api/v10/applications/${CONFIG.APPLICATION_ID}/commands`;
  
  const options = {
    hostname: baseUrl,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bot ${CONFIG.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    }
  };
  
  try {
    const response = await httpsRequest(options);
    
    if (response.statusCode !== 200) {
      console.log(`${colors.red}❌ Erreur lors de la récupération des commandes ${isGuild ? 'de serveur' : 'globales'}: ${response.statusCode}${colors.reset}`);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error(`${colors.red}❌ Erreur de requête: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Supprime une commande spécifique
 */
async function deleteCommand(commandId, commandName, isGuild = false) {
  const baseUrl = 'discord.com';
  const path = isGuild 
    ? `/api/v10/applications/${CONFIG.APPLICATION_ID}/guilds/${CONFIG.GUILD_ID}/commands/${commandId}`
    : `/api/v10/applications/${CONFIG.APPLICATION_ID}/commands/${commandId}`;
  
  const options = {
    hostname: baseUrl,
    path: path,
    method: 'DELETE',
    headers: {
      'Authorization': `Bot ${CONFIG.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    }
  };
  
  try {
    const response = await httpsRequest(options);
    
    if (response.statusCode === 204 || response.statusCode === 200) {
      console.log(`${colors.green}✅ Commande "${commandName}" (ID: ${commandId}) supprimée avec succès.${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Échec de la suppression de la commande "${commandName}" (ID: ${commandId}). Code HTTP: ${response.statusCode}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la suppression de la commande "${commandName}": ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Demande confirmation à l'utilisateur
 */
function askConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (o/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'o');
    });
  });
}

/**
 * Pose une question à l'utilisateur
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Affiche la liste des commandes
 */
function displayCommands(commands, type) {
  if (commands.length === 0) {
    console.log(`${colors.yellow}⚠️ Aucune commande ${type} trouvée.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.cyan}📝 Commandes ${type} trouvées (${commands.length}):${colors.reset}`);
  commands.forEach(cmd => {
    console.log(`   ${colors.blue}ID: ${cmd.id}${colors.reset} - ${colors.green}Nom: ${cmd.name}${colors.reset} - ${colors.yellow}Description: ${cmd.description || 'Aucune'}${colors.reset}`);
  });
  return true;
}

/**
 * Récupère les commandes globales et les sauvegarde
 */
async function getAndSaveGlobalCommands() {
  console.log(`${colors.cyan}Récupération des commandes globales...${colors.reset}`);
  try {
    const commands = await getCommands(false);
    
    if (commands.length > 0) {
      saveToFile(commands, 'commands_globales.json');
      displayCommands(commands, 'globales');
    } else {
      console.log(`${colors.yellow}⚠️ Aucune commande globale trouvée.${colors.reset}`);
    }
    
    return commands;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la récupération des commandes globales: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Récupère les commandes de serveur et les sauvegarde
 */
async function getAndSaveGuildCommands() {
  if (!CONFIG.GUILD_ID) {
    console.log(`${colors.yellow}\n⚠️ Aucun ID de serveur spécifié, les commandes de serveur ne seront pas récupérées.${colors.reset}`);
    return [];
  }
  
  console.log(`${colors.cyan}\nRécupération des commandes spécifiques au serveur ${CONFIG.GUILD_ID}...${colors.reset}`);
  try {
    const commands = await getCommands(true);
    
    if (commands.length > 0) {
      saveToFile(commands, 'commands_serveur.json');
      displayCommands(commands, 'de serveur');
    } else {
      console.log(`${colors.yellow}⚠️ Aucune commande de serveur trouvée.${colors.reset}`);
    }
    
    return commands;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la récupération des commandes de serveur: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Gère la suppression de commandes - tout ou sélection
 */
async function handleCommandDeletion(commands, isGuild) {
  const type = isGuild ? 'de serveur' : 'globales';
  
  if (commands.length === 0) {
    return;
  }
  
  // Demander si l'utilisateur veut supprimer toutes les commandes ou une seule
  const choice = await askQuestion(`\n${colors.yellow}Voulez-vous supprimer toutes les commandes ${type} ou seulement une commande spécifique? (T = toutes / S = spécifique): ${colors.reset}`);
  
  if (choice.toLowerCase() === 't') {
    // Supprimer toutes les commandes
    const confirmed = await askConfirmation(`${colors.red}⚠️ ATTENTION: Voulez-vous vraiment supprimer TOUTES les commandes ${type}?${colors.reset}`);
    
    if (!confirmed) {
      console.log(`${colors.yellow}⚠️ Suppression des commandes ${type} annulée.${colors.reset}`);
      return;
    }
    
    console.log(`\n${colors.magenta}🗑️ Suppression de toutes les commandes ${type}...${colors.reset}`);
    for (const cmd of commands) {
      await deleteCommand(cmd.id, cmd.name, isGuild);
    }
    console.log(`${colors.green}✅ Suppression de toutes les commandes ${type} terminée.${colors.reset}`);
    
  } else if (choice.toLowerCase() === 's') {
    // Supprimer une commande spécifique
    const commandId = await askQuestion(`${colors.yellow}Entrez l'ID de la commande à supprimer: ${colors.reset}`);
    
    // Vérifier si l'ID existe
    const commandToDelete = commands.find(cmd => cmd.id === commandId);
    
    if (!commandToDelete) {
      console.log(`${colors.red}❌ Aucune commande trouvée avec l'ID ${commandId}.${colors.reset}`);
      return;
    }
    
    const confirmed = await askConfirmation(`${colors.red}⚠️ Voulez-vous vraiment supprimer la commande "${commandToDelete.name}"?${colors.reset}`);
    
    if (!confirmed) {
      console.log(`${colors.yellow}⚠️ Suppression annulée.${colors.reset}`);
      return;
    }
    
    console.log(`\n${colors.magenta}🗑️ Suppression de la commande...${colors.reset}`);
    await deleteCommand(commandToDelete.id, commandToDelete.name, isGuild);
    
  } else {
    console.log(`${colors.red}❌ Option non reconnue. Suppression annulée.${colors.reset}`);
  }
}

/**
 * Menu principal
 */
async function showMainMenu() {
  console.log(`\n${colors.cyan}=== GESTIONNAIRE DE COMMANDES DISCORD ===${colors.reset}`);
  console.log(`${colors.green}1.${colors.reset} Récupérer les commandes`);
  console.log(`${colors.red}2.${colors.reset} Supprimer des commandes`);
  console.log(`${colors.yellow}3.${colors.reset} Quitter`);
  
  const choice = await askQuestion(`\n${colors.cyan}Choisissez une option (1-3): ${colors.reset}`);
  
  switch (choice) {
    case '1':
      await retrieveCommands();
      break;
    case '2':
      await deleteCommands();
      break;
    case '3':
      console.log(`${colors.green}✨ Au revoir!${colors.reset}`);
      rl.close();
      return false;
    default:
      console.log(`${colors.red}❌ Option non reconnue. Veuillez réessayer.${colors.reset}`);
  }
  
  return true;
}

/**
 * Récupère et affiche les commandes
 */
async function retrieveCommands() {
  console.log(`\n${colors.cyan}=== RÉCUPÉRATION DES COMMANDES ===${colors.reset}`);
  
  const globalCommands = await getAndSaveGlobalCommands();
  const guildCommands = await getAndSaveGuildCommands();
  
  console.log(`\n${colors.green}✅ Récupération des commandes terminée.${colors.reset}`);
  
  if (globalCommands.length > 0 || guildCommands.length > 0) {
    const confirmed = await askConfirmation(`${colors.yellow}Voulez-vous également supprimer des commandes maintenant?${colors.reset}`);
    if (confirmed) {
      await deleteCommands();
    }
  }
}

/**
 * Supprime des commandes
 */
async function deleteCommands() {
  console.log(`\n${colors.cyan}=== SUPPRESSION DES COMMANDES ===${colors.reset}`);
  
  console.log(`${colors.yellow}1.${colors.reset} Supprimer des commandes globales`);
  console.log(`${colors.yellow}2.${colors.reset} Supprimer des commandes de serveur`);
  console.log(`${colors.yellow}3.${colors.reset} Retour au menu principal`);
  
  const choice = await askQuestion(`\n${colors.cyan}Choisissez une option (1-3): ${colors.reset}`);
  
  switch (choice) {
    case '1':
      const globalCommands = await getCommands(false);
      if (displayCommands(globalCommands, 'globales')) {
        await handleCommandDeletion(globalCommands, false);
      }
      break;
    case '2':
      if (!CONFIG.GUILD_ID) {
        console.log(`${colors.red}❌ Aucun ID de serveur spécifié dans la configuration.${colors.reset}`);
        break;
      }
      const guildCommands = await getCommands(true);
      if (displayCommands(guildCommands, 'de serveur')) {
        await handleCommandDeletion(guildCommands, true);
      }
      break;
    case '3':
      return;
    default:
      console.log(`${colors.red}❌ Option non reconnue. Veuillez réessayer.${colors.reset}`);
  }
}

/**
 * Demande à l'utilisateur de saisir les informations de configuration
 */
async function askForConfiguration() {
  console.log(`${colors.cyan}=== CONFIGURATION ===${colors.reset}`);
  console.log(`${colors.yellow}Veuillez saisir les informations nécessaires pour le fonctionnement du script.${colors.reset}`);
  
  CONFIG.APPLICATION_ID = await askQuestion(`${colors.cyan}ID de l'application Discord: ${colors.reset}`);
  
  // Vérifier si l'ID de l'application a été saisi
  if (!CONFIG.APPLICATION_ID) {
    console.log(`${colors.red}❌ L'ID de l'application est obligatoire.${colors.reset}`);
    return false;
  }
  
  CONFIG.BOT_TOKEN = await askQuestion(`${colors.cyan}Token du bot Discord: ${colors.reset}`);
  
  // Vérifier si le token du bot a été saisi
  if (!CONFIG.BOT_TOKEN) {
    console.log(`${colors.red}❌ Le token du bot est obligatoire.${colors.reset}`);
    return false;
  }
  
  const useGuild = await askConfirmation(`${colors.yellow}Voulez-vous également gérer les commandes spécifiques à un serveur?${colors.reset}`);
  
  if (useGuild) {
    CONFIG.GUILD_ID = await askQuestion(`${colors.cyan}ID du serveur Discord: ${colors.reset}`);
  }
  
  // Optionnel: permettre à l'utilisateur de modifier le dossier de sortie
  const changeOutputDir = await askConfirmation(`${colors.yellow}Voulez-vous modifier le dossier de sortie? (Actuellement: ${CONFIG.OUTPUT_DIR})${colors.reset}`);
  
  if (changeOutputDir) {
    CONFIG.OUTPUT_DIR = await askQuestion(`${colors.cyan}Nouveau dossier de sortie: ${colors.reset}`);
    
    // Si l'utilisateur n'a rien saisi, on garde la valeur par défaut
    if (!CONFIG.OUTPUT_DIR) {
      CONFIG.OUTPUT_DIR = './discord_commands';
    }
  }
  
  console.log(`${colors.green}✅ Configuration terminée!${colors.reset}`);
  return true;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`${colors.cyan}🤖 Discord Command Manager - v1.0${colors.reset}`);
  console.log(`${colors.magenta}Ce script permet de récupérer et supprimer les commandes slash de votre bot Discord.${colors.reset}`);
  
  // Demander à l'utilisateur de saisir les informations de configuration
  const configSuccess = await askForConfiguration();
  
  if (!configSuccess) {
    console.log(`${colors.red}❌ Configuration incomplète. Le script va se terminer.${colors.reset}`);
    rl.close();
    return;
  }
  
  let continueRunning = true;
  while (continueRunning) {
    continueRunning = await showMainMenu();
  }
}

// Exécution du script
main().catch(error => {
  console.error(`${colors.red}❌ Erreur générale: ${error}${colors.reset}`);
  rl.close();
});