#!/usr/bin/env node
// tests/test-concurrence.js
//
// ═══════════════════════════════════════════════════════════════════
// TEST DE CONCURRENCE — Verrouillage Optimiste
// ═══════════════════════════════════════════════════════════════════
//
// Simule N utilisateurs qui commandent SIMULTANÉMENT le même produit.
// Vérifie que la somme des quantités accordées ≤ stock initial.
//
// Usage:
//   node tests/test-concurrence.js
//   node tests/test-concurrence.js --utilisateurs=20 --quantite=50
//
// Prérequis: serveur Next.js en cours (npm run dev)
//

const BASE_URL = 'http://localhost:3000'

// ── Paramètres CLI ────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v] })
)

const NB_UTILISATEURS = parseInt(args.utilisateurs || '10')
const QUANTITE_PAR_CMD = parseFloat(args.quantite || '100')
const PRODUIT_ID       = args.produitId || null  // auto-détecté si absent

// ── Couleurs ANSI ─────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
}
const ok  = (s) => `${C.green}✅ ${s}${C.reset}`
const err = (s) => `${C.red}❌ ${s}${C.reset}`
const info = (s) => `${C.blue}ℹ  ${s}${C.reset}`
const warn = (s) => `${C.yellow}⚠  ${s}${C.reset}`

async function main() {
  console.log(`\n${C.bold}${C.cyan}═══════════════════════════════════════════════════${C.reset}`)
  console.log(`${C.bold}  TEST DE CONCURRENCE — VivriérPro Stock System${C.reset}`)
  console.log(`${C.cyan}═══════════════════════════════════════════════════${C.reset}\n`)

  // 1. Récupérer un produit et son stock
  console.log(info('Récupération de l\'état initial du stock...'))
  let stocks, points
  try {
    stocks = await fetch(`${BASE_URL}/api/stock`).then(r => r.json())
    points = await fetch(`${BASE_URL}/api/points`).then(r => r.json())
  } catch {
    console.error(err('Impossible de contacter le serveur. Lancez: npm run dev'))
    process.exit(1)
  }

  // Choisir le produit avec le plus de stock libre
  const produit = PRODUIT_ID
    ? stocks.find(s => s.produitId === PRODUIT_ID)
    : stocks.sort((a, b) => b.quantiteLibre - a.quantiteLibre)[0]

  if (!produit) { console.error(err('Aucun produit trouvé')); process.exit(1) }

  const point = points.find(p => p.actif)
  if (!point) { console.error(err('Aucun point actif')); process.exit(1) }

  const stockInitial = produit.quantiteLibre
  const totalDemande = NB_UTILISATEURS * QUANTITE_PAR_CMD

  console.log(`${C.bold}Produit ciblé :${C.reset}    ${produit.nomProduit}`)
  console.log(`${C.bold}Stock libre   :${C.reset}    ${C.green}${stockInitial} ${produit.unite}${C.reset}`)
  console.log(`${C.bold}Utilisateurs  :${C.reset}    ${NB_UTILISATEURS}`)
  console.log(`${C.bold}Qté / commande:${C.reset}    ${QUANTITE_PAR_CMD} ${produit.unite}`)
  console.log(`${C.bold}Total demandé :${C.reset}    ${C.red}${totalDemande} ${produit.unite}${C.reset} ${totalDemande > stockInitial ? '⚠️  DÉPASSE le stock' : '✓  Dans le stock'}`)
  console.log(`${C.bold}Point livr.   :${C.reset}    ${point.nom}\n`)

  // 2. Lancer toutes les commandes SIMULTANÉMENT (Promise.all)
  console.log(info(`Envoi de ${NB_UTILISATEURS} commandes simultanées...\n`))
  const debut = Date.now()

  const promesses = Array.from({ length: NB_UTILISATEURS }, (_, i) =>
    fetch(`${BASE_URL}/api/commandes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pointId: point.id,
        produitId: produit.produitId,
        quantite: QUANTITE_PAR_CMD,
        notes: `Test concurrence — utilisateur #${i + 1}`,
        forceHoraire: true,   // bypass fenêtre 20h-23h pour le test
      }),
    }).then(async r => {
      const data = await r.json()
      return { utilisateur: i + 1, status: r.status, data }
    }).catch(e => ({ utilisateur: i + 1, status: 0, data: { error: e.message } }))
  )

  const resultats = await Promise.all(promesses)
  const duree = Date.now() - debut

  // 3. Analyser les résultats
  const succes   = resultats.filter(r => r.status === 201)
  const refusees = resultats.filter(r => r.status !== 201)
  const conflits = resultats.filter(r => r.data?.code === 'CONFLIT_EPUISE')
  const insuff   = resultats.filter(r => r.data?.code === 'STOCK_INSUFFISANT')
  const hors_f   = resultats.filter(r => r.data?.code === 'HORS_FENETRE')
  const autres   = resultats.filter(r => r.status !== 201 && !['CONFLIT_EPUISE','STOCK_INSUFFISANT','HORS_FENETRE'].includes(r.data?.code))

  const qteAccordee = succes.length * QUANTITE_PAR_CMD

  console.log(`${C.bold}═══ RÉSULTATS (${duree}ms) ════════════════════════════${C.reset}\n`)

  // Affichage ligne par ligne
  resultats.forEach(r => {
    if (r.status === 201) {
      console.log(`  Utilisateur ${String(r.utilisateur).padStart(3)} : ${ok(`Accordé  — réf. ${r.data.reference}`)}`)
    } else if (r.data?.code === 'STOCK_INSUFFISANT') {
      console.log(`  Utilisateur ${String(r.utilisateur).padStart(3)} : ${err(`Refusé   — STOCK INSUFFISANT (${r.data.details?.dispo ?? '?'} dispo)`)}`)
    } else if (r.data?.code === 'CONFLIT_EPUISE') {
      console.log(`  Utilisateur ${String(r.utilisateur).padStart(3)} : ${warn(`Refusé   — CONFLIT CONCURRENCE (3 retries épuisés)`)}`)
    } else {
      console.log(`  Utilisateur ${String(r.utilisateur).padStart(3)} : ${err(`Erreur   — ${r.data?.error || 'Inconnue'} (HTTP ${r.status})`)}`)
    }
  })

  console.log(`\n${C.bold}═══ SYNTHÈSE ═══════════════════════════════════════${C.reset}`)
  console.log(`  Commandes acceptées  : ${C.green}${succes.length}${C.reset} / ${NB_UTILISATEURS}`)
  console.log(`  Commandes refusées   : ${C.red}${refusees.length}${C.reset} / ${NB_UTILISATEURS}`)
  if (insuff.length)  console.log(`    dont stock insuff. : ${C.yellow}${insuff.length}${C.reset}`)
  if (conflits.length) console.log(`    dont conflits      : ${C.yellow}${conflits.length}${C.reset}`)
  if (autres.length)  console.log(`    dont autres        : ${C.red}${autres.length}${C.reset}`)
  console.log(`  Quantité accordée    : ${C.cyan}${qteAccordee} ${produit.unite}${C.reset}`)
  console.log(`  Stock initial libre  : ${C.cyan}${stockInitial} ${produit.unite}${C.reset}`)

  // 4. Vérification d'intégrité CRITIQUE
  console.log(`\n${C.bold}═══ VÉRIFICATION D'INTÉGRITÉ ═══════════════════════${C.reset}`)

  if (qteAccordee > stockInitial) {
    console.log(err(`DÉPASSEMENT DÉTECTÉ ! ${qteAccordee} > ${stockInitial} — Le verrou a ÉCHOUÉ !\n`))
    process.exit(1)
  } else {
    console.log(ok(`Aucun dépassement : ${qteAccordee} ≤ ${stockInitial} — Verrou OK !`))
  }

  // Vérifier l'état du stock en BDD après les opérations
  const stockFinal = await fetch(`${BASE_URL}/api/stock`).then(r => r.json())
  const sf = stockFinal.find(s => s.produitId === produit.produitId)

  if (sf) {
    const qteReserveeAttendue = Math.min(qteAccordee, stockInitial)
    console.log(ok(`Stock BDD — Réservé : ${sf.quantiteReservee} ${produit.unite} (attendu ≤ ${stockInitial})`))
    console.log(ok(`Stock BDD — Libre   : ${sf.quantiteLibre} ${produit.unite}`))
    console.log(ok(`Version courante    : v${sf.version}`))

    if (sf.quantiteReservee > sf.quantiteDisponible) {
      console.log(err('INCOHÉRENCE : quantiteReservee > quantiteDisponible !'))
      process.exit(1)
    } else {
      console.log(ok('Cohérence BDD validée : réservé ≤ disponible'))
    }
  }

  console.log(`\n${C.bold}${C.green}  TEST RÉUSSI — Aucune sur-allocation détectée.${C.reset}`)
  console.log(`${C.dim}  Le verrouillage optimiste protège correctement le stock concurrent.${C.reset}\n`)
}

main().catch(e => { console.error(err(e.message)); process.exit(1) })
