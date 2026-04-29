// src/lib/utils-server.ts
// Fonctions utilitaires côté serveur uniquement

export function generateRef(prefix: string): string {
  const now = new Date()
  const timestamp = now.getTime().toString(36).toUpperCase()
  return `${prefix}-${timestamp}`
}

export function estDansFenetreCommande(): boolean {
  const now = new Date()
  const heures = now.getHours()
  return heures >= 20 && heures < 23
}
